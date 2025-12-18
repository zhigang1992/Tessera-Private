import { useCallback } from 'react'
import { Menu } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import TesseraLogo from './_/terrera-logo.svg?react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import personIcon from '@/assets/person.png'

function ellipsify(str = '', len = 4, delimiter = '...') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length
  return strLen >= limit ? `${str.substring(0, len)}${delimiter}${str.substring(strLen - len, strLen)}` : str
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { connected, publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const address = publicKey?.toBase58() ?? ''

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet', error)
    }
  }, [disconnect])

  const handleOpenModal = useCallback(() => {
    setVisible(true)
  }, [setVisible])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4 dark:bg-[#111111] lg:justify-end lg:px-6">
      {/* Mobile: hamburger menu and logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/">
          <TesseraLogo className="h-6 text-[#111111] dark:text-white" />
        </Link>
      </div>

      {/* Wallet connection */}
      {connected && publicKey ? (
        <div className="inline-flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#D2FB95]">
            <img src={personIcon} alt="User" className="size-5" />
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium">{ellipsify(address, 4)}</span>
            <button
              onClick={handleDisconnect}
              className="cursor-pointer text-left text-xs text-muted-foreground hover:text-foreground"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleOpenModal}
          className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          Select Wallet
        </Button>
      )}
    </header>
  )
}
