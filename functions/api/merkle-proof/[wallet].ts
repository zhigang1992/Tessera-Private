import type { PagesFunction } from '@cloudflare/workers-types'

// Static imports for merkle proof files — Alpha Vaults
import devnetKalshiAlphaMerkleProofs from '../../data/merkle-proofs-9viFcLBqJkYGVuNVsZWmi28xNG8BKeFUrLSx9HNcyq3f.json'
import mainnetMerkleProofs from '../../data/merkle-proofs-Gu1onXKo8XxCZbXbJj8jG3GVDL9JrL1Qs6yRo9JknRQ5.json'

// Static imports for merkle proof files — Presale Vaults
import devnetKalshiPresale1MerkleProofs from '../../data/merkle-proofs-GiYeT2HnPq8Hf4mFukEJL1Q33tRXZdX7F1ZHw5b8369.json'
import devnetKalshiPresale2MerkleProofs from '../../data/merkle-proofs-7zNPVD91t1vf8iMmSQveK4mtEc3u6BgwCnKWDFPvSje2.json'

// ---------- Types ----------

type AlphaVaultProofData = {
  proof: number[][]
  max_cap: number
  merkle_root_config?: string
}

type PresaleProofData = {
  proof: number[][]
  deposit_cap: number
  merkle_root_config?: string
}

type AlphaVaultProofsDB = Record<string, AlphaVaultProofData>
type PresaleProofsDB = Record<string, PresaleProofData>

// ---------- Vault registry ----------

type VaultType = 'alpha' | 'presale'

interface VaultEntry {
  type: VaultType
  proofs: AlphaVaultProofsDB | PresaleProofsDB
}

const VAULT_REGISTRY: Record<string, VaultEntry> = {
  // Alpha Vaults
  '9viFcLBqJkYGVuNVsZWmi28xNG8BKeFUrLSx9HNcyq3f': { type: 'alpha', proofs: devnetKalshiAlphaMerkleProofs as AlphaVaultProofsDB },
  'Gu1onXKo8XxCZbXbJj8jG3GVDL9JrL1Qs6yRo9JknRQ5': { type: 'alpha', proofs: mainnetMerkleProofs as AlphaVaultProofsDB },
  // Presale Vaults
  'GiYeT2HnPq8Hf4mFukEJL1Q33tRXZdX7F1ZHw5b8369': { type: 'presale', proofs: devnetKalshiPresale1MerkleProofs as PresaleProofsDB },
  '7zNPVD91t1vf8iMmSQveK4mtEc3u6BgwCnKWDFPvSje2': { type: 'presale', proofs: devnetKalshiPresale2MerkleProofs as PresaleProofsDB },
}

// ---------- Helpers ----------

function isValidSolanaAddress(address: string): boolean {
  if (address.length < 32 || address.length > 44) return false
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
  return base58Regex.test(address)
}

function lookupAlphaVaultProof(proofs: AlphaVaultProofsDB, wallet: string) {
  const data = proofs[wallet]
  if (!data) return null
  return {
    proof: data.proof,
    maxCap: data.max_cap,
    merkleRootConfig: data.merkle_root_config,
  }
}

function lookupPresaleProof(proofs: PresaleProofsDB, wallet: string, registryIndex: number) {
  // Presale proof keys use format: {wallet}-{registryIndex}
  const key = `${wallet}-${registryIndex}`
  const data = proofs[key]
  if (!data) return null
  return {
    proof: data.proof,
    depositCap: data.deposit_cap,
    merkleRootConfig: data.merkle_root_config,
    registryIndex,
  }
}

// ---------- Handler ----------

/**
 * GET /api/merkle-proof/{wallet}?vaultId={vaultId}&registryIndex={registryIndex}
 *
 * Query Parameters:
 *   - vaultId: The vault address (required)
 *   - registryIndex: Registry index for presale vaults (optional, defaults to 0)
 *
 * For alpha vaults: returns { wallet, vaultId, vaultType, proof, maxCap, merkleRootConfig }
 * For presale vaults: returns { wallet, vaultId, vaultType, proof, depositCap, merkleRootConfig, registryIndex }
 */
export const onRequest: PagesFunction = async ({ request, params }) => {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Allow': 'GET', 'Content-Type': 'application/json' },
    })
  }

  const wallet = params.wallet as string
  const url = new URL(request.url)
  const vaultId = url.searchParams.get('vaultId')

  if (!vaultId) {
    return Response.json(
      { error: 'Missing vaultId query parameter' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  if (!isValidSolanaAddress(vaultId)) {
    return Response.json(
      { error: 'Invalid vaultId format' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const vaultEntry = VAULT_REGISTRY[vaultId]
  if (!vaultEntry) {
    return Response.json(
      {
        error: 'Vault not found or no whitelist configured',
        vaultId,
        supportedVaults: Object.keys(VAULT_REGISTRY),
      },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  if (!wallet || !isValidSolanaAddress(wallet)) {
    return Response.json(
      { error: 'Invalid wallet address format' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // Lookup proof based on vault type
  if (vaultEntry.type === 'alpha') {
    const result = lookupAlphaVaultProof(vaultEntry.proofs as AlphaVaultProofsDB, wallet)
    if (!result) {
      return Response.json(
        { error: 'Wallet not whitelisted for this vault', wallet, vaultId },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return Response.json(
      { wallet, vaultId, vaultType: 'alpha', ...result },
      { headers: { 'Cache-Control': 'public, max-age=3600', 'Content-Type': 'application/json' } }
    )
  }

  // Presale vault — use registryIndex param (defaults to 0)
  const registryIndex = parseInt(url.searchParams.get('registryIndex') ?? '0', 10)
  const result = lookupPresaleProof(vaultEntry.proofs as PresaleProofsDB, wallet, registryIndex)
  if (!result) {
    return Response.json(
      { error: 'Wallet not whitelisted for this vault', wallet, vaultId, registryIndex },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  return Response.json(
    { wallet, vaultId, vaultType: 'presale', ...result },
    { headers: { 'Cache-Control': 'public, max-age=3600', 'Content-Type': 'application/json' } }
  )
}
