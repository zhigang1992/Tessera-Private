/**
 * Solana On-Chain Integration
 *
 * Main export file for Solana on-chain functionality.
 * Import from this file to access all on-chain utilities.
 *
 * @example
 * ```ts
 * import {
 *   useCreateReferralCode,
 *   useUserRegistration,
 *   getReferralCodePDA,
 *   validateReferralCodeFormat,
 * } from '@/lib/solana';
 * ```
 */

// Configuration
export * from './config'

// Client utilities
export * from './on-chain-client'

// React hooks
export * from './hooks'

// Re-export commonly used types from @solana/web3.js
export { PublicKey, Connection, SystemProgram, Transaction } from '@solana/web3.js'

// Re-export Anchor types
export type { Program, AnchorProvider } from '@coral-xyz/anchor'
