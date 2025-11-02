/**
 * On-Chain Referral Hooks
 *
 * Replacement for use-referral-queries.ts
 * Uses on-chain Solana queries instead of off-chain API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import {
  useCreateReferralCode as useCreateCodeMutation,
  useSolanaConnection,
  getReferralProgram,
  fetchReferralCode,
  fetchReferralConfig,
  fetchUserRegistration,
  getReferralCodePDA,
  getUserRegistrationPDA,
  getReferralConfigPDA,
  getRegisterWithReferralCodeAccounts,
  getTesseraMintAddress,
  shortenAddress,
} from '@/lib/solana';

/**
 * Query Keys - mimics the old structure for easier migration
 */
export const referralKeys = {
  all: ['referral'] as const,
  trader: () => [...referralKeys.all, 'trader'] as const,
  affiliate: () => [...referralKeys.all, 'affiliate'] as const,
  userCodes: (wallet: string) => [...referralKeys.all, 'userCodes', wallet] as const,
};

/**
 * Trader Data (equivalent to useTraderData)
 * Returns user's registration and referral information
 */
export function useTraderData(walletAddress?: string | null, enabled = true) {
  const wallet = useWallet();
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: [...referralKeys.trader(), walletAddress ?? 'no-wallet'],
    queryFn: async () => {
      const pubkey = walletAddress ? new PublicKey(walletAddress) : wallet.publicKey;
      if (!pubkey) return null;

      // Fetch user registration from on-chain
      const program = getReferralProgram(connection, wallet);
      if (!program) return null;

      const [registrationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_registration'), pubkey.toBuffer()],
        program.programId
      );

      try {
        const registration = await (program.account as any).userRegistration.fetch(registrationPDA);

        // Fetch the referral code details
        let referralCode = null;
        if (registration.referralCode) {
          try {
            const codeAccount = await (program.account as any).referralCode.fetch(
              registration.referralCode
            );
            referralCode = {
              referrerCode: codeAccount.code,
              referrerWallet: registration.owner.toBase58(),
              boundAt: null, // Not stored on-chain in current schema
              lastModified: null,
            };
          } catch (error) {
            console.warn('Failed to fetch referral code details:', error);
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
        };
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
        };
      }
    },
    enabled: enabled && (!!walletAddress || !!wallet.publicKey),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Affiliate Data (equivalent to useAffiliateData)
 * Returns user's referral codes and metrics
 */
export function useAffiliateData(enabled = true, walletAddress?: string | null) {
  const wallet = useWallet();
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: [...referralKeys.affiliate(), walletAddress ?? 'no-wallet'],
    queryFn: async () => {
      const pubkey = walletAddress ? new PublicKey(walletAddress) : wallet.publicKey;
      if (!pubkey) return null;

      const program = getReferralProgram(connection, wallet);
      if (!program) return null;

      // Fetch all referral codes owned by this wallet
      // Note: This requires indexing or getProgramAccounts which is expensive
      // For now, return empty array - codes will be managed differently
      // In production, you'd need an indexer or maintain a list client-side

      const referralCodes: any[] = [];

      // Try to fetch known codes from localStorage or indexer
      // This is a simplified version - in production you'd query an indexer
      const knownCodes = getKnownCodesForWallet(pubkey.toBase58());

      for (const code of knownCodes) {
        try {
          const [codePDA] = getReferralCodePDA(code);
          const codeAccount = await (program.account as any).referralCode.fetch(codePDA);

          if (codeAccount.owner.equals(pubkey)) {
            referralCodes.push({
              id: code, // Use code as ID
              codeSlug: codeAccount.code,
              status: codeAccount.isActive ? 'active' : 'inactive',
              activeLayer: 3, // Not stored in current schema
              walletAddress: pubkey.toBase58(),
              createdAt: new Date().toISOString(), // Not stored on-chain
              updatedAt: new Date().toISOString(),
              referredTraderCount: codeAccount.totalReferrals,
            });
          }
        } catch (error) {
          // Code doesn't exist or error fetching
          console.warn(`Failed to fetch code ${code}:`, error);
        }
      }

      return {
        walletAddress: pubkey.toBase58(),
        displayName: null,
        email: null,
        emailVerified: false,
        metrics: {
          rebatesTotal: 0, // Not tracked in current schema
          referralPoints: 0,
          snapshotAt: new Date().toISOString(),
        },
        referralCodes,
        tree: {
          l1TraderCount: 0, // Would need to query all registrations
          l2TraderCount: 0,
          l3TraderCount: 0,
          totalTraderCount: 0,
          l1Traders: [],
          l2Traders: [],
          l3Traders: [],
        },
      };
    },
    enabled: enabled && (!!walletAddress || !!wallet.publicKey),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create Referral Code (uses on-chain transaction)
 */
export function useCreateReferralCode() {
  const queryClient = useQueryClient();
  const onChainMutation = useCreateCodeMutation();

  return useMutation({
    mutationFn: async (payload: { codeSlug?: string; activeLayer?: number }) => {
      // Use auto-generated code if not provided
      const code = payload.codeSlug || generateRandomCode();

      // Store code in localStorage for future queries
      const result = await onChainMutation.mutateAsync(code);

      // Save to localStorage for tracking user's codes
      addKnownCodeForWallet(result.code);

      return result;
    },
    onSuccess: async () => {
      // Invalidate affiliate queries
      await queryClient.invalidateQueries({ queryKey: referralKeys.affiliate() });
      await queryClient.refetchQueries({ queryKey: referralKeys.affiliate() });
    },
    onError: (error: Error) => {
      // Error handling already done in on-chain hook
      console.error('Create referral code error:', error);
    },
  });
}

/**
 * Bind to Referral Code (uses on-chain transaction)
 */
export function useBindReferralCode() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const connection = useSolanaConnection();

  return useMutation({
    mutationFn: async (referralCode: string): Promise<{ code: string; txSignature: string }> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const program = getReferralProgram(connection, wallet);
      if (!program) {
        throw new Error('Program not initialized');
      }

      // Validate code exists
      const codeAccount = await fetchReferralCode(connection, referralCode);
      if (!codeAccount) {
        throw new Error('Referral code does not exist');
      }

      if (!codeAccount.isActive) {
        throw new Error('Referral code is not active');
      }

      const referralConfig = await fetchReferralConfig(connection);
      if (!referralConfig) {
        throw new Error('Referral system is not initialized');
      }

      const [referralConfigPda] = getReferralConfigPDA(program.programId);
      const tesseraMint = getTesseraMintAddress();

      const referrerPubkey = new PublicKey(codeAccount.owner);
      const referrerRegistrationAccount = await fetchUserRegistration(connection, referrerPubkey);
      const referrerRegistrationPda = referrerRegistrationAccount
        ? getUserRegistrationPDA(referrerPubkey, program.programId)[0]
        : null;

      const accounts = getRegisterWithReferralCodeAccounts(referralCode, wallet.publicKey, {
        mint: tesseraMint,
        referralConfig: referralConfigPda,
        referrerRegistration: referrerRegistrationPda,
        programId: program.programId,
      });

      const txSignature = await program.methods
        .registerWithReferralCode()
        .accounts(accounts as any)
        .rpc();

      return { code: referralCode, txSignature };
    },
    onSuccess: (data) => {
      toast.success(
        `Registered with code "${data.code}"! TX: ${shortenAddress(data.txSignature)}`
      );
      queryClient.invalidateQueries({ queryKey: referralKeys.trader() });
      queryClient.invalidateQueries({ queryKey: referralKeys.affiliate() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bind referral code');
    },
  });
}

/**
 * Helper: Generate random referral code (6-12 chars)
 */
function generateRandomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
  const length = 8;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/**
 * LocalStorage helpers for tracking user's codes
 * In production, this should be replaced with an indexer
 */
const KNOWN_CODES_KEY = 'referral_known_codes';

function getKnownCodesForWallet(walletAddress: string): string[] {
  try {
    const data = localStorage.getItem(`${KNOWN_CODES_KEY}_${walletAddress}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function addKnownCodeForWallet(code: string) {
  try {
    // Get current wallet
    const wallet = (window as any).__currentWallet as string | undefined;
    if (!wallet) return;

    const known = getKnownCodesForWallet(wallet);
    if (!known.includes(code)) {
      known.push(code);
      localStorage.setItem(`${KNOWN_CODES_KEY}_${wallet}`, JSON.stringify(known));
    }
  } catch (error) {
    console.error('Failed to save known code:', error);
  }
}

// Set current wallet for tracking (call this when wallet connects)
export function setCurrentWalletForTracking(walletAddress: string) {
  (window as any).__currentWallet = walletAddress;
}
