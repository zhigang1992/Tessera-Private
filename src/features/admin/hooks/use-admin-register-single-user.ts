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
  getTesseraTokenProgramId,
  findReferralCodeByString,
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
    retry: false, // Don't retry on failure - user needs to manually retry
    mutationFn: async (input: RegisterUserInput): Promise<RegisterUserResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      const program = getReferralProgram(connection, wallet)
      if (!program) {
        throw new Error('Program not initialized')
      }

      const userPubkey = new PublicKey(input.binding.userWallet)

      // Search for referral code on-chain (we don't know owner beforehand)
      const codeAccount = await findReferralCodeByString(connection, input.binding.referralCode)
      if (!codeAccount) {
        throw new Error(
          `Referral code "${input.binding.referralCode}" does not exist on-chain.\n` +
            `Make sure this exact code was created in Step 3.`,
        )
      }

      if (!codeAccount.isActive) {
        throw new Error(`Referral code "${input.binding.referralCode}" is not active`)
      }

      const [referralConfigPDA] = getReferralConfigPDA(program.programId)
      const [referralCodePDA] = getReferralCodePDA(input.binding.referralCode, codeAccount.owner, program.programId)
      const [userRegistrationPDA] = getUserRegistrationPDA(userPubkey, program.programId)
      const [tokenAuthorityPDA] = getTokenAuthorityPDA(referralConfigPDA, program.programId)
      const [adminListPDA] = getAdminListPDA(program.programId)

      // Get optional referrer registration if it exists (similar to user-facing flow)
      const referrerPubkey = codeAccount.owner
      const referrerRegistration = await fetchUserRegistration(connection, referrerPubkey)
      const referrerRegistrationPDA = referrerRegistration
        ? getUserRegistrationPDA(referrerPubkey, program.programId)[0]
        : null

      // Note: tesseraTokenProgram field was removed from ReferralConfig struct
      // Use the global config function to get the token program ID
      const tesseraTokenProgramId = getTesseraTokenProgramId()

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
        } as any)
        .rpc()

      return {
        signature,
        user: input.binding.userWallet,
        referralCode: input.binding.referralCode,
      }
    },
  })
}
