/**
 * Solana On-Chain Client for Referral System
 *
 * Provides utilities for interacting with the on-chain referral program.
 * Includes PDA derivation, program initialization, and helper functions.
 */

import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import ReferralSystemIDL from '../idl/referral_system.json';
import { getRpcEndpoint, getReferralProgramId, CONNECTION_CONFIG } from './config';

/**
 * Get Anchor program instance for referral system
 */
export function getReferralProgram(
  connection: Connection,
  wallet: WalletContextState
): Program | null {
  if (!wallet.publicKey) {
    return null;
  }

  try {
    const provider = new AnchorProvider(
      connection,
      wallet as any, // Anchor types are slightly different
      {
        commitment: CONNECTION_CONFIG.commitment,
        preflightCommitment: CONNECTION_CONFIG.commitment,
      }
    );

    // Use the two-argument constructor - Program will read programId from IDL metadata
    const program = new Program(ReferralSystemIDL as any, provider);

    return program;
  } catch (error) {
    console.error('Failed to initialize referral program:', error);
    return null;
  }
}

/**
 * Create a new Solana connection
 */
export function createConnection(): Connection {
  const endpoint = getRpcEndpoint();
  return new Connection(endpoint, CONNECTION_CONFIG.commitment);
}

/**
 * PDA Derivation Functions
 */

/**
 * Derive the referral config PDA
 */
export function getReferralConfigPDA(): [PublicKey, number] {
  const programId = getReferralProgramId();
  return PublicKey.findProgramAddressSync([Buffer.from('referral_config')], programId);
}

/**
 * Derive a referral code PDA
 */
export function getReferralCodePDA(code: string): [PublicKey, number] {
  const programId = getReferralProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('referral_code'), Buffer.from(code)],
    programId
  );
}

/**
 * Derive a user registration PDA
 */
export function getUserRegistrationPDA(userPubkey: PublicKey): [PublicKey, number] {
  const programId = getReferralProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_registration'), userPubkey.toBuffer()],
    programId
  );
}

/**
 * Account Fetching Functions
 */

/**
 * Fetch referral config account
 */
export async function fetchReferralConfig(connection: Connection) {
  const program = getReferralProgram(connection, {} as WalletContextState);
  if (!program) return null;

  const [configPDA] = getReferralConfigPDA();

  try {
    const config = await (program.account as any).referralConfig.fetch(configPDA);
    return config;
  } catch (error) {
    console.error('Failed to fetch referral config:', error);
    return null;
  }
}

/**
 * Fetch referral code account
 */
export async function fetchReferralCode(connection: Connection, code: string) {
  const program = getReferralProgram(connection, {} as WalletContextState);
  if (!program) return null;

  const [codePDA] = getReferralCodePDA(code);

  try {
    const codeAccount = await (program.account as any).referralCode.fetch(codePDA);
    return codeAccount;
  } catch (error) {
    // Account doesn't exist - not an error
    return null;
  }
}

/**
 * Fetch user registration account
 */
export async function fetchUserRegistration(connection: Connection, userPubkey: PublicKey) {
  const program = getReferralProgram(connection, {} as WalletContextState);
  if (!program) return null;

  const [registrationPDA] = getUserRegistrationPDA(userPubkey);

  try {
    const registration = await (program.account as any).userRegistration.fetch(registrationPDA);
    return registration;
  } catch (error) {
    // Account doesn't exist - user not registered
    return null;
  }
}

/**
 * Validation Functions
 */

/**
 * Validate referral code format (6-12 alphanumeric characters)
 */
export function validateReferralCodeFormat(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!code) {
    return { valid: false, error: 'Code cannot be empty' };
  }

  if (code.length < 6) {
    return { valid: false, error: 'Code must be at least 6 characters' };
  }

  if (code.length > 12) {
    return { valid: false, error: 'Code must be at most 12 characters' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(code)) {
    return { valid: false, error: 'Code must be alphanumeric only' };
  }

  return { valid: true };
}

/**
 * Check if referral code exists and is active
 */
export async function checkReferralCodeAvailability(
  connection: Connection,
  code: string
): Promise<{
  available: boolean;
  exists: boolean;
  isActive?: boolean;
}> {
  const codeAccount = await fetchReferralCode(connection, code);

  if (!codeAccount) {
    return { available: true, exists: false };
  }

  return {
    available: false,
    exists: true,
    isActive: codeAccount.isActive,
  };
}

/**
 * Transaction Building Helpers
 */

/**
 * Get accounts for create referral code instruction
 */
export function getCreateReferralCodeAccounts(code: string, ownerPubkey: PublicKey) {
  const [referralCodePDA] = getReferralCodePDA(code);

  return {
    referralCode: referralCodePDA,
    owner: ownerPubkey,
    systemProgram: SystemProgram.programId,
  };
}

/**
 * Get accounts for register with referral code instruction
 * Note: This is a simplified version. Full version needs Tessera Token accounts.
 */
export function getRegisterWithReferralCodeAccounts(code: string, userPubkey: PublicKey) {
  const [referralCodePDA] = getReferralCodePDA(code);
  const [userRegistrationPDA] = getUserRegistrationPDA(userPubkey);
  const [referralConfigPDA] = getReferralConfigPDA();

  return {
    referralCode: referralCodePDA,
    userRegistration: userRegistrationPDA,
    referralConfig: referralConfigPDA,
    user: userPubkey,
    systemProgram: SystemProgram.programId,
    // TODO: Add Tessera Token accounts when implementing full registration
  };
}

/**
 * Utility Functions
 */

/**
 * Format SOL amount for display
 */
export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}

/**
 * Convert basis points to percentage
 */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100;
}

/**
 * Convert percentage to basis points
 */
export function percentToBasisPoints(percent: number): number {
  return Math.floor(percent * 100);
}

/**
 * Shorten public key for display
 */
export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const addressStr = typeof address === 'string' ? address : address.toBase58();
  return `${addressStr.slice(0, chars)}...${addressStr.slice(-chars)}`;
}

/**
 * Check if two public keys are equal
 */
export function publicKeysEqual(a: PublicKey, b: PublicKey): boolean {
  return a.equals(b);
}

/**
 * Check if public key is default (all zeros)
 */
export function isDefaultPublicKey(pubkey: PublicKey): boolean {
  return pubkey.equals(PublicKey.default);
}

/**
 * Export all types for convenience
 */
export type { Program, AnchorProvider };
export { SystemProgram, PublicKey, Connection };
