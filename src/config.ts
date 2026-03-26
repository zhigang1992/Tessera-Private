import { PublicKey } from '@solana/web3.js'

export type SolanaNetwork = 'devnet' | 'mainnet-beta'

/**
 * Production flag to control UI visibility for production readiness
 * When true, certain features will be hidden or show "Coming Soon" status
 *
 * Priority:
 * 1. If VITE_PRODUCTION_MODE is explicitly set, use that value
 * 2. Otherwise, check if hostname contains "production" or is app.tessera.pe
 */
export const PRODUCTION_MODE = (() => {
  // Priority 1: Check environment variable
  if (import.meta.env.VITE_PRODUCTION_MODE !== undefined) {
    return import.meta.env.VITE_PRODUCTION_MODE === 'true'
  }

  // Priority 2: Check hostname for production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const query = window.location.search
    return hostname === 'app.tessera.pe' || hostname.includes('production') || query.includes('production=true')
  }

  // Default to false for SSR or unknown environments
  return false
})()

export const CURRENT_NETWORK: SolanaNetwork = (() => {
  // Use environment variable if explicitly set
  if (import.meta.env.VITE_SOLANA_NETWORK) {
    return import.meta.env.VITE_SOLANA_NETWORK as SolanaNetwork
  }

  // Fall back to hostname detection
  if (typeof window !== 'undefined') {
    const query = window.location.search
    if (query.includes('network=mainnet')) {
      return 'mainnet-beta'
    }
    const hostname = window.location.hostname
    return hostname.includes('dev') || hostname.includes('localhost') ? 'devnet' : 'mainnet-beta'
  }

  // Default to devnet for SSR or unknown environments
  return 'devnet'
})()

export function getCurrentNetwork(): SolanaNetwork {
  return CURRENT_NETWORK;
}

/**
 * Network-aware helper function that returns the appropriate value based on current network
 * @param config Object with devnet and mainnet-beta values
 * @param currentNetwork Optional network override (defaults to getCurrentNetwork())
 */
export function network<T>(
  config: { devnet: T; 'mainnet-beta': T },
  currentNetwork: SolanaNetwork = getCurrentNetwork()
): T {
  return config[currentNetwork]
}

export const RPC_ENDPOINTS: Record<SolanaNetwork, string> = {
  devnet: import.meta.env.VITE_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
  'mainnet-beta': import.meta.env.VITE_MAINNET_RPC_URL || 'https://frequent-intensive-bush.solana-mainnet.quiknode.pro/4bed0e8688659b74ee97ad7afba050392774f0a5/',
}

export const WS_ENDPOINTS: Record<SolanaNetwork, string> = {
  devnet: import.meta.env.VITE_DEVNET_WS_URL || 'wss://api.devnet.solana.com',
  'mainnet-beta': import.meta.env.VITE_MAINNET_WS_URL || 'wss://frequent-intensive-bush.solana-mainnet.quiknode.pro/4bed0e8688659b74ee97ad7afba050392774f0a5/',
}

export const GRAPHQL_ENDPOINTS: Record<SolanaNetwork, string> = {
  devnet: 'https://tracker-gql-dev.tessera.fun/v1/graphql',
  'mainnet-beta': 'https://tracker-gql.tessera.fun/v1/graphql',
}

export function getRpcEndpoint(): string {
  return RPC_ENDPOINTS[getCurrentNetwork()]
}

export function getWsEndpoint(): string {
  return WS_ENDPOINTS[getCurrentNetwork()]
}

export function getGraphQLEndpoint(): string {
  return GRAPHQL_ENDPOINTS[getCurrentNetwork()]
}

export const PROGRAM_IDS = {
  TESSERA_TOKEN: new PublicKey('TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf'),
  TESSERA_REFERRALS: new PublicKey(network({
    devnet: 'HiA4mhg5viZhiPHsJg2rEo2B5L2TNnNkwDi6AzCT9eD4',
    "mainnet-beta": "TESMgr3q4s1CK5nGz7bmkbMQBQeSt8N9wpZjTDWm2cY"
  })),
} as const

