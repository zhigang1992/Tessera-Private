/**
 * Whitelist Utilities
 *
 * Provides helper functions for checking wallet whitelist status
 * and retrieving merkle proof information for the Alpha Vault.
 *
 * Phase 2: All functions use individual wallet API lookups.
 * The complete whitelist is never exposed to clients for privacy.
 */

import { BigNumber, math, type BigNumberValue } from '@/lib/bignumber'

export interface WhitelistInfo {
  isWhitelisted: boolean
  maxCapRaw: string | null
  maxCapFormatted: BigNumberValue | null
  proof: string[][] | null
}

/**
 * Check if a wallet is whitelisted and get their max cap for a specific vault
 * Phase 2: Uses vault-specific API endpoint to fetch only specific wallet's proof
 *
 * @param walletAddress - The wallet public key as a string
 * @param vaultId - The vault address to check whitelist for
 * @returns WhitelistInfo object with whitelist status and cap information
 */
export async function getWhitelistInfo(walletAddress: string, vaultId: string): Promise<WhitelistInfo> {
  try {
    // Fetch proof for this specific wallet via vault-specific API (Phase 2)
    const response = await fetch(`/api/merkle-proof/${walletAddress}?vaultId=${vaultId}`)

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

