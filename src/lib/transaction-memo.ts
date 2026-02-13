/**
 * Solana Transaction Memo Utility
 *
 * Provides functionality to attach memo messages to Solana transactions
 * using the SPL Memo Program. Memos are visible on-chain and in block explorers.
 *
 * Cost impact: Zero - memos are additional instructions with no extra fee.
 */

import {
  TransactionInstruction,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
  Connection,
  AddressLookupTableAccount,
} from '@solana/web3.js'

/**
 * SPL Memo Program ID
 * @see https://spl.solana.com/memo
 */
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

/**
 * Predefined memo messages for different transaction types
 * Shortened to reduce transaction size and fit within Solana's 1232 byte limit
 */
export enum MemoType {
  TRADING = "T&C: https://terms.tessera.pe/",
  VAULT_DEPOSIT = "T&C: https://terms.tessera.pe/",
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
 * If compute budget instructions already exist (e.g., from Meteora SDK), this function
 * removes them and replaces with our higher limits to avoid duplicate instruction errors.
 *
 * Note: Only adds compute unit limit instruction to save transaction space.
 * Price instruction is optional and omitted to reduce transaction size.
 *
 * @param transaction - The transaction to add compute budget to
 * @returns The transaction with compute budget instructions prepended
 */
export function ensureComputeBudget(transaction: Transaction): Transaction {
  const COMPUTE_BUDGET_PROGRAM_ID = ComputeBudgetProgram.programId.toBase58()

  // Remove any existing compute budget instructions to avoid duplicates
  const nonComputeBudgetInstructions = transaction.instructions.filter(
    (ix) => ix.programId.toBase58() !== COMPUTE_BUDGET_PROGRAM_ID
  )

  // Set compute unit limit to 200,000 (sufficient for swap + memo)
  const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 200_000,
  })

  // NOTE: Omitting compute unit price instruction to save ~32 bytes of transaction space
  // This reduces transaction size to fit within Solana's 1232 byte limit
  // The transaction will still succeed, just without priority fee

  // Prepend our compute budget instruction at the beginning
  transaction.instructions = [computeLimitIx, ...nonComputeBudgetInstructions]

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

/**
 * Adds a terms acceptance memo to a VersionedTransaction
 *
 * @param transaction - The VersionedTransaction to add the memo to
 * @param signer - The public key of the transaction signer
 * @param type - The type of terms being accepted
 * @returns A new VersionedTransaction with the memo instruction added and compute budget ensured
 */
async function resolveAddressLookupTableAccounts(
  transaction: VersionedTransaction,
  connection: Connection
): Promise<AddressLookupTableAccount[]> {
  const lookups = transaction.message.addressTableLookups
  if (!lookups || lookups.length === 0) {
    return []
  }

  const lookupAccounts = await Promise.all(
    lookups.map(async (lookup) => {
      const result = await connection.getAddressLookupTable(lookup.accountKey)
      return result.value
    }),
  )

  const unresolvedCount = lookupAccounts.filter((account) => account === null).length
  if (unresolvedCount > 0) {
    throw new Error('Failed to resolve address lookup tables for swap transaction')
  }

  return lookupAccounts.filter((account): account is AddressLookupTableAccount => account !== null)
}

export async function addTermsAcceptanceMemoToVersionedTx(
  transaction: VersionedTransaction,
  signer: PublicKey,
  type: MemoType,
  connection: Connection
): Promise<VersionedTransaction> {
  const lookupTableAccounts = await resolveAddressLookupTableAccounts(transaction, connection)

  // Decompose the versioned transaction
  const message = TransactionMessage.decompile(transaction.message, {
    addressLookupTableAccounts: lookupTableAccounts,
  })

  // Create memo instruction
  const memoIx = createMemoInstruction(type, signer)

  // Set compute unit limit to 200,000 (sufficient for swap + memo)
  const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 200_000,
  })

  // Remove any existing compute budget instructions
  const COMPUTE_BUDGET_PROGRAM_ID = ComputeBudgetProgram.programId.toBase58()
  const nonComputeBudgetInstructions = message.instructions.filter(
    (ix) => ix.programId.toBase58() !== COMPUTE_BUDGET_PROGRAM_ID
  )

  // Rebuild with compute budget at the start, followed by other instructions, and memo at the end
  const newInstructions = [computeLimitIx, ...nonComputeBudgetInstructions, memoIx]

  // Create new transaction message with updated instructions
  const newMessage = new TransactionMessage({
    payerKey: message.payerKey,
    recentBlockhash: message.recentBlockhash,
    instructions: newInstructions,
  }).compileToV0Message(lookupTableAccounts)

  // Create and return new VersionedTransaction
  return new VersionedTransaction(newMessage)
}
