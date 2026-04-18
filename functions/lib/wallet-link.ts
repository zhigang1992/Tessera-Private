import { decodeBase58 } from './encoding'

export const WALLET_LINK_NONCE_TTL_SECONDS = 5 * 60 // 5 minutes
export const WALLET_LINK_MAX_SIG_AGE_MS = 5 * 60 * 1000
export const WALLET_LINK_MAX_FUTURE_DRIFT_MS = 60 * 1000

export const WALLET_LINK_MESSAGE_HEADER = 'Link this wallet to a Tessera parent wallet'

/**
 * Deterministic sign-the-pairing message. Must match exactly on the client and
 * the server, byte for byte — we re-derive it server-side before verification.
 */
export function buildWalletLinkMessage(params: {
  parentWallet: string
  childWallet: string
  nonce: string
  timestampIso: string
}): string {
  return [
    WALLET_LINK_MESSAGE_HEADER,
    `Parent: ${params.parentWallet}`,
    `Child: ${params.childWallet}`,
    `Nonce: ${params.nonce}`,
    `Timestamp: ${params.timestampIso}`,
  ].join('\n')
}

export function parseWalletAddress(address: string | undefined | null): {
  address: string
  publicKeyBytes: Uint8Array
} {
  if (!address) {
    throw new Error('Missing wallet address')
  }

  const trimmed = address.trim()
  if (trimmed.length < 32 || trimmed.length > 44) {
    throw new Error('Invalid wallet address length')
  }

  const decoded = decodeBase58(trimmed)
  if (decoded.length !== 32) {
    throw new Error('Wallet address must decode to 32 bytes')
  }

  return { address: trimmed, publicKeyBytes: decoded }
}
