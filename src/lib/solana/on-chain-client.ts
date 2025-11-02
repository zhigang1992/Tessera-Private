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
import {
  getRpcEndpoint,
  getReferralProgramId,
  CONNECTION_CONFIG,
  getTesseraTokenProgramId,
  getTesseraMintAddress,
} from './config';

type ReadOnlyWallet = {
  publicKey: PublicKey;
  signTransaction: (tx: any) => Promise<any>;
  signAllTransactions: (txs: any[]) => Promise<any[]>;
};

function createReadOnlyWallet(): ReadOnlyWallet {
  return {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (transactions) => transactions,
  };
}

/**
 * Get Anchor program instance for referral system
 */
export function getReferralProgram(
  connection: Connection,
  wallet?: WalletContextState | null
): Program | null {
  try {
    const resolvedWallet =
      wallet && wallet.publicKey ? (wallet as any) : (createReadOnlyWallet() as any);

    const provider = new AnchorProvider(
      connection,
      resolvedWallet, // Anchor types are slightly different
      {
        commitment: CONNECTION_CONFIG.commitment,
        preflightCommitment: CONNECTION_CONFIG.commitment,
      }
    );

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

function resolveProgramId(programId?: PublicKey): PublicKey {
  return programId ?? getReferralProgramId();
}

/**
 * PDA Derivation Functions
 */

/**
 * Derive the referral config PDA
 */
export function getReferralConfigPDA(programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId);
  return PublicKey.findProgramAddressSync([Buffer.from('referral_config')], id);
}

/**
 * Derive a referral code PDA
 */
export function getReferralCodePDA(code: string, programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('referral_code'), Buffer.from(code)],
    id
  );
}

/**
 * Derive a user registration PDA
 */
export function getUserRegistrationPDA(
  userPubkey: PublicKey,
  programId?: PublicKey
): [PublicKey, number] {
  const id = resolveProgramId(programId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_registration'), userPubkey.toBuffer()],
    id
  );
}

export function getTokenAuthorityPDA(
  referralConfig?: PublicKey,
  programId?: PublicKey
): [PublicKey, number] {
  const id = resolveProgramId(programId);
  const [defaultReferralConfig] = getReferralConfigPDA(id);
  const configKey = referralConfig ?? defaultReferralConfig;

  return PublicKey.findProgramAddressSync(
    [Buffer.from('token_authority'), configKey.toBuffer()],
    id
  );
}

/**
 * Tessera Token PDA helpers
 */
export function getWhitelistEntryPDA(address: PublicKey): [PublicKey, number] {
  const tesseraProgramId = getTesseraTokenProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('whitelist'), address.toBuffer()],
    tesseraProgramId
  );
}

export function getSenderFeeConfigPDA(mint: PublicKey, sender: PublicKey): [PublicKey, number] {
  const tesseraProgramId = getTesseraTokenProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('sender_fee_config'), mint.toBuffer(), sender.toBuffer()],
    tesseraProgramId
  );
}

/**
 * Account Fetching Functions
 */

/**
 * Fetch referral config account
 */
export async function fetchReferralConfig(connection: Connection) {
  const program = getReferralProgram(connection, null);
  if (!program) return null;

  const [configPDA] = getReferralConfigPDA(program.programId);

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
  const program = getReferralProgram(connection, null);
  if (!program) return null;

  const [codePDA] = getReferralCodePDA(code, program.programId);

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
  const program = getReferralProgram(connection, null);
  if (!program) return null;

  const [registrationPDA] = getUserRegistrationPDA(userPubkey, program.programId);

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
export function getCreateReferralCodeAccounts(
  code: string,
  ownerPubkey: PublicKey,
  programId?: PublicKey
) {
  const [referralCodePDA] = getReferralCodePDA(code, programId);

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
type RegisterWithReferralCodeOptions = {
  mint?: PublicKey;
  referralConfig?: PublicKey;
  referrerRegistration?: PublicKey | null;
  programId?: PublicKey;
};

export function getRegisterWithReferralCodeAccounts(
  code: string,
  userPubkey: PublicKey,
  options: RegisterWithReferralCodeOptions = {}
) {
  const programId = resolveProgramId(options.programId);
  const [referralCodePDA] = getReferralCodePDA(code, programId);
  const [userRegistrationPDA] = getUserRegistrationPDA(userPubkey, programId);
  const [defaultReferralConfigPDA] = getReferralConfigPDA(programId);
  const referralConfigPDA = options.referralConfig ?? defaultReferralConfigPDA;
  const [tokenAuthorityPDA] = getTokenAuthorityPDA(referralConfigPDA, programId);
  const resolvedMint = options.mint ?? getTesseraMintAddress();
  const [whitelistEntryPDA] = getWhitelistEntryPDA(userPubkey);
  const [senderFeeConfigPDA] = getSenderFeeConfigPDA(resolvedMint, userPubkey);
  const tesseraTokenProgramId = getTesseraTokenProgramId();

  return {
    referralCode: referralCodePDA,
    userRegistration: userRegistrationPDA,
    referralConfig: referralConfigPDA,
    tokenAuthority: tokenAuthorityPDA,
    whitelistEntry: whitelistEntryPDA,
    senderFeeConfig: senderFeeConfigPDA,
    tesseraMint: resolvedMint,
    tesseraTokenProgram: tesseraTokenProgramId,
    user: userPubkey,
    systemProgram: SystemProgram.programId,
    ...(options.referrerRegistration
      ? { referrerRegistration: options.referrerRegistration }
      : {}),
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
