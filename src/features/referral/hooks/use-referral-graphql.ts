/**
 * GraphQL-based Referral Hooks
 *
 * Fetches referral statistics from Hasura GraphQL endpoint
 * to supplement on-chain data with aggregated metrics
 */

import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  fetchAffiliateStats,
  fetchReferralCodesByOwner,
  fetchUserRegistration,
  fetchUsersForCode,
  type AggregatedAffiliateStats,
  type ReferralCodeCreatedEvent,
  type UserRegisteredEvent,
  type CodeRegisterView,
} from '../lib/graphql-client'

/**
 * Query Keys
 */
export const referralGraphqlKeys = {
  all: ['referral-graphql'] as const,
  affiliateStats: (wallet: string) => [...referralGraphqlKeys.all, 'affiliate-stats', wallet] as const,
  referralCodes: (wallet: string) => [...referralGraphqlKeys.all, 'referral-codes', wallet] as const,
  userRegistration: (wallet: string) => [...referralGraphqlKeys.all, 'user-registration', wallet] as const,
  tradersForCode: (code: string) => [...referralGraphqlKeys.all, 'traders-for-code', code] as const,
}

/**
 * Fetch aggregated affiliate stats from GraphQL
 * Includes referral counts, trading volumes, and rewards by tier
 */
export function useAffiliateGraphqlStats(walletAddress?: string | null) {
  const wallet = useWallet()
  const address = walletAddress ?? wallet.publicKey?.toBase58()

  return useQuery<AggregatedAffiliateStats | null>({
    queryKey: referralGraphqlKeys.affiliateStats(address ?? 'no-wallet'),
    queryFn: async () => {
      if (!address) return null
      return fetchAffiliateStats(address)
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch referral codes created by the wallet from GraphQL
 * This provides historical code creation data with timestamps
 */
export function useReferralCodesGraphql(walletAddress?: string | null) {
  const wallet = useWallet()
  const address = walletAddress ?? wallet.publicKey?.toBase58()

  return useQuery<ReferralCodeCreatedEvent[]>({
    queryKey: referralGraphqlKeys.referralCodes(address ?? 'no-wallet'),
    queryFn: async () => {
      if (!address) return []
      return fetchReferralCodesByOwner(address)
    },
    enabled: !!address,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch user registration info (what referral code they're bound to)
 */
export function useUserRegistrationGraphql(walletAddress?: string | null) {
  const wallet = useWallet()
  const address = walletAddress ?? wallet.publicKey?.toBase58()

  return useQuery<UserRegisteredEvent | null>({
    queryKey: referralGraphqlKeys.userRegistration(address ?? 'no-wallet'),
    queryFn: async () => {
      if (!address) return null
      return fetchUserRegistration(address)
    },
    enabled: !!address,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch traders registered under a specific referral code
 */
export function useTradersForCode(referralCode?: string | null) {
  return useQuery<CodeRegisterView[]>({
    queryKey: referralGraphqlKeys.tradersForCode(referralCode ?? 'no-code'),
    queryFn: async () => {
      if (!referralCode) return []
      return fetchUsersForCode(referralCode)
    },
    enabled: !!referralCode,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
