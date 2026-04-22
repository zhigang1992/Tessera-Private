import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { decodeBase58, decodeBase64 } from '../../lib/encoding'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  SOLANA_MAINNET_RPC_URL?: string
  HELIUS_API_KEY?: string
}

// Official Solana Mobile collection / authority addresses.
// Source: https://docs.solanamobile.com/getting-started/saga-genesis-token,
// https://docs.solanamobile.com/getting-started/chapter2-preorder-token,
// https://docs.solanamobile.com/marketing/engaging-seeker-users
// Saga is a Metaplex NFT collection — one unique NFT per device, minted into
// the collection `46pcSL…`. Check via DAS collection grouping.
const SAGA_GENESIS_COLLECTION = '46pcSL5gmjBrPqGKFaLbbCmR6iVuLJbnQy13hAe7s6CC'
// Chapter 2 Preorder is a single fungible SPL-Token mint that every
// preorderer holds a balance of — not a collection of NFTs. Check via
// getTokenAccountsByOwner with a mint filter.
const CHAPTER_2_PREORDER_MINT = '2DMMamkkxQ6zDMBtkFp8KH7FoWzBMBA1CGTYwom4QH6Z'
// Seeker uses a Token-2022 group mint; we identify SGT mints by a base-mint
// mint_authority equal to the Solana Mobile Seeker authority.
const SEEKER_GENESIS_MINT_AUTHORITY = 'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4'

const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

type JsonRpcOk<T> = { jsonrpc: '2.0'; id: string | number; result: T }
type JsonRpcErr = { jsonrpc: '2.0'; id: string | number; error: { code: number; message: string } }
type JsonRpcResponse<T> = JsonRpcOk<T> | JsonRpcErr

async function rpc<T>(url: string, method: string, params: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
  })
  if (!res.ok) {
    throw new Error(`RPC ${method} failed: ${res.status}`)
  }
  const body = (await res.json()) as JsonRpcResponse<T>
  if ('error' in body) {
    throw new Error(`RPC ${method}: ${body.error.message}`)
  }
  return body.result
}

function resolveRpcUrl(env: Env): string | null {
  if (env.SOLANA_MAINNET_RPC_URL) return env.SOLANA_MAINNET_RPC_URL
  if (env.HELIUS_API_KEY) return `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`
  return null
}

// DAS searchAssets returns `total > 0` when the wallet holds at least one NFT
// in the given Metaplex verified collection. Used for the Saga Genesis Token.
async function ownsCollectionViaDas(
  rpcUrl: string,
  owner: string,
  collection: string,
): Promise<boolean> {
  type SearchAssetsResult = { total: number }
  try {
    const result = await rpc<SearchAssetsResult>(rpcUrl, 'searchAssets', {
      ownerAddress: owner,
      grouping: ['collection', collection],
      page: 1,
      limit: 1,
    })
    return (result?.total ?? 0) > 0
  } catch (err) {
    console.error(`DAS searchAssets failed for collection ${collection}`, err)
    return false
  }
}

// Balance check for a single SPL-Token mint. Used for the Chapter 2 Preorder
// token, which is a fungible-style mint where every preorderer holds > 0.
async function holdsTokenBalance(
  rpcUrl: string,
  owner: string,
  mint: string,
): Promise<boolean> {
  type TokenAccount = {
    account: {
      data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } }
    }
  }
  type TokenAccountsResult = { value: TokenAccount[] }
  try {
    const result = await rpc<TokenAccountsResult>(rpcUrl, 'getTokenAccountsByOwner', [
      owner,
      { mint },
      { encoding: 'jsonParsed' },
    ])
    return result.value.some(
      (a) => (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0) > 0,
    )
  } catch (err) {
    console.error(`getTokenAccountsByOwner failed for mint ${mint}`, err)
    return false
  }
}

