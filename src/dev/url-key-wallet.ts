/*
  URL Key Wallet bootstrap for testing without a Chrome extension.
  - Reads a Solana private key from the URL hash
  - Registers a minimal Wallet Standard wallet exposing that account
  - Auto-selects the account so the app treats it as connected
  - Implements window.solana.signMessage for referral auth flows
  - Implements signTransaction and signAndSendTransaction for on-chain operations

  Supported hash formats (examples):
  - #<base58-encoded-secret-key>                // 64 bytes (secret+public) or 32-byte seed
  - #0x<hex> or #<hex>                          // 64 hex chars (32 bytes) or 128 hex chars (64 bytes)
  - #[1,2,3,...]                                // JSON array of numbers (64 length preferred)
  - #pk=<value> or #secret=<value>              // query-like single key

  Note: After parsing, this removes the hash from the URL via history.replaceState to avoid leaking keys.
*/

import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { registerWallet } from '@wallet-standard/wallet'
import type { Wallet, WalletAccount } from '@wallet-standard/base'
import { StandardConnect, StandardDisconnect, StandardEvents } from '@wallet-standard/features'
import {
  SolanaSignMessage,
  SolanaSignTransaction,
  SolanaSignAndSendTransaction,
  type SolanaSignTransactionInput,
  type SolanaSignAndSendTransactionInput,
} from '@solana/wallet-standard-features'
import { Transaction, VersionedTransaction, Keypair, Connection } from '@solana/web3.js'

// RPC endpoints for different chains
const CHAIN_RPC_ENDPOINTS: Record<string, string> = {
  'solana:devnet': 'https://api.devnet.solana.com',
  'solana:localnet': 'http://localhost:8899',
  'solana:testnet': 'https://api.testnet.solana.com',
  'solana:mainnet': 'https://api.mainnet-beta.solana.com',
}

function parseHash(): string | undefined {
  const raw = globalThis?.location?.hash?.slice(1) ?? ''
  if (!raw) return undefined

  // Allow query-like usage: #pk=..., #secret=...
  if (raw.includes('=')) {
    try {
      const params = new URLSearchParams(raw.replace(/^\?/, ''))
      return params.get('pk') ?? params.get('secret') ?? undefined
    } catch {
      return raw
    }
  }
  return raw
}

function decodeSecretKey(encoded?: string): Uint8Array | undefined {
  if (!encoded) return undefined

  // JSON array format
  if (encoded.trim().startsWith('[')) {
    try {
      const arr = JSON.parse(encoded.trim()) as number[]
      return new Uint8Array(arr)
    } catch {
      return undefined
    }
  }

  // Hex (with or without 0x)
  const hexMatch = encoded.match(/^(0x)?([0-9a-fA-F]+)$/)
  if (hexMatch) {
    const hex = (hexMatch[2] ?? '').toLowerCase()
    if (hex.length % 2 !== 0) return undefined
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
    }
    return bytes
  }

  // Fallback to base58
  try {
    return bs58.decode(encoded)
  } catch {
    return undefined
  }
}

function toKeyPair(secret: Uint8Array): nacl.SignKeyPair | undefined {
  // Solana uses ed25519. Accept either 32-byte seed or 64-byte secret key.
  if (secret.length === 32) {
    try {
      return nacl.sign.keyPair.fromSeed(secret)
    } catch {
      return undefined
    }
  }
  if (secret.length === 64) {
    try {
      return nacl.sign.keyPair.fromSecretKey(secret)
    } catch {
      return undefined
    }
  }
  return undefined
}

function createWalletAccount(
  name: string,
  kp: nacl.SignKeyPair,
  chains: readonly `${string}:${string}`[],
): WalletAccount {
  const address = bs58.encode(kp.publicKey)
  return Object.freeze({
    address,
    publicKey: kp.publicKey,
    chains: chains as WalletAccount['chains'],
    features: [SolanaSignMessage, SolanaSignTransaction, SolanaSignAndSendTransaction] as WalletAccount['features'],
    label: `${name} (${address.slice(0, 4)}..${address.slice(-4)})`,
  })
}

