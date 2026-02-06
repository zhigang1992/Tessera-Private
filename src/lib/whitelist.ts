/**
 * Whitelist Utilities
 *
 * Provides helper functions for checking wallet whitelist status
 * and retrieving merkle proof information for the Alpha Vault.
 */

import { BigNumber, math, type BigNumberValue } from '@/lib/bignumber'
import { getLocalMerkleProofs } from '@/services/alpha-vault'

export interface WhitelistInfo {
  isWhitelisted: boolean
  maxCapRaw: string | null
  maxCapFormatted: BigNumberValue | null
  proof: string[][] | null
}

/**
 * Check if a wallet is whitelisted and get their max cap
 *
 * @param walletAddress - The wallet public key as a string
 * @returns WhitelistInfo object with whitelist status and cap information
 */
export async function getWhitelistInfo(walletAddress: string): Promise<WhitelistInfo> {
  const merkleProofs = await getLocalMerkleProofs()
  const proofData = merkleProofs[walletAddress]

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
  const maxCapBigNumber = math`${BigNumber.from(proofData.max_cap)} / ${math`${10} ^ ${6}`}`

  return {
    isWhitelisted: true,
    maxCapRaw: proofData.max_cap.toString(),
    maxCapFormatted: maxCapBigNumber,
    proof: proofData.proof.map((p) => p.map((n) => n.toString())),
  }
}

/**
 * Get all whitelisted wallet addresses
 *
 * @returns Array of whitelisted wallet addresses
 */
export async function getAllWhitelistedWallets(): Promise<string[]> {
  const merkleProofs = await getLocalMerkleProofs()
  return Object.keys(merkleProofs)
}

/**
 * Get count of whitelisted wallets
 *
 * @returns Number of whitelisted wallets
 */
export async function getWhitelistCount(): Promise<number> {
  const merkleProofs = await getLocalMerkleProofs()
  return Object.keys(merkleProofs).length
}

/**
 * Check if any wallets are whitelisted
 *
 * @returns true if whitelist is not empty
 */
export async function hasWhitelist(): Promise<boolean> {
  const count = await getWhitelistCount()
  return count > 0
}
