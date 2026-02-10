import { Button } from '@/components/ui/button'
import ArrowForwardIcon from './arrow-forward.svg?react'

export default function HowToJoinWhitelist() {
  const handleGoToReferral = () => {
    // Navigate to referral page
    window.location.href = '/referral'
  }

  return (
    <div className="bg-white dark:bg-[#1e1f20] border border-[rgba(17,17,17,0.15)] dark:border-[#393b3d] rounded-2xl px-8 py-10 w-full max-w-[360px] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 items-center w-full">
        <h2 className="text-lg font-semibold leading-9 tracking-[0.07px] text-center text-black dark:text-[#d2d2d2] w-full">
          How to Join the Whitelist?
        </h2>

        {/* Methods */}
        <div className="flex flex-col gap-2 items-start w-full">
          {/* Method 1 */}
          <div className="flex gap-2.5 items-center justify-center w-full">
            <div className="bg-black dark:bg-white flex items-center justify-center px-2 py-1 rounded-full shrink-0 w-[80px]">
              <p className="text-xs font-normal leading-[1.5] tracking-[0.12px] text-white dark:text-black">
                Method 1
              </p>
            </div>
            <p className="flex-1 text-xs font-normal leading-[1.5] tracking-[0.12px] text-black dark:text-[#d2d2d2]">
              Bind someone else's Referral Code to your wallet.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#ddd] dark:bg-[#393b3d] w-full" />

          {/* Method 2 */}
          <div className="flex gap-2.5 items-center justify-center w-full">
            <div className="bg-black dark:bg-white flex items-center justify-center px-2 py-1 rounded-full shrink-0 w-[80px]">
              <p className="text-xs font-normal leading-[1.5] tracking-[0.12px] text-white dark:text-black">
                Method 2
              </p>
            </div>
            <p className="flex-1 text-xs font-normal leading-[1.5] tracking-[0.12px] text-black dark:text-[#d2d2d2]">
              Create your own Referral Code with your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Button */}
      <Button
        onClick={handleGoToReferral}
        className="w-full h-[45px] bg-[#d2fb95] hover:bg-[#c5ed88] dark:bg-[#d2fb95] dark:hover:bg-[#c5ed88] text-black rounded-lg text-sm font-medium tracking-[-0.15px] flex items-center justify-center gap-1.5"
      >
        Go to Referral Page
        <ArrowForwardIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}
