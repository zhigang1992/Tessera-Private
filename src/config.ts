import { PublicKey } from '@solana/web3.js'

export type SolanaNetwork = 'devnet' | 'mainnet-beta'

export function getCurrentNetwork(): SolanaNetwork {
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
  return network as SolanaNetwork
}

export const RPC_ENDPOINTS: Record<SolanaNetwork, string> = {
  devnet: 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
}

export const WS_ENDPOINTS: Record<SolanaNetwork, string> = {
  devnet: 'wss://api.devnet.solana.com',
  'mainnet-beta': 'wss://api.mainnet-beta.solana.com',
}

export function getRpcEndpoint(network: SolanaNetwork = getCurrentNetwork()): string {
  return RPC_ENDPOINTS[network]
}

export function getWsEndpoint(network: SolanaNetwork = getCurrentNetwork()): string {
  return WS_ENDPOINTS[network]
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
    // Countdown configuration - set to 'disabled' for immediate trading
    // Currently set to 2 minutes from deployment for testing
    countdown: { type: 'timestamp', targetTimestamp: Date.now() + 2 * 60 * 1000 } as
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

export function isDevnet(network: SolanaNetwork = getCurrentNetwork()): boolean {
  return network === 'devnet'
}

export function isMainnet(network: SolanaNetwork = getCurrentNetwork()): boolean {
  return network === 'mainnet-beta'
}

export function getNetworkName(network: SolanaNetwork = getCurrentNetwork()): string {
  const names: Record<SolanaNetwork, string> = {
    devnet: 'Devnet',
    'mainnet-beta': 'Mainnet',
  }
  return names[network]
}

export function getExplorerUrl(
  signature: string,
  type: 'tx' | 'address' = 'tx',
  network: SolanaNetwork = getCurrentNetwork()
): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`

  if (type === 'tx') {
    return `https://explorer.solana.com/tx/${signature}${cluster}`
  }

  return `https://explorer.solana.com/address/${signature}${cluster}`
}

export function getSolscanUrl(
  signature: string,
  type: 'tx' | 'account' = 'tx',
  network: SolanaNetwork = getCurrentNetwork()
): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`
  return `https://solscan.io/${type}/${signature}${cluster}`
}

export type TokenProgram = 'spl-token' | 'token-2022'
export type TokenIconKey = 't-spacex' | 'usdc'
export type AppTokenId = 'T-SpaceX' | 'USDC'

export type NetworkMap<T> = Partial<Record<SolanaNetwork, T>>

export interface TokenMintConfig {
  address: string
  decimals: number
  program: TokenProgram
}

export interface DlmmPoolConfig {
  id: string
  quoteToken: Extract<AppTokenId, 'USDC'>
  addresses: NetworkMap<string>
}

export interface AlphaVaultNetworkConfig {
  vault: string
  dlmmPool: string
  merkleRootConfig?: string
  meteoraUrl?: string
}

