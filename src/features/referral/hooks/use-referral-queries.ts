import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { toast } from 'sonner';

// Query keys
export const referralKeys = {
  all: ['referral'] as const,
  trader: () => [...referralKeys.all, 'trader'] as const,
  affiliate: () => [...referralKeys.all, 'affiliate'] as const,
};

// Trader queries
export function useTraderData(walletAddress?: string | null, enabled = true) {
  return useQuery({
    queryKey: [...referralKeys.trader(), walletAddress ?? 'no-wallet'],
    queryFn: () => {
      // If we have a wallet address but no authentication, use public endpoint
      if (walletAddress && !apiClient.getToken()) {
        return apiClient.getTraderDataPublic(walletAddress);
      }
      return apiClient.getTraderData();
    },
    enabled: enabled && (walletAddress !== undefined), // Enable if wallet is available or undefined
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer
    retry: 1, // Less aggressive retry for read operations that might not be authenticated
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });
}

// Affiliate queries
export function useAffiliateData(enabled = true, walletAddress?: string | null) {
  return useQuery({
    queryKey: [...referralKeys.affiliate(), walletAddress ?? 'no-wallet'],
    queryFn: () => {
      // If we have a wallet address but no authentication, use public endpoint
      if (walletAddress && !apiClient.getToken()) {
        return apiClient.getAffiliateDataPublic(walletAddress);
      }
      return apiClient.getAffiliateData();
    },
    enabled: enabled && (walletAddress !== undefined), // Enable if wallet is available or undefined
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer
    retry: 1, // Less aggressive retry for read operations that might not be authenticated
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });
}

// Mutations
export function useCreateReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { codeSlug?: string; activeLayer?: number }) =>
      apiClient.createReferralCode(payload),
    onSuccess: async () => {
      // Invalidate affiliate queries to force refetch
      await queryClient.invalidateQueries({ queryKey: referralKeys.affiliate() });
      // Also refetch immediately to ensure UI updates
      await queryClient.refetchQueries({ queryKey: referralKeys.affiliate() });
      toast.success('Referral code created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create referral code');
    },
  });
}

export function useBindReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (referralCode: string) => apiClient.bindToReferralCode(referralCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.trader() });
      queryClient.invalidateQueries({ queryKey: referralKeys.affiliate() });
      toast.success('Successfully bound to referral code!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bind referral code');
    },
  });
}
