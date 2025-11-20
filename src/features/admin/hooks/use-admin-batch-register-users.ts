/**
 * Admin Batch Register Users Hook
 *
 * Uses admin_batch_register_with_referral_code instruction
 */

import { useMutation } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSolanaConnection, getReferralProgram } from '@/lib/solana'
import type { TraderBindingData } from '../types/migration'

interface BatchRegisterUsersInput {
  bindings: TraderBindingData[]
}

interface BatchRegisterUsersResult {
  signatures: string[]
  successful: number
  failed: number
  errors: Array<{ user: string; error: string }>
}

/**
 * Admin: Batch register users with referral codes
 * Only the program authority can use this
 */
export function useAdminBatchRegisterUsers() {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useMutation({
    mutationFn: async (input: BatchRegisterUsersInput): Promise<BatchRegisterUsersResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      const program = getReferralProgram(connection, wallet)
      if (!program) {
        throw new Error('Program not initialized')
      }

      // Suppress unused variable warnings
      void program
      void input

      // NOTE: Batch method removed from on-chain program - this hook is deprecated
      throw new Error('adminBatchRegisterWithReferralCode method no longer exists in on-chain program')
    },
  })
}
