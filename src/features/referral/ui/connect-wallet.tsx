import { useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletDropdown } from '@/components/wallet-dropdown'
import personIcon from '@/assets/person.png'

function ellipsify(str = '', len = 4, delimiter = '...') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length
  return strLen >= limit ? `${str.substring(0, len)}${delimiter}${str.substring(strLen - len, strLen)}` : str
}

export default function ConnectWallet() {
  const { connected, publicKey, disconnect } = useWallet()
  const address = publicKey?.toBase58() ?? ''

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet', error)
    }
  }, [disconnect])

  if (connected && publicKey) {
    return (
      <div className="inline-flex items-center gap-3 py-2">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#D2FB95]">
          <img src={personIcon} alt="User" className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-black">{ellipsify(address, 8)}</span>
          <button
            onClick={handleDisconnect}
            className="cursor-pointer text-left text-sm text-gray-500 hover:text-gray-700"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <WalletDropdown
        triggerVariant="default"
        triggerSize="lg"
        triggerClassName="h-11 rounded-full bg-black px-6 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
      />
    </div>
  )
}
