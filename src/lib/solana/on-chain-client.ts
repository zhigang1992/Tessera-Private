/**
 * Solana On-Chain Client for Tessera Referrals
 *
 * Provides utilities for interacting with the on-chain referral program.
 * Includes PDA derivation, program initialization, and helper functions.
 */

import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import type { WalletContextStateCompat as WalletContextState } from '@/hooks/use-wallet'
import TesseraReferralsIDL from '../idl/tessera_referrals.json'
import type { TesseraReferrals } from '@/generated/tessera-referrals/types'
import {
  getRpcEndpoint,
  getTesseraReferralsProgramId,
  CONNECTION_CONFIG,
  getTesseraTokenProgramId,
} from '@/config'

type ReadOnlyWallet = {
  publicKey: PublicKey
  signTransaction: (tx: any) => Promise<any>
  signAllTransactions: (txs: any[]) => Promise<any[]>
}

function createReadOnlyWallet(): ReadOnlyWallet {
  return {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (transactions) => transactions,
  }
}

/**
 * Get Anchor program instance for Tessera Referrals
 */
export function getTesseraReferralsProgram(
  connection: Connection,
  wallet?: WalletContextState | null,
): Program<TesseraReferrals> | null {
  try {
    const resolvedWallet = wallet && wallet.publicKey ? (wallet as any) : (createReadOnlyWallet() as any)

    const provider = new AnchorProvider(
      connection,
      resolvedWallet, // Anchor types are slightly different
      {
        commitment: CONNECTION_CONFIG.commitment,
        preflightCommitment: CONNECTION_CONFIG.commitment,
      },
    )

    const program = new Program<TesseraReferrals>({
      ...TesseraReferralsIDL,
      address: getTesseraReferralsProgramId().toBase58(),
    } as TesseraReferrals, provider)
    return program
  } catch (error) {
    console.error('Failed to initialize tessera referrals program:', error)
    return null
  }
}

// Backwards compatibility alias
export const getReferralProgram = getTesseraReferralsProgram

/**
 * Create a new Solana connection
 */
export function createConnection(): Connection {
  const endpoint = getRpcEndpoint()
  return new Connection(endpoint, CONNECTION_CONFIG.commitment)
}

function resolveProgramId(programId?: PublicKey): PublicKey {
  return programId ?? getTesseraReferralsProgramId()
}

/**
 * PDA Derivation Functions
 */

/**
 * Derive the referral config PDA
 */
export function getReferralConfigPDA(programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId)
  return PublicKey.findProgramAddressSync([Buffer.from('referral_config')], id)
}

/**
 * Derive a referral code PDA
 * Seeds: ["referral_code", code, owner]
 */
export function getReferralCodePDA(code: string, ownerPubkey: PublicKey, programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('referral_code'), Buffer.from(code), ownerPubkey.toBuffer()],
    id,
  )
}

/**
 * Derive a user registration PDA
 */
export function getUserRegistrationPDA(userPubkey: PublicKey, programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId)
  return PublicKey.findProgramAddressSync([Buffer.from('user_registration'), userPubkey.toBuffer()], id)
}

/**
 * Derive the code registry PDA for global uniqueness
 * Seeds: ["code_registry", code.as_bytes()]
 */
export function getCodeRegistryPDA(code: string, programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId)
  return PublicKey.findProgramAddressSync([Buffer.from('code_registry'), Buffer.from(code)], id)
}

export function getTokenAuthorityPDA(referralConfig?: PublicKey, programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId)
  const [defaultReferralConfig] = getReferralConfigPDA(id)
  const configKey = referralConfig ?? defaultReferralConfig

  return PublicKey.findProgramAddressSync([Buffer.from('token_authority'), configKey.toBuffer()], id)
}

/**
 * Derive the admin list PDA
 */
export function getAdminListPDA(programId?: PublicKey): [PublicKey, number] {
  const id = resolveProgramId(programId)
  return PublicKey.findProgramAddressSync([Buffer.from('admin_list')], id)
}

/**
 * Tessera Token PDA helpers
 */
export function getTesseraFeeConfigPDA(): [PublicKey, number] {
  const tesseraProgramId = getTesseraTokenProgramId()
  return PublicKey.findProgramAddressSync([Buffer.from('fee_config')], tesseraProgramId)
}

export function getAuthorizedProgramsPDA(authority: PublicKey, programId?: PublicKey): [PublicKey, number] {
  const tesseraProgramId = programId ?? getTesseraTokenProgramId()
  return PublicKey.findProgramAddressSync([Buffer.from('authorized_programs'), authority.toBuffer()], tesseraProgramId)
}

export function getTreasuryConfigPDA(mint: PublicKey, programId?: PublicKey): [PublicKey, number] {
  const tesseraProgramId = programId ?? getTesseraTokenProgramId()
  return PublicKey.findProgramAddressSync([Buffer.from('treasury_config'), mint.toBuffer()], tesseraProgramId)
}

