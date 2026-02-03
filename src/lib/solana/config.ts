/**
 * Solana On-Chain Configuration
 *
 * Central configuration for Solana RPC endpoints and program IDs.
 * Supports multiple environments (localnet, devnet, testnet, mainnet).
 */

import { PublicKey } from '@solana/web3.js'

// Environment detection
export type SolanaNetwork = 'localnet' | 'devnet' | 'testnet' | 'mainnet-beta'

/**
 * Get current network from environment variables
 */
export function getCurrentNetwork(): SolanaNetwork {
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
  return network as SolanaNetwork
}

/**
 * RPC endpoint URLs for each network
 */
export const RPC_ENDPOINTS: Record<SolanaNetwork, string> = {
  localnet: 'http://127.0.0.1:8899',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
}

/**
 * WebSocket endpoint URLs for each network
 */
export const WS_ENDPOINTS: Record<SolanaNetwork, string> = {
  localnet: 'ws://127.0.0.1:8900',
  devnet: 'wss://api.devnet.solana.com',
  testnet: 'wss://api.testnet.solana.com',
  'mainnet-beta': 'wss://api.mainnet-beta.solana.com',
}

/**
 * Get RPC endpoint for current network
 */
export function getRpcEndpoint(): string {
  const network = getCurrentNetwork()
  return RPC_ENDPOINTS[network]
}

/**
 * Get WebSocket endpoint for current network
 */
export function getWsEndpoint(): string {
  const network = getCurrentNetwork()
  return WS_ENDPOINTS[network]
}

/**
 * Program IDs - Same across all networks
 * Updated 2024-12-01: Referral program redeployed to new address
 */
export const PROGRAM_IDS = {
  TESSERA_TOKEN: new PublicKey('TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf'),
  TESSERA_REFERRALS: new PublicKey('HiA4mhg5viZhiPHsJg2rEo2B5L2TNnNkwDi6AzCT9eD4'),
  TESSERA_AUCTION: new PublicKey('4Edp1p2soByRisvWP7SUA6dmfeZLHqa3UCCsoPm1Ak5R'),
} as const

/**
 * Tessera mint addresses per environment
 * See addresses.md for complete details
 */
export const DEFAULT_MINT_ADDRESSES: Record<SolanaNetwork, PublicKey> = {
  localnet: PublicKey.default,
  devnet: new PublicKey('2Z41NAkarnW3VKA5EYk3YM58CgXDvpdyw5isEDbNW8mR'), // TTT02 - Current Test Mint
  testnet: PublicKey.default,
  'mainnet-beta': new PublicKey('TESgesqMiVxUG38tuJmLkDSQoebKmBn2FhZkYNBr8hu'), // TESS - Production Mint
}

/**
 * USDC mint addresses per environment
 * Devnet uses a custom SPL token that mirrors USDC properties
 */
export const USDC_MINT_ADDRESSES: Record<SolanaNetwork, PublicKey> = {
  localnet: PublicKey.default,
  devnet: new PublicKey('6C4wSPz9mcaqGkFD5iqHhvG1FMHx7ehgE2hLCiVnF25r'), // Custom USDC for devnet testing
  testnet: PublicKey.default,
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC - Production Mint
}

/**
 * Get Tessera Token program ID
 */
export function getTesseraTokenProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_TOKEN
}

/**
 * Get Tessera Referrals program ID
 */
export function getTesseraReferralsProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_REFERRALS
}

// Backwards compatibility alias
export const getReferralProgramId = getTesseraReferralsProgramId

/**
 * Get Tessera Auction program ID
 */
export function getTesseraAuctionProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_AUCTION
}

// Backwards compatibility alias
export const getAuctionProgramId = getTesseraAuctionProgramId

/**
 * Get Tessera mint address for current network
 */
export function getTesseraMintAddress(): PublicKey {
  const network = getCurrentNetwork()
  const defaultMint = DEFAULT_MINT_ADDRESSES[network]

  if (defaultMint && !defaultMint.equals(PublicKey.default)) {
    return defaultMint
  }

  // Fallback to devnet mint when network-specific mint is unavailable
  return DEFAULT_MINT_ADDRESSES.devnet
}

/**
 * Get USDC mint address for current network
 */
export function getUsdcMintAddress(): PublicKey {
  const network = getCurrentNetwork()
  const usdcMint = USDC_MINT_ADDRESSES[network]

  if (usdcMint && !usdcMint.equals(PublicKey.default)) {
    return usdcMint
  }

  // Fallback to devnet USDC when network-specific mint is unavailable
  return USDC_MINT_ADDRESSES.devnet
}

/**
 * Connection configuration options
 */
export const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 60000, // 60 seconds
}

/**
 * Transaction retry configuration
 */
export const TRANSACTION_CONFIG = {
  maxRetries: 3,
  skipPreflight: false,
  preflightCommitment: 'confirmed' as const,
}

/**
 * Per-pool trading configuration
 * Maps pool IDs to their trading enabled status
 */
export const POOL_TRADING_CONFIG = {
  // Devnet pools
  'T-SpaceX-USDC': true, // Set to true to enable T-SpaceX-USDC trading on devnet
} as const

export type TradingPoolId = keyof typeof POOL_TRADING_CONFIG

/**
 * Check if trading is enabled for a specific pool
 */
export function isTradingEnabledForPool(poolId: TradingPoolId): boolean {
  return POOL_TRADING_CONFIG[poolId] ?? false
}

/**
 * Check if running on devnet
 */
export function isDevnet(): boolean {
  return getCurrentNetwork() === 'devnet'
}

/**
 * Check if running on mainnet
 */
export function isMainnet(): boolean {
  return getCurrentNetwork() === 'mainnet-beta'
}

/**
 * Check if running locally
 */
export function isLocalnet(): boolean {
  return getCurrentNetwork() === 'localnet'
}

/**
 * Display-friendly network name
 */
export function getNetworkName(): string {
  const network = getCurrentNetwork()
  const names: Record<SolanaNetwork, string> = {
    localnet: 'Local',
    devnet: 'Devnet',
    testnet: 'Testnet',
    'mainnet-beta': 'Mainnet',
  }
  return names[network]
}

/**
 * Get Solana Explorer URL for transaction
 */
export function getExplorerUrl(signature: string, type: 'tx' | 'address' = 'tx'): string {
  const network = getCurrentNetwork()
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`

  if (type === 'tx') {
    return `https://explorer.solana.com/tx/${signature}${cluster}`
  } else {
    return `https://explorer.solana.com/address/${signature}${cluster}`
  }
}

/**
 * Get SolScan URL for transaction or address
 */
export function getSolscanUrl(signature: string, type: 'tx' | 'account' = 'tx'): string {
  const network = getCurrentNetwork()
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`

  return `https://solscan.io/${type}/${signature}${cluster}`
}
