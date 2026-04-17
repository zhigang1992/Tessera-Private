/**
 * @deprecated Import from '@/hooks/use-wallet' directly.
 *
 * Kept as a thin re-export so existing import sites keep working during the
 * Dynamic.xyz migration. Impersonation (?asSolanaAddress=...) is now handled
 * inside the compat layer in '@/hooks/use-wallet'.
 */
export { useWallet, useConnection, useAnchorWallet } from '@/hooks/use-wallet'
