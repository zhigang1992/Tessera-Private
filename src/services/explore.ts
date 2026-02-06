import { sleep } from './utils'
import spacexBg from '@/assets/spacex-bg.png'
import kalshiBg from '@/assets/kalshi-bg.jpeg'

// ============ Types ============

export type AssetStatus = 'trading' | 'auction' | 'coming_soon'

export interface ExploreAsset {
  id: string
  name: string
  ticker: string
  category: string
  headerColor: string
  headerImage?: string
  price: number
  valuation: string
  status: AssetStatus
}

// ============ Mock Data ============

const exploreAssets: ExploreAsset[] = [
  {
    id: 'spacex',
    name: 'SpaceX',
    ticker: 'T-SpaceX',
    category: 'Aerospace',
    headerColor: '#555555',
    headerImage: spacexBg,
    price: 476.22,
    valuation: '$180B',
    status: 'auction',
  },
  {
    id: 'kalshi',
    name: 'Kalshi',
    ticker: 'KLSH',
    category: 'Prediction Markets',
    headerColor: '#1a3a2e',
    headerImage: kalshiBg,
    price: 12.8,
    valuation: '$800M',
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