export function getTesseraTokenProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_TOKEN
}

export function getTesseraReferralsProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_REFERRALS
}


export const getReferralProgramId = getTesseraReferralsProgramId

export const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 60000,
}

export const TRANSACTION_CONFIG = {
  maxRetries: 3,
  skipPreflight: false,
  preflightCommitment: 'confirmed' as const,
}

export const POOL_TRADING_CONFIG = {
  'T-SpaceX-USDC': {
    enabled: true,
    countdown: { type: 'timestamp', targetTimestamp: 1770269523312 } as
      | { type: 'slot'; targetSlot: number }
      | { type: 'timestamp'; targetTimestamp: number }
      | { type: 'disabled' },
  },
  'T-Kalshi-USDC': {
    enabled: false,
    countdown: { type: 'timestamp', targetTimestamp: 1774443600000 } as // 2026-03-25T13:00:00Z
      | { type: 'slot'; targetSlot: number }
      | { type: 'timestamp'; targetTimestamp: number }
      | { type: 'disabled' },
  },
} as const

export type TradingPoolId = keyof typeof POOL_TRADING_CONFIG

export function isTradingEnabledForPool(poolId: TradingPoolId): boolean {
  return POOL_TRADING_CONFIG[poolId]?.enabled ?? false
}

export function getPoolCountdownConfig(poolId: TradingPoolId) {
  return POOL_TRADING_CONFIG[poolId]?.countdown ?? { type: 'disabled' }
}

export function isDevnet(net: SolanaNetwork = getCurrentNetwork()): boolean {
  return net === 'devnet'
}

export function isMainnet(net: SolanaNetwork = getCurrentNetwork()): boolean {
  return net === 'mainnet-beta'
}

export function getNetworkName(net: SolanaNetwork = getCurrentNetwork()): string {
  const names: Record<SolanaNetwork, string> = {
    devnet: 'Devnet',
    'mainnet-beta': 'Mainnet',
  }
  return names[net]
}

export function getExplorerUrl(
  signature: string,
  type: 'tx' | 'address' = 'tx',
  net: SolanaNetwork = getCurrentNetwork()
): string {
  const cluster = net === 'mainnet-beta' ? '' : `?cluster=${net}`

  if (type === 'tx') {
    return `https://explorer.solana.com/tx/${signature}${cluster}`
  }

  return `https://explorer.solana.com/address/${signature}${cluster}`
}

export function getSolscanUrl(
  signature: string,
  type: 'tx' | 'account' = 'tx',
  net: SolanaNetwork = getCurrentNetwork()
): string {
  const cluster = net === 'mainnet-beta' ? '' : `?cluster=${net}`
  return `https://solscan.io/${type}/${signature}${cluster}`
}

export type TokenProgram = 'spl-token' | 'token-2022'
export type TokenIconKey = 't-spacex' | 't-kalshi' | 'usdc'
export type AppTokenId = 'T-SpaceX' | 'T-Kalshi' | 'USDC'

export interface TokenMintConfig {
  address: string
  decimals: number
  program: TokenProgram
}

export interface DlmmPoolConfig {
  id: string
  quoteToken: Extract<AppTokenId, 'USDC'>
  address: string
}

export interface AlphaVaultNetworkConfig {
  vault: string
  dlmmPool: string
}

export type AlphaVaultType = 'fcfs' | 'prorata'

export interface AlphaVaultConfig {
  quoteToken: Extract<AppTokenId, 'USDC'>
  vaultType: AlphaVaultType
  hasVestingPeriod: boolean
  devnet: AlphaVaultNetworkConfig
  'mainnet-beta': AlphaVaultNetworkConfig
}

export interface AppTokenMetadata {
  name?: string
  code?: string
  sector?: string
  type?: string
  website?: string
  description?: string
  auctionMechanism?: string
  vestingTerms?: string
}

