import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletDropdown } from '@/components/wallet-dropdown'
import SimpleReferralHeader from './ui/simple-referral-header'
import HeroSection from './ui/hero-section'
import BindCodeCard from './ui/bind-code-card'
import CreateCodeCard from './ui/create-code-card'
import ReferralCodeModal from './ui/referral-code-modal'
import infoImg1 from '@/assets/info1.png'
import infoImg2 from '@/assets/info2.png'
import infoImg3 from '@/assets/info3.png'
import infoImg4 from '@/assets/info4.png'
import ConnectWallet from './ui/connect-wallet'
import PepeLeft from '@/assets/parallax/pepe-left.png'
import PepeRight from '@/assets/parallax/pepe-right.png'
import rectangleBlur from '@/assets/parallax/rectangle-blur.png'

export default function ReferralFeatureSimple() {
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
    <div className="relative min-h-screen bg-white pb-24 dark:bg-black">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-12 px-6 pt-6 sm:px-10 lg:flex-row lg:justify-center lg:items-start lg:gap-6 lg:px-16 lg:pt-10">
        <div className="flex w-full lg:w-[66%] flex-col gap-6 lg:gap-6 lg:p-6 bg-[url('/src/assets/content-bg.png')] bg-contain bg-repeat rounded-2xl">
          <SimpleReferralHeader />

          <div className="h-px rounded-full bg-[#000] dark:bg-[#27272A]" />

          <ConnectWallet />

          <HeroSection />

          <div className="h-px rounded-full bg-[#E7E7EA] dark:bg-[#27272A]" />

          {!connected || !publicKey ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <h2 className="text-2xl font-bold text-black dark:text-white">Referral Program</h2>
              <p className="text-black/50 dark:text-white/50">Connect your wallet to access the referral program</p>
              <WalletDropdown />
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Bind referral code section */}
              <BindCodeCard />

              {/* Create referral code section */}
              <CreateCodeCard />
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex items-center justify-start gap-3 text-center text-xs text-black/50 dark:text-white/50">
            <span>© 2025 Tessera PE. All rights reserved.</span>
          </div>
        </div>

        <div className="relative w-full lg:w-[34%] overflow-hidden hidden lg:flex lg:h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)] lg:self-start lg:flex-col lg:gap-4">
          {[infoImg1, infoImg2, infoImg3, infoImg4].map((img, index) => (
            <img className="w-full" key={index} src={img} alt={`info-${index + 1}`} />
          ))}
        </div>
      </div>

      {referralCode && (
        <ReferralCodeModal isOpen={isModalOpen} onClose={handleCloseModal} referralCode={referralCode} />
      )}

      <div className="fixed bottom-0 left-0 z-10 hidden w-[288px] md:block">
        <img src={PepeLeft} alt="Pepe Left" className="h-full w-full object-contain" />
      </div>
      <div className="fixed bottom-0 right-0 z-10 hidden w-[288px] md:block">
        <img src={PepeRight} alt="Pepe Right" className="h-full w-full object-contain" />
      </div>
      <div className="absolute w-[312px] left-1/2 bottom-0 z-20">
        <img src={rectangleBlur} alt="Rectangle Blur" />
      </div>
    </div>
  )
}
