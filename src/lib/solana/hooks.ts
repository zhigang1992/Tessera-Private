/**
 * React Hooks for Solana On-Chain Interactions
 *
 * Custom hooks for interacting with the Tessera Referrals program.
 * Integrates with React Query for caching and state management.
 */

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet, useConnection } from '@/hooks/use-wallet'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import {
  createConnection,
  getReferralProgram,
  fetchReferralCode,
  fetchUserRegistration,
  fetchReferralConfig,
  getCreateReferralCodeAccounts,
  getReferralConfigPDA,
  getRegisterWithReferralCodeAccounts,
  getUserRegistrationPDA,
  validateReferralCodeFormat,
  checkReferralCodeAvailability,
  findReferralCodeByString,
  shortenAddress,
} from './on-chain-client'
import { getTesseraTokenProgramId } from '@/config'

/**
 * Query Keys
 */
export const QUERY_KEYS = {
  referralConfig: ['referral', 'config'] as const,
  referralCode: (code: string) => ['referral', 'code', code] as const,
  userRegistration: (wallet: string) => ['referral', 'user', wallet] as const,
  userCodes: (wallet: string) => ['referral', 'userCodes', wallet] as const,
} as const

/**
 * Hook: Get Solana connection
 */
export function useSolanaConnection() {
  const { connection } = useConnection()
  return connection || createConnection()
}

/**
 * Hook: Get referral program instance
 */
export function useReferralProgram() {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  // useMemo to prevent re-creating the program on every render
  return React.useMemo(() => {
    if (!wallet.publicKey) {
      return null
    }
    return getReferralProgram(connection, wallet)
  }, [connection, wallet, wallet.publicKey])
}

/**
 * Hook: Query referral config
 */
export function useReferralConfig() {
  const connection = useSolanaConnection()

  return useQuery({
    queryKey: QUERY_KEYS.referralConfig,
    queryFn: () => fetchReferralConfig(connection),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook: Query referral code
 */
export function useReferralCode(code: string | null, ownerPubkey: PublicKey | null) {
  const connection = useSolanaConnection()

  return useQuery({
    queryKey: [...QUERY_KEYS.referralCode(code || ''), ownerPubkey?.toBase58()],
    queryFn: () => {
      if (!code || !ownerPubkey) return null
      return fetchReferralCode(connection, code, ownerPubkey)
    },
    enabled: !!code && code.length >= 6 && !!ownerPubkey,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook: Query user registration
 */
export function useUserRegistration() {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useQuery({
    queryKey: QUERY_KEYS.userRegistration(wallet.publicKey?.toBase58() || ''),
    queryFn: () => {
      if (!wallet.publicKey) return null
      return fetchUserRegistration(connection, wallet.publicKey)
    },
    enabled: !!wallet.publicKey,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook: Check if user is registered
 */
export function useIsUserRegistered() {
  const { data: registration, isLoading } = useUserRegistration()
  return {
    isRegistered: !!registration,
    registration,
    isLoading,
  }
}

/**
 * Hook: Create referral code mutation
 */
export function useCreateReferralCode() {
  const wallet = useWallet()
  const program = useReferralProgram()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      if (!program) {
        throw new Error('Program not initialized')
      }

      // Validate code format
      const validation = validateReferralCodeFormat(code)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Check availability (for this owner)
      const connection = createConnection()
      const availability = await checkReferralCodeAvailability(connection, code, wallet.publicKey)
      if (!availability.available) {
        throw new Error('Referral code already exists for this wallet')
      }

      // PRE-FLIGHT CHECK: Verify program is deployed on our connection
      const programInfo = await connection.getAccountInfo(program.programId)
      console.log('🔍 Pre-flight check:')
      console.log('  Program ID:', program.programId.toBase58())
      console.log('  RPC Endpoint:', connection.rpcEndpoint)
      console.log('  Program exists:', !!programInfo)
      console.log('  Program executable:', programInfo?.executable)

      if (!programInfo || !programInfo.executable) {
        throw new Error(
          `Program not deployed on ${connection.rpcEndpoint}. ` +
            `Please ensure your wallet is connected to the same network as the app (devnet).`,
        )
      }

      // Get accounts
      const accounts = getCreateReferralCodeAccounts(code, wallet.publicKey, program.programId)

      console.log('🚀 Sending createReferralCode transaction:')
      console.log('  Code:', code)
      console.log('  ReferralCode PDA:', accounts.referralCode.toBase58())
      console.log('  Owner:', accounts.owner.toBase58())

      // Send transaction with skipPreflight to bypass wallet's simulation
      // This is necessary because Phantom may simulate on a different network than configured
      try {
        const tx = await program.methods
          .createReferralCode(code)
          .accounts(accounts)
          .rpc({ skipPreflight: true, commitment: 'confirmed' })

        return { code, txSignature: tx }
      } catch (sendError: any) {
        // Extract detailed error information
        console.error('🔴 Transaction failed:', sendError)
        console.error('  Error name:', sendError?.name)
        console.error('  Error message:', sendError?.message)
        console.error('  Error JSON:', JSON.stringify(sendError, null, 2))

        if (sendError.logs) {
          console.error('  Transaction logs:', sendError.logs)
        }
        if (sendError.getLogs) {
          try {
            const logs = await sendError.getLogs()
            console.error('  Detailed logs:', logs)
          } catch (e) {
            console.error('  Could not get logs:', e)
          }
        }

        // Check for InstructionError with UnsupportedProgramId
        const errorJson = JSON.stringify(sendError)
        const errorStr = sendError?.message || String(sendError)
        console.error('  Error string check:', errorStr)
        console.error('  Error JSON check:', errorJson)

        if (
          errorStr.includes('not deployed') ||
          errorStr.includes('UnsupportedProgramId') ||
          errorJson.includes('UnsupportedProgramId') ||
          errorJson.includes('InvalidProgramId')
        ) {
          throw new Error(
            'Transaction failed: Program not found on the network your wallet is connected to. ' +
              'Please ensure Phantom is set to Devnet (Settings > Developer Settings > Testnet Mode ON)',
          )
        }
        throw sendError
      }
    },
    onSuccess: (data) => {
      toast.success(`Code "${data.code}" created! Transaction: ${shortenAddress(data.txSignature)}`)

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.referralCode(data.code),
      })
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userCodes(wallet.publicKey.toBase58()),
        })
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create referral code:', error)
      toast.error(`Failed to create code: ${error.message}`)
    },
  })
}

/**
 * Hook: Register with referral code mutation
 */
export function useRegisterWithReferralCode() {
  const wallet = useWallet()
  const program = useReferralProgram()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      if (!program) {
        throw new Error('Program not initialized')
      }

      // Validate code format
      const validation = validateReferralCodeFormat(code)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Search for the code on-chain (since we don't know the owner)
      const connection = createConnection()
      const codeAccount = await findReferralCodeByString(connection, code)
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

      const referrerPubkey = codeAccount.owner
      const referrerRegistration = await fetchUserRegistration(connection, referrerPubkey)
      const referrerRegistrationPda = referrerRegistration
        ? getUserRegistrationPDA(referrerPubkey, program.programId)[0]
        : null

      console.log('🔍 [hooks] Referrer registration check:', {
        referrerPubkey: referrerPubkey.toBase58(),
        hasRegistration: !!referrerRegistration,
        referrerRegistrationPda: referrerRegistrationPda?.toBase58() ?? 'null',
      })

      const accounts = getRegisterWithReferralCodeAccounts(code, wallet.publicKey, {
        codeOwner: codeAccount.owner,
        referralConfig: referralConfigPda,
        referrerRegistration: referrerRegistrationPda,
        programId: program.programId,
        tesseraTokenProgram: tesseraTokenProgramId,
      })

      console.log('🔍 [hooks] Register accounts:', {
        referralCode: accounts.referralCode.toBase58(),
        referrerRegistration: accounts.referrerRegistration?.toBase58() ?? 'null',
        senderFeeConfig: accounts.senderFeeConfig.toBase58(),
        user: accounts.user.toBase58(),
      })

      const tx = await program.methods
        .registerWithReferralCode()
        .accounts(accounts as any)
        .rpc()

      return { code, txSignature: tx }
    },
    onSuccess: (data: any) => {
      toast.success(`Registered with code "${data.code}"! Transaction: ${shortenAddress(data.txSignature)}`)

      // Invalidate queries
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userRegistration(wallet.publicKey.toBase58()),
        })
      }
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.referralCode(data.code),
      })
    },
    onError: (error: Error) => {
      console.error('Failed to register with referral code:', error)
      toast.error(`Failed to register: ${error.message}`)
    },
  })
}

