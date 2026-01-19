/**
 * On-Chain Referral Hooks
 *
 * Replacement for use-referral-queries.ts
 * Uses on-chain Solana queries instead of off-chain API
 * Enriched with GraphQL data for metrics and tier counts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import type { ReferralCode as ReferralCodeRecord, AffiliateData as AffiliateDataRecord } from '../lib/api-client'
import {
  useCreateReferralCode as useCreateCodeMutation,
  useSolanaConnection,
  getReferralProgram,
  fetchReferralCode,
  fetchReferralConfig,
  fetchUserRegistration,
  getReferralConfigPDA,
  getUserRegistrationPDA,
  getRegisterWithReferralCodeAccounts,
  getTesseraTokenProgramId,
  shortenAddress,
} from '@/lib/solana'
import { fetchAffiliateStats } from '../lib/graphql-client'

/**
 * Query Keys - mimics the old structure for easier migration
 */
export const referralKeys = {
  all: ['referral'] as const,
  trader: () => [...referralKeys.all, 'trader'] as const,
  affiliate: () => [...referralKeys.all, 'affiliate'] as const,
  userCodes: (wallet: string) => [...referralKeys.all, 'userCodes', wallet] as const,
}

/**
 * Trader Data (equivalent to useTraderData)
 * Returns user's registration and referral information
 */
