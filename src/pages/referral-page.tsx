import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletDropdown } from '@/components/wallet-dropdown'
import SimpleReferralHeader from '@/features/referral/ui/simple-referral-header'
import HeroSection from '@/features/referral/ui/hero-section'
import BindCodeCard from '@/features/referral/ui/bind-code-card'
import CreateCodeCard from '@/features/referral/ui/create-code-card'
import ReferralCodeModal from '@/features/referral/ui/referral-code-modal'
import ConnectWallet from '@/features/referral/ui/connect-wallet'

export default function ReferralPage() {
  const { connected, publicKey } = useWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code) {
      setReferralCode(code)
      setIsModalOpen(true)
    }
  }, [])

  const clearCodeFromUrl = () => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('code')) return

    url.searchParams.delete('code')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setReferralCode(null)
    clearCodeFromUrl()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-white p-8 dark:bg-[#111111]">
        <SimpleReferralHeader />

        <div className="my-6 h-px rounded-full bg-[#000] dark:bg-[#27272A]" />

        <ConnectWallet />

        <HeroSection />

        <div className="my-6 h-px rounded-full bg-gray-300 dark:bg-[#27272A]" />

        {!connected || !publicKey ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
              Referral Program
            </h2>
            <p className="text-center text-sm text-black/50 dark:text-white/50 sm:text-base">
              Connect your wallet to access the referral program
            </p>
            <WalletDropdown />
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-10">
            <BindCodeCard />
            <CreateCodeCard />
          </div>
        )}
      </div>

      {referralCode && (
        <ReferralCodeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          referralCode={referralCode}
        />
      )}
    </div>
  )
}
