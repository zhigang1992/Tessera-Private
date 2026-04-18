import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'
import { DynamicProvider } from '@/components/dynamic/dynamic-provider'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { SlotProvider } from '@/contexts/slot-context'
import { HeaderProvider } from '@/contexts/header-context'
import { GeoBlockModal } from '@/components/geo-block-modal'
import { FirstTimeUserModal } from '@/components/first-time-user-modal'
import { PwaUpdatePrompt } from '@/components/pwa-update-prompt'
import { Toaster } from 'sonner'
import React from 'react'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <DynamicProvider>
          <SolanaProvider>
            <SlotProvider>
              <HeaderProvider>
                {children}
                <Toaster position="bottom-left" />
                <PwaUpdatePrompt />
                <GeoBlockModal />
                <FirstTimeUserModal />
              </HeaderProvider>
            </SlotProvider>
          </SolanaProvider>
        </DynamicProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