export function getWhitelistEntryPDA(address: PublicKey, programId?: PublicKey): [PublicKey, number] {
  const tesseraProgramId = programId ?? getTesseraTokenProgramId()
  return PublicKey.findProgramAddressSync([Buffer.from('whitelist'), address.toBuffer()], tesseraProgramId)
}

/**
 * Get sender fee config PDA (mint-agnostic)
 * Seeds: [b"sender_fee_config", user.key()]
 * Note: This is mint-agnostic - user only registers once for all mints
 */
export function getSenderFeeConfigPDA(sender: PublicKey, programId?: PublicKey): [PublicKey, number] {
  const tesseraProgramId = programId ?? getTesseraTokenProgramId()
  return PublicKey.findProgramAddressSync([Buffer.from('sender_fee_config'), sender.toBuffer()], tesseraProgramId)
}

/**
 * Account Fetching Functions
 */

/**
 * Fetch referral config account
 */
export async function fetchReferralConfig(connection: Connection) {
  const program = getReferralProgram(connection, null)
  if (!program) return null

  const [configPDA] = getReferralConfigPDA(program.programId)

  try {
    const config = await program.account.referralConfig.fetch(configPDA)
    return config
  } catch (error) {
    console.error('Failed to fetch referral config:', error)
    return null
  }
}

/**
 * Check if referral code has correct memory layout that Anchor can deserialize
 * Codes with wrong layout will cause AccountDidNotDeserialize errors in on-chain instructions
 */
export async function checkReferralCodeLayout(
  connection: Connection,
  code: string,
  ownerPubkey: PublicKey,
): Promise<{
  exists: boolean
  hasCorrectLayout: boolean
  needsRecreation: boolean
}> {
  const program = getReferralProgram(connection, null)
  if (!program) {
    return { exists: false, hasCorrectLayout: false, needsRecreation: false }
  }

  const [codePDA] = getReferralCodePDA(code, ownerPubkey, program.programId)

  // Try Anchor's auto-deserializer first (this is what on-chain instructions use)
  let anchorWorks = false
  try {
    await program.account.referralCode.fetch(codePDA)
    anchorWorks = true
  } catch (err) {
    // Anchor deserialization failed - might be wrong layout or account doesn't exist
  }

  // If Anchor works, the code has correct layout
  if (anchorWorks) {
    return { exists: true, hasCorrectLayout: true, needsRecreation: false }
  }

  // Try manual deserialization to see if account exists with wrong layout
  try {
    const accountInfo = await connection.getAccountInfo(codePDA)
    if (!accountInfo) {
      return { exists: false, hasCorrectLayout: false, needsRecreation: false }
    }

    const data = accountInfo.data
    const expectedDiscriminator = Buffer.from([227, 239, 247, 224, 128, 187, 44, 229])
    const actualDiscriminator = data.slice(0, 8)

    if (!expectedDiscriminator.equals(actualDiscriminator)) {
      // Wrong discriminator - corrupted or very old account
      return { exists: true, hasCorrectLayout: false, needsRecreation: true }
    }

    // Has correct discriminator but Anchor can't deserialize it
    // Try manual deserialization to verify it follows Anchor's layout
    try {
      let offset = 8
      const codeLen = data.readUInt32LE(offset)
      offset += 4
      offset += codeLen // Variable-length string

      // If we can parse basic fields without error, layout is probably valid
      // but there might be other issues. Mark as needing recreation to be safe.
      return { exists: true, hasCorrectLayout: false, needsRecreation: true }
    } catch {
      return { exists: true, hasCorrectLayout: false, needsRecreation: true }
    }
  } catch (error) {
    return { exists: false, hasCorrectLayout: false, needsRecreation: false }
  }
}

/**
 * Fetch referral code account
 * @param ownerPubkey - The owner of the referral code (required for PDA derivation)
 */
