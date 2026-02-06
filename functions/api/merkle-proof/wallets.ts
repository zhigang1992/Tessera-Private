import type { PagesFunction } from '@cloudflare/workers-types'

type MerkleProofData = {
  proof: number[][]
  max_cap: number
  merkle_root_config?: string
}

type MerkleProofsDB = Record<string, MerkleProofData>

// Import the merkle proofs data
import merkleProofs from '../../../public/data/merkle-proofs-t22.json'

/**
 * API endpoint to get list of all whitelisted wallets
 *
 * GET /api/merkle-proof/wallets
 *
 * Returns array of whitelisted wallet addresses and count
 */
export const onRequest: PagesFunction = async ({ request }) => {
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

  // Load merkle proofs (cast to correct type)
  const proofs = merkleProofs as MerkleProofsDB

  // Get all wallet addresses
  const wallets = Object.keys(proofs)

  // Return the wallet list
  return Response.json(
    {
      wallets,
      count: wallets.length,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    }
  )
}
