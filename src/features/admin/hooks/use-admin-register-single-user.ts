/**
 * Admin Register Single User Hook
 *
 * Uses admin_register_with_referral_code instruction (single user)
 */

import { useMutation } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
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
} from '@/lib/solana';
import type { TraderBindingData } from '../types/migration';

interface RegisterUserInput {
  binding: TraderBindingData;
}

interface RegisterUserResult {
  signature: string;
  user: string;
  referralCode: string;
}

/**
 * Admin: Register a single user with a referral code
 * Only the program authority can use this
 */
export function useAdminRegisterSingleUser() {
  const wallet = useWallet();
  const connection = useSolanaConnection();

  return useMutation({
    mutationFn: async (input: RegisterUserInput): Promise<RegisterUserResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const program = getReferralProgram(connection, wallet);
      if (!program) {
        throw new Error('Program not initialized');
      }

      const userPubkey = new PublicKey(input.binding.userWallet);
      const [referralConfigPDA] = getReferralConfigPDA(program.programId);
      const [referralCodePDA] = getReferralCodePDA(input.binding.referralCode, program.programId);
      const [userRegistrationPDA] = getUserRegistrationPDA(userPubkey, program.programId);
      const [tokenAuthorityPDA] = getTokenAuthorityPDA(referralConfigPDA, program.programId);
      const [adminListPDA] = getAdminListPDA(program.programId);

      const tesseraMint = getTesseraMintAddress();
      const tesseraTokenProgramId = getTesseraTokenProgramId();
      const [whitelistEntryPDA] = getWhitelistEntryPDA(userPubkey, tesseraTokenProgramId);

      const signature = await program.methods
        .adminRegisterWithReferralCode(userPubkey)
        .accounts({
          referralCode: referralCodePDA,
          userRegistration: userRegistrationPDA,
          referralConfig: referralConfigPDA,
          tokenAuthority: tokenAuthorityPDA,
          adminList: adminListPDA,
          referrerRegistration: null, // Will be derived on-chain
          whitelistEntry: whitelistEntryPDA,
          userAccount: userPubkey,
          tesseraMint: tesseraMint,
          tesseraTokenProgram: tesseraTokenProgramId,
          authority: wallet.publicKey,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        signature,
        user: input.binding.userWallet,
        referralCode: input.binding.referralCode,
      };
    },
  });
}
