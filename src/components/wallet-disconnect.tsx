import * as React from 'react'
import { useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function WalletDisconnect(props: React.ComponentProps<typeof Button>) {
  const { connected, disconnect, disconnecting } = useWallet()

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Failed to disconnect wallet', error)
      toast.error('Failed to disconnect wallet')
    }
  }, [disconnect])

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      {...props}
      onClick={handleDisconnect}
      disabled={!connected || disconnecting}
    >
      Disconnect
    </Button>
  )
}

export { WalletDisconnect }
