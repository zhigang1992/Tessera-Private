import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { SlotProvider } from '@/contexts/slot-context'
import { HeaderProvider } from '@/contexts/header-context'
import { GeoBlockModal } from '@/components/geo-block-modal'
import { Toaster } from 'sonner'
import React from 'react'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SolanaProvider>
          <SlotProvider>
            <HeaderProvider>
              {children}
              <Toaster position="bottom-left" />
              <GeoBlockModal />
            </HeaderProvider>
          </SlotProvider>
        </SolanaProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
