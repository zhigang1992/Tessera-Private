import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { Trophy, Loader2 } from 'lucide-react'
import { getRewardsOverview, formatCurrency } from '@/services'
import { useTraderData, useBindReferralCode } from '@/features/referral/hooks/use-referral-onchain'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { PRODUCTION_MODE } from '@/config'
import AwardIcon from './_/award.svg?react'

export function RewardsOverview() {
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()

  const { data, isLoading } = useQuery({
    queryKey: ['rewardsOverview', walletAddress],
    queryFn: () => getRewardsOverview(walletAddress!),
    enabled: connected && !!walletAddress,
  })

  // Fetch on-chain trader data for active referral code (only in production mode)
  const { data: traderData, isLoading: isTraderDataLoading } = useTraderData(
    walletAddress,
    connected && PRODUCTION_MODE
  )
  const activeReferralCode = traderData?.referral?.referrerCode ?? null

  // Modal state for binding referral code
  const [isBindModalOpen, setIsBindModalOpen] = useState(false)
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const bindMutation = useBindReferralCode()

  // Show dash when wallet not connected or loading
  const showDash = !connected || isLoading
  const showCodeDash = !connected || isTraderDataLoading

  const handleReferralCodeClick = () => {
    if (!connected) {
      toast.error('Please connect your wallet first')
      return
    }
    // Only open modal if user doesn't have an active code
    if (!activeReferralCode) {
      setIsBindModalOpen(true)
    }
  }

  const handleBindCode = async () => {
    if (!referralCodeInput.trim()) return

    if (!connected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      await bindMutation.mutateAsync(referralCodeInput.toUpperCase())
      setReferralCodeInput('')
      setIsBindModalOpen(false)
    } catch (error) {
      console.error('Bind code error:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 20)
    setReferralCodeInput(value)
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-[10px]">
        {/* Rewards Card */}
        <div className="flex-1 flex items-center justify-between bg-[#d2fb95] dark:bg-[#d2fb95] rounded-[16px] p-6 overflow-hidden border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
          <div className="flex flex-col gap-[5px]">
            <p className="text-[12px] text-zinc-900 dark:text-zinc-900">Rewards</p>
            <p className="text-[40px] font-light text-zinc-900 dark:text-zinc-900 font-martian leading-none">
              {showDash ? '—' : formatCurrency(data?.rewards ?? 0)}
            </p>
          </div>
          <Trophy className="size-14 text-zinc-700 shrink-0" strokeWidth={1.5} />
        </div>

        {/* Referral Points Card */}
        <div className="flex-1 flex items-center justify-between bg-white dark:bg-[#323334] rounded-[16px] px-4 py-6 border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
          <div className="flex flex-col gap-[5px]">
            <p className="text-[12px] text-zinc-900 dark:text-[#d2d2d2]">Referral Points</p>
            <p className="text-[40px] font-light text-zinc-900 dark:text-[#d2d2d2] font-martian leading-none">
              {showDash ? '—' : (data?.referralPoints?.toLocaleString() ?? '0')}
            </p>
          </div>
          <AwardIcon className="size-14 text-zinc-700 dark:text-[#d2d2d2] shrink-0" />
        </div>

        {/* Active Referral Code Card (only in production mode) */}
        {PRODUCTION_MODE && (
          <div className="flex-1 flex items-center justify-between bg-white dark:bg-[#323334] rounded-[16px] px-4 py-6 border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
            <div className="flex flex-col gap-[5px] w-full">
              <p className="text-[12px] text-zinc-900 dark:text-[#d2d2d2]">Active referral code</p>
              <div className="flex items-center w-full">
                {showCodeDash ? (
                  <div className="bg-[#d2fb95] w-full rounded-[4px] px-6 h-10 flex items-center justify-center">
                    <span className="text-[16px] font-semibold text-zinc-900 font-martian">—</span>
                  </div>
                ) : activeReferralCode ? (
                  <div className="bg-[#d2fb95] w-full rounded-[4px] px-6 h-10 flex items-center justify-center">
                    <span className="text-[16px] font-semibold text-zinc-900 font-martian">
                      {activeReferralCode}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleReferralCodeClick}
                    className="bg-zinc-900 dark:bg-[#d2fb95] hover:bg-zinc-800 dark:hover:bg-[#d2fb95]/80 w-full rounded-[4px] px-6 h-10 flex items-center justify-center transition-colors"
                  >
                    <span className="text-[14px] font-semibold text-white dark:text-black">
                      Bind Referral Code
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bind Referral Code Modal */}
      {PRODUCTION_MODE && (
        <Dialog open={isBindModalOpen} onOpenChange={setIsBindModalOpen}>
          <DialogContent className="w-[342px] max-w-[342px] rounded-2xl bg-[#F4F4F5] dark:bg-[#323334] p-0">
            <div className="flex flex-col gap-4 p-6">
              <DialogHeader className="p-0">
                <DialogTitle className="text-base font-normal text-black dark:text-[#d2d2d2]">
                  Bind Referral Code
                </DialogTitle>
              </DialogHeader>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the referral code of the person who invited you. They will earn rewards based on your trading
                volume.
              </p>

              <div className="flex flex-col gap-3">
                <Input
                  value={referralCodeInput}
                  onChange={handleInputChange}
                  placeholder="Enter referral code"
                  disabled={bindMutation.isPending}
                  className="h-[42px] rounded-lg border border-[#D4D4D8] dark:border-[#393b3d] bg-white dark:bg-[#27272A] px-4 text-base text-[#111111] dark:text-[#d2d2d2] placeholder:text-[#9CA3AF] dark:placeholder:text-gray-500 focus-visible:ring-[#111111]/20 dark:focus-visible:ring-white/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && referralCodeInput.trim()) {
                      handleBindCode()
                    }
                  }}
                />
                <Button
                  onClick={handleBindCode}
                  disabled={!connected || !referralCodeInput.trim() || bindMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black dark:bg-[#d2fb95] py-3 text-sm font-medium text-white dark:text-black hover:bg-black/90 dark:hover:bg-[#d2fb95]/80 disabled:opacity-50"
                >
                  {bindMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {bindMutation.isPending ? 'Binding...' : 'Bind Code'}
                </Button>
              </div>

              <button
                onClick={() => setIsBindModalOpen(false)}
                className="mx-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}


