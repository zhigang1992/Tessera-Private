/**
 * Solana Transaction Memo Utility
 *
 * Provides functionality to attach memo messages to Solana transactions
 * using the SPL Memo Program. Memos are visible on-chain and in block explorers.
 *
 * Cost impact: Zero - memos are additional instructions with no extra fee.
 */

import { TransactionInstruction, PublicKey, Transaction } from '@solana/web3.js'

/**
 * SPL Memo Program ID
 * @see https://spl.solana.com/memo
 */
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

/**
 * Predefined memo messages for different transaction types
 */
export enum MemoType {
  TRADING = 'I accept Tessera trading terms and conditions',
  VAULT_DEPOSIT = 'I accept Tessera vault deposit terms and conditions',
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
 * Adds a terms acceptance memo to a transaction
 *
 * @param transaction - The transaction to add the memo to
 * @param signer - The public key of the transaction signer
 * @param type - The type of terms being accepted
 * @returns The transaction with the memo instruction added
 */
export function addTermsAcceptanceMemo(
  transaction: Transaction,
  signer: PublicKey,
  type: MemoType
): Transaction {
  const memoIx = createMemoInstruction(type, signer)
  transaction.add(memoIx)
  return transaction
}
