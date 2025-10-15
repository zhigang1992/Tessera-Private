import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useSolanaClientContext } from './solana-provider'
import { useSolanaCluster } from './solana-cluster-context'

/**
 * Custom hook to abstract Wallet UI and related functionality from your app.
 *
 * This is a great place to add custom shared Solana logic or clients.
 */
export function useSolana() {
  const { cluster } = useSolanaCluster()
  const client = useSolanaClientContext()
  const { connection } = useConnection()
  const wallet = useWallet()

  const address = useMemo(() => wallet.publicKey?.toBase58() ?? null, [wallet.publicKey])

  return {
    address,
    cluster,
    client,
    connection,
    publicKey: wallet.publicKey,
    signMessage: wallet.signMessage,
    sendTransaction: wallet.sendTransaction,
    wallet: wallet.wallet,
    wallets: wallet.wallets,
    connected: wallet.connected,
    connecting: wallet.connecting,
    connect: wallet.connect,
    select: wallet.select,
    disconnect: wallet.disconnect,
  }
}
