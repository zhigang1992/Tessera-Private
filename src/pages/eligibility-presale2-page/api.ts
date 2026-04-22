import type { AppTokenId } from '@/config'

// Mock services for Pre-Sale 2 eligibility. Replace with real APIs once
// snapshot volume + Solana mobile device checks are wired up on the backend.

export const PRESALE2_SNAPSHOT_DATE = '2026-04-27'

export type PresaleSnapshotVolume = {
  volumeUsd: number
  snapshotDate: string
}

export type SolanaMobileStatus = 'met' | 'unmet'

export async function fetchPresaleSnapshotVolume(
  _wallet: string,
  _tokenId: AppTokenId,
): Promise<PresaleSnapshotVolume> {
  return { volumeUsd: 0, snapshotDate: PRESALE2_SNAPSHOT_DATE }
}

export async function fetchSolanaMobileEligibility(_wallet: string): Promise<SolanaMobileStatus> {
  return 'unmet'
}
