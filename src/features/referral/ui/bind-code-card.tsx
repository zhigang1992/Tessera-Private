import { useState } from 'react'
import { useTraderData, useBindReferralCode } from '../hooks/use-referral-onchain'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function BindCodeCard() {
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const bindMutation = useBindReferralCode()
  const { data: traderData, isLoading } = useTraderData(walletAddress, connected)

  const [referralCodeInput, setReferralCodeInput] = useState('')
  const activeReferralCode = traderData?.referral?.referrerCode
  const isAlreadyBound = Boolean(activeReferralCode)

  const handleBindCode = async () => {
    if (!referralCodeInput.trim()) return

    if (!connected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      await bindMutation.mutateAsync(referralCodeInput.toUpperCase())
      setReferralCodeInput('')
    } catch (error) {
      // Error already handled by mutation
      console.error('Bind code error:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and limit to reasonable length
    const value = e.target.value.toUpperCase().slice(0, 20)
    setReferralCodeInput(value)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-white">Referral code (Who invited you?)</h2>
        <Card className="rounded-[8px] border border-[#E4E4E7] bg-[#fff] shadow-none dark:border-[#27272A] dark:bg-[#111111]">
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="h-[42px] flex-1 animate-pulse rounded-[16px] bg-[#E9ECF2] dark:bg-[#27272A]" />
              <div className="h-10 w-[120px] animate-pulse rounded-lg bg-[#E9ECF2] dark:bg-[#27272A]" />
            </div>
            <div className="h-5 w-3/4 animate-pulse rounded bg-[#E9ECF2] dark:bg-[#27272A]" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-white">Referral code (Who invited you?)</h2>

        <Card className="rounded-[8px] border border-[#E4E4E7] bg-[#fff] shadow-none dark:border-[#27272A] dark:bg-[#111111]">
          <CardContent className="flex flex-col gap-5 p-5">
            {isAlreadyBound ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium uppercase text-[#6B7280] dark:text-[#A1A1AA]">Active referral code</p>
                <p className="text-2xl font-semibold text-[#111111] dark:text-white">{activeReferralCode}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                  <Input
                    value={referralCodeInput}
                    onChange={handleInputChange}
                    placeholder="Enter a code"
                    disabled={bindMutation.isPending}
                    className="h-[42px] rounded-lg border-0 bg-[#E9ECF2] px-4 text-base text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#111111]/20 focus-visible:ring-[#111111]/20 dark:bg-[#27272A] dark:text-white dark:placeholder:text-[#71717A]"
                  />
                  <Button
                    onClick={handleBindCode}
                    disabled={!connected || !referralCodeInput.trim() || bindMutation.isPending}
                    size="lg"
                    className="flex h-10 items-center gap-2 rounded-lg bg-black px-6 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {bindMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {bindMutation.isPending ? 'Binding...' : 'Bind Code'}
                  </Button>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                 The account linked to this referral code will earn rewards proportionate to your trading volume.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
