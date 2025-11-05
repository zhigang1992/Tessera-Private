/**
 * Admin Create Single Referral Code Hook
 *
 * Uses admin_create_referral_code instruction (single code)
 */

import { useMutation } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useSolanaConnection, getReferralProgram, getReferralConfigPDA, getReferralCodePDA, getAdminListPDA } from '@/lib/solana';
import type { ReferralCodeData } from '../types/migration';

interface CreateCodeInput {
  code: ReferralCodeData;
}

interface CreateCodeResult {
  signature: string;
  code: string;
  owner: string;
}

/**
 * Admin: Create a single referral code
 * Only the program authority can use this
 */
export function useAdminCreateSingleCode() {
  const wallet = useWallet();
  const connection = useSolanaConnection();

  return useMutation({
    mutationFn: async (input: CreateCodeInput): Promise<CreateCodeResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const program = getReferralProgram(connection, wallet);
      if (!program) {
        throw new Error('Program not initialized');
      }

      const [referralConfigPDA] = getReferralConfigPDA(program.programId);
      const [referralCodePDA] = getReferralCodePDA(input.code.code, program.programId);
      const [adminListPDA] = getAdminListPDA(program.programId);
      const ownerPubkey = new PublicKey(input.code.ownerWallet);

      const signature = await program.methods
        .adminCreateReferralCode(input.code.code, ownerPubkey)
        .accounts({
          referralCode: referralCodePDA,
          referralConfig: referralConfigPDA,
          adminList: adminListPDA,
          authority: wallet.publicKey,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        signature,
        code: input.code.code,
        owner: input.code.ownerWallet,
      };
    },
  });
}
