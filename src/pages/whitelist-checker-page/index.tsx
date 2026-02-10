import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkWhitelistStatus } from '@/lib/whitelist'
import TesseraLogo from '@/assets/Terrera Logo.svg?react'
import CheckCircleIcon from './components/check-circle.svg?react'
import CancelIcon from './components/cancel.svg?react'
import ElectricBoltIcon from './components/electric-bolt.svg?react'
import BackgroundImage from './assets/check_whitelist_bg.png'
import TSpaceXLogo from './assets/t-spacex-logo.png'
import HowToJoinWhitelist from './components/HowToJoinWhitelist'

type CheckStatus = 'idle' | 'checking' | 'whitelisted' | 'not_whitelisted' | 'error'

export default function WhitelistCheckerPage() {
  const { publicKey, connected } = useWallet()
  const [walletAddress, setWalletAddress] = useState('')
  const [status, setStatus] = useState<CheckStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Update input when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58())
    }
  }, [connected, publicKey])

  const handleCheckWhitelist = async () => {
    if (!walletAddress) return

    setIsLoading(true)
    setStatus('checking')
    setErrorMessage('')

    try {
      const isWhitelisted = await checkWhitelistStatus(walletAddress)

      if (isWhitelisted) {
        setStatus('whitelisted')
      } else {
        setStatus('not_whitelisted')
      }
    } catch (error) {
      console.error('Error checking whitelist:', error)
      setStatus('error')

      // Extract meaningful error message
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else if (typeof error === 'string') {
        setErrorMessage(error)
      } else {
        setErrorMessage('Failed to check whitelist. Please try again later.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Background with gradient */}
      <div
        className="fixed inset-0 bg-[#d2fb95]"
        style={{
          backgroundImage: `url(${BackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 lg:pl-[256px]">
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6">
          {/* Left Column - Main Card + How to Join (vertical stack) */}
          <div className="flex flex-col gap-2.5 w-full lg:w-[360px]">
            {/* Main Card */}
            <div className="bg-white dark:bg-[#1e1f20] border border-[rgba(17,17,17,0.15)] dark:border-[#393b3d] rounded-2xl px-8 py-10 w-full flex flex-col gap-6">
              {/* Logo */}
              <div className="flex flex-col gap-4 items-center">
                <TesseraLogo className="h-8 w-auto text-[#111111] dark:text-[#d2d2d2]" />

                {/* Divider */}
                <div className="h-px bg-[#e4e4e7] dark:bg-[#393b3d] w-full" />

                {/* Header */}
                <div className="text-center w-full">
                  <h1 className="text-lg font-semibold leading-9 tracking-[0.07px] text-center">
                    <span className="text-[#06a800]">Whitelist</span>
                    <span className="text-black dark:text-[#d2d2d2]"> Checker</span>
                  </h1>
                  <p className="text-xs text-black dark:text-[#d2d2d2] leading-[1.5] tracking-[0.12px] mt-0">
                    Enter your Solana address to check eligibility for Tessera.
                  </p>
                </div>

                {/* Wallet Address Input */}
                <Input
                  type="text"
                  placeholder="Enter your Solana address..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="h-14 px-4 text-base border-[#dddbd0] dark:border-[#393b3d] rounded-xl w-full tracking-[-0.625px] text-black dark:text-[#d2d2d2] placeholder:text-[#999] dark:placeholder:text-[#666] dark:bg-[#27272a]"
                />
              </div>

              {/* Check Button */}
              <Button
                onClick={handleCheckWhitelist}
                disabled={!walletAddress || isLoading}
                className={`w-full h-[45px] rounded-lg text-sm font-medium tracking-[-0.15px] flex items-center justify-center gap-1.5 ${
                  !walletAddress || isLoading
                    ? 'bg-[#b1b1b1] dark:bg-[#3f3f46] text-white/50 cursor-not-allowed hover:bg-[#b1b1b1] dark:hover:bg-[#3f3f46]'
                    : 'bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90'
                }`}
              >
                <ElectricBoltIcon className="w-4 h-4" />
                {isLoading ? 'Checking...' : 'Check Whitelist'}
              </Button>

              {/* Status Display */}
              {(status === 'not_whitelisted' || status === 'error') && (
                <div className="bg-[#eee] dark:bg-[#27272a] rounded-lg px-4 py-3 flex items-center gap-2.5">
                  <CancelIcon className="w-6 h-6 text-red-600 shrink-0" />
                  <p className="text-xs text-black dark:text-[#d2d2d2] leading-[1.2] flex-1">
                    {status === 'error'
                      ? (errorMessage || 'An error occurred. Please try again.')
                      : 'Sorry! Your address is not on the whitelist.'}
                  </p>
                </div>
              )}

              {status === 'whitelisted' && (
                <div className="bg-[#eee] dark:bg-[#27272a] rounded-lg px-4 py-3 flex items-center gap-2.5">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
                  <p className="text-xs text-black dark:text-[#d2d2d2] leading-[1.2] flex-1">
                    Congratulations! Your address is on the whitelist.
                  </p>
                </div>
              )}
            </div>

            {/* How to Join Whitelist */}
            <HowToJoinWhitelist />
          </div>

          {/* Right Column - T-SpaceX Logo with background */}
          <div className="hidden lg:flex items-stretch w-[360px]">
            <div className="bg-[rgba(0,0,0,0.3)] border border-[rgba(17,17,17,0.15)] rounded-2xl px-8 py-10 flex items-center justify-center w-full">
              <img
                src={TSpaceXLogo}
                alt="T-SpaceX"
                className="w-[175px] h-[480px] object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
