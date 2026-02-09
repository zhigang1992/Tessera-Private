/**
 * Development utility for impersonating Solana addresses
 * Only enabled when PRODUCTION_MODE is false
 */

import { PublicKey } from '@solana/web3.js'
import { PRODUCTION_MODE } from '@/config'

/**
 * Get impersonation address from URL query parameter
 * Example: ?asSolanaAddress=HbHV51jrqiFsLSm7ZyDu1hQNxSYHXyUjfSTYoMEftQs8
 */
export function getImpersonationAddress(): string | null {
  // Only allow impersonation in development mode
  if (PRODUCTION_MODE) {
    return null
  }

  if (typeof window === 'undefined') {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  const address = params.get('asSolanaAddress')

  if (!address) {
    return null
  }

  // Validate that it's a valid Solana address
  try {
    new PublicKey(address)
    return address
  } catch (error) {
    console.warn('[Impersonation] Invalid Solana address provided:', address)
    return null
  }
}

/**
 * Check if currently impersonating
 */
export function isImpersonating(): boolean {
  return getImpersonationAddress() !== null
}

/**
 * Get display info for impersonation banner
 */
export function getImpersonationInfo(): { address: string; truncated: string } | null {
  const address = getImpersonationAddress()
  if (!address) return null

  return {
    address,
    truncated: `${address.slice(0, 4)}...${address.slice(-4)}`,
  }
}
