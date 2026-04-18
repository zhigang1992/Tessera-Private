import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import {
  buildWalletLinkMessage,
  parseWalletAddress,
  WALLET_LINK_NONCE_TTL_SECONDS,
} from '../../lib/wallet-link'

type Env = {
  DB: D1Database
}

type NonceRequest = {
  parentWallet?: string
  childWallet?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: NonceRequest
  try {
    payload = (await request.json()) as NonceRequest
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let parent: string
  let child: string
  try {
    parent = parseWalletAddress(payload.parentWallet).address
    child = parseWalletAddress(payload.childWallet).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  if (parent === child) {
    return Response.json({ error: 'Parent and child wallets must differ' }, { status: 400 })
  }

  const db = env.DB

  // Fast-path conflict: child already linked to someone.
  const existing = await db
    .prepare('SELECT parent_wallet FROM wallet_links WHERE child_wallet = ?')
    .bind(child)
    .first<{ parent_wallet: string }>()

  if (existing) {
    return Response.json(
      {
        error: 'Child wallet is already linked',
        detail: existing.parent_wallet === parent ? 'Already linked to this parent' : 'Linked to a different parent',
      },
      { status: 409 },
    )
  }

  // Don't allow using a wallet that's already someone's parent as a child
  // (keeps the tree flat — no chaining).
  const isParentElsewhere = await db
    .prepare('SELECT 1 AS found FROM wallet_links WHERE parent_wallet = ? LIMIT 1')
    .bind(child)
    .first<{ found: number }>()

  if (isParentElsewhere) {
    return Response.json(
      { error: 'Wallet cannot be a child — it is already a parent of other linked wallets' },
      { status: 409 },
    )
  }

  // Ensure both wallets exist in the users table so auth_nonces FK is satisfied.
  // We use ON CONFLICT to be idempotent.
  await db.batch([
    db
      .prepare(
        "INSERT INTO users (wallet_address) VALUES (?) ON CONFLICT(wallet_address) DO UPDATE SET updated_at = datetime('now')",
      )
      .bind(parent),
    db
      .prepare(
        "INSERT INTO users (wallet_address) VALUES (?) ON CONFLICT(wallet_address) DO UPDATE SET updated_at = datetime('now')",
      )
      .bind(child),
  ])

  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + WALLET_LINK_NONCE_TTL_SECONDS * 1000)
  const nonce = crypto.randomUUID().replace(/-/g, '')

  try {
    await db
      .prepare(
        'INSERT INTO auth_nonces (nonce, wallet_address, expires_at, purpose) VALUES (?, ?, ?, ?)',
      )
      .bind(nonce, child, expiresAt.toISOString(), 'wallet-link')
      .run()
  } catch (err) {
    console.error('Failed to persist wallet-link nonce', err)
    return Response.json({ error: 'Failed to issue nonce' }, { status: 500 })
  }

  const issuedAtIso = issuedAt.toISOString()
  const message = buildWalletLinkMessage({
    parentWallet: parent,
    childWallet: child,
    nonce,
    timestampIso: issuedAtIso,
  })

  return Response.json(
    {
      nonce,
      parentWallet: parent,
      childWallet: child,
      issuedAt: issuedAtIso,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds: WALLET_LINK_NONCE_TTL_SECONDS,
      message,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
