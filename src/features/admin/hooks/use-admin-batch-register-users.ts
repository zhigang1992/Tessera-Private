/**
 * Admin Batch Register Users Hook
 *
 * Uses admin_batch_register_with_referral_code instruction
 */

import { useMutation } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useSolanaConnection, getReferralProgram, getReferralConfigPDA, getReferralCodePDA } from '@/lib/solana'
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

const MAX_BATCH_SIZE = 10

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

      const [referralConfigPDA] = getReferralConfigPDA(program.programId)

      const result: BatchRegisterUsersResult = {
        signatures: [],
        successful: 0,
        failed: 0,
        errors: [],
      }

      // Split into batches of MAX_BATCH_SIZE
      const batches: TraderBindingData[][] = []
      for (let i = 0; i < input.bindings.length; i += MAX_BATCH_SIZE) {
        batches.push(input.bindings.slice(i, i + MAX_BATCH_SIZE))
      }

      // Process each batch
      for (const batch of batches) {
        const users = batch.map((b) => new PublicKey(b.userWallet))
        const referralCodeKeys = batch.map((b) => {
          const [codePDA] = getReferralCodePDA(b.referralCode, program.programId)
          return codePDA
        })

        try {
          const signature = await program.methods
            .adminBatchRegisterWithReferralCode(users, referralCodeKeys)
            .accounts({
              referralConfig: referralConfigPDA,
              authority: wallet.publicKey,
              payer: wallet.publicKey,
              systemProgram: new PublicKey('11111111111111111111111111111111'),
            })
            .rpc()

          result.signatures.push(signature)
          result.successful += batch.length

          console.log(`✓ Batch registered ${batch.length} users: ${signature}`)
        } catch (error) {
          result.failed += batch.length

          // Add individual errors for each user in the failed batch
          batch.forEach((binding) => {
            result.errors.push({
              user: binding.userWallet,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          })

          console.error(
            `✗ Batch failed for users:`,
            batch.map((b) => b.userWallet),
            error,
          )
        }
      }

      return result
    },
  })
}
