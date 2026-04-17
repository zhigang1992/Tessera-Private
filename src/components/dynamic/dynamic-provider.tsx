import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
import { useTheme } from 'next-themes'
import React from 'react'

const ENVIRONMENT_ID = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || ''

export function DynamicProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { resolvedTheme } = useTheme()

  if (!ENVIRONMENT_ID) {
    console.warn('VITE_DYNAMIC_ENVIRONMENT_ID is not set. Dynamic wallet integration will not work.')
  }

  return (
    <DynamicContextProvider
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      settings={{
        environmentId: ENVIRONMENT_ID,
        walletConnectors: [SolanaWalletConnectors],
      }}
    >
      {children}
    </DynamicContextProvider>
  )
}
