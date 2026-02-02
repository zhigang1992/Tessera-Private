/**
 * Whitelist Utilities
 *
 * Provides helper functions for checking wallet whitelist status
 * and retrieving merkle proof information for the Alpha Vault.
 */

import { BigNumber, math, type BigNumberValue } from '@/lib/bignumber'
import { LOCAL_MERKLE_PROOFS } from '@/services/alpha-vault'

export interface WhitelistInfo {
  isWhitelisted: boolean
  maxCapRaw: string | null
  maxCapFormatted: BigNumberValue | null
  proof: string[] | null
}

/**
 * Check if a wallet is whitelisted and get their max cap
 *
 * @param walletAddress - The wallet public key as a string
 * @returns WhitelistInfo object with whitelist status and cap information
 */
export function getWhitelistInfo(walletAddress: string): WhitelistInfo {
  const proofData = LOCAL_MERKLE_PROOFS[walletAddress]

  if (!proofData) {
    return {
      isWhitelisted: false,
      maxCapRaw: null,
      maxCapFormatted: null,
      proof: null,
    }
  }

  // maxCap is stored in smallest units (e.g., 10000000000 = 10,000 USDC with 6 decimals)
  // Convert to human-readable format
  const maxCapBigNumber = math`${BigNumber.from(proofData.maxCap)} / ${math`${10} ^ ${6}`}`

  return {
    isWhitelisted: true,
    maxCapRaw: proofData.maxCap,
    maxCapFormatted: maxCapBigNumber,
    proof: proofData.proof,
  }
}

/**
 * Get all whitelisted wallet addresses
 *
 * @returns Array of whitelisted wallet addresses
 */
export function getAllWhitelistedWallets(): string[] {
  return Object.keys(LOCAL_MERKLE_PROOFS)
}

/**
 * Get count of whitelisted wallets
 *
 * @returns Number of whitelisted wallets
 */
export function getWhitelistCount(): number {
  return Object.keys(LOCAL_MERKLE_PROOFS).length
}

/**
 * Check if any wallets are whitelisted
 *
 * @returns true if whitelist is not empty
 */
export function hasWhitelist(): boolean {
  return getWhitelistCount() > 0
}
