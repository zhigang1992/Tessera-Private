import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
import { useTheme } from 'next-themes'
import React from 'react'

const FALLBACK_ENVIRONMENT_ID = '28958007-e672-4e24-bd56-abadc9d639e9'
const ENVIRONMENT_ID = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || FALLBACK_ENVIRONMENT_ID

export function DynamicProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { resolvedTheme } = useTheme()

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
