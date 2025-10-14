import type { ComponentProps } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ellipsify, UiWallet, useWalletUi, useWalletUiWallet } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function WalletAvatar({
  className,
  fallbackClassName,
  wallet,
}: {
  className?: string
  fallbackClassName?: string
  wallet: UiWallet
}) {
  return (
    <Avatar className={cn('size-6 rounded-full', className)}>
      {wallet.icon ? <AvatarImage src={wallet.icon} alt={wallet.name} /> : null}
      <AvatarFallback className={cn('bg-muted text-xs font-medium uppercase', fallbackClassName)}>
        {wallet.name?.[0] ?? '?'}
      </AvatarFallback>
    </Avatar>
  )
}

function WalletDropdownItem({ wallet }: { wallet: UiWallet }) {
  const { connect } = useWalletUiWallet({ wallet })

  return (
    <DropdownMenuItem
      className="cursor-pointer"
      key={wallet.name}
      onClick={() => {
        return connect()
      }}
    >
      <WalletAvatar wallet={wallet} />
      {wallet.name}
    </DropdownMenuItem>
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
  const { account, connected, copy, disconnect, wallet, wallets } = useWalletUi()
  const label = connected
    ? account
      ? ellipsify(account.address)
      : wallet?.name ?? 'Wallet'
    : 'Select Wallet'
  const showLabel = !(connected && hideTriggerLabelOnConnect)
  const ariaLabel = !showLabel ? triggerAriaLabel ?? (connected ? 'Open wallet menu' : 'Connect wallet') : undefined

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
        {account ? (
          <>
            <DropdownMenuItem className="cursor-pointer" onClick={copy}>
              Copy address
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={disconnect}>
              Disconnect
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {wallets.length ? (
          wallets.map((wallet) => <WalletDropdownItem key={wallet.name} wallet={wallet} />)
        ) : (
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="https://solana.com/solana-wallets" target="_blank" rel="noopener noreferrer">
              Get a Solana wallet to connect.
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { WalletDropdown }
