/**
 * Wallet hooks compatibility layer — sources from Dynamic instead of @solana/wallet-adapter-react.
 *
 * Drop-in replacement: change the import path, the return shape stays compatible.
 *   Replace: import { useWallet } from '@solana/wallet-adapter-react'
 *   With:    import { useWallet } from '@/hooks/use-wallet'
 *
 * Supports:
 *   - useWallet() — connected, publicKey, disconnect, signTransaction, signAllTransactions, sendTransaction, signMessage, wallet
 *   - useConnection() — { connection } from existing wallet-adapter ConnectionProvider
 *   - useAnchorWallet() — { publicKey, signTransaction, signAllTransactions } | undefined
 *   - useWalletModal() — { setVisible } that opens Dynamic's auth flow
 *   - URL impersonation via ?asSolanaAddress=<addr> in non-production mode (read-only)
 */

import { useCallback, useMemo } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { isSolanaWallet } from '@dynamic-labs/solana'
import { Connection, PublicKey, type SendOptions, type Transaction, type TransactionSignature, type VersionedTransaction } from '@solana/web3.js'
import { useConnection as useConnectionOriginal } from '@solana/wallet-adapter-react'
import { getImpersonationAddress } from '@/lib/impersonation'

type SignTransaction = <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>
type SignAllTransactions = <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>
type SendTransaction = <T extends Transaction | VersionedTransaction>(
  tx: T,
  connection: Connection,
  options?: SendOptions,
) => Promise<TransactionSignature>
type SignMessage = (message: Uint8Array) => Promise<Uint8Array>

export type WalletAdapterCompat = {
  name?: string
  icon?: string
}

export type WalletShape = {
  adapter: WalletAdapterCompat
}

export type WalletContextStateCompat = {
  connected: boolean
  connecting: boolean
  publicKey: PublicKey | null
  wallet: WalletShape | null
  disconnect: () => Promise<void>
  signTransaction?: SignTransaction
  signAllTransactions?: SignAllTransactions
  sendTransaction?: SendTransaction
  signMessage?: SignMessage
}

// Dynamic ships its own copy of @solana/web3.js inside @dynamic-labs/embedded-wallet-solana,
// so the Transaction/VersionedTransaction nominal types differ from the app's. Cast through
// `any` at the boundary — the runtime shapes are identical.
type DynamicSigner = {
  signTransaction: (tx: any) => Promise<any>
  signAllTransactions: (txs: any[]) => Promise<any[]>
  signAndSendTransaction: (tx: any, opts?: SendOptions) => Promise<{ signature: TransactionSignature }>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
}

async function getSolanaSigner(primaryWallet: unknown): Promise<DynamicSigner> {
  if (!primaryWallet) throw new Error('Wallet not connected')
  if (!isSolanaWallet(primaryWallet as never)) throw new Error('Connected wallet is not a Solana wallet')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await (primaryWallet as any).getSigner()) as DynamicSigner
}

export function useWallet(): WalletContextStateCompat {
  const { primaryWallet, handleLogOut, sdkHasLoaded } = useDynamicContext()
  const impersonationAddress = getImpersonationAddress()

  return useMemo<WalletContextStateCompat>(() => {
    // Impersonation overlay (read-only): pretend we're connected with the impersonated address.
    if (impersonationAddress) {
      return {
        connected: true,
        connecting: false,
        publicKey: new PublicKey(impersonationAddress),
        wallet: { adapter: { name: 'Impersonation' } },
        disconnect: async () => {},
      }
    }

    if (!primaryWallet) {
      return {
        connected: false,
        connecting: !sdkHasLoaded,
        publicKey: null,
        wallet: null,
        disconnect: async () => {
          await handleLogOut()
        },
      }
    }

    const publicKey = (() => {
      try {
        return new PublicKey(primaryWallet.address)
      } catch {
        return null
      }
    })()

    const adapterName = primaryWallet.connector?.name
    const adapterIcon = (primaryWallet.connector as { walletBook?: { logoUrl?: string }; brand?: { spinnerLogoUrl?: string } } | undefined)?.walletBook?.logoUrl
      ?? (primaryWallet.connector as { brand?: { spinnerLogoUrl?: string } } | undefined)?.brand?.spinnerLogoUrl

    const signTransaction: SignTransaction = async (tx) => {
      const signer = await getSolanaSigner(primaryWallet)
      return (await signer.signTransaction(tx)) as typeof tx
    }
    const signAllTransactions: SignAllTransactions = async (txs) => {
      const signer = await getSolanaSigner(primaryWallet)
      return (await signer.signAllTransactions(txs)) as typeof txs
    }
    const sendTransaction: SendTransaction = async (tx, _connection, options) => {
      const signer = await getSolanaSigner(primaryWallet)
      const result = await signer.signAndSendTransaction(tx, options)
      return result.signature
    }
    const signMessage: SignMessage = async (message) => {
      const signer = await getSolanaSigner(primaryWallet)
      const result = await signer.signMessage(message)
      return result.signature
    }

    return {
      connected: true,
      connecting: false,
      publicKey,
      wallet: { adapter: { name: adapterName, icon: adapterIcon } },
      disconnect: async () => {
        await handleLogOut()
      },
      signTransaction,
      signAllTransactions,
      sendTransaction,
      signMessage,
    }
  }, [primaryWallet, handleLogOut, sdkHasLoaded, impersonationAddress])
}

export type AnchorWalletCompat = {
  publicKey: PublicKey
  signTransaction: SignTransaction
  signAllTransactions: SignAllTransactions
}

export function useAnchorWallet(): AnchorWalletCompat | undefined {
  const wallet = useWallet()
  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return undefined
    }
    return {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    }
  }, [wallet])
}

/**
 * Connection hook — delegates to wallet-adapter-react's ConnectionProvider, which we keep mounted
 * in solana-provider.tsx for read-only RPC access (cluster switching, slot subscriptions, etc.).
 */
export function useConnection() {
  return useConnectionOriginal()
}

/**
 * Wallet modal compat — opens Dynamic's auth flow instead of the wallet-adapter modal.
 */
export function useWalletModal() {
  const { setShowAuthFlow } = useDynamicContext()
  const setVisible = useCallback(
    (visible: boolean) => {
      setShowAuthFlow(visible)
    },
    [setShowAuthFlow],
  )
  return { visible: false, setVisible }
}
