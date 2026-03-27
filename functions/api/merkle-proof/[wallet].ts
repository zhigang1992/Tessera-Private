import type { PagesFunction } from '@cloudflare/workers-types'

// Static imports for merkle proof files
import devnetSpacexMerkleProofs from '../../data/merkle-proofs-GhCka6EdFTvXAZtgLgxY8c2jD4cqXHcvWfo523QGca1p.json'
import devnetKalshiMerkleProofs from '../../data/merkle-proofs-3Buxngd6WzbQkJbBBqfB97ZzqFTFjst2bg3NaLDWSWFJ.json'
import mainnetMerkleProofs from '../../data/merkle-proofs-Gu1onXKo8XxCZbXbJj8jG3GVDL9JrL1Qs6yRo9JknRQ5.json'

type MerkleProofData = {
  proof: number[][]
  max_cap: number
  merkle_root_config?: string
}

type MerkleProofsDB = Record<string, MerkleProofData>

// Supported vault IDs (strong typed union)
const DEVNET_SPACEX_VAULT_ID = 'GhCka6EdFTvXAZtgLgxY8c2jD4cqXHcvWfo523QGca1p' as const
const DEVNET_KALSHI_VAULT_ID = '3Buxngd6WzbQkJbBBqfB97ZzqFTFjst2bg3NaLDWSWFJ' as const
const MAINNET_VAULT_ID = 'Gu1onXKo8XxCZbXbJj8jG3GVDL9JrL1Qs6yRo9JknRQ5' as const

type VaultId = typeof DEVNET_SPACEX_VAULT_ID | typeof DEVNET_KALSHI_VAULT_ID | typeof MAINNET_VAULT_ID

// Static mapping of vault IDs to merkle proof data
const VAULT_MERKLE_PROOFS: Record<VaultId, MerkleProofsDB> = {
  [DEVNET_SPACEX_VAULT_ID]: devnetSpacexMerkleProofs as MerkleProofsDB,
  [DEVNET_KALSHI_VAULT_ID]: devnetKalshiMerkleProofs as MerkleProofsDB,
  [MAINNET_VAULT_ID]: mainnetMerkleProofs as MerkleProofsDB,
}

/**
 * Validate Solana wallet/vault address format
 */
function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded and typically 32-44 characters
  if (address.length < 32 || address.length > 44) {
    return false
  }

  // Check if it contains only valid base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
  return base58Regex.test(address)
}

/**
 * Type guard to check if a string is a valid VaultId
 */
function isValidVaultId(vaultId: string): vaultId is VaultId {
  return vaultId === DEVNET_SPACEX_VAULT_ID || vaultId === DEVNET_KALSHI_VAULT_ID || vaultId === MAINNET_VAULT_ID
}

/**
 * Load merkle proofs for a specific vault
 */
function loadMerkleProofsForVault(vaultId: VaultId): MerkleProofsDB {
  return VAULT_MERKLE_PROOFS[vaultId]
}

/**
 * API endpoint to get merkle proof for a specific wallet in a specific vault
 *
 * GET /api/merkle-proof/{wallet}?vaultId={vaultId}
 *
 * Query Parameters:
 *   - vaultId: The vault address (required) - must be one of the supported vaults
 *
 * Supported Vault IDs:
 *   - Devnet T-SpaceX: GhCka6EdFTvXAZtgLgxY8c2jD4cqXHcvWfo523QGca1p
 *   - Devnet T-Kalshi: 3Buxngd6WzbQkJbBBqfB97ZzqFTFjst2bg3NaLDWSWFJ
 *   - Mainnet T-SpaceX: Gu1onXKo8XxCZbXbJj8jG3GVDL9JrL1Qs6yRo9JknRQ5
 *
 * Returns the merkle proof data for the specified wallet address in the vault,
 * or 404 if the wallet is not whitelisted for that vault.
 */
export const onRequest: PagesFunction = async ({ request, params }) => {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        'Allow': 'GET',
        'Content-Type': 'application/json',
      },
    })
  }

  const wallet = params.wallet as string
  const url = new URL(request.url)
  const vaultId = url.searchParams.get('vaultId')

  // Validate vault ID
  if (!vaultId) {
    return Response.json(
      { error: 'Missing vaultId query parameter' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store', // Don't cache validation errors
        },
      }
    )
  }

  if (!isValidSolanaAddress(vaultId)) {
    return Response.json(
      { error: 'Invalid vaultId format' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store', // Don't cache validation errors
        },
      }
    )
  }

  // Check if vault ID is supported
  if (!isValidVaultId(vaultId)) {
    return Response.json(
      {
        error: 'Vault not found or no whitelist configured',
        vaultId,
        supportedVaults: [DEVNET_SPACEX_VAULT_ID, DEVNET_KALSHI_VAULT_ID, MAINNET_VAULT_ID],
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store', // Don't cache vault loading errors
        },
      }
    )
  }

  // Validate wallet address format
  if (!wallet || !isValidSolanaAddress(wallet)) {
    return Response.json(
      { error: 'Invalid wallet address format' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store', // Don't cache validation errors
        },
      }
    )
  }

  // Load merkle proofs for the specified vault (static import)
  const proofs = loadMerkleProofsForVault(vaultId)

  // Check if wallet is whitelisted
  const proofData = proofs[wallet]

  if (!proofData) {
    return Response.json(
      {
        error: 'Wallet not whitelisted for this vault',
        wallet,
        vaultId,
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store', // Don't cache negative results - wallet may be added later
        },
      }
    )
  }

  // Return the proof data
  return Response.json(
    {
      wallet,
      vaultId,
      proof: proofData.proof,
      maxCap: proofData.max_cap,
      merkleRootConfig: proofData.merkle_root_config,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour (proofs don't change often)
        'Content-Type': 'application/json',
      },
    }
  )
}