/**
 * Sign a serialized transaction with the keypair.
 * Handles both legacy Transaction and VersionedTransaction formats.
 */
function signTransactionBytes(transactionBytes: Uint8Array, secretKey: Uint8Array): Uint8Array {
  // Create Keypair from the secret key
  const keypair = Keypair.fromSecretKey(secretKey)

  // Try to deserialize as VersionedTransaction first (v0 format)
  try {
    const versionedTx = VersionedTransaction.deserialize(transactionBytes)
    versionedTx.sign([keypair])
    return versionedTx.serialize()
  } catch {
    // Fall back to legacy Transaction
    const legacyTx = Transaction.from(transactionBytes)
    legacyTx.partialSign(keypair)
    return legacyTx.serialize()
  }
}

/**
 * Get or create a Connection for the given chain
 */
function getConnectionForChain(chain: string): Connection {
  const endpoint = CHAIN_RPC_ENDPOINTS[chain] || CHAIN_RPC_ENDPOINTS['solana:devnet']
  return new Connection(endpoint, 'confirmed')
}

// Simple event emitter for standard:events
type ChangeListener = (props: { accounts?: readonly WalletAccount[] }) => void
function createEventHub() {
  const listeners = new Set<ChangeListener>()
  return {
    on(listener: ChangeListener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    emitChange(change: { accounts?: readonly WalletAccount[] }) {
      for (const l of listeners) {
        try {
          l(change)
        } catch (e) {
          console.error(e)
        }
      }
    },
  }
}

function registerUrlKeyWallet(secretKey: Uint8Array) {
  const kp = toKeyPair(secretKey)
  if (!kp) return

  const CHAINS = ['solana:devnet', 'solana:localnet'] as const satisfies readonly `${string}:${string}`[]
  const WALLET_NAME = 'URL Key Wallet'
  const account = createWalletAccount(WALLET_NAME, kp, CHAINS)
  const accounts: WalletAccount[] = [account]
  const events = createEventHub()

  // Minimal transparent 1x1 PNG icon
  const icon =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

  const wallet: Wallet = {
    version: '1.0.0',
    name: WALLET_NAME,
    icon,
    chains: CHAINS,
    features: {
      [StandardEvents]: {
        version: '1.0.0',
        on: (event: 'change', listener: ChangeListener) => {
          if (event !== 'change') return () => {}
          return events.on(listener)
        },
      },
      [StandardConnect]: {
        version: '1.0.0',
        connect: async () => {
          return { accounts }
        },
      },
      [StandardDisconnect]: {
        version: '1.0.0',
        disconnect: async () => {
          // no-op for in-memory wallet
        },
      },
      [SolanaSignMessage]: {
        version: '1.0.0',
        signMessage: async (...inputs: readonly { account: WalletAccount; message: Uint8Array }[]) => {
          // Inputs are { account, message }
          return inputs.map(({ message }) => {
            const signature = nacl.sign.detached(message, kp.secretKey)
            return Object.freeze({ signedMessage: message, signature, signatureType: 'ed25519' as const })
          })
        },
      },
      [SolanaSignTransaction]: {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0] as const,
        signTransaction: async (...inputs: readonly SolanaSignTransactionInput[]) => {
          return inputs.map(({ transaction }) => {
            const signedTransaction = signTransactionBytes(transaction, secretKey)
            return Object.freeze({ signedTransaction })
          })
        },
      },
      [SolanaSignAndSendTransaction]: {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0] as const,
        signAndSendTransaction: async (...inputs: readonly SolanaSignAndSendTransactionInput[]) => {
          const results = await Promise.all(
            inputs.map(async ({ transaction, chain, options }) => {
              // Sign the transaction
              const signedTransaction = signTransactionBytes(transaction, secretKey)

              // Get connection for the specified chain
              const connection = getConnectionForChain(chain)

              // Send the signed transaction
              const signature = await connection.sendRawTransaction(signedTransaction, {
                skipPreflight: options?.skipPreflight ?? false,
                preflightCommitment: options?.preflightCommitment ?? 'confirmed',
                maxRetries: options?.maxRetries,
              })

              // Optionally confirm if commitment is specified
              if (options?.commitment) {
                await connection.confirmTransaction(signature, options.commitment)
              }

              // Return signature as Uint8Array (base58 decoded)
              return Object.freeze({ signature: bs58.decode(signature) })
            }),
          )
          return results
        },
      },
    },
    // Pre-authorize the account
    accounts,
  }

  // Register with Wallet Standard so @wallet-ui can discover it
  try {
    registerWallet(wallet)
  } catch (e) {
    console.error('Failed to register URL Key Wallet', e)
  }

  // Let the app auto-select this wallet/account on mount
  try {
    const storageKey = `wallet-ui:account`
    const saved = `${wallet.name}:${account.address}`
    localStorage.setItem(storageKey, JSON.stringify(saved))
    // Emit change event to notify listeners accounts are present
    // Not strictly required, but helps some UIs refresh immediately
    void (wallet.features[StandardEvents] as { on: (event: 'change', listener: ChangeListener) => () => void }).on(
      'change',
      () => {},
    )
    events.emitChange({ accounts })
  } catch (e) {
    console.warn('Could not persist selected account:', e)
  }

  // Provide Phantom-like window.solana shim for signMessage and signTransaction
  try {
    const pubkeyBase58 = account.address
    const solanaKeypair = Keypair.fromSecretKey(secretKey)

    const shim = {
      publicKey: {
        toString: () => pubkeyBase58,
        toBase58: () => pubkeyBase58,
        toBytes: () => kp.publicKey.slice(),
        equals: (other: { toBase58?: () => string; toString?: () => string }) => {
          const otherStr = other.toBase58?.() || other.toString?.() || ''
          return otherStr === pubkeyBase58
        },
      },
      signMessage: async (message: Uint8Array) => {
        const signature = nacl.sign.detached(message, kp.secretKey)
        return { signature }
      },
      signTransaction: async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
        if (transaction instanceof VersionedTransaction) {
          transaction.sign([solanaKeypair])
        } else {
          transaction.partialSign(solanaKeypair)
        }
        return transaction
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
        for (const tx of transactions) {
          if (tx instanceof VersionedTransaction) {
            tx.sign([solanaKeypair])
          } else {
            tx.partialSign(solanaKeypair)
          }
        }
        return transactions
      },
      isPhantom: false,
      isUrlKeyWallet: true,
      isConnected: true,
      connect: async () => ({ publicKey: shim.publicKey }),
      disconnect: async () => {},
    }
    const globalWithShim = globalThis as typeof globalThis & {
      solana?: typeof shim
      phantom?: { solana: typeof shim }
    }
    globalWithShim.solana = shim
    globalWithShim.phantom = { solana: shim }
  } catch (e) {
    console.warn('Failed to install window.solana shim:', e)
  }
}

