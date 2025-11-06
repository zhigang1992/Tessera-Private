/**
 * Admin Register Single User Hook
 *
 * Uses admin_register_with_referral_code instruction (single user)
 */

import { useMutation } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import {
  useSolanaConnection,
  getReferralProgram,
  getReferralConfigPDA,
  getReferralCodePDA,
  getUserRegistrationPDA,
  getTokenAuthorityPDA,
  getAdminListPDA,
  getWhitelistEntryPDA,
  getTesseraMintAddress,
  fetchReferralCode,
  fetchUserRegistration,
} from '@/lib/solana'
import type { TraderBindingData } from '../types/migration'

interface RegisterUserInput {
  binding: TraderBindingData
}

interface RegisterUserResult {
  signature: string
  user: string
  referralCode: string
}

/**
 * Admin: Register a single user with a referral code
 * Only the program authority can use this
 */
export function useAdminRegisterSingleUser() {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useMutation({
    mutationFn: async (input: RegisterUserInput): Promise<RegisterUserResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      const program = getReferralProgram(connection, wallet)
      if (!program) {
        throw new Error('Program not initialized')
      }

      const userPubkey = new PublicKey(input.binding.userWallet)

      // Validate referral code exists on-chain
      const codeAccount = await fetchReferralCode(connection, input.binding.referralCode)
      if (!codeAccount) {
        // Debug: Show the PDA we're looking for
        const [codePDA] = getReferralCodePDA(input.binding.referralCode, program.programId)
        throw new Error(
          `Referral code "${input.binding.referralCode}" does not exist on-chain.\n` +
            `PDA: ${codePDA.toBase58()}\n` +
            `Code bytes: ${Array.from(Buffer.from(input.binding.referralCode)).join(',')}\n` +
            `Make sure this exact code was created in Step 3.`,
        )
      }

      if (!codeAccount.isActive) {
        throw new Error(`Referral code "${input.binding.referralCode}" is not active`)
      }

      const [referralConfigPDA] = getReferralConfigPDA(program.programId)
      const [referralCodePDA] = getReferralCodePDA(input.binding.referralCode, program.programId)
      const [userRegistrationPDA] = getUserRegistrationPDA(userPubkey, program.programId)
      const [tokenAuthorityPDA] = getTokenAuthorityPDA(referralConfigPDA, program.programId)
      const [adminListPDA] = getAdminListPDA(program.programId)

      // Get optional referrer registration if it exists (similar to user-facing flow)
      const referrerPubkey = new PublicKey(codeAccount.owner)
      const referrerRegistration = await fetchUserRegistration(connection, referrerPubkey)
      const referrerRegistrationPDA = referrerRegistration
        ? getUserRegistrationPDA(referrerPubkey, program.programId)[0]
        : null

      // IMPORTANT: Fetch the referral config to get the tessera_token_program stored on-chain
      // The admin instruction has a constraint that requires this exact program ID
      const referralConfigAccount = await program.account.referralConfig.fetch(referralConfigPDA)
      const tesseraTokenProgramId = referralConfigAccount.tesseraTokenProgram

      const tesseraMint = getTesseraMintAddress()
      const [whitelistEntryPDA] = getWhitelistEntryPDA(userPubkey, tesseraTokenProgramId)

      const signature = await program.methods
        .adminRegisterWithReferralCode(userPubkey)
        .accounts({
          referralCode: referralCodePDA,
          userRegistration: userRegistrationPDA,
          referralConfig: referralConfigPDA,
          tokenAuthority: tokenAuthorityPDA,
          adminList: adminListPDA,
          referrerRegistration: referrerRegistrationPDA,
          whitelistEntry: whitelistEntryPDA,
          userAccount: userPubkey,
          tesseraMint: tesseraMint,
          tesseraTokenProgram: tesseraTokenProgramId,
          authority: wallet.publicKey,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return {
        signature,
        user: input.binding.userWallet,
        referralCode: input.binding.referralCode,
      }
    },
  })
}
