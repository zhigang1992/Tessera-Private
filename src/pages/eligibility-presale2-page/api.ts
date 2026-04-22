import type { AppTokenId } from '@/config'

export const PRESALE2_SNAPSHOT_DATE = '2026-04-27'

export type PresaleSnapshotVolume = {
  volumeUsd: number
  snapshotDate: string
  linkedWalletCount?: number
  mockedWalletCount?: number
}

export type SolanaMobileStatus = 'met' | 'unmet'

export async function fetchPresaleSnapshotVolume(
  wallet: string,
  _tokenId: AppTokenId,
): Promise<PresaleSnapshotVolume> {
  const res = await fetch(
    `/api/eligibility/snapshot-volume?wallet=${encodeURIComponent(wallet)}`,
  )
  if (!res.ok) {
    throw new Error(`snapshot-volume request failed: ${res.status}`)
  }
  const data = (await res.json()) as {
    volumeUsd: number
    linkedWalletCount?: number
    mockedWalletCount?: number
  }
  return {
    volumeUsd: data.volumeUsd,
    snapshotDate: PRESALE2_SNAPSHOT_DATE,
    linkedWalletCount: data.linkedWalletCount,
    mockedWalletCount: data.mockedWalletCount,
  }
}

export async function fetchSolanaMobileEligibility(wallet: string): Promise<SolanaMobileStatus> {
  const res = await fetch(
    `/api/eligibility/solana-mobile?wallet=${encodeURIComponent(wallet)}`,
  )
  if (!res.ok) {
    throw new Error(`solana-mobile request failed: ${res.status}`)
  }
  const data = (await res.json()) as { status: SolanaMobileStatus }
  return data.status
}
