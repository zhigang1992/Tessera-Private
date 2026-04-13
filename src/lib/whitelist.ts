/**
 * Whitelist Utilities
 *
 * Provides helper functions for checking wallet whitelist status
 * and retrieving merkle proof information for Alpha Vaults and Presale Vaults.
 *
 * Phase 2: All functions use individual wallet API lookups.
 * The complete whitelist is never exposed to clients for privacy.
 */

import { BigNumber, math, type BigNumberValue } from '@/lib/bignumber'
import {
  getGraphQLEndpoint,
  DEFAULT_BASE_TOKEN_ID,
  getTokenAlphaVaultConfig,
  getTokenPresaleVaultConfigs,
  getCurrentNetwork,
  getRpcEndpoint,
  type AppTokenId,
} from '@/config'
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
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
 * Check if a wallet is whitelisted for a specific vault.
 * Works for both alpha vaults and presale vaults.
 *
 * @param walletAddress - The wallet public key
 * @param vaultId - The vault on-chain address
 * @param registryIndex - Registry index for presale vaults (optional, defaults to 0)
 */
export async function getWhitelistInfo(
  walletAddress: string,
  vaultId: string,
  registryIndex?: number
): Promise<WhitelistInfo> {
  const params = new URLSearchParams({ vaultId })
  if (registryIndex != null) {
    params.set('registryIndex', registryIndex.toString())
  }

  const response = await fetch(`/api/merkle-proof/${walletAddress}?${params}`)

  if (response.status === 404) {
    return { isWhitelisted: false, maxCapRaw: null, maxCapFormatted: null, proof: null }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error ?? errorData.message ?? errorMessage
    } catch {}
    throw new Error(errorMessage)
  }

  const proofData = await response.json()

  // Alpha vaults use maxCap, presale vaults use depositCap
  const rawCap = proofData.maxCap ?? proofData.depositCap
  const capFormatted = rawCap != null
    ? math`${BigNumber.from(rawCap)} / ${math`${10} ^ ${6}`}`
    : null

  return {
    isWhitelisted: true,
    maxCapRaw: rawCap?.toString() ?? null,
    maxCapFormatted: capFormatted,
    proof: proofData.proof.map((p: number[]) => p.map((n: number) => n.toString())),
  }
}

/**
 * Resolve a vault tab ID (e.g. "presale-1", "auction") to an on-chain vault address.
 */
export function resolveVaultAddress(
  tokenId: AppTokenId,
  vaultTab: string | null
): string | null {
  const net = getCurrentNetwork()

  if (!vaultTab || vaultTab === 'auction') {
    const config = getTokenAlphaVaultConfig(tokenId, net)
    return config?.vault ?? null
  }

  // Presale vault — vaultTab is the presale config id (e.g. "presale-1")
  const presaleConfigs = getTokenPresaleVaultConfigs(tokenId, net)
  const match = presaleConfigs.find((pc) => pc.id === vaultTab)
  return match?.presaleAddress ?? null
}

/**
 * Check whitelist status via GraphQL backend API (pre-deposit phase).
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
  return data.view_latest_user_registered_events.length > 0 ||
    data.view_latest_referral_system_referral_code_created_events.length > 0
}

/**
 * Check if alpha vault deposits are currently open.
 */
async function areDepositsOpen(): Promise<boolean> {
  try {
    const vaultConfig = getTokenAlphaVaultConfig(DEFAULT_BASE_TOKEN_ID, getCurrentNetwork())
    if (!vaultConfig) return false

    const connection = new Connection(getRpcEndpoint(), 'confirmed')
    const client = new AlphaVaultClient({ tokenId: DEFAULT_BASE_TOKEN_ID, connection })
    const vaultInfo = await client.getVaultInfo()
    return vaultInfo.state === 'deposit_open'
  } catch {
    return false
  }
}

/**
 * Check if a user is whitelisted for a specific vault.
 *
 * @param walletAddress - The wallet public key
 * @param vaultAddress - The on-chain vault address to check against.
 *   If provided, always checks via merkle proof API.
 *   If null, uses the legacy strategy (GraphQL pre-deposit, alpha vault post-deposit).
 */
export async function checkWhitelistStatus(
  walletAddress: string,
  vaultAddress?: string | null
): Promise<boolean> {
  try {
    if (vaultAddress) {
      // Direct vault check via merkle proof API
      const info = await getWhitelistInfo(walletAddress, vaultAddress)
      return info.isWhitelisted
    }

    // Legacy fallback: check alpha vault or GraphQL
    const depositsOpen = await areDepositsOpen()
    if (depositsOpen) {
      const vaultConfig = getTokenAlphaVaultConfig(DEFAULT_BASE_TOKEN_ID, getCurrentNetwork())
      if (!vaultConfig) throw new Error('Alpha vault configuration not found')
      const info = await getWhitelistInfo(walletAddress, vaultConfig.vault)
      return info.isWhitelisted
    }

    return await checkWhitelistViaGraphQL(walletAddress)
  } catch (error) {
    console.error('Error checking whitelist status:', error)
    throw new Error('Failed to check whitelist status. Please try again later.')
  }
}