export async function fetchReferralCode(connection: Connection, code: string, ownerPubkey: PublicKey) {
  const program = getReferralProgram(connection, null)
  if (!program) {
    console.error('fetchReferralCode: Failed to get program')
    return null
  }

  const [codePDA] = getReferralCodePDA(code, ownerPubkey, program.programId)

  console.log(`fetchReferralCode: Querying code "${code}"`)
  console.log(`  Program ID: ${program.programId.toBase58()}`)
  console.log(`  PDA: ${codePDA.toBase58()}`)

  try {
    // Fetch raw account info instead of using Anchor's deserializer
    // This avoids issues with accounts that Anchor can't properly deserialize
    const accountInfo = await connection.getAccountInfo(codePDA)

    if (!accountInfo) {
      console.log(`  ❌ Account not found`)
      return null
    }

    // Manual deserialization from raw bytes
    const data = accountInfo.data

    // Verify discriminator matches ReferralCode (offset 0, 8 bytes)
    const expectedDiscriminator = Buffer.from([227, 239, 247, 224, 128, 187, 44, 229])
    const actualDiscriminator = data.slice(0, 8)
    if (!expectedDiscriminator.equals(actualDiscriminator)) {
      console.error(`  ❌ Discriminator mismatch`)
      return null
    }

    let offset = 8 // Skip discriminator

    // Read code (String: u32 length + N bytes - variable length, NOT fixed 12 bytes!)
    // IMPORTANT: Anchor serializes String as variable-length, not fixed-length
    // So owner field offset depends on actual code length
    const codeLen = data.readUInt32LE(offset)
    offset += 4
    const codeStr = data.slice(offset, offset + codeLen).toString('utf8')
    offset += codeLen // Variable length - only advance by actual string length

    // Read owner (Pubkey: 32 bytes)
    const ownerBytes = data.slice(offset, offset + 32)
    const owner = new PublicKey(ownerBytes)
    offset += 32

    // Read is_active (bool: 1 byte)
    const isActive = data[offset] === 1
    offset += 1

    // Read total_referrals (u32: 4 bytes)
    const totalReferrals = data.readUInt32LE(offset)
    offset += 4

    // Read bump (u8: 1 byte)
    const bump = data[offset]

    console.log(`  ✅ Found code account: ${codeStr}, owner: ${owner.toBase58()}, active: ${isActive}`)

    return {
      code: codeStr,
      owner,
      isActive,
      totalReferrals,
      bump,
    }
  } catch (error) {
    console.error(`  ❌ Failed to fetch code:`, error)
    return null
  }
}

/**
 * Fetch user registration account
 */
export async function fetchUserRegistration(connection: Connection, userPubkey: PublicKey) {
  const program = getReferralProgram(connection, null)
  if (!program) return null

  const [registrationPDA] = getUserRegistrationPDA(userPubkey, program.programId)

  try {
    const registration = await program.account.userRegistration.fetch(registrationPDA)
    return registration
  } catch (error) {
    // Account doesn't exist - user not registered
    return null
  }
}

/**
 * Validation Functions
 */

/**
 * Validate referral code format (6-12 alphanumeric characters)
 */
export function validateReferralCodeFormat(code: string): {
  valid: boolean
  error?: string
} {
  if (!code) {
    return { valid: false, error: 'Code cannot be empty' }
  }

  if (code.length < 6) {
    return { valid: false, error: 'Code must be at least 6 characters' }
  }

  if (code.length > 12) {
    return { valid: false, error: 'Code must be at most 12 characters' }
  }

  if (!/^[a-zA-Z0-9]+$/.test(code)) {
    return { valid: false, error: 'Code must be alphanumeric only' }
  }

  return { valid: true }
}

/**
 * Search for a referral code by its code string (without knowing the owner)
 * Uses getProgramAccounts to find matching codes.
 * Returns the first active code found, or null if not found.
 */
export async function findReferralCodeByString(
  connection: Connection,
  code: string,
): Promise<{
  code: string
  owner: PublicKey
  isActive: boolean
  bump: number
  referredUserCount: number
  totalRebatesEarned: bigint
  pda: PublicKey
} | null> {
  const program = getReferralProgram(connection, null)
  if (!program) {
    throw new Error('findReferralCodeByString: Failed to get program')
  }

  try {
    // Use getProgramAccounts with memcmp filter to find codes matching the string
    // The code string is stored after the 8-byte discriminator
    // String format: 4-byte length + string bytes
    const codeBytes = Buffer.from(code)
    const codeFilter = Buffer.concat([
      Buffer.from([codeBytes.length, 0, 0, 0]), // 4-byte little-endian length
      codeBytes,
    ])

    const accounts = await connection.getProgramAccounts(program.programId, {
      filters: [
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: codeFilter.toString('base64'),
            encoding: 'base64',
          },
        },
      ],
    })

    if (accounts.length === 0) {
      console.log(`findReferralCodeByString: No account found for code "${code}"`)
      return null
    }

    // Parse account data according to new IDL layout:
    // ReferralCode { code: string, owner: pubkey, is_active: bool, total_referrals: u32, bump: u8 }
    const parseReferralCode = (pubkey: PublicKey, data: Buffer) => {
      // Verify discriminator
      const expectedDiscriminator = Buffer.from([227, 239, 247, 224, 128, 187, 44, 229])
      const actualDiscriminator = data.slice(0, 8)
      if (!expectedDiscriminator.equals(actualDiscriminator)) {
        return null
      }

      let offset = 8

      // Read code (string: 4-byte length + bytes)
      const codeLen = data.readUInt32LE(offset)
      offset += 4
      const codeStr = data.slice(offset, offset + codeLen).toString('utf8')
      offset += codeLen

      // Read owner (32 bytes pubkey)
      const ownerBytes = data.slice(offset, offset + 32)
      const owner = new PublicKey(ownerBytes)
      offset += 32

      // Read is_active (1 byte bool)
      const isActive = data.readUInt8(offset) === 1
      offset += 1

      // Read total_referrals (u32)
      const totalReferrals = data.readUInt32LE(offset)
      offset += 4

      // Read bump (1 byte)
      const bump = data.readUInt8(offset)

      return {
        code: codeStr,
        owner,
        isActive,
        bump,
        referredUserCount: totalReferrals,
        totalRebatesEarned: BigInt(0), // Field removed in new IDL
        pda: pubkey,
      }
    }

    // Parse accounts, prefer active codes
    for (const { pubkey, account } of accounts) {
      const parsed = parseReferralCode(pubkey, account.data)
      if (parsed && parsed.isActive) {
        return parsed
      }
    }

    // No active code found, return first valid match
    for (const { pubkey, account } of accounts) {
      const parsed = parseReferralCode(pubkey, account.data)
      if (parsed) {
        return parsed
      }
    }

    return null
  } catch (error) {
    throw error
  }
}