export function bootstrapUrlKeyWallet() {
  const raw = parseHash()
  let secret = decodeSecretKey(raw)

  // If no key in URL, try to restore from localStorage
  if (!secret) {
    try {
      const storedKey = localStorage.getItem('url-key-wallet-secret')
      if (storedKey) {
        const storedType = localStorage.getItem('url-key-wallet-type') || 'base58'
        secret = decodeSecretKey(storedType === 'hex' ? `0x${storedKey}` : storedKey)
      }
    } catch (e) {
      console.warn('Failed to restore key from localStorage:', e)
    }
  }

  if (!secret) return

  // Persist the key to localStorage for future sessions
  try {
    localStorage.setItem('url-key-wallet-secret', bs58.encode(secret))
    localStorage.setItem('url-key-wallet-type', 'base58')
  } catch (e) {
    console.warn('Failed to persist key to localStorage:', e)
  }

  // Remove hash from the bar to avoid leaks
  try {
    history.replaceState(null, '', location.pathname + location.search)
  } catch {
    // Intentionally empty
  }
  registerUrlKeyWallet(secret)
}

// Auto-run on import in the browser
if (typeof window !== 'undefined') {
  try {
    bootstrapUrlKeyWallet()
  } catch (e) {
    console.error(e)
  }
}
