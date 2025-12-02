import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { WalletDropdown } from '@/components/wallet-dropdown'
import SimpleReferralHeader from './ui/simple-referral-header'
import HeroSection from './ui/hero-section'
import BindCodeCard from './ui/bind-code-card'
import CreateCodeCard from './ui/create-code-card'
import ReferralCodeModal from './ui/referral-code-modal'
import infoImg1 from '@/assets/info/info1.png'
import infoImg2 from '@/assets/info/info2.png'
import infoImg3 from '@/assets/info/info3.png'
import infoImg4 from '@/assets/info/info4.png'
import ConnectWallet from './ui/connect-wallet'
import rectangleTop from '@/assets/parallax/rectangle-top.png'
import rectangleottom from '@/assets/parallax/rectangle-bottom.png'

import brain from '@/assets/info/brain.png'
import coin from '@/assets/info/coin.png'
import rocket from '@/assets/info/rocket.png'

import { ThemeToggleButton } from '@/components/theme-toggle-button'

// Rectangle top - gentle float up and down with subtle rotation
const rectangleTopVariants = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 2, 0, -1, 0],
    scale: [1, 1.03, 1],
    transition: {
      duration: 4.5,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

// Rectangle bottom - slower, opposite direction movement
const rectangleBottomVariants = {
  animate: {
    y: [0, 8, 0, -4, 0],
    x: [0, -3, 0, 3, 0],
    rotate: [0, -3, 0, 2, 0],
    transition: {
      duration: 5.5,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

// Coin - spinning and floating effect
const coinVariants = {
  animate: {
    y: [0, -18, 0],
    rotateY: [0, 180, 360],
    scale: [1, 1.05, 1],
    transition: {
      duration: 6,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

// Rocket - diagonal upward motion with rotation
const rocketVariants = {
  animate: {
    y: [0, -25, -10, -20, 0],
    x: [0, 8, 4, 12, 0],
    rotate: [6, 10, 4, 8, 6],
    scale: [1, 1.08, 1.04, 1.06, 1],
    transition: {
      duration: 5,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

// Brain - pulsing glow effect with subtle movement
const brainVariants = {
  animate: {
    y: [0, -10, 0, -5, 0],
    rotate: [8, 12, 6, 10, 8],
    scale: [1, 1.06, 1, 1.03, 1],
    transition: {
      duration: 4,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

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
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-black sm:pb-24">
      <div className="mx-auto flex w-full max-w-[1366px] flex-col px-0 pt-0 sm:px-6 sm:pt-6 md:px-10 lg:flex-row lg:items-start lg:justify-center lg:gap-6 lg:px-16 lg:pt-10">
        <div className="relative flex w-full flex-col gap-4 bg-[#fefefe] dark:bg-[#111111] bg-contain bg-repeat py-6 px-4 sm:rounded-2xl sm:px-0 lg:w-[60%] lg:gap-4 lg:p-12">
          <SimpleReferralHeader />

          <div className="h-px rounded-full bg-[#000] dark:bg-[#27272A]" />

          <ConnectWallet />

          <HeroSection />

          <div className="h-px my-4 rounded-full bg-gray-300 dark:bg-[#27272A]" />

          {!connected || !publicKey ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 sm:min-h-[400px]">
              <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">Referral Program</h2>
              <p className="text-center text-sm text-black/50 dark:text-white/50 sm:text-base">
                Connect your wallet to access the referral program
              </p>
              <WalletDropdown />
            </div>
          ) : (
            <div className="flex flex-col gap-6 sm:gap-10">
              {/* Bind referral code section */}
              <BindCodeCard />

              {/* Create referral code section */}
              <CreateCodeCard />
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-start gap-3 text-center text-xs text-black/50 dark:text-white/50">
            <span>© 2025 Tessera PE. All rights reserved.</span>
            <ThemeToggleButton />
          </div>

          {/* Top rectangle - gentle floating */}
          <motion.div
            className="absolute left-1/2 -top-[24px] z-1 hidden w-[100px] md:block lg:-top-[32px] lg:w-[120px] xl:w-[146px]"
            variants={rectangleTopVariants}
            animate="animate"
          >
            <img src={rectangleTop} className="w-full" alt="Rectangle Top" />
          </motion.div>

          {/* Bottom rectangle - slower opposite motion */}
          <motion.div
            className="absolute right-0 bottom-0 z-1 hidden w-[100px] md:block lg:w-[130px] xl:w-[164px]"
            variants={rectangleBottomVariants}
            animate="animate"
          >
            <img src={rectangleottom} className="w-full" alt="Rectangle Bottom" />
          </motion.div>

          {/* Left coin - spinning effect */}
          <motion.div
            className="absolute -left-8 top-1/2 -translate-y-[36%] z-1 hidden w-[100px] md:block lg:-left-12 lg:w-[120px] xl:-left-24 xl:w-[153px]"
            variants={coinVariants}
            animate="animate"
            style={{ perspective: 1000 }}
          >
            <img src={coin} className="w-full" alt="Coin" />
          </motion.div>

          {/* Right rocket - diagonal upward motion */}
          <motion.div
            className="absolute -right-16 -top-4 z-1 -rotate-[6deg] hidden w-[100px] md:block lg:-right-20 lg:w-[130px] xl:-right-24 xl:w-[166px]"
            variants={rocketVariants}
            animate="animate"
          >
            <img src={rocket} className="w-full" alt="Rocket" />
          </motion.div>
        </div>

        <div className="relative hidden w-full  lg:flex lg:w-[40%] lg:flex-col lg:gap-6 lg:self-start">
          {[infoImg1, infoImg2, infoImg3, infoImg4].map((img, index) => (
            <img className="w-full" key={index} src={img} alt={`info-${index + 1}`} />
          ))}

          {/* Brain - pulsing glow effect */}
          <motion.div
            className="absolute -right-8 top-1/2 -translate-y-[50%] z-1 hidden w-[120px] md:block lg:-right-12 lg:w-[160px] xl:-right-24 xl:w-[215px]"
            variants={brainVariants}
            animate="animate"
          >
            <img src={brain} className="w-full" alt="Brain" />
          </motion.div>
        </div>
      </div>

      {referralCode && (
        <ReferralCodeModal isOpen={isModalOpen} onClose={handleCloseModal} referralCode={referralCode} />
      )}
    </div>
  )
}