/**
 * Check if referral code exists and is active for a specific owner
 * @param ownerPubkey - The owner to check the code for (required for PDA derivation)
 */
export async function checkReferralCodeAvailability(
  connection: Connection,
  code: string,
  ownerPubkey: PublicKey,
): Promise<{
  available: boolean
  exists: boolean
  isActive?: boolean
}> {
  const codeAccount = await fetchReferralCode(connection, code, ownerPubkey)

  if (!codeAccount) {
    return { available: true, exists: false }
  }

  return {
    available: false,
    exists: true,
    isActive: codeAccount.isActive,
  }
}

/**
 * Transaction Building Helpers
 */

/**
 * Get accounts for create referral code instruction
 */
export function getCreateReferralCodeAccounts(code: string, ownerPubkey: PublicKey, programId?: PublicKey) {
  const [referralCodePDA] = getReferralCodePDA(code, ownerPubkey, programId)
  const [codeRegistryPDA] = getCodeRegistryPDA(code, programId)

  return {
    referralCode: referralCodePDA,
    codeRegistry: codeRegistryPDA,
    owner: ownerPubkey,
    systemProgram: SystemProgram.programId,
  }
}

/**
 * Get accounts for register with referral code instruction
 */
type RegisterWithReferralCodeOptions = {
  referralConfig?: PublicKey
  referrerRegistration?: PublicKey | null
  programId?: PublicKey
  tesseraTokenProgram?: PublicKey
  authority?: PublicKey
  codeOwner: PublicKey // Required: owner of the referral code
}

export function getRegisterWithReferralCodeAccounts(
  code: string,
  userPubkey: PublicKey,
  options: RegisterWithReferralCodeOptions,
) {
  const programId = resolveProgramId(options.programId)
  const [referralCodePDA] = getReferralCodePDA(code, options.codeOwner, programId)
  const [userRegistrationPDA] = getUserRegistrationPDA(userPubkey, programId)
  const [defaultReferralConfigPDA] = getReferralConfigPDA(programId)
  const referralConfigPDA = options.referralConfig ?? defaultReferralConfigPDA

  // sender_fee_config is derived from REFERRAL program with seeds [b"sender_fee_config", user]
  const [senderFeeConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('sender_fee_config'), userPubkey.toBuffer()],
    programId,
  )

  return {
    referralCode: referralCodePDA,
    userRegistration: userRegistrationPDA,
    referralConfig: referralConfigPDA,
    referrerRegistration: options.referrerRegistration ?? null,
    senderFeeConfig: senderFeeConfigPDA,
    user: userPubkey,
    systemProgram: SystemProgram.programId,
  }
}

/**
 * Utility Functions
 */

/**
 * Format SOL amount for display
 */
export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4)
}

/**
 * Convert basis points to percentage
 */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100
}

/**
 * Convert percentage to basis points
 */
export function percentToBasisPoints(percent: number): number {
  return Math.floor(percent * 100)
}

/**
 * Shorten public key for display
 */
export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const addressStr = typeof address === 'string' ? address : address.toBase58()
  return `${addressStr.slice(0, chars)}...${addressStr.slice(-chars)}`
}

/**
 * Check if two public keys are equal
 */
export function publicKeysEqual(a: PublicKey, b: PublicKey): boolean {
  return a.equals(b)
}

/**
 * Check if public key is default (all zeros)
 */
export function isDefaultPublicKey(pubkey: PublicKey): boolean {
  return pubkey.equals(PublicKey.default)
}

/**
 * Export all types for convenience
 */
export type { Program, AnchorProvider }
export { SystemProgram, PublicKey, Connection }
