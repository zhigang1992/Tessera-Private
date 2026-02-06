/**
 * Whitelist Utilities
 *
 * Provides helper functions for checking wallet whitelist status
 * and retrieving merkle proof information for the Alpha Vault.
 */

import { BigNumber, math, type BigNumberValue } from '@/lib/bignumber'
import { getWhitelistedWalletsList } from '@/services/alpha-vault'

export interface WhitelistInfo {
  isWhitelisted: boolean
  maxCapRaw: string | null
  maxCapFormatted: BigNumberValue | null
  proof: string[][] | null
}

/**
 * Check if a wallet is whitelisted and get their max cap
 * Phase 2: Uses API endpoint to fetch only specific wallet's proof
 *
 * @param walletAddress - The wallet public key as a string
 * @returns WhitelistInfo object with whitelist status and cap information
 */
export async function getWhitelistInfo(walletAddress: string): Promise<WhitelistInfo> {
  try {
    // Fetch proof for this specific wallet via API (Phase 2)
    const response = await fetch(`/api/merkle-proof/${walletAddress}`)

    if (response.status === 404) {
      // Wallet not whitelisted
      return {
        isWhitelisted: false,
        maxCapRaw: null,
        maxCapFormatted: null,
        proof: null,
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch whitelist info: ${response.statusText}`)
    }

    const proofData = await response.json()

    // maxCap is stored in smallest units (e.g., 10000000000 = 10,000 USDC with 6 decimals)
    // Convert to human-readable format
    const maxCapBigNumber = math`${BigNumber.from(proofData.maxCap)} / ${math`${10} ^ ${6}`}`

    return {
      isWhitelisted: true,
      maxCapRaw: proofData.maxCap.toString(),
      maxCapFormatted: maxCapBigNumber,
      proof: proofData.proof.map((p: number[]) => p.map((n: number) => n.toString())),
    }
  } catch (error) {
    console.error('Error fetching whitelist info:', error)
    // Return not whitelisted on error
    return {
      isWhitelisted: false,
      maxCapRaw: null,
      maxCapFormatted: null,
      proof: null,
    }
  }
}

/**
 * Get all whitelisted wallet addresses
 * Phase 2: Uses API endpoint to get wallet list
 *
 * @returns Array of whitelisted wallet addresses
 */
export async function getAllWhitelistedWallets(): Promise<string[]> {
  return getWhitelistedWalletsList()
}

/**
 * Get count of whitelisted wallets
 * Phase 2: Uses API endpoint to get count
 *
 * @returns Number of whitelisted wallets
 */
export async function getWhitelistCount(): Promise<number> {
  const wallets = await getWhitelistedWalletsList()
  return wallets.length
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
