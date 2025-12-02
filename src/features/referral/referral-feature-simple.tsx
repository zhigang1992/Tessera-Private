import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
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
import rectangleBlur from '@/assets/parallax/rectangle-blur.png'
import rectangle from '@/assets/parallax/rectangle.png'
import { ThemeToggleButton } from '@/components/theme-toggle-button'

// Rectangle floating - dramatic float with rotation
const rectangleFloatVariants = {
  animate: {
    y: [0, -15, 0],
    rotate: [0, 3, 0, -2, 0],
    scale: [1, 1.04, 1],
    transition: {
      duration: 4,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

// Orbit-like motion for side rectangles
const orbitLeftVariants = {
  animate: {
    x: [0, 8, 0, -4, 0],
    y: [0, -10, 0, -5, 0],
    rotate: [0, -5, 0, 3, 0],
    transition: {
      duration: 5,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

const orbitRightVariants = {
  animate: {
    x: [0, -8, 0, 4, 0],
    y: [0, -8, 0, -12, 0],
    rotate: [0, 5, 0, -3, 0],
    transition: {
      duration: 6,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

// Pulsing scale for small elements
const pulseVariants = {
  animate: {
    scale: [1, 1.1, 1, 1.05, 1],
    rotate: [0, 2, 0, -2, 0],
    transition: {
      duration: 3.5,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

// Blur rectangle - slow dramatic float
const blurFloatVariants = {
  animate: {
    y: [0, -20, 0],
    x: [0, 5, 0, -5, 0],
    scale: [1, 1.08, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 6,
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

          {/* Top right rectangle - main cube image */}
          <motion.div
            className="absolute -right-16 top-[56px] z-1 hidden w-[140px] lg:block xl:-right-20 xl:w-[190px]"
            variants={rectangleFloatVariants}
            animate="animate"
          >
            <img src={rectangle} className="w-full" alt="Rectangle" />
          </motion.div>

          {/* Left small rectangle - reuse main image with transforms */}
          <motion.div
            className="absolute -left-10 top-[24%] z-1 hidden w-[56px] lg:block xl:-left-[56px] xl:w-[72px]"
            variants={pulseVariants}
            animate="animate"
          >
            <img src={rectangle} className="w-full scale-50 rotate-12" alt="Rectangle Small" />
          </motion.div>
        </div>

        <div className="relative hidden w-full overflow-hidden lg:flex lg:w-[40%] lg:flex-col lg:gap-6 lg:self-start">
          {[infoImg1, infoImg2, infoImg3, infoImg4].map((img, index) => (
            <img className="w-full" key={index} src={img} alt={`info-${index + 1}`} />
          ))}
        </div>
      </div>

      {referralCode && (
        <ReferralCodeModal isOpen={isModalOpen} onClose={handleCloseModal} referralCode={referralCode} />
      )}
  
      {/* Rectangle Blur - dramatic float at bottom center */}
      <motion.div
        className="absolute bottom-0 left-1/2 z-10 hidden w-[200px] -translate-x-1/2 md:block lg:w-[260px] xl:w-[312px]"
        variants={blurFloatVariants}
        animate="animate"
      >
        <img src={rectangleBlur} alt="Rectangle Blur" />
      </motion.div>

      {/* Rectangle Left - reuse main image with rotation/scale */}
      <motion.div
        className="absolute bottom-[36%] left-0 z-1 hidden w-[120px] md:block lg:w-[150px] xl:w-[186px]"
        variants={orbitLeftVariants}
        animate="animate"
      >
        <img src={rectangle} className="w-full rotate-[25deg] scale-75 opacity-90" alt="Rectangle Left" />
      </motion.div>

      {/* Rectangle Right - reuse main image with rotation/scale */}
      <motion.div
        className="absolute bottom-[56%] right-0 z-20 hidden w-[100px] md:block lg:w-[130px] xl:w-[164px]"
        variants={orbitRightVariants}
        animate="animate"
      >
        <img src={rectangle} className="w-full -rotate-[15deg] scale-[0.6] opacity-85" alt="Rectangle Right" />
      </motion.div>
    </div>
  )
}