export interface AppToken {
  id: AppTokenId
  symbol: string
  displayName: string
  slug: string
  routeSegment: string
  decimals: number
  metadataUri?: string
  iconKey: TokenIconKey
  iconUrl?: string
  mint: string
  program: TokenProgram
  metadata?: AppTokenMetadata
  dlmmPool?: DlmmPoolConfig
  alphaVault?: AlphaVaultConfig
  auctionLive?: boolean
  impliedValuation?: {
    valuation: string
    valuationNumber: number
    auctionPrice: string
    auctionPriceNumber: number
    disclaimer?: string
  }
  auctionValuation?: {
    valuation: string
    auctionPrice: string
  }
}

// Raw network-specific configs (before network() resolution)
const TOKEN_NETWORK_CONFIGS: Record<AppTokenId, {
  mint: { devnet: string; 'mainnet-beta': string }
  decimals: { devnet: number; 'mainnet-beta': number }
}> = {
  'T-SpaceX': {
    mint: {
      devnet: '767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj',
      'mainnet-beta': 'TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v',
    },
    decimals: {
      devnet: 6,
      'mainnet-beta': 9,
    },
  },
  'T-Kalshi': {
    mint: {
      devnet: 'ARYx1wGLzm9QrRXeMQ11kDNxvtvUk4VDqBg3uCXx8BG5',
      'mainnet-beta': 'TODO_KALSHI_MAINNET_MINT', // TODO: set for mainnet launch
    },
    decimals: {
      devnet: 6,
      'mainnet-beta': 9,
    },
  },
  USDC: {
    mint: {
      devnet: '6LPd6FuUknRZBSXDn8M9bJsmmTzyZEYaCGv1VTtb22MK',
      'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    decimals: {
      devnet: 6,
      'mainnet-beta': 6,
    },
  },
}

