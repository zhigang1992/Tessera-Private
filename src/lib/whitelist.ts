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
import { getGraphQLEndpoint, DEFAULT_BASE_TOKEN_ID, getTokenAlphaVaultConfig, getCurrentNetwork, getRpcEndpoint } from '@/config'
import { AlphaVaultClient } from '@/services/alpha-vault'
import { Connection } from '@solana/web3.js'

const GRAPHQL_ENDPOINT = getGraphQLEndpoint()

export interface WhitelistInfo {
  isWhitelisted: boolean
  maxCapRaw: string | null
  maxCapFormatted: BigNumberValue | null
  proof: string[][] | null
}

interface UserRegisteredEvent {
  signature: string
  user: string
  referral_code: string
}

interface ReferralCodeCreatedEvent {
  code: string
}

interface UserInteractionQueryResult {
  view_latest_user_registered_events: UserRegisteredEvent[]
  view_latest_referral_system_referral_code_created_events: ReferralCodeCreatedEvent[]
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL query failed')
  }

  return result.data
}

/**
 * Check if a wallet is whitelisted and get their max cap for a specific vault
 * Phase 2: Uses vault-specific API endpoint to fetch only specific wallet's proof
 *
 * NOTE: This function is used by the auction page for actual deposits and requires merkle proof data.
 * For whitelist checking only, use checkWhitelistStatus() instead.
 *
 * @param walletAddress - The wallet public key as a string
 * @param vaultId - The vault address to check whitelist for
 * @returns WhitelistInfo object with whitelist status and cap information
 */
export async function getWhitelistInfo(walletAddress: string, vaultId: string): Promise<WhitelistInfo> {
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
    // Try to parse error message from response
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.error) {
        errorMessage = errorData.error
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    } catch {
      // If parsing JSON fails, use the default error message
    }
    throw new Error(errorMessage)
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
}

/**
 * Check if vault deposits are currently open
 * This determines which whitelist checking method to use
 *
 * @returns boolean indicating if deposits are open (true) or not yet open (false)
 */
async function areDepositsOpen(): Promise<boolean> {
  try {
    // Get vault configuration
    const vaultConfig = getTokenAlphaVaultConfig(DEFAULT_BASE_TOKEN_ID, getCurrentNetwork())

    if (!vaultConfig) {
      console.warn('Alpha vault config not found, defaulting to GraphQL whitelist check')
      return false
    }

    // Create connection and alpha vault client
    const connection = new Connection(getRpcEndpoint(), 'confirmed')
    const alphaVaultClient = new AlphaVaultClient({
      tokenId: DEFAULT_BASE_TOKEN_ID,
      connection,
    })

    // Get vault info from on-chain
    const vaultInfo = await alphaVaultClient.getVaultInfo()

    // Deposits are open if state is 'deposit_open'
    return vaultInfo.state === 'deposit_open'
  } catch (error) {
    console.error('Error checking vault deposit status:', error)
    // Default to GraphQL check on error
    return false
  }
}

/**
 * Check whitelist status via GraphQL backend API
 * Used when deposits are NOT yet open
 *
 * A user is considered whitelisted if they have either:
 * - Registered with a referral code (view_latest_user_registered_events)
 * - Created a referral code (view_latest_referral_system_referral_code_created_events)
 *
 * @param walletAddress - The wallet public key as a string
 * @returns boolean indicating if the user has interacted with the website
 */
async function checkWhitelistViaGraphQL(walletAddress: string): Promise<boolean> {
  const query = `
    query GetUserInteraction($user: String!) {
      view_latest_user_registered_events(where: { user: { _eq: $user } }) {
        signature
        user
        referral_code
      }
      view_latest_referral_system_referral_code_created_events(where: { owner: { _eq: $user } }) {
        code
      }
    }
  `

  const data = await graphqlRequest<UserInteractionQueryResult>(query, { user: walletAddress })

  // User is whitelisted if they have either registered OR created a referral code
  const hasRegistered = data.view_latest_user_registered_events.length > 0
  const hasCreatedCode = data.view_latest_referral_system_referral_code_created_events.length > 0

  return hasRegistered || hasCreatedCode
}

/**
 * Check if a user is whitelisted (for whitelist checker page)
 *
 * Strategy:
 * - If deposits are OPEN: Check using alpha vault merkle proof API (auction whitelist)
 * - If deposits are NOT OPEN: Check using backend GraphQL API (registration/referral events)
 *
 * This ensures users can verify their whitelist status before deposits open,
 * and then checks the actual vault whitelist once deposits begin.
 *
 * @param walletAddress - The wallet public key as a string
 * @returns boolean indicating if the user is whitelisted
 */
export async function checkWhitelistStatus(walletAddress: string): Promise<boolean> {
  try {
    const depositsOpen = await areDepositsOpen()

    if (depositsOpen) {
      // Deposits are open - use alpha vault merkle proof API
      const vaultConfig = getTokenAlphaVaultConfig(DEFAULT_BASE_TOKEN_ID, getCurrentNetwork())

      if (!vaultConfig) {
        throw new Error('Alpha vault configuration not found')
      }

      const whitelistInfo = await getWhitelistInfo(walletAddress, vaultConfig.vault)
      return whitelistInfo.isWhitelisted
    } else {
      // Deposits not yet open - use backend GraphQL API
      return await checkWhitelistViaGraphQL(walletAddress)
    }
  } catch (error) {
    console.error('Error checking whitelist status:', error)
    throw new Error('Failed to check whitelist status. Please try again later.')
  }
}

