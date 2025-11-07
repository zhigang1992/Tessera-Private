/**
 * Admin Close Referral Code Hook
 *
 * Allows admin to close/delete a referral code account and reclaim rent
 */

import { useMutation } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  useSolanaConnection,
  getReferralProgram,
  getReferralConfigPDA,
  getReferralCodePDA,
  getAdminListPDA,
} from '@/lib/solana'

interface CloseCodeInput {
  code: string
}

interface CloseCodeResult {
  signature: string
  code: string
}

/**
 * Admin: Close a referral code account
 * Only admins can use this - rent is returned to the authority
 */
export function useAdminCloseCode() {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useMutation({
    retry: false,
    mutationFn: async (input: CloseCodeInput): Promise<CloseCodeResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      const program = getReferralProgram(connection, wallet)
      if (!program) {
        throw new Error('Program not initialized')
      }

      const [referralConfigPDA] = getReferralConfigPDA(program.programId)
      const [referralCodePDA] = getReferralCodePDA(input.code, program.programId)
      const [adminListPDA] = getAdminListPDA(program.programId)

      console.log(`🗑️  Closing referral code: ${input.code}`)
      console.log(`   PDA: ${referralCodePDA.toBase58()}`)

      const signature = await program.methods
        .adminCloseReferralCode()
        .accounts({
          referralConfig: referralConfigPDA,
          adminList: adminListPDA,
          authority: wallet.publicKey,
          referralCode: referralCodePDA,
        })
        .rpc()

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      })

      console.log(`✅ Closed code ${input.code}`)
      console.log(`   TX: ${signature}`)

      return {
        signature,
        code: input.code,
      }
    },
  })
}
