/**
 * React Hooks for Solana On-Chain Interactions
 *
 * Custom hooks for interacting with the referral system program.
 * Integrates with React Query for caching and state management.
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
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
  shortenAddress,
} from './on-chain-client';
import { getTesseraMintAddress } from './config';

/**
 * Query Keys
 */
export const QUERY_KEYS = {
  referralConfig: ['referral', 'config'] as const,
  referralCode: (code: string) => ['referral', 'code', code] as const,
  userRegistration: (wallet: string) => ['referral', 'user', wallet] as const,
  userCodes: (wallet: string) => ['referral', 'userCodes', wallet] as const,
} as const;

/**
 * Hook: Get Solana connection
 */
export function useSolanaConnection() {
  const { connection } = useConnection();
  return connection || createConnection();
}

/**
 * Hook: Get referral program instance
 */
export function useReferralProgram() {
  const wallet = useWallet();
  const connection = useSolanaConnection();

  // useMemo to prevent re-creating the program on every render
  return React.useMemo(() => {
    if (!wallet.publicKey) {
      return null;
    }
    return getReferralProgram(connection, wallet);
  }, [connection, wallet, wallet.publicKey]);
}

/**
 * Hook: Query referral config
 */
export function useReferralConfig() {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: QUERY_KEYS.referralConfig,
    queryFn: () => fetchReferralConfig(connection),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Query referral code
 */
export function useReferralCode(code: string | null) {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: QUERY_KEYS.referralCode(code || ''),
    queryFn: () => {
      if (!code) return null;
      return fetchReferralCode(connection, code);
    },
    enabled: !!code && code.length >= 6,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook: Query user registration
 */
export function useUserRegistration() {
  const wallet = useWallet();
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: QUERY_KEYS.userRegistration(wallet.publicKey?.toBase58() || ''),
    queryFn: () => {
      if (!wallet.publicKey) return null;
      return fetchUserRegistration(connection, wallet.publicKey);
    },
    enabled: !!wallet.publicKey,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook: Check if user is registered
 */
export function useIsUserRegistered() {
  const { data: registration, isLoading } = useUserRegistration();
  return {
    isRegistered: !!registration,
    registration,
    isLoading,
  };
}

/**
 * Hook: Create referral code mutation
 */
export function useCreateReferralCode() {
  const wallet = useWallet();
  const program = useReferralProgram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!program) {
        throw new Error('Program not initialized');
      }

      // Validate code format
      const validation = validateReferralCodeFormat(code);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Check availability
      const connection = createConnection();
      const availability = await checkReferralCodeAvailability(connection, code);
      if (!availability.available) {
        throw new Error('Referral code already exists');
      }

      // Get accounts
      const accounts = getCreateReferralCodeAccounts(
        code,
        wallet.publicKey,
        program.programId
      );

      // Send transaction
      const tx = await program.methods.createReferralCode(code).accounts(accounts).rpc();

      return { code, txSignature: tx };
    },
    onSuccess: (data) => {
      toast.success(
        `Code "${data.code}" created! Transaction: ${shortenAddress(data.txSignature)}`
      );

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.referralCode(data.code),
      });
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userCodes(wallet.publicKey.toBase58()),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create referral code:', error);
      toast.error(`Failed to create code: ${error.message}`);
    },
  });
}

/**
 * Hook: Register with referral code mutation
 */
export function useRegisterWithReferralCode() {
  const wallet = useWallet();
  const program = useReferralProgram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!program) {
        throw new Error('Program not initialized');
      }

      // Validate code format
      const validation = validateReferralCodeFormat(code);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Check code exists
      const connection = createConnection();
      const codeAccount = await fetchReferralCode(connection, code);
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
      const tesseraTokenProgramId = new PublicKey(
        (referralConfig as any).tesseraTokenProgram ?? (referralConfig as any).tessera_token_program
      );

      const referrerPubkey = new PublicKey(codeAccount.owner);
      const referrerRegistration = await fetchUserRegistration(connection, referrerPubkey);
      const referrerRegistrationPda = referrerRegistration
        ? getUserRegistrationPDA(referrerPubkey, program.programId)[0]
        : null;

      const accounts = getRegisterWithReferralCodeAccounts(code, wallet.publicKey, {
        tesseraMint,
        referralConfig: referralConfigPda,
        referrerRegistration: referrerRegistrationPda,
        programId: program.programId,
        tesseraTokenProgram: tesseraTokenProgramId,
      });

      const tx = await program.methods
        .registerWithReferralCode()
        .accounts(accounts as any)
        .rpc();

      return { code, txSignature: tx };
    },
    onSuccess: (data: any) => {
      toast.success(
        `Registered with code "${data.code}"! Transaction: ${shortenAddress(data.txSignature)}`
      );

      // Invalidate queries
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userRegistration(wallet.publicKey.toBase58()),
        });
      }
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.referralCode(data.code),
      });
    },
    onError: (error: Error) => {
      console.error('Failed to register with referral code:', error);
      toast.error(`Failed to register: ${error.message}`);
    },
  });
}

/**
 * Hook: Check referral code availability (debounced)
 */
export function useCheckCodeAvailability(code: string) {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: ['checkAvailability', code],
    queryFn: () => {
      if (!code || code.length < 6) {
        return { available: false, exists: false };
      }
      return checkReferralCodeAvailability(connection, code);
    },
    enabled: code.length >= 6,
    staleTime: 5000, // 5 seconds
  });
}

/**
 * Hook: Get user's referral tree
 * Returns the complete 3-tier referral structure
 */
export function useReferralTree() {
  const { data: registration } = useUserRegistration();

  return useQuery({
    queryKey: ['referralTree', registration?.user.toBase58()],
    queryFn: async () => {
      if (!registration) return null;

      const tree = {
        tier1: registration.owner,
        tier2: registration.tier2Referrer,
        tier3: registration.tier3Referrer,
      };

      // Fetch details for each referrer if not default
      // TODO: Implement detailed fetching if needed

      return tree;
    },
    enabled: !!registration,
  });
}

/**
 * Hook: Get transaction status
 */
export function useTransactionStatus(signature: string | null) {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: ['transaction', signature],
    queryFn: async () => {
      if (!signature) return null;

      const status = await connection.getSignatureStatus(signature);
      return status;
    },
    enabled: !!signature,
    refetchInterval: (query) => {
      // Stop refetching once confirmed
      const data = query.state.data;
      if (data?.value?.confirmationStatus === 'finalized') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}
