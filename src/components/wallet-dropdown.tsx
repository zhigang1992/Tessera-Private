import type { ComponentProps } from 'react'
import { useCallback, useMemo } from 'react'
import { useWallet, type WalletContextState } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

function ellipsify(str = '', len = 4, delimiter = '..') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length
  return strLen >= limit ? `${str.substring(0, len)}${delimiter}${str.substring(strLen - len, strLen)}` : str
}

function WalletAvatar({
  className,
  fallbackClassName,
  wallet,
}: {
  className?: string
  fallbackClassName?: string
  wallet: NonNullable<WalletContextState['wallet']>
}) {
  const icon = wallet?.adapter?.icon
  const iconSrc = Array.isArray(icon) ? icon[0] : icon

  return (
    <Avatar className={cn('size-6 rounded-full', className)}>
      {iconSrc ? <AvatarImage src={iconSrc} alt={wallet.adapter.name} /> : null}
      <AvatarFallback className={cn('bg-muted text-xs font-medium uppercase', fallbackClassName)}>
        {wallet.adapter.name?.[0] ?? '?'}
      </AvatarFallback>
    </Avatar>
  )
}

type WalletDropdownProps = {
  triggerClassName?: string
  triggerSize?: ComponentProps<typeof Button>['size']
  triggerVariant?: ComponentProps<typeof Button>['variant']
  hideTriggerLabelOnConnect?: boolean
  triggerAriaLabel?: string
  walletAvatarClassName?: string
  walletAvatarFallbackClassName?: string
}

function WalletDropdown({
  triggerClassName,
  triggerSize = 'default',
  triggerVariant = 'outline',
  hideTriggerLabelOnConnect = false,
  triggerAriaLabel,
  walletAvatarClassName,
  walletAvatarFallbackClassName,
}: WalletDropdownProps = {}) {
  const { connected, disconnect, publicKey, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const address = useMemo(() => publicKey?.toBase58() ?? '', [publicKey])
  const label = connected ? (address ? ellipsify(address) : (wallet?.adapter.name ?? 'Wallet')) : 'Select Wallet'
  const showLabel = !(connected && hideTriggerLabelOnConnect)
  const ariaLabel = !showLabel ? (triggerAriaLabel ?? (connected ? 'Open wallet menu' : 'Connect wallet')) : undefined

  const handleCopy = useCallback(async () => {
    if (!address) {
      return
    }
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API unavailable')
      }
      await navigator.clipboard.writeText(address)
      toast.success('Address copied')
    } catch (error) {
      console.error('Failed to copy address', error)
      toast.error('Failed to copy address')
    }
  }, [address])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Failed to disconnect wallet', error)
      toast.error('Failed to disconnect wallet')
    }
  }, [disconnect])

  const handleOpenModal = useCallback(() => {
    setVisible(true)
  }, [setVisible])

  if (!connected) {
    return (
      <Button
        aria-label={ariaLabel}
        variant={triggerVariant}
        size={triggerSize}
        className={cn('cursor-pointer', triggerClassName)}
        onClick={handleOpenModal}
      >
        <span className={cn(showLabel ? '' : 'sr-only')}>{label}</span>
      </Button>
    )
  }

  if (!wallet) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={ariaLabel}
          variant={triggerVariant}
          size={triggerSize}
          className={cn('cursor-pointer', triggerClassName)}
        >
          {wallet ? (
            <WalletAvatar
              wallet={wallet}
              className={walletAvatarClassName}
              fallbackClassName={walletAvatarFallbackClassName}
            />
          ) : null}
          <span className={cn(showLabel ? '' : 'sr-only')}>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {address ? (
          <DropdownMenuItem className="cursor-pointer" onClick={handleCopy}>
            Copy address
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className="cursor-pointer" onClick={handleOpenModal}>
          Change wallet
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleDisconnect}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { WalletDropdown }