export interface AlphaVaultConfig {
  quoteToken: Extract<AppTokenId, 'USDC'>
  hasVestingPeriod: boolean
  baseDecimals: number
  quoteDecimals: number
  networks: NetworkMap<AlphaVaultNetworkConfig>
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
  mints: NetworkMap<TokenMintConfig>
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
    decimals: 6,
    metadataUri: 'https://cdn.tesseralab.co/tessera/t-spacex.json',
    iconKey: 't-spacex',
    iconUrl: 'https://cdn.tesseralab.co/tessera/tokenicon_T-SpaceX.svg',
    mints: {
      devnet: {
        address: '767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj',
        decimals: 6,
        program: 'token-2022',
      },
      'mainnet-beta': {
        address: 'TESgesqMiVxUG38tuJmLkDSQoebKmBn2FhZkYNBr8hu',
        decimals: 9,
        program: 'token-2022',
      },
    },
    metadata: {
      name: 'T-SpaceX Token',
      code: 'TSX-001',
      sector: 'Private Markets',
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
      addresses: {
        devnet: '31zJJsg4bb4XYYjxheUTrGneDxkjsRQqFNUy4KtuWsUN',
      },
    },
    alphaVault: {
      quoteToken: 'USDC',
      hasVestingPeriod: false,
      baseDecimals: 6,
      quoteDecimals: 6,
      networks: {
        devnet: {
          vault: '87o9R4AGWpPqHJnycMRucoNkpnxBduFo8x3DPBaVBZwy',
          dlmmPool: '31zJJsg4bb4XYYjxheUTrGneDxkjsRQqFNUy4KtuWsUN',
          merkleRootConfig: 'D8ai1BoAoUstRW4dD61dENocRNQ34Zw5CUt69PjeQctE',
          meteoraUrl: 'https://devnet.app.meteora.ag/vault/87o9R4AGWpPqHJnycMRucoNkpnxBduFo8x3DPBaVBZwy',
        },
      },
    },
  },
  USDC: {
    id: 'USDC',
    symbol: 'USDC',
    displayName: 'USD Coin',
    slug: 'usdc',
    routeSegment: 'USDC',
    decimals: 6,
    iconKey: 'usdc',
    mints: {
      devnet: {
        address: '6C4wSPz9mcaqGkFD5iqHhvG1FMHx7ehgE2hLCiVnF25r',
        decimals: 6,
        program: 'spl-token',
      },
      'mainnet-beta': {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        program: 'spl-token',
      },
    },
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

  Object.values(token.mints).forEach((mint) => {
    if (mint) {
      MINT_TO_TOKEN_ID[mint.address] = token.id
    }
  })
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
  network: SolanaNetwork = getCurrentNetwork()
): TokenMintConfig | null {
  const token = getAppToken(tokenId)
  if (token.mints[network]) {
    return token.mints[network]!
  }

  const fallback = Object.values(token.mints)[0]
  return fallback ?? null
}

export function getTokenMintAddress(
  tokenId: AppTokenId,
  network: SolanaNetwork = getCurrentNetwork()
): string {
  const mint = getTokenMintConfig(tokenId, network)
  if (mint) {
    return mint.address
  }

  throw new Error(`No mint configured for token ${tokenId}`)
}

export function getTokenMintPublicKey(
  tokenId: AppTokenId,
  network: SolanaNetwork = getCurrentNetwork()
): PublicKey {
  return new PublicKey(getTokenMintAddress(tokenId, network))
}

export function getTokenDecimals(
  tokenId: AppTokenId,
  network: SolanaNetwork = getCurrentNetwork()
): number {
  return getTokenMintConfig(tokenId, network)?.decimals ?? getAppToken(tokenId).decimals
}

export function getTokenIdByMint(mint: string): AppTokenId | null {
  return MINT_TO_TOKEN_ID[mint] ?? null
}

export function getTokenDlmmPool(tokenId: AppTokenId): DlmmPoolConfig | null {
  return getAppToken(tokenId).dlmmPool ?? null
}

export function getTokenDlmmPoolAddress(
  tokenId: AppTokenId,
  network: SolanaNetwork = getCurrentNetwork()
): string | null {
  const pool = getTokenDlmmPool(tokenId)
  if (!pool) return null

  if (pool.addresses?.[network]) {
    return pool.addresses[network]!
  }

  const fallback = Object.values(pool.addresses ?? {}).find(Boolean)
  return fallback ?? null
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
  network: SolanaNetwork = getCurrentNetwork()
): ResolvedAlphaVaultConfig | null {
  const token = getAppToken(tokenId)
  if (!token.alphaVault) {
    return null
  }

  const envConfig = token.alphaVault.networks[network]
  if (!envConfig) {
    return null
  }

  return {
    ...envConfig,
    token,
    quoteToken: getAppToken(token.alphaVault.quoteToken),
    hasVestingPeriod: token.alphaVault.hasVestingPeriod,
    baseDecimals: token.alphaVault.baseDecimals,
    quoteDecimals: token.alphaVault.quoteDecimals,
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

  const poolAddress = token.dlmmPool?.addresses.devnet
  const tokenMint = token.mints.devnet
  const quoteMint = quote.mints.devnet

  if (poolAddress && tokenMint && quoteMint) {
    pools[token.dlmmPool!.id] = {
      address: poolAddress,
      tokenX: {
        mint: tokenMint.address,
        symbol: token.symbol,
        decimals: tokenMint.decimals,
      },
      tokenY: {
        mint: quoteMint.address,
        symbol: quote.symbol,
        decimals: quoteMint.decimals,
      },
    }
  }

  return pools
}

export const DEVNET_POOLS = buildDevnetPools()
