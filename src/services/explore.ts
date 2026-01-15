import { sleep } from './utils'

// ============ Types ============

export type AssetStatus = 'trading' | 'auction' | 'coming_soon'

export interface ExploreAsset {
  id: string
  name: string
  ticker: string
  category: string
  headerColor: string
  price: number
  valuation: string
  status: AssetStatus
}

// ============ Mock Data ============

const exploreAssets: ExploreAsset[] = [
  {
    id: 'spacex',
    name: 'SpaceX',
    ticker: 'SPX-T',
    category: 'Aerospace',
    headerColor: '#1a1d29',
    price: 476.22,
    valuation: '$180B',
    status: 'trading',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    ticker: 'OAI',
    category: 'AI / Tech',
    headerColor: '#10b981',
    price: 124.5,
    valuation: '$86B',
    status: 'auction',
  },
  {
    id: 'xai',
    name: 'xAI',
    ticker: 'XAI',
    category: 'AI / Tech',
    headerColor: '#1a1d29',
    price: 42.0,
    valuation: '$24B',
    status: 'coming_soon',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    ticker: 'STRP',
    category: 'FinTech',
    headerColor: '#6366f1',
    price: 65.2,
    valuation: '$65B',
    status: 'trading',
  },
  {
    id: 'kalshi',
    name: 'Kalshi',
    ticker: 'KLSH',
    category: 'FinTech',
    headerColor: '#a855f7',
    price: 12.8,
    valuation: '$800M',
    status: 'auction',
  },
  {
    id: 'databricks',
    name: 'Databricks',
    ticker: 'DATA',
    category: 'Enterprise',
    headerColor: '#ef4444',
    price: 72.1,
    valuation: '$43B',
    status: 'coming_soon',
  },
]

// ============ API Functions ============

export async function getExploreAssets(): Promise<ExploreAsset[]> {
  await sleep(400)
  return exploreAssets
}

export async function getExploreAssetById(id: string): Promise<ExploreAsset | undefined> {
  await sleep(300)
  return exploreAssets.find((asset) => asset.id === id)
}