// Seeker Genesis Token is a Token-2022 mint with MetadataPointer + TokenGroup
// extensions. We scan the wallet's Token-2022 accounts and inspect each mint's
// base data for a mint_authority matching Solana Mobile's Seeker authority.
// That's a necessary condition for SGT and avoids needing to decode the
// Token-2022 extension TLV bytes. False positives would require someone else
// to have used the same mint_authority pubkey, which is fine for eligibility
// (we'd err toward allowing a wallet, not blocking it).
async function ownsSeekerGenesisToken(rpcUrl: string, owner: string): Promise<boolean> {
  type TokenAccount = {
    pubkey: string
    account: {
      data: {
        parsed: {
          info: {
            mint: string
            tokenAmount: { uiAmount: number | null }
          }
        }
      }
    }
  }
  type TokenAccountsResult = { value: TokenAccount[] }

  let accounts: TokenAccount[]
  try {
    const result = await rpc<TokenAccountsResult>(rpcUrl, 'getTokenAccountsByOwner', [
      owner,
      { programId: TOKEN_2022_PROGRAM },
      { encoding: 'jsonParsed' },
    ])
    accounts = result.value
  } catch (err) {
    console.error('getTokenAccountsByOwner (Token-2022) failed', err)
    return false
  }

  const heldMints = accounts
    .filter((a) => (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0) > 0)
    .map((a) => a.account.data.parsed.info.mint)
  if (heldMints.length === 0) return false

  type MultipleAccountsResult = {
    value: ({ data: [string, 'base64'] } | null)[]
  }

  const expectedAuthority = decodeBase58(SEEKER_GENESIS_MINT_AUTHORITY)

  // getMultipleAccountsInfo caps at 100 pubkeys per call. Batch if needed.
  const BATCH = 100
  for (let i = 0; i < heldMints.length; i += BATCH) {
    const batch = heldMints.slice(i, i + BATCH)
    let result: MultipleAccountsResult
    try {
      result = await rpc<MultipleAccountsResult>(rpcUrl, 'getMultipleAccounts', [
        batch,
        { encoding: 'base64' },
      ])
    } catch (err) {
      console.error('getMultipleAccounts (Token-2022 mints) failed', err)
      continue
    }

    for (const entry of result.value) {
      if (!entry) continue
      const [base64] = entry.data
      let bytes: Uint8Array
      try {
        bytes = decodeBase64(base64)
      } catch {
        continue
      }
      // Token-2022 / SPL Mint layout (first 82 bytes, same as SPL-Token):
      //   [0..4)   COption tag (0 = None, 1 = Some)  — mint_authority
      //   [4..36)  mint_authority pubkey (if Some)
      //   [36..44) supply (u64 LE)
      //   [44]     decimals
      //   [45]     is_initialized
      //   [46..50) COption tag — freeze_authority
      //   [50..82) freeze_authority pubkey
      if (bytes.length < 36) continue
      const optionTag = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)
      if (optionTag !== 1) continue
      let match = true
      for (let k = 0; k < 32; k++) {
        if (bytes[4 + k] !== expectedAuthority[k]) {
          match = false
          break
        }
      }
      if (match) return true
    }
  }

  return false
}

type ResponseBody = {
  status: 'met' | 'unmet'
  source: 'mock' | 'on-chain' | 'unavailable'
  details?: {
    sagaGenesis?: boolean
    chapter2Preorder?: boolean
    seekerGenesis?: boolean
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const walletParam = new URL(request.url).searchParams.get('wallet')

  let wallet: string
  try {
    wallet = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  try {
    const mock = await env.DB
      .prepare('SELECT eligible FROM mock_solana_mobile WHERE wallet_address = ?')
      .bind(wallet)
      .first<{ eligible: number }>()
    if (mock) {
      const body: ResponseBody = {
        status: mock.eligible ? 'met' : 'unmet',
        source: 'mock',
      }
      return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
    }
  } catch (err) {
    console.error('Failed to read mock_solana_mobile', err)
  }

  const rpcUrl = resolveRpcUrl(env)
  if (!rpcUrl) {
    const body: ResponseBody = { status: 'unmet', source: 'unavailable' }
    return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
  }

  const [sagaGenesis, chapter2Preorder, seekerGenesis] = await Promise.all([
    ownsCollectionViaDas(rpcUrl, wallet, SAGA_GENESIS_COLLECTION),
    holdsTokenBalance(rpcUrl, wallet, CHAPTER_2_PREORDER_MINT),
    ownsSeekerGenesisToken(rpcUrl, wallet),
  ])

  const eligible = sagaGenesis || chapter2Preorder || seekerGenesis
  const body: ResponseBody = {
    status: eligible ? 'met' : 'unmet',
    source: 'on-chain',
    details: { sagaGenesis, chapter2Preorder, seekerGenesis },
  }
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
