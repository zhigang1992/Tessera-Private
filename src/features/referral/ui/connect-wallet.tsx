import { useWallet } from '@solana/wallet-adapter-react'
import { WalletDropdown } from '@/components/wallet-dropdown'

export default function ConnectWallet() {
  const { connected, publicKey } = useWallet()

  return (
    <div>
      {connected && publicKey ? (
        <WalletDropdown
          triggerVariant="ghost"
          triggerClassName="h-11 gap-2 rounded-full border border-transparent bg-[#D2FB95] px-4 text-sm font-semibold text-black shadow-[0_8px_12px_rgba(15,23,42,0.05)] transition-colors hover:bg-[#C6F381] focus-visible:ring-[#D2FB95]/50 dark:bg-[#18181B] dark:text-white dark:hover:bg-[#26262C]"
          walletAvatarClassName="size-6 bg-transparent text-current"
          walletAvatarFallbackClassName="bg-transparent text-current"
          triggerAriaLabel="Wallet menu"
        />
      ) : (
        <WalletDropdown
          triggerVariant="default"
          triggerSize="lg"
          triggerClassName="h-11 rounded-full bg-black px-6 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
        />
      )}
    </div>
  )
}