const TOKENS: Record<AppTokenId, AppToken> = {
  'T-SpaceX': {
    id: 'T-SpaceX',
    symbol: 'T-SpaceX',
    displayName: 'T-SpaceX',
    slug: 't-spacex',
    routeSegment: 'T-SpaceX',
    decimals: network(TOKEN_NETWORK_CONFIGS['T-SpaceX'].decimals),
    metadataUri: 'https://cdn.tesseralab.co/tessera/t-spacex.json',
    iconKey: 't-spacex',
    iconUrl: 'https://cdn.tesseralab.co/tessera/tokenicon_T-SpaceX.svg',
    mint: network(TOKEN_NETWORK_CONFIGS['T-SpaceX'].mint),
    program: 'token-2022',
    auctionLive: false,
    impliedValuation: {
      valuation: '$1T',
      valuationNumber: 1_004_202_000_000,
      auctionPrice: '~$423',
      auctionPriceNumber: 423,
      disclaimer: 'Valuation reflects the combined SpaceX entity post-acquisition of xAI (Feb 2026), which increased total shares outstanding by ~20%.',
    },
    auctionValuation: {
      valuation: '$800B',
      auctionPrice: '~$423',
    },
    metadata: {
      name: 'T-SpaceX',
      code: 'tSpaceX',
      sector: 'Aerospace',
      type: 'PRE-IPO',
      website: 'https://www.spacex.com',
      description:
        'T-SpaceX represents a loan participation right which provides economic exposure to SpaceX and is redeemable following divestment of the underlying exposure. This is a loan product, not a security - token holders have no ownership, voting, or dividend rights in SpaceX. By owning and using this token, you accept and agree to be bound by the Terms and Conditions available at https://terms.tessera.pe',
      auctionMechanism:
        'Funds are deposited into a single liquidity bin. The auction runs for a set duration. If oversubscribed, participants receive a pro-rata share based on their contribution.',
    },
    dlmmPool: {
      id: 'T-SpaceX-USDC',
      quoteToken: 'USDC',
      address: network({
        devnet: '3BiXVMQYcTCiGMePubJu79SoQACgxSrQiALv1GVLyYSp',
        'mainnet-beta': '8obGpjiUu7QTJHK58YHCoz5HxobmrVP2x5zpMZu3c4BT',
      }),
    },
    alphaVault: {
      quoteToken: 'USDC',
      vaultType: 'prorata',
      hasVestingPeriod: false,
      devnet: {
        vault: 'AFiS9aGDSbUUcaTeaTEfquHXVTAhnP1xP1qhQGtjLJv9',
        dlmmPool: '3BiXVMQYcTCiGMePubJu79SoQACgxSrQiALv1GVLyYSp',
      },
      'mainnet-beta': {
        vault: 'Gu1onXKo8XxCZbXbJj8jG3GVDL9JrL1Qs6yRo9JknRQ5',
        dlmmPool: '8obGpjiUu7QTJHK58YHCoz5HxobmrVP2x5zpMZu3c4BT',
      },
    },
  },
  'T-Kalshi': {
    id: 'T-Kalshi',
    symbol: 'T-Kalshi',
    displayName: 'T-Kalshi',
    slug: 't-kalshi',
    routeSegment: 'T-Kalshi',
    decimals: network(TOKEN_NETWORK_CONFIGS['T-Kalshi'].decimals),
    iconKey: 't-kalshi',
    iconUrl: 'https://cdn.tesseralab.co/tessera/tokenicon_T-Kalshi.svg',
    mint: network(TOKEN_NETWORK_CONFIGS['T-Kalshi'].mint),
    program: 'token-2022',
    auctionLive: true,
    impliedValuation: {
      valuation: '$12B',
      valuationNumber: 12_000_000_000,
      auctionPrice: '~$360',
      auctionPriceNumber: 360,
    },
    auctionValuation: {
      valuation: '$12B',
      auctionPrice: '~$360',
    },
    metadata: {
      name: 'T-Kalshi',
      code: 'tKalshi',
      sector: 'Prediction Markets',
      type: 'PRE-IPO',
      website: 'https://kalshi.com',
      description:
        'T-Kalshi represents a loan participation right which provides economic exposure to Kalshi and is redeemable following divestment of the underlying exposure. This is a loan product, not a security - token holders have no ownership, voting, or dividend rights in Kalshi. By owning and using this token, you accept and agree to be bound by the Terms and Conditions available at https://terms.tessera.pe',
      auctionMechanism:
        'Funds are deposited into a single liquidity bin. The auction runs for a set duration on a first-come, first-served basis. Each participant can deposit up to the individual cap.',
    },
    dlmmPool: {
      id: 'T-Kalshi-USDC',
      quoteToken: 'USDC',
      address: network({
        devnet: '3TMBsifVAUbTxgG5JnaRj72UXahsYqPZpk9EA6LAhtg3',
        'mainnet-beta': 'TODO_KALSHI_MAINNET_POOL', // TODO: set for mainnet launch
      }),
    },
    alphaVault: {
      quoteToken: 'USDC',
      vaultType: 'fcfs',
      hasVestingPeriod: false,
      devnet: {
        vault: '13LVswJqTkfsQjoJdD2wQaggkBix4xYH4qy68MS8xXHm',
        dlmmPool: '3TMBsifVAUbTxgG5JnaRj72UXahsYqPZpk9EA6LAhtg3',
      },
      'mainnet-beta': {
        vault: 'TODO_KALSHI_MAINNET_VAULT', // TODO: set for mainnet launch
        dlmmPool: 'TODO_KALSHI_MAINNET_POOL',
      },
    },
  },
  USDC: {
    id: 'USDC',
    symbol: 'USDC',
    displayName: 'USD Coin',
    slug: 'usdc',
    routeSegment: 'USDC',
    decimals: network(TOKEN_NETWORK_CONFIGS['USDC'].decimals),
    iconKey: 'usdc',
    mint: network(TOKEN_NETWORK_CONFIGS['USDC'].mint),
    program: 'spl-token',
    metadata: {
      name: 'USD Coin',
      code: 'USDC',
      sector: 'Stablecoin',
      type: 'Stablecoin',
      website: 'https://www.circle.com/en/usdc',
      description: 'USD Coin is a fully reserved digital dollar.',
    },
  },
} as const