export function useTraderData(walletAddress?: string | null, enabled = true) {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useQuery({
    queryKey: [...referralKeys.trader(), walletAddress ?? 'no-wallet'],
    queryFn: async () => {
      const pubkey = walletAddress ? new PublicKey(walletAddress) : wallet.publicKey
      if (!pubkey) return null

      // Fetch user registration from on-chain
      const program = getReferralProgram(connection, wallet)
      if (!program) return null

      const [registrationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_registration'), pubkey.toBuffer()],
        program.programId,
      )

      try {
        const registration = await program.account.userRegistration.fetch(registrationPDA)

        // Fetch the referral code details
        let referralCode = null
        if (registration.referralCode) {
          try {
            const codeAccount = await program.account.referralCode.fetch(registration.referralCode)
            referralCode = {
              referrerCode: codeAccount.code,
              referrerWallet: registration.tier1Referrer.toBase58(),
              boundAt: null, // Not stored on-chain in current schema
              lastModified: null,
            }
          } catch (error) {
            console.warn('Failed to fetch referral code details:', error)
          }
        }

        return {
          walletAddress: pubkey.toBase58(),
          metrics: {
            tradingVolume: 0, // Not tracked on-chain in current schema
            feeRebateTotal: 0,
            tradingPoints: 0,
            feeDiscountPct: 0,
            snapshotAt: new Date().toISOString(),
          },
          referral: referralCode,
        }
      } catch (error) {
        // User not registered yet
        return {
          walletAddress: pubkey.toBase58(),
          metrics: {
            tradingVolume: 0,
            feeRebateTotal: 0,
            tradingPoints: 0,
            feeDiscountPct: 0,
            snapshotAt: new Date().toISOString(),
          },
          referral: null,
        }
      }
    },
    enabled: enabled && (!!walletAddress || !!wallet.publicKey),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Affiliate Data (equivalent to useAffiliateData)
 * Returns user's referral codes and metrics
 * Now enriched with GraphQL data for accurate metrics and tier counts
 */
export function useAffiliateData(enabled = true, walletAddress?: string | null) {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useQuery({
    queryKey: [...referralKeys.affiliate(), walletAddress ?? 'no-wallet'],
    queryFn: async () => {
      const pubkey = walletAddress ? new PublicKey(walletAddress) : wallet.publicKey
      if (!pubkey) return null

      const program = getReferralProgram(connection, wallet)
      if (!program) return null

      // Fetch both on-chain data and GraphQL stats in parallel
      const [accountsResult, graphqlStats] = await Promise.all([
        // On-chain: Get referral codes owned by this wallet
        connection.getProgramAccounts(program.programId, {
          filters: [
            {
              // Filter by account discriminator (ReferralCode)
              memcmp: {
                offset: 0,
                bytes: 'f8H8SWXTmJC', // base58 of [227, 239, 247, 224, 128, 187, 44, 229]
              },
            },
          ],
        }),
        // GraphQL: Get aggregated stats
        fetchAffiliateStats(pubkey.toBase58()).catch((err) => {
          console.warn('Failed to fetch GraphQL stats:', err)
          return null
        }),
      ])

      // Build code stats lookup from GraphQL data
      const codeStatsMap = new Map<string, { referralCount: number; tradingVolume: number; rewardsUsd: number }>()
      if (graphqlStats) {
        for (const code of graphqlStats.codes) {
          codeStatsMap.set(code.code, {
            referralCount: code.referralCount,
            tradingVolume: code.tradingVolume,
            rewardsUsd: code.rewardsUsd,
          })
        }
      }

      const referralCodes: ReferralCodeRecord[] = []
      for (const { pubkey: accountPubkey, account } of accountsResult) {
        try {
          // Manual deserialization from raw bytes
          const data = account.data
          let offset = 8 // Skip discriminator

          // Read code (String: u32 length + N bytes - variable length!)
          // IMPORTANT: Anchor serializes String as variable-length, not fixed 12 bytes
          const codeLen = data.readUInt32LE(offset)
          offset += 4
          const code = data.slice(offset, offset + codeLen).toString('utf8')
          offset += codeLen // Variable length - only advance by actual string length

          // Read owner (Pubkey: 32 bytes)
          const ownerBytes = data.slice(offset, offset + 32)
          const owner = new PublicKey(ownerBytes)
          offset += 32

          // Filter by owner client-side
          if (!owner.equals(pubkey)) {
            continue
          }

          // Read is_active (bool: 1 byte)
          const isActive = data[offset] === 1
          offset += 1

          // Read total_referrals (u32: 4 bytes) - on-chain value as fallback
          const onChainReferrals = data.readUInt32LE(offset)

          // Use GraphQL stats if available, otherwise fall back to on-chain data
          const codeStats = codeStatsMap.get(code)
          const referredTraderCount = codeStats?.referralCount ?? onChainReferrals

          referralCodes.push({
            id: referralCodes.length,
            codeSlug: code,
            status: isActive ? 'active' : 'inactive',
            activeLayer: 3,
            walletAddress: pubkey.toBase58(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            referredTraderCount,
          })
        } catch (err) {
          console.warn('Failed to decode account:', accountPubkey.toBase58(), err)
        }
      }

      // Calculate total rewards from GraphQL data
      const totalRewards = graphqlStats?.totalRewardsUsd ?? 0

      const affiliateSummary: AffiliateDataRecord = {
        walletAddress: pubkey.toBase58(),
        displayName: null,
        email: null,
        emailVerified: false,
        metrics: {
          rebatesTotal: totalRewards,
          referralPoints: graphqlStats?.totalReferrals ?? 0,
          snapshotAt: new Date().toISOString(),
        },
        referralCodes,
        tree: {
          l1TraderCount: graphqlStats?.tier1Referrals ?? 0,
          l2TraderCount: graphqlStats?.tier2Referrals ?? 0,
          l3TraderCount: graphqlStats?.tier3Referrals ?? 0,
          totalTraderCount: graphqlStats?.totalReferrals ?? 0,
          l1Traders: [], // Could be populated from GraphQL if needed
          l2Traders: [],
          l3Traders: [],
        },
      }
      return affiliateSummary
    },
    enabled: enabled && (!!walletAddress || !!wallet.publicKey),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Create Referral Code (uses on-chain transaction)
 */
export function useCreateReferralCode() {
  const queryClient = useQueryClient()
  const onChainMutation = useCreateCodeMutation()

  return useMutation({
    mutationFn: async (payload: { codeSlug?: string; activeLayer?: number }) => {
      // Use auto-generated code if not provided
      const code = payload.codeSlug || generateRandomCode()

      // Store code in localStorage for future queries
      const result = await onChainMutation.mutateAsync(code)

      return result
    },
    onSuccess: async () => {
      // Invalidate affiliate queries
      await queryClient.invalidateQueries({ queryKey: referralKeys.affiliate() })
      await queryClient.refetchQueries({ queryKey: referralKeys.affiliate() })
    },
    onError: (error: Error) => {
      // Error handling already done in on-chain hook
      console.error('Create referral code error:', error)
    },
  })
}

/**
 * Bind to Referral Code (uses on-chain transaction)
 */
export function useBindReferralCode() {
  const queryClient = useQueryClient()
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useMutation({
    mutationFn: async (referralCode: string): Promise<{ code: string; txSignature: string }> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      const program = getReferralProgram(connection, wallet)
      if (!program) {
        throw new Error('Program not initialized')
      }

      // Validate code exists
      const codeAccount = await fetchReferralCode(connection, referralCode)
      if (!codeAccount) {
        throw new Error('Referral code does not exist')
      }

      if (!codeAccount.isActive) {
        throw new Error('Referral code is not active')
      }

      const referralConfig = await fetchReferralConfig(connection)
      if (!referralConfig) {
        throw new Error('Tessera Referrals is not initialized')
      }

      const [referralConfigPda] = getReferralConfigPDA(program.programId)
      // Note: tesseraTokenProgram field was removed from ReferralConfig struct
      // Use the global config function to get the token program ID
      const tesseraTokenProgramId = getTesseraTokenProgramId()

      // Get optional referrer registration if it exists
      const referrerPubkey = new PublicKey(codeAccount.owner)
      const referrerRegistration = await fetchUserRegistration(connection, referrerPubkey)
      const referrerRegistrationPda = referrerRegistration
        ? getUserRegistrationPDA(referrerPubkey, program.programId)[0]
        : null

      console.log('🔍 Referrer registration check:', {
        referrerPubkey: referrerPubkey.toBase58(),
        hasRegistration: !!referrerRegistration,
        referrerRegistrationPda: referrerRegistrationPda?.toBase58() ?? 'null',
      })

      // Get accounts with the referrer registration if available
      const accounts = getRegisterWithReferralCodeAccounts(referralCode, wallet.publicKey, {
        referrerRegistration: referrerRegistrationPda,
        referralConfig: referralConfigPda,
        programId: program.programId,
        tesseraTokenProgram: tesseraTokenProgramId,
      })

      console.log('🔍 Register with referral code - accounts:', {
        referralCode: accounts.referralCode.toBase58(),
        userRegistration: accounts.userRegistration.toBase58(),
        referrerRegistration: accounts.referrerRegistration?.toBase58() ?? 'null',
        senderFeeConfig: accounts.senderFeeConfig.toBase58(),
        user: accounts.user.toBase58(),
      })

      const txSignature = await program.methods.registerWithReferralCode().accounts(accounts).rpc()

      return { code: referralCode, txSignature }
    },
    onSuccess: (data) => {
      toast.success(`Registered with code "${data.code}"! TX: ${shortenAddress(data.txSignature)}`)
      queryClient.invalidateQueries({ queryKey: referralKeys.trader() })
      queryClient.invalidateQueries({ queryKey: referralKeys.affiliate() })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bind referral code')
    },
  })
}

/**
 * Helper: Generate random referral code (6-12 chars)
 */
function generateRandomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusing chars
  const length = 8
  let code = ''
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}
