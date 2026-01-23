import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { HeaderProvider } from '@/contexts/header-context'
import { Toaster } from 'sonner'
import React from 'react'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SolanaProvider>
          <HeaderProvider>
            {children}
            <Toaster position="bottom-left" />
          </HeaderProvider>
        </SolanaProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
