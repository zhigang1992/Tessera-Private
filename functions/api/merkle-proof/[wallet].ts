import type { PagesFunction } from '@cloudflare/workers-types'

type MerkleProofData = {
  proof: number[][]
  max_cap: number
  merkle_root_config?: string
}

type MerkleProofsDB = Record<string, MerkleProofData>

// Import the merkle proofs data
// In production, this will be bundled with the worker
import merkleProofs from '../../../public/data/merkle-proofs-t22.json'

/**
 * Validate Solana wallet address format
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
 * API endpoint to get merkle proof for a specific wallet
 *
 * GET /api/merkle-proof/{wallet}
 *
 * Returns the merkle proof data for the specified wallet address,
 * or 404 if the wallet is not whitelisted.
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

  // Validate wallet address format
  if (!wallet || !isValidSolanaAddress(wallet)) {
    return Response.json(
      { error: 'Invalid wallet address format' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    )
  }

  // Load merkle proofs (cast to correct type)
  const proofs = merkleProofs as MerkleProofsDB

  // Check if wallet is whitelisted
  const proofData = proofs[wallet]

  if (!proofData) {
    return Response.json(
      {
        error: 'Wallet not whitelisted',
        wallet
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    )
  }

  // Return the proof data
  return Response.json(
    {
      wallet,
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
