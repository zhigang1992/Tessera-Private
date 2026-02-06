import type { PagesFunction } from '@cloudflare/workers-types'

type MerkleProofData = {
  proof: number[][]
  max_cap: number
  merkle_root_config?: string
}

type MerkleProofsDB = Record<string, MerkleProofData>

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
 * Load merkle proofs for a specific vault
 */
async function loadMerkleProofsForVault(vaultId: string): Promise<MerkleProofsDB | null> {
  try {
    // Import is resolved at build time, so we need to use dynamic import pattern
    // For now, we support the devnet vault
    const module = await import(`../../data/merkle-proofs-${vaultId}.json`)
    return module.default as MerkleProofsDB
  } catch (error) {
    console.error(`Failed to load merkle proofs for vault ${vaultId}:`, error)
    return null
  }
}

/**
 * API endpoint to get merkle proof for a specific wallet in a specific vault
 *
 * GET /api/merkle-proof/{wallet}?vaultId={vaultId}
 *
 * Query Parameters:
 *   - vaultId: The vault address (required)
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
        'Content-Type': 'application/json'
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
          'Cache-Control': 'no-store' // Don't cache validation errors
        }
      }
    )
  }

  if (!isValidSolanaAddress(vaultId)) {
    return Response.json(
      { error: 'Invalid vaultId format' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store' // Don't cache validation errors
        }
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
          'Cache-Control': 'no-store' // Don't cache validation errors
        }
      }
    )
  }

  // Load merkle proofs for the specified vault
  const proofs = await loadMerkleProofsForVault(vaultId)

  if (!proofs) {
    return Response.json(
      {
        error: 'Vault not found or no whitelist configured',
        vaultId
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store' // Don't cache vault loading errors
        }
      }
    )
  }

  // Check if wallet is whitelisted
  const proofData = proofs[wallet]

  if (!proofData) {
    return Response.json(
      {
        error: 'Wallet not whitelisted for this vault',
        wallet,
        vaultId
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store' // Don't cache negative results - wallet may be added later
        }
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
        'Content-Type': 'application/json'
      }
    }
  )
}
