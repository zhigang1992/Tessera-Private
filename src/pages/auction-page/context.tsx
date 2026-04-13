import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { AppToken, AppTokenId, ResolvedPresaleVaultEntry } from '@/config'
import type { UseAlphaVaultReturn } from '@/hooks/use-alpha-vault'

interface AuctionContextValue {
  tokenId: AppTokenId
  token: AppToken
  alphaVault: UseAlphaVaultReturn
  presaleVaultConfigs: ResolvedPresaleVaultEntry[]
}

const AuctionContext = createContext<AuctionContextValue | null>(null)

export function AuctionProvider({ value, children }: { value: AuctionContextValue; children: ReactNode }) {
  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>
}

export function useAuctionContext(): AuctionContextValue {
  const ctx = useContext(AuctionContext)
  if (!ctx) {
    throw new Error('useAuctionContext must be used within <AuctionProvider>')
  }
  return ctx
}

export function useAuctionToken(): AppToken {
  return useAuctionContext().token
}

export function useAuctionAlphaVault(): UseAlphaVaultReturn {
  return useAuctionContext().alphaVault
}

export function useAuctionPresaleVaultConfigs(): ResolvedPresaleVaultEntry[] {
  return useAuctionContext().presaleVaultConfigs
}

export function useAuctionTokenId(): AppTokenId {
  return useAuctionContext().tokenId
}
