/**
 * Admin Batch Create Referral Codes Hook
 *
 * Uses admin_batch_create_referral_codes instruction
 */

import { useMutation } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useSolanaConnection, getReferralProgram, getReferralConfigPDA } from '@/lib/solana';
import type { ReferralCodeData } from '../types/migration';

interface BatchCreateCodesInput {
  codes: ReferralCodeData[];
}

interface BatchCreateCodesResult {
  signatures: string[];
  successful: number;
  failed: number;
  errors: Array<{ code: string; error: string }>;
}

const MAX_BATCH_SIZE = 10;

/**
 * Admin: Batch create referral codes
 * Only the program authority can use this
 */
export function useAdminBatchCreateCodes() {
  const wallet = useWallet();
  const connection = useSolanaConnection();

  return useMutation({
    mutationFn: async (input: BatchCreateCodesInput): Promise<BatchCreateCodesResult> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const program = getReferralProgram(connection, wallet);
      if (!program) {
        throw new Error('Program not initialized');
      }

      const [referralConfigPDA] = getReferralConfigPDA(program.programId);

      const result: BatchCreateCodesResult = {
        signatures: [],
        successful: 0,
        failed: 0,
        errors: [],
      };

      // Split into batches of MAX_BATCH_SIZE
      const batches: ReferralCodeData[][] = [];
      for (let i = 0; i < input.codes.length; i += MAX_BATCH_SIZE) {
        batches.push(input.codes.slice(i, i + MAX_BATCH_SIZE));
      }

      // Process each batch
      for (const batch of batches) {
        const codes = batch.map((c) => c.code);
        const owners = batch.map((c) => new PublicKey(c.ownerWallet));

        try {
          const signature = await program.methods
            .adminBatchCreateReferralCodes(codes, owners)
            .accounts({
              referralConfig: referralConfigPDA,
              authority: wallet.publicKey,
              payer: wallet.publicKey,
              systemProgram: new PublicKey('11111111111111111111111111111111'),
            })
            .rpc();

          result.signatures.push(signature);
          result.successful += batch.length;

          console.log(`✓ Batch created ${batch.length} codes: ${signature}`);
        } catch (error) {
          result.failed += batch.length;

          // Add individual errors for each code in the failed batch
          batch.forEach((code) => {
            result.errors.push({
              code: code.code,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });

          console.error(`✗ Batch failed for codes:`, batch.map(c => c.code), error);
        }
      }

      return result;
    },
  });
}