export const APP_TOKENS = TOKENS
export const DEFAULT_BASE_TOKEN_ID: AppTokenId = 'T-SpaceX'
export const QUOTE_TOKEN_ID: Extract<AppTokenId, 'USDC'> = 'USDC'

const TOKEN_PARAM_INDEX: Record<string, AppTokenId> = {}
const TOKEN_SYMBOL_INDEX: Record<string, AppTokenId> = {}
const MINT_TO_TOKEN_ID: Record<string, AppTokenId> = {}

Object.values(APP_TOKENS).forEach((token) => {
  TOKEN_PARAM_INDEX[token.slug.toLowerCase()] = token.id
  TOKEN_PARAM_INDEX[token.routeSegment.toLowerCase()] = token.id
  TOKEN_PARAM_INDEX[token.symbol.toLowerCase()] = token.id
  TOKEN_SYMBOL_INDEX[token.symbol.toLowerCase()] = token.id

  // Index the current network mint
  MINT_TO_TOKEN_ID[token.mint] = token.id
})

export function listAppTokenIds(): AppTokenId[] {
  return Object.keys(APP_TOKENS) as AppTokenId[]
}

export function getAppToken(tokenId: AppTokenId): AppToken {
  return APP_TOKENS[tokenId]
}

export function resolveTokenIdFromParam(param: string | undefined): AppTokenId | null {
  if (!param) return null
  const key = param.toLowerCase()
  return TOKEN_PARAM_INDEX[key] ?? null
}

export function resolveTokenIdFromSymbol(symbol: string | null | undefined): AppTokenId | null {
  if (!symbol) return null
  return TOKEN_SYMBOL_INDEX[symbol.toLowerCase()] ?? null
}

export function getTokenBySymbol(symbol: string | null | undefined): AppToken | null {
  const tokenId = resolveTokenIdFromSymbol(symbol)
  return tokenId ? getAppToken(tokenId) : null
}

export function getTokenMintConfig(
  tokenId: AppTokenId,
  _net: SolanaNetwork = getCurrentNetwork()
): TokenMintConfig {
  const token = getAppToken(tokenId)
  return {
    address: token.mint,
    decimals: token.decimals,
    program: token.program,
  }
}

export function getTokenMintAddress(
  tokenId: AppTokenId,
  _net: SolanaNetwork = getCurrentNetwork()
): string {
  return getAppToken(tokenId).mint
}

export function getTokenMintPublicKey(
  tokenId: AppTokenId,
  net: SolanaNetwork = getCurrentNetwork()
): PublicKey {
  return new PublicKey(getTokenMintAddress(tokenId, net))
}

export function getTokenDecimals(
  tokenId: AppTokenId,
  _net: SolanaNetwork = getCurrentNetwork()
): number {
  return getAppToken(tokenId).decimals
}

/**
 * Get token mint for a specific network (useful for cross-network operations)
 */
export function getTokenMintForNetwork(tokenId: AppTokenId, net: SolanaNetwork): string {
  return TOKEN_NETWORK_CONFIGS[tokenId].mint[net]
}

/**
 * Get token decimals for a specific network (useful for cross-network operations)
 */
export function getTokenDecimalsForNetwork(tokenId: AppTokenId, net: SolanaNetwork): number {
  return TOKEN_NETWORK_CONFIGS[tokenId].decimals[net]
}

export function getTokenIdByMint(mint: string): AppTokenId | null {
  return MINT_TO_TOKEN_ID[mint] ?? null
}

export function getTokenByMint(mint: string): AppToken | null {
  const tokenId = getTokenIdByMint(mint)
  return tokenId ? getAppToken(tokenId) : null
}

