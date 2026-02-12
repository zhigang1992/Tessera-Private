import { useWallet } from '@solana/wallet-adapter-react'
import { Clock, CheckCircle } from 'lucide-react'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenAmount } from '@/components/app-token-amount'
import { BigNumber, fromTokenAmount, mathIs } from '@/lib/bignumber'
import { useAuctionAlphaVault, useAuctionToken } from '../../context'

export function ClaimHeaderCard() {
  const wallet = useWallet()
  const token = useAuctionToken()
  const { escrowInfo, estimatedRefund, config } = useAuctionAlphaVault()

  // Check if user is eligible (has allocation)
  const isEligible =
    wallet.connected && escrowInfo && mathIs`${escrowInfo.estimatedAllocation} > ${0}`

  // Calculate amounts
  const totalTokens = escrowInfo
    ? escrowInfo.estimatedAllocation
    : BigNumber.from(0)

  const refundAmount = estimatedRefund ?? BigNumber.from(0)

  if (!isEligible) {
    return (
      <div className="rounded-2xl border p-6 bg-white dark:bg-[#323334] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-[#666] dark:text-[#999]">
            {wallet.connected
              ? 'No allocation found for your wallet'
              : 'Connect your wallet to view your allocation'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border p-6 bg-white dark:bg-[#323334] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
      {/* Header with Clock Icon */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 flex items-center justify-center">
          <Clock className="w-6 h-6 text-[#06a800] dark:text-[#AAD36D]" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-xl font-semibold leading-[30px] tracking-[-0.45px] text-black dark:text-[#d2d2d2]">
            Your Final Allocation
          </h3>
          <p className="text-xs font-normal leading-[18px] text-[#666] dark:text-[#999]">
            Calculated based on your auction contribution
          </p>
        </div>
      </div>

      {/* Two Columns - Total Tokens & Refund Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
        {/* Total Tokens */}
        <div>
          <p className="text-[10px] font-medium leading-[15px] tracking-[0.6172px] mb-2 text-[#666] dark:text-[#999]">
            TOTAL TOKENS
          </p>
          <p className="text-4xl font-bold leading-[48px] text-black dark:text-[#d2d2d2] font-mono">
            <AppTokenAmount token={token} amount={totalTokens} minimumFractionDigits={2} maximumFractionDigits={4} />
          </p>
          <p className="text-sm font-normal leading-[21px] text-[#06a800] dark:text-[#AAD36D]">
            <AppTokenName token={token} variant="symbol" />
          </p>
        </div>

        {/* Refund Amount */}
        <div>
          <p className="text-[10px] font-medium leading-[15px] tracking-[0.6172px] mb-2 text-[#666] dark:text-[#999]">
            REFUND AMOUNT
          </p>
          <p className="text-4xl font-bold leading-[48px] text-black dark:text-[#d2d2d2] font-mono">
            <AppTokenAmount
              token={config.quoteToken}
              amount={refundAmount}
              minimumFractionDigits={2}
              maximumFractionDigits={4}
            />
          </p>
          <p className="text-sm font-normal leading-[21px] text-[#666] dark:text-[#999]">
            <AppTokenName token={config.quoteToken} variant="symbol" />
          </p>
        </div>
      </div>

      {/* 100% Unlocked Status */}
      <div className="rounded-lg p-4 bg-[rgba(6,168,0,0.08)] dark:bg-[rgba(6,168,0,0.1)]">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[#06a800] flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <div>
            <p className="text-base font-semibold leading-6 mb-1 text-[#06a800]">
              100% Unlocked
            </p>
            <p className="text-xs font-normal leading-[18px] text-[#06a800] dark:text-[#AAD36D]">
              No vesting period. All tokens are immediately claimable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