/**
 * Hook: Check referral code availability for current wallet (debounced)
 * Note: With the new PDA scheme, codes are unique per owner, so this checks
 * if the current wallet can create this code.
 */
export function useCheckCodeAvailability(code: string) {
  const connection = useSolanaConnection()
  const wallet = useWallet()

  return useQuery({
    queryKey: ['checkAvailability', code, wallet.publicKey?.toBase58()],
    queryFn: () => {
      if (!code || code.length < 6 || !wallet.publicKey) {
        return { available: false, exists: false }
      }
      return checkReferralCodeAvailability(connection, code, wallet.publicKey)
    },
    enabled: code.length >= 6 && !!wallet.publicKey,
    staleTime: 5000, // 5 seconds
  })
}

/**
 * Hook: Get user's referral tree
 * Returns the complete 3-tier referral structure
 */
export function useReferralTree() {
  const { data: registration } = useUserRegistration()

  return useQuery({
    queryKey: ['referralTree', registration?.user.toBase58()],
    queryFn: async () => {
      if (!registration) return null

      const tree = {
        tier1: registration.tier1Referrer,
        tier2: registration.tier2Referrer,
        tier3: registration.tier3Referrer,
      }

      // Fetch details for each referrer if not default
      // TODO: Implement detailed fetching if needed

      return tree
    },
    enabled: !!registration,
  })
}

/**
 * Hook: Get transaction status
 */
export function useTransactionStatus(signature: string | null) {
  const connection = useSolanaConnection()

  return useQuery({
    queryKey: ['transaction', signature],
    queryFn: async () => {
      if (!signature) return null

      const status = await connection.getSignatureStatus(signature)
      return status
    },
    enabled: !!signature,
    refetchInterval: (query) => {
      // Stop refetching once confirmed
      const data = query.state.data
      if (data?.value?.confirmationStatus === 'finalized') {
        return false
      }
      return 2000 // Poll every 2 seconds
    },
  })
}
