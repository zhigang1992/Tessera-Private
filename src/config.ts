import { PublicKey } from '@solana/web3.js'

export type SolanaNetwork = 'devnet' | 'mainnet-beta'

export function getCurrentNetwork(): SolanaNetwork {
  // Use environment variable if explicitly set
  if (import.meta.env.VITE_SOLANA_NETWORK) {
    return import.meta.env.VITE_SOLANA_NETWORK as SolanaNetwork
  }

  // Fall back to hostname detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // If hostname contains 'dev', use devnet, otherwise use mainnet
    return hostname.includes('dev') ? 'devnet' : 'mainnet-beta'
  }

  // Default to devnet for SSR or unknown environments
  return 'devnet'
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

export function getRpcEndpoint(net: SolanaNetwork = getCurrentNetwork()): string {
  return RPC_ENDPOINTS[net]
}

export function getWsEndpoint(net: SolanaNetwork = getCurrentNetwork()): string {
  return WS_ENDPOINTS[net]
}

export function getGraphQLEndpoint(net: SolanaNetwork = getCurrentNetwork()): string {
  return GRAPHQL_ENDPOINTS[net]
}

export const PROGRAM_IDS = {
  TESSERA_TOKEN: new PublicKey('TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf'),
  TESSERA_REFERRALS: new PublicKey('HiA4mhg5viZhiPHsJg2rEo2B5L2TNnNkwDi6AzCT9eD4'),
  TESSERA_AUCTION: new PublicKey('4Edp1p2soByRisvWP7SUA6dmfeZLHqa3UCCsoPm1Ak5R'),
} as const

export function getTesseraTokenProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_TOKEN
}

export function getTesseraReferralsProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_REFERRALS
}

export function getTesseraAuctionProgramId(): PublicKey {
  return PROGRAM_IDS.TESSERA_AUCTION
}

export const getReferralProgramId = getTesseraReferralsProgramId
export const getAuctionProgramId = getTesseraAuctionProgramId

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
export type TokenIconKey = 't-spacex' | 'usdc'
export type AppTokenId = 'T-SpaceX' | 'USDC'

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
  merkleRootConfig?: string
  meteoraUrl?: string
  targetPrice?: number
}

export interface AlphaVaultConfig {
  quoteToken: Extract<AppTokenId, 'USDC'>
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
  decimals: { devnet: number; 'mainnet-beta': number }
  metadataUri?: string
  iconKey: TokenIconKey
  iconUrl?: string
  mint: { devnet: string; 'mainnet-beta': string }
  program: TokenProgram
  metadata?: AppTokenMetadata
  dlmmPool?: DlmmPoolConfig
  alphaVault?: AlphaVaultConfig
}

