/**
 * Admin Batch Create Referral Codes Hook
 *
 * Uses admin_batch_create_referral_codes instruction (true batch operation)
 * Creates up to 10 referral codes in a single on-chain transaction
 *
 * The on-chain program now handles PDA allocation automatically via invoke_signed
 */

import { useMutation } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import {
  useSolanaConnection,
  getReferralProgram,
  getReferralConfigPDA,
  getReferralCodePDA,
  getAdminListPDA,
} from '@/lib/solana'
import type { ReferralCodeData } from '../types/migration'

interface BatchCreateCodesInput {
  codes: ReferralCodeData[]
}

interface BatchCreateCodesResult {
  signature: string
  count: number
}

/**
 * Admin: Batch create referral codes (up to 10 at once)
 * Only the program authority can use this
 *
 * Uses the on-chain batch instruction which automatically allocates PDAs
 */
export function useAdminBatchCreateCodes() {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useMutation({
    retry: false, // Don't retry on failure - user needs to manually retry
    mutationFn: async (input: BatchCreateCodesInput): Promise<BatchCreateCodesResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      if (input.codes.length === 0 || input.codes.length > 10) {
        throw new Error('Batch size must be between 1 and 10')
      }

      const program = getReferralProgram(connection, wallet)
      if (!program) {
        throw new Error('Program not initialized')
      }

      const [referralConfigPDA] = getReferralConfigPDA(program.programId)
      const [adminListPDA] = getAdminListPDA(program.programId)

      // Extract codes and owners
      const codes = input.codes.map((c) => c.code)
      const owners = input.codes.map((c) => new PublicKey(c.ownerWallet))

      // Derive all referral code PDAs and pass as remaining accounts
      const referralCodePDAs = input.codes.map((c) => {
        const [pda] = getReferralCodePDA(c.code, program.programId)
        return {
          pubkey: pda,
          isWritable: true,
          isSigner: false,
        }
      })

      // Execute the batch create instruction
      // The on-chain program will automatically allocate the PDAs using invoke_signed
      const signature = await program.methods
        .adminBatchCreateReferralCodes(codes, owners)
        .accounts({
          referralConfig: referralConfigPDA,
          adminList: adminListPDA,
          authority: wallet.publicKey,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(referralCodePDAs)
        .rpc()

      // Wait for transaction confirmation before returning
      // This ensures the codes exist on-chain before Step 4 tries to validate them
      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      })

      // Debug: Log created codes and their PDAs
      console.log('✅ Batch created codes:')
      input.codes.forEach((codeData) => {
        const [pda] = getReferralCodePDA(codeData.code, program.programId)
        console.log(`  - "${codeData.code}" → PDA: ${pda.toBase58()}`)
      })

      return {
        signature,
        count: input.codes.length,
      }
    },
  })
}
