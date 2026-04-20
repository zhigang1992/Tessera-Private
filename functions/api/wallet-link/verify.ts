import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { decodeBase58, decodeBase64 } from '../../lib/encoding'
import {
  buildWalletLinkMessage,
  parseWalletAddress,
  WALLET_LINK_MAX_FUTURE_DRIFT_MS,
  WALLET_LINK_MAX_SIG_AGE_MS,
} from '../../lib/wallet-link'

type Env = {
  DB: D1Database
}

type VerifyRequest = {
  parentWallet?: string
  childWallet?: string
  nonce?: string
  signature?: string
  signatureEncoding?: 'base64' | 'base58'
  timestamp?: string
}

type NonceRow = {
  wallet_address: string
  expires_at: string
  used: number
  purpose: string
}

function decodeSignature(signature: string, encoding: 'base58' | 'base64'): Uint8Array {
  const decoded = encoding === 'base58' ? decodeBase58(signature) : decodeBase64(signature)
  if (decoded.length !== 64) {
    throw new Error('Signature must be 64 bytes')
  }
  return decoded
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: VerifyRequest
  try {
    payload = (await request.json()) as VerifyRequest
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Parse inputs
  let parent: string
  let child: string
  let childPubkeyBytes: Uint8Array
  try {
    parent = parseWalletAddress(payload.parentWallet).address
    const childParsed = parseWalletAddress(payload.childWallet)
    child = childParsed.address
    childPubkeyBytes = childParsed.publicKeyBytes
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  if (parent === child) {
    return Response.json({ error: 'Parent and child wallets must differ' }, { status: 400 })
  }

  const nonce = payload.nonce?.trim()
  const signature = payload.signature?.trim()
  const timestampIso = payload.timestamp?.trim()
  if (!nonce || !signature || !timestampIso) {
    return Response.json({ error: 'Missing nonce, signature, or timestamp' }, { status: 400 })
  }

  if (!timestampIso.endsWith('Z')) {
    return Response.json({ error: 'Timestamp must be an ISO string ending with Z' }, { status: 400 })
  }
  const timestampMs = Date.parse(timestampIso)
  if (Number.isNaN(timestampMs)) {
    return Response.json({ error: 'Invalid timestamp' }, { status: 400 })
  }

  const now = Date.now()
  if (timestampMs > now + WALLET_LINK_MAX_FUTURE_DRIFT_MS) {
    return Response.json({ error: 'Timestamp is too far in the future' }, { status: 400 })
  }
  if (now - timestampMs > WALLET_LINK_MAX_SIG_AGE_MS) {
    return Response.json({ error: 'Signature has expired' }, { status: 400 })
  }

  const encoding = (payload.signatureEncoding ?? 'base64').toLowerCase()
  if (encoding !== 'base64' && encoding !== 'base58') {
    return Response.json({ error: 'Unsupported signature encoding' }, { status: 400 })
  }

  let signatureBytes: Uint8Array
  try {
    signatureBytes = decodeSignature(signature, encoding as 'base58' | 'base64')
  } catch (err) {
    return Response.json(
      { error: 'Invalid signature', detail: (err as Error).message },
      { status: 400 },
    )
  }

  const db = env.DB

  // Look up the nonce. Must be issued by wallet-link for this child and unused.
  const nonceRow = await db
    .prepare('SELECT wallet_address, expires_at, used, purpose FROM auth_nonces WHERE nonce = ?')
    .bind(nonce)
    .first<NonceRow>()

  if (!nonceRow) {
    return Response.json({ error: 'Nonce not found' }, { status: 400 })
  }
  if (nonceRow.used) {
    return Response.json({ error: 'Nonce already used' }, { status: 409 })
  }
  if (nonceRow.purpose !== 'wallet-link') {
    return Response.json({ error: 'Nonce purpose mismatch' }, { status: 400 })
  }
  if (nonceRow.wallet_address !== child) {
    return Response.json({ error: 'Nonce child mismatch' }, { status: 400 })
  }
  const nonceExpiresMs = Date.parse(nonceRow.expires_at)
  if (Number.isNaN(nonceExpiresMs) || nonceExpiresMs < now) {
    return Response.json({ error: 'Nonce expired' }, { status: 400 })
  }

  // Re-derive the exact message we expect the child to have signed.
  const message = buildWalletLinkMessage({
    parentWallet: parent,
    childWallet: child,
    nonce,
    timestampIso,
  })
  const messageBytes = new TextEncoder().encode(message)

  const { ed25519 } = await import('@noble/curves/ed25519')
  const isValid = ed25519.verify(signatureBytes, messageBytes, childPubkeyBytes)
  if (!isValid) {
    return Response.json({ error: 'Signature verification failed' }, { status: 401 })
  }

  // Re-check conflicts before write (another request could have beaten us).
  const [existingLink, isParentElsewhere, parentIsAlreadyChild] = await Promise.all([
    db
      .prepare('SELECT parent_wallet FROM wallet_links WHERE child_wallet = ?')
      .bind(child)
      .first<{ parent_wallet: string }>(),
    db
      .prepare('SELECT 1 AS found FROM wallet_links WHERE parent_wallet = ? LIMIT 1')
      .bind(child)
      .first<{ found: number }>(),
    db
      .prepare('SELECT 1 AS found FROM wallet_links WHERE child_wallet = ? LIMIT 1')
      .bind(parent)
      .first<{ found: number }>(),
  ])

  if (existingLink) {
    return Response.json({ error: 'Child wallet is already linked' }, { status: 409 })
  }
  if (isParentElsewhere) {
    return Response.json(
      { error: 'Wallet cannot be a child — it is already a parent of other linked wallets' },
      { status: 409 },
    )
  }
  if (parentIsAlreadyChild) {
    return Response.json(
      { error: 'Parent wallet is already linked as a child — nested wallet links are not supported' },
      { status: 409 },
    )
  }

  // Atomically: mark nonce used, insert link. Use D1 batch so both commit together.
  try {
    const results = await db.batch([
      db
        .prepare('UPDATE auth_nonces SET used = 1 WHERE nonce = ? AND used = 0')
        .bind(nonce),
      db
        .prepare(
          'INSERT INTO wallet_links (child_wallet, parent_wallet, nonce, message, signature) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(child, parent, nonce, message, signature),
    ])
    if ((results[0]?.meta?.changes ?? 0) === 0) {
      return Response.json({ error: 'Nonce already used' }, { status: 409 })
    }
  } catch (err) {
    console.error('Failed to persist wallet link', err)
    return Response.json({ error: 'Failed to save wallet link' }, { status: 500 })
  }

  return Response.json(
    {
      ok: true,
      parentWallet: parent,
      childWallet: child,
      linkedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
