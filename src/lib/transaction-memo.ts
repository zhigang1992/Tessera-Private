/**
 * Solana Transaction Memo Utility
 *
 * Provides functionality to attach memo messages to Solana transactions
 * using the SPL Memo Program. Memos are visible on-chain and in block explorers.
 *
 * Cost impact: Zero - memos are additional instructions with no extra fee.
 */

import { TransactionInstruction, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js'

/**
 * SPL Memo Program ID
 * @see https://spl.solana.com/memo
 */
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

/**
 * Predefined memo messages for different transaction types
 */
export enum MemoType {
  TRADING = "I acknowledge that I have read and accept Tessera's Terms and Conditions available at https://terms.tessera.pe/",
  VAULT_DEPOSIT = "I acknowledge that I have read and accept Tessera's Terms and Conditions available at https://terms.tessera.pe/",
}

/**
 * Creates a memo instruction with the specified message
 *
 * @param message - The memo text to attach
 * @param signer - The public key of the transaction signer
 * @returns A memo instruction to add to the transaction
 */
export function createMemoInstruction(message: string, signer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(message, 'utf-8'),
  })
}

/**
 * Adds compute budget instructions to ensure transaction has enough compute units
 *
 * The failed transaction showed that the memo instruction needs ~50k CUs.
 * We set a higher limit (200k CUs) to accommodate the memo plus other instructions.
 *
 * @param transaction - The transaction to add compute budget to
 * @returns The transaction with compute budget instructions prepended
 */
export function ensureComputeBudget(transaction: Transaction): Transaction {
  // Set compute unit limit to 200,000 (sufficient for swap + memo)
  const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 200_000,
  })

  // Set compute unit price (micro-lamports per CU) for priority
  const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1,
  })

  // Prepend compute budget instructions at the beginning
  const instructions = [computeLimitIx, computePriceIx, ...transaction.instructions]
  transaction.instructions = instructions

  return transaction
}

/**
 * Adds a terms acceptance memo to a transaction
 *
 * @param transaction - The transaction to add the memo to
 * @param signer - The public key of the transaction signer
 * @param type - The type of terms being accepted
 * @returns The transaction with the memo instruction added and compute budget ensured
 */
export function addTermsAcceptanceMemo(
  transaction: Transaction,
  signer: PublicKey,
  type: MemoType
): Transaction {
  const memoIx = createMemoInstruction(type, signer)
  transaction.add(memoIx)

  // Ensure adequate compute budget for memo instruction
  ensureComputeBudget(transaction)

  return transaction
}
