/**
 * Migration API Client
 *
 * Fetches off-chain referral data for migration to on-chain
 */

import type { MigrationData, ReferralCodeData, TraderBindingData } from '../types/migration'

const API_BASE = import.meta.env.VITE_API_BASE || ''

/**
 * Fetch all migration data from off-chain database
 */
export async function fetchMigrationData(): Promise<MigrationData> {
  // TEMPORARY: Return mock test data for testing batch operations
  // TODO: Restore real API call after testing
  console.log('🧪 Using mock migration data for testing')

  return {
    referralCodes: [
      {
        code: 'TEST2025',
        ownerWallet: 'Hzu1F1HF9ZEd7ezokS6ePUP5gP3p1UkdnoU7rKYS2xPu', // Your test wallet
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ],
    traderBindings: [
      {
        userWallet: '9Fvhvzk9kZQZqGjYJZ3jtT7ks2zXvQX8g3xV7nZkPjQM', // Random test wallet
        referralCode: 'TEST2025',
        referrerWallet: 'Hzu1F1HF9ZEd7ezokS6ePUP5gP3p1UkdnoU7rKYS2xPu',
        boundAt: new Date().toISOString(),
      },
    ],
    metadata: {
      exportedAt: new Date().toISOString(),
      totalCodes: 1,
      totalBindings: 1,
      dataSource: 'local',
    },
  }

  // Original implementation (commented out for testing):
  /*
  const response = await fetch(`${API_BASE}/api/admin/migration/data`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch migration data: ${response.statusText}`)
  }

  const data = await response.json()
  return data
  */
}

/**
 * Fetch referral codes only
 */
export async function fetchReferralCodes(): Promise<ReferralCodeData[]> {
  const response = await fetch(`${API_BASE}/api/admin/migration/codes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch referral codes: ${response.statusText}`)
  }

  const data = await response.json()
  return data.codes || []
}

/**
 * Fetch trader bindings only
 */
export async function fetchTraderBindings(): Promise<TraderBindingData[]> {
  const response = await fetch(`${API_BASE}/api/admin/migration/bindings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch trader bindings: ${response.statusText}`)
  }

  const data = await response.json()
  return data.bindings || []
}

/**
 * Export migration data as JSON file
 */
export function exportMigrationDataAsJson(data: MigrationData, filename = 'migration-data.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Import migration data from JSON file
 */
export function importMigrationDataFromJson(file: File): Promise<MigrationData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}
