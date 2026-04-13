import { useState, useEffect, useMemo } from 'react'
import { Connection } from '@solana/web3.js'
import type { AppTokenId, ResolvedPresaleVaultEntry } from '@/config'
import { getRpcEndpoint } from '@/config'
import { PresaleVaultClient } from '@/services/presale-vault'
import { fromTokenAmount, type BigNumberValue } from '@/lib/bignumber'
import { BigNumber } from 'math-literal'
import type { UseAlphaVaultReturn } from './use-alpha-vault'

export interface AuctionPhaseSummary {
  allocation: BigNumberValue
  startTime: Date | null
  endTime: Date | null
}

export type AuctionPhaseSummaryMap = Record<string, AuctionPhaseSummary | null>

/**
 * Fetches lightweight schedule/allocation data from on-chain for all auction phases.
 * - Presale vaults: fetches via PresaleVaultClient (presaleStartTime, presaleEndTime, maximumCap)
 * - Alpha vault: reads from the already-loaded alphaVault hook (depositOpenTime, depositCloseTime, maxCap)
 */
export function useAuctionPhaseSummaries(
  tokenId: AppTokenId,
  presaleConfigs: ResolvedPresaleVaultEntry[],
  alphaVault: UseAlphaVaultReturn
): AuctionPhaseSummaryMap {
  const [presaleSummaries, setPresaleSummaries] = useState<Record<string, AuctionPhaseSummary | null>>({})

  const connection = useMemo(() => {
    const rpcEndpoint = import.meta.env.VITE_SOLANA_RPC_URL || getRpcEndpoint()
    return new Connection(rpcEndpoint, 'confirmed')
  }, [])

  // Fetch presale vault summaries on mount and when configs change
  useEffect(() => {
    if (presaleConfigs.length === 0) return

    let cancelled = false

    async function fetchPresaleSummaries() {
      const results: Record<string, AuctionPhaseSummary | null> = {}

      await Promise.all(
        presaleConfigs.map(async (pc) => {
          try {
            const client = new PresaleVaultClient({
              tokenId,
              presaleConfig: pc,
              connection,
            })
            const info = await client.getVaultInfo()
            if (!cancelled) {
              results[pc.id] = {
                allocation: fromTokenAmount(info.maximumCap, pc.quoteDecimals),
                startTime: info.presaleStartTime,
                endTime: info.presaleEndTime,
              }
            }
          } catch {
            if (!cancelled) {
              results[pc.id] = null
            }
          }
        })
      )

      if (!cancelled) {
        setPresaleSummaries(results)
      }
    }

    fetchPresaleSummaries()
    return () => { cancelled = true }
  }, [tokenId, presaleConfigs, connection])

  // Build alpha vault summary from the already-loaded hook data
  const alphaVaultSummary = useMemo<AuctionPhaseSummary | null>(() => {
    const info = alphaVault.vaultInfo
    if (!info) return null
    return {
      allocation: fromTokenAmount(info.maxCap, alphaVault.config.quoteDecimals),
      startTime: info.depositOpenTime,
      endTime: info.depositCloseTime,
    }
  }, [alphaVault.vaultInfo, alphaVault.config.quoteDecimals])

  // Merge presale + alpha vault summaries
  return useMemo(() => {
    return {
      ...presaleSummaries,
      auction: alphaVaultSummary,
    }
  }, [presaleSummaries, alphaVaultSummary])
}