export function getTokenDlmmPool(tokenId: AppTokenId): DlmmPoolConfig | null {
  return getAppToken(tokenId).dlmmPool ?? null
}

export function getTokenDlmmPoolAddress(tokenId: AppTokenId): string | null {
  const pool = getTokenDlmmPool(tokenId)
  return pool?.address ?? null
}

export interface TokenDisplayMetadata {
  id: string
  symbol: string
  name: string
  code?: string
  sector?: string
}

export function getTokenDisplayMetadata(tokenId: AppTokenId): TokenDisplayMetadata {
  const token = getAppToken(tokenId)
  return {
    id: token.slug,
    symbol: token.symbol,
    name: token.displayName,
    code: token.metadata?.code ?? token.routeSegment,
    sector: token.metadata?.sector ?? 'Tokenized Asset',
  }
}

export interface ResolvedAlphaVaultConfig extends AlphaVaultNetworkConfig {
  token: AppToken
  quoteToken: AppToken
  vaultType: AlphaVaultType
  hasVestingPeriod: boolean
  baseDecimals: number
  quoteDecimals: number
}

export function getTokenAlphaVaultConfig(
  tokenId: AppTokenId,
  net: SolanaNetwork = getCurrentNetwork()
): ResolvedAlphaVaultConfig | null {
  const token = getAppToken(tokenId)
  if (!token.alphaVault) {
    return null
  }

  const envConfig = token.alphaVault[net]
  const quoteToken = getAppToken(token.alphaVault.quoteToken)

  return {
    ...envConfig,
    token,
    quoteToken,
    vaultType: token.alphaVault.vaultType,
    hasVestingPeriod: token.alphaVault.hasVestingPeriod,
    baseDecimals: getTokenDecimals(tokenId, net),
    quoteDecimals: getTokenDecimals(token.alphaVault.quoteToken, net),
  }
}

export function getTesseraMintAddress(): PublicKey {
  return getTokenMintPublicKey('T-SpaceX')
}

export function getUsdcMintAddress(): PublicKey {
  return getTokenMintPublicKey('USDC')
}

export interface LegacyPoolTokenInfo {
  mint: string
  symbol: string
  decimals: number
}

export interface LegacyPoolInfo {
  address: string
  tokenX: LegacyPoolTokenInfo
  tokenY: LegacyPoolTokenInfo
}

function buildDevnetPools(): Record<string, LegacyPoolInfo> {
  const pools: Record<string, LegacyPoolInfo> = {}
  const quote = APP_TOKENS['USDC']

  const baseTokenIds: AppTokenId[] = ['T-SpaceX', 'T-Kalshi']
  for (const tokenId of baseTokenIds) {
    const token = APP_TOKENS[tokenId]
    const poolAddress = token.dlmmPool?.address
    if (poolAddress) {
      pools[token.dlmmPool!.id] = {
        address: poolAddress,
        tokenX: {
          mint: token.mint,
          symbol: token.symbol,
          decimals: token.decimals,
        },
        tokenY: {
          mint: quote.mint,
          symbol: quote.symbol,
          decimals: quote.decimals,
        },
      }
    }
  }

  return pools
}

export const DEVNET_POOLS = buildDevnetPools()

/**
 * Returns all tokens that have an alpha vault (i.e. auction tokens), ordered with live auctions first.
 */
export function getAuctionTokens(): AppToken[] {
  return Object.values(APP_TOKENS)
    .filter((t) => t.alphaVault != null)
    .sort((a, b) => (a.auctionLive === b.auctionLive ? 0 : a.auctionLive ? -1 : 1))
}

/**
 * Returns the route segment of the first live auction token, or the first auction token if none is live.
 */
export function getLiveAuctionRoute(): string {
  const tokens = getAuctionTokens()
  const live = tokens.find((t) => t.auctionLive)
  return (live ?? tokens[0])?.routeSegment ?? DEFAULT_BASE_TOKEN_ID
}
