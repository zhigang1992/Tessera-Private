/**
 * Wrapper hook for useWallet that supports address impersonation in development
 *
 * Usage:
 *   Replace: import { useWallet } from '@solana/wallet-adapter-react'
 *   With:    import { useWallet } from '@/hooks/use-wallet-with-impersonation'
 *
 * Or use directly:
 *   const { publicKey, connected } = useWallet()
 *
 * When ?asSolanaAddress=<address> is in URL (and not in production mode),
 * this hook returns the impersonated address instead of the real wallet.
 */

import { useWallet as useWalletOriginal } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { getImpersonationAddress } from '@/lib/impersonation'

export function useWallet() {
  const wallet = useWalletOriginal()
  const impersonationAddress = getImpersonationAddress()

  return useMemo(() => {
    if (!impersonationAddress) {
      // No impersonation, return original wallet
      return wallet
    }

    // Impersonation active - override publicKey and connected
    const impersonatedPublicKey = new PublicKey(impersonationAddress)

    return {
      ...wallet,
      publicKey: impersonatedPublicKey,
      connected: true, // Always "connected" when impersonating
    }
  }, [wallet, impersonationAddress])
}

// Re-export other wallet hooks for convenience
export { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