const TOKENS: Record<AppTokenId, AppToken> = {
  'T-SpaceX': {
    id: 'T-SpaceX',
    symbol: 'T-SpaceX',
    displayName: 'T-SpaceX Token',
    slug: 't-spacex',
    routeSegment: 'T-SpaceX',
    decimals: {
      devnet: 6,
      'mainnet-beta': 9,
    },
    metadataUri: 'https://cdn.tesseralab.co/tessera/t-spacex.json',
    iconKey: 't-spacex',
    iconUrl: 'https://cdn.tesseralab.co/tessera/tokenicon_T-SpaceX.svg',
    mint: {
      devnet: '767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj',
      'mainnet-beta': 'DwtmRMoEcynQsw8GtdMiZdpPfZctPK2PiCBZntL2f8g9',
    },
    program: 'token-2022',
    metadata: {
      name: 'T-SpaceX Token',
      code: 'TSX-001',
      sector: 'Aerospace',
      type: 'PRE-IPO',
      website: 'https://spacex.com',
      description:
        'T-SpaceX is a synthetic asset engineered to track the valuation of SpaceX equity in private secondary markets.',
      auctionMechanism:
        'Funds are deposited into a single liquidity bin. The auction runs for a set duration. If oversubscribed, participants receive a pro-rata share based on their contribution.',
    },
    dlmmPool: {
      id: 'T-SpaceX-USDC',
      quoteToken: 'USDC',
      address: network({
        devnet: '8YJfkiCCdSHjWZuXw1wWXnxSEjsUG8Y8nDQQUta733Qm',
        'mainnet-beta': 'A1BtbJyRhWzKzLectwCeuS94S6vFKpHmLurtg7X8AA6E',
      }),
    },
    alphaVault: {
      quoteToken: 'USDC',
      hasVestingPeriod: false,
      devnet: {
        vault: '2GpAqQXVuwHGutxJBt2UcrDXAAprSVYo7ErFVXyETaNN',
        dlmmPool: '8YJfkiCCdSHjWZuXw1wWXnxSEjsUG8Y8nDQQUta733Qm',
        merkleRootConfig: 'GtzjfPuEPUQbWBsbK6Z9JawxtGHhR26KkUtBKeDoNhmG',
        meteoraUrl: 'https://devnet.app.meteora.ag/vault/2GpAqQXVuwHGutxJBt2UcrDXAAprSVYo7ErFVXyETaNN',
      },
      'mainnet-beta': {
        vault: 'GaAMF2kAytKbQjDJvgTSoK8CeM6ShX21Gukkdk1D6kKN',
        dlmmPool: 'A1BtbJyRhWzKzLectwCeuS94S6vFKpHmLurtg7X8AA6E',
        meteoraUrl: 'https://app.meteora.ag/vault/GaAMF2kAytKbQjDJvgTSoK8CeM6ShX21Gukkdk1D6kKN',
        targetPrice: 412,
      },
    },
  },
  USDC: {
    id: 'USDC',
    symbol: 'USDC',
    displayName: 'USD Coin',
    slug: 'usdc',
    routeSegment: 'USDC',
    decimals: {
      devnet: 6,
      'mainnet-beta': 6,
    },
    iconKey: 'usdc',
    mint: {
      devnet: '7iENkTQY9RCwbWhASSrTbXCTtKBvGmn8wf6x2Su1GYVc',
      'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
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

  // Index both network mints
  const devnetMint = token.mint.devnet
  const mainnetMint = token.mint['mainnet-beta']
  if (devnetMint) MINT_TO_TOKEN_ID[devnetMint] = token.id
  if (mainnetMint) MINT_TO_TOKEN_ID[mainnetMint] = token.id
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
  net: SolanaNetwork = getCurrentNetwork()
): TokenMintConfig {
  const token = getAppToken(tokenId)
  return {
    address: token.mint[net],
    decimals: token.decimals[net],
    program: token.program,
  }
}

export function getTokenMintAddress(
  tokenId: AppTokenId,
  net: SolanaNetwork = getCurrentNetwork()
): string {
  return getAppToken(tokenId).mint[net]
}

export function getTokenMintPublicKey(
  tokenId: AppTokenId,
  net: SolanaNetwork = getCurrentNetwork()
): PublicKey {
  return new PublicKey(getTokenMintAddress(tokenId, net))
}

export function getTokenDecimals(
  tokenId: AppTokenId,
  net: SolanaNetwork = getCurrentNetwork()
): number {
  return getAppToken(tokenId).decimals[net]
}

export function getTokenIdByMint(mint: string): AppTokenId | null {
  return MINT_TO_TOKEN_ID[mint] ?? null
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
  const token = APP_TOKENS['T-SpaceX']
  const quote = APP_TOKENS['USDC']

  const poolAddress = token.dlmmPool?.address
  if (poolAddress) {
    pools[token.dlmmPool!.id] = {
      address: poolAddress,
      tokenX: {
        mint: token.mint.devnet,
        symbol: token.symbol,
        decimals: token.decimals.devnet,
      },
      tokenY: {
        mint: quote.mint.devnet,
        symbol: quote.symbol,
        decimals: quote.decimals.devnet,
      },
    }
  }

  return pools
}

export const DEVNET_POOLS = buildDevnetPools()
