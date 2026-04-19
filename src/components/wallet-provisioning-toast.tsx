import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@/hooks/use-wallet'
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'

const TOAST_ID = 'wallet-provisioning'

export function WalletProvisioningToast() {
  const { connected, connecting } = useWallet()
  const isLoggedIn = useIsLoggedIn()
  const shownRef = useRef(false)

  useEffect(() => {
    const isProvisioning = isLoggedIn && !connected && connecting

    if (isProvisioning && !shownRef.current) {
      shownRef.current = true
      toast.loading('Setting up your wallet…', {
        id: TOAST_ID,
        description: 'This only takes a few seconds.',
        icon: <Loader2 className="size-4 animate-spin" />,
        duration: Infinity,
      })
      return
    }

    if (!isProvisioning && shownRef.current) {
      shownRef.current = false
      if (connected) {
        toast.success('Wallet ready', { id: TOAST_ID, duration: 2000 })
      } else {
        toast.dismiss(TOAST_ID)
      }
    }
  }, [isLoggedIn, connected, connecting])

  return null
}
