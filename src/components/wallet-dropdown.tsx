import type { ComponentProps } from 'react'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import type { Button } from '@/components/ui/button'

// Migrated to Dynamic. The trigger* props from the original wallet-adapter implementation
// are accepted for source compatibility but ignored — Dynamic owns its own trigger styling.
type WalletDropdownProps = {
  triggerClassName?: string
  triggerSize?: ComponentProps<typeof Button>['size']
  triggerVariant?: ComponentProps<typeof Button>['variant']
  hideTriggerLabelOnConnect?: boolean
  triggerAriaLabel?: string
  walletAvatarClassName?: string
  walletAvatarFallbackClassName?: string
}

function WalletDropdown(_props: WalletDropdownProps = {}) {
  return <DynamicWidget />
}

export { WalletDropdown }
