import { useState, useMemo, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Info, Loader2, AlertCircle } from 'lucide-react'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenAmount } from '@/components/app-token-amount'
import { CountdownNotification } from '@/components/countdown-notification'
import { getExplorerUrl } from '@/config'
import { toast } from 'sonner'
import { BigNumber, math, fromTokenAmount, mathIs } from '@/lib/bignumber'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useAuctionAlphaVault, useAuctionToken } from '../../context'
import { useCountdown } from '@/hooks/use-countdown'
import type { CountdownConfig } from '@/types/countdown'

export function DepositUSDCCard() {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const [depositAmount, setDepositAmount] = useState('')
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const isTouchRef = useRef(false)

  const {
    config,
    isLoading,
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    depositQuota,
    usdcBalance,
    poolPrice,
    totalRaised,
    targetRaise,
    estimatedAllocation,
    deposit,
    error,
    clearError,
  } = useAuctionAlphaVault()
  const token = useAuctionToken()

  // Countdown to when deposits START (depositOpenSlot)
  const depositStartCountdownConfig: CountdownConfig = useMemo(() => {
    if (!vaultInfo) {
      return { type: 'disabled' }
    }

    // Check activation type to determine how to handle time values
    if (vaultInfo.activationType === 'timestamp') {
      // depositOpenSlot is actually a Unix timestamp in seconds - convert to milliseconds
      return {
        type: 'timestamp',
        targetTimestamp: vaultInfo.depositOpenSlot * 1000,
      }
    }

    // Slot-based countdown
    return { type: 'slot', targetSlot: vaultInfo.depositOpenSlot }
  }, [vaultInfo])

  const { timeRemaining: timeUntilDepositStart } = useCountdown(depositStartCountdownConfig)
  const isDepositActive = timeUntilDepositStart.isExpired

  const isDepositOpen = vaultInfo?.state === 'deposit_open'
  const canDeposit = isDepositActive && depositQuota?.canDeposit && isDepositOpen && wallet.connected

  // Check if vault has whitelist enabled (merkle root config indicates whitelist)
  // This is more efficient than fetching the entire whitelist
  const isWhitelistEnabled = true

  // Calculate existing deposit (amount already deposited)
  const existingDepositAmount = useMemo(() => {
    // escrowInfo.totalDeposited is already a BigNumberValue (already converted)
    return escrowInfo?.totalDeposited ?? BigNumber.from(0)
  }, [escrowInfo?.totalDeposited])

  // Calculate after this deposit (existing + new input amount)
  const afterThisDepositAmount = useMemo(() => {
    // escrowInfo.totalDeposited is already a BigNumberValue (human-scale)
    const existingDeposit = escrowInfo?.totalDeposited ?? BigNumber.from(0)

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return existingDeposit
    }

    try {
      const newAmount = BigNumber.from(depositAmount)
      return math`${existingDeposit} + ${newAmount}`
    } catch {
      return existingDeposit
    }
  }, [escrowInfo?.totalDeposited, depositAmount])

  // Calculate estimated allocation based on current deposit + input
  const calculatedEstAllocation = useMemo(() => {
    // estimatedAllocation is already a BigNumberValue
    const fallback = estimatedAllocation

    if (!vaultInfo || !totalRaised || !targetRaise || !poolPrice || poolPrice === 0) {
      return fallback
    }

    try {
      // All values are already in human scale (BigNumberValue)
      const existingDeposit = escrowInfo?.totalDeposited ?? BigNumber.from(0)

      let totalUserDeposit = existingDeposit
      let newDepositAmount = BigNumber.from(0)

      if (depositAmount && parseFloat(depositAmount) > 0) {
        newDepositAmount = BigNumber.from(depositAmount)
        totalUserDeposit = math`${existingDeposit} + ${newDepositAmount}`
      }

      // totalRaised is already a BigNumberValue (human-scale)
      const hypotheticalTotalRaised = math`${totalRaised} + ${newDepositAmount}`

      if (mathIs`${hypotheticalTotalRaised} === ${0}`) {
        return fallback
      }

      const userShare = math`${totalUserDeposit} / ${hypotheticalTotalRaised}`

      // targetRaise is already a BigNumberValue (human-scale)
      const effectiveUsdc = math`min(${hypotheticalTotalRaised}, ${targetRaise})`

      const tessAllocation = math`${effectiveUsdc} / ${BigNumber.from(poolPrice)}`
      const userTessAllocation = math`${userShare} * ${tessAllocation}`

      return userTessAllocation
    } catch (error) {
      console.error('Failed to calculate allocation:', error)
      return fallback
    }
  }, [
    vaultInfo,
    totalRaised,
    targetRaise,
    poolPrice,
    escrowInfo?.totalDeposited,
    depositAmount,
    estimatedAllocation,
  ])

  // Check if deposit amount exceeds wallet balance
  const exceedsBalance = useMemo(() => {
    if (!depositAmount || !usdcBalance) return false

    try {
      const amountBN = BigNumber.from(depositAmount)
      // usdcBalance is now a BigNumberValue, no need to parse
      return mathIs`${amountBN} > ${usdcBalance}`
    } catch {
      return false
    }
  }, [depositAmount, usdcBalance])

  // Check if deposit amount exceeds remaining quota
  const exceedsRemainingQuota = useMemo(() => {
    if (!depositAmount || !depositQuota) return false

    try {
      const amountBN = BigNumber.from(depositAmount)
      const remainingQuotaBN = fromTokenAmount(depositQuota.remainingQuota, config.quoteDecimals)
      return mathIs`${amountBN} > ${remainingQuotaBN}`
    } catch {
      return false
    }
  }, [depositAmount, depositQuota, config.quoteDecimals])

  const handleConfirmDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount')
      return
    }

    if (!wallet.connected) {
      toast.error('Please connect your wallet')
      return
    }

    const signature = await deposit(depositAmount, () => {
      // Clear input immediately on success, before balance refresh
      setDepositAmount('')
    })

    if (signature) {
      toast.success('Deposit successful!', {
        description: `Transaction: ${signature.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () => window.open(getExplorerUrl(signature), '_blank'),
        },
      })
    } else if (error) {
      toast.error('Deposit failed', { description: error })
      clearError()
    }
  }

  const handleMaxClick = () => {
    // Use the smaller of: user's USDC balance or remaining deposit quota
    // usdcBalance is now a BigNumberValue
    const balanceBN = usdcBalance ?? BigNumber.from(0)

    // remainingQuota is a raw token amount (with USDC decimals)
    const quotaBN = fromTokenAmount(depositQuota?.remainingQuota ?? '0', config.quoteDecimals)

    // Use BigNumber min function for precise comparison
    const maxAmountBN = math`min(${balanceBN}, ${quotaBN})`

    // Convert to plain numeric string for input (no locale formatting)
    setDepositAmount(BigNumber.toString(maxAmountBN))
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="w-full rounded-2xl border p-6 bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-black">
            Deposit <AppTokenName token={config.quoteToken} variant="symbol" />
          </h3>
        </div>
        {vaultStateDisplay ? (
          <span
            className="text-white text-[10px] font-semibold px-2 py-1 rounded tracking-wider"
            style={{ backgroundColor: vaultStateDisplay.color }}
          >
            {vaultStateDisplay.label}
          </span>
        ) : (
          <span className="text-[#6b7280] text-[10px] font-semibold px-2 py-1 rounded tracking-wider bg-[#6b7280]/20">
            LOADING
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Input Section */}
        <div className="relative rounded-lg w-full group bg-white dark:bg-[rgba(0,0,0,0.6)]">
          <div className="rounded-[inherit] size-full">
            <div className="flex flex-col gap-1.5 items-start pb-4 pt-2 px-4 w-full">
              <div className="flex items-center justify-between leading-5 text-sm w-full text-[#a1a1aa] dark:text-[#ffffff] dark:opacity-50">
                <p className="font-bold">You Deposit</p>
                <div className="flex flex-col items-end gap-0.5">
                  <button
                    onClick={handleMaxClick}
                    className="text-xs hover:text-black dark:hover:text-white dark:hover:opacity-100 transition-colors"
                    disabled={!canDeposit}
                  >
                    Balance: <AppTokenAmount token={config.quoteToken} amount={usdcBalance ?? BigNumber.from(0)} /> <AppTokenName token={config.quoteToken} variant="symbol" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="relative rounded-md flex-shrink-0">
                  <div className="flex gap-2.5 items-center overflow-clip px-3 py-2 rounded-[inherit]">
                    <div className="relative flex-shrink-0 size-8">
                      <AppTokenIcon token={config.quoteToken} size={32} className="block size-full" />
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <p className="font-semibold leading-7 text-xl text-black dark:text-[#ffffff]">
                        <AppTokenName token={config.quoteToken} variant="symbol" />
                      </p>
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute border border-solid inset-0 pointer-events-none rounded-md border-[#dddbd0] dark:border-[rgba(255,255,255,0.15)]"
                  />
                </div>
                <div className="flex flex-col items-end justify-center flex-1 min-w-0">
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow numbers and decimal point
                      if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
                        setDepositAmount(value)
                      }
                    }}
                    placeholder="0.0"
                    disabled={!canDeposit}
                    className="font-semibold leading-10 bg-transparent outline-none border-none text-right w-full overflow-hidden text-black dark:text-white placeholder:text-black dark:placeholder:text-white text-[36px]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute border border-solid inset-0 pointer-events-none rounded-lg transition-colors border-[#dddbd0] dark:border-[#393b3d] group-focus-within:border-black dark:group-focus-within:border-[#d2fb95]"
          />
        </div>

        {/* Balance Warning */}
        {exceedsBalance && (
          <div className="bg-[#fef2f2] dark:bg-[#7f1d1d] flex gap-2 items-start p-3 rounded-lg w-full border border-[#fca5a5] dark:border-[#dc2626]">
            <AlertCircle className="w-4 h-4 text-[#dc2626] dark:text-[#fca5a5] shrink-0 mt-0.5" />
            <p className="flex-1 font-normal leading-[16.5px] text-xs text-[#991b1b] dark:text-[#fca5a5]">
              Insufficient balance. Your wallet balance is{' '}
              <AppTokenAmount token={config.quoteToken} amount={usdcBalance ?? BigNumber.from(0)} />{' '}
              <AppTokenName token={config.quoteToken} variant="symbol" />.
            </p>
          </div>
        )}

        {/* Remaining Quota Warning */}
        {exceedsRemainingQuota && depositQuota && (
          <div className="bg-[#fef2f2] dark:bg-[#7f1d1d] flex gap-2 items-start p-3 rounded-lg w-full border border-[#fca5a5] dark:border-[#dc2626]">
            <AlertCircle className="w-4 h-4 text-[#dc2626] dark:text-[#fca5a5] shrink-0 mt-0.5" />
            <p className="flex-1 font-normal leading-[16.5px] text-xs text-[#991b1b] dark:text-[#fca5a5]">
              Amount exceeds remaining quota. Your remaining deposit quota is{' '}
              <AppTokenAmount token={config.quoteToken} amount={fromTokenAmount(depositQuota.remainingQuota, config.quoteDecimals)} />{' '}
              <AppTokenName token={config.quoteToken} variant="symbol" />.
            </p>
          </div>
        )}

        {/* Persistent Warnings/Info */}
        {isWhitelistEnabled && depositQuota && (
          <div className="bg-[rgba(255,255,255,0.5)] flex items-center justify-center p-[12px] rounded-[8px] w-full">
            <p className="font-normal leading-[16.5px] text-[10px] text-center text-black tracking-[0.0645px]">
              Deposits are only available to whitelisted wallets.
              {mathIs`${fromTokenAmount(depositQuota.maxDeposit, config.quoteDecimals)} > ${0}` && (
                <>
                  Maximum deposit per wallet: $
                  <AppTokenAmount
                    token={config.quoteToken}
                    amount={fromTokenAmount(depositQuota.maxDeposit, config.quoteDecimals)}
                  />
                </>
              )}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between h-[18px]">
            <span className="font-normal leading-[18px] text-xs text-[#666]">Current Deposit</span>
            <span className="font-normal leading-[18px] text-xs text-black font-mono flex items-center gap-1">
              <AppTokenAmount token={config.quoteToken} amount={existingDepositAmount} />
              <AppTokenName token={config.quoteToken} variant="symbol" />
            </span>
          </div>
          <div className="flex items-start justify-between h-[18px]">
            <span className="font-normal leading-[18px] text-xs text-[#666]">After This Deposit</span>
            <span className="font-normal leading-[18px] text-xs text-black font-mono flex items-center gap-1">
              <AppTokenAmount token={config.quoteToken} amount={afterThisDepositAmount} />
              <AppTokenName token={config.quoteToken} variant="symbol" />
            </span>
          </div>
          <div className="flex items-start justify-between h-[18px]">
            <div className="flex items-center gap-1">
              <span className="font-normal leading-[18px] text-xs text-[#666]">Est. Allocation (Total)</span>
              <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
                <Tooltip.Root open={tooltipOpen}>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center touch-manipulation p-1 -m-1"
                      onTouchStart={() => { isTouchRef.current = true }}
                      onClick={() => {
                        if (!isTouchRef.current) return
                        setTooltipOpen(!tooltipOpen)
                      }}
                      onMouseEnter={() => {
                        if (!isTouchRef.current) setTooltipOpen(true)
                      }}
                      onMouseLeave={() => {
                        if (!isTouchRef.current) setTooltipOpen(false)
                      }}
                    >
                      <Info className="w-4 h-4 text-[#666] cursor-help" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="max-w-[220px] sm:max-w-xs px-3 py-2 bg-black text-white text-xs leading-[1.4] rounded-lg z-50 shadow-lg"
                      sideOffset={8}
                      side="top"
                      align="end"
                      alignOffset={-8}
                      collisionPadding={16}
                      onPointerDownOutside={() => setTooltipOpen(false)}
                    >
                      In pro-rata mode, your final allocation may change as more users deposit before the auction ends.
                      <Tooltip.Arrow className="fill-black" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <span className="font-normal leading-[18px] text-xs text-[#06a800] font-mono flex items-center gap-1">
              <AppTokenAmount token={token} amount={calculatedEstAllocation} />
              <AppTokenName token={token} variant="symbol" />
            </span>
          </div>
        </div>

        {/* Countdown Notification - shown when deposits haven't started */}
        {!isDepositActive && (
          <CountdownNotification
            config={depositStartCountdownConfig}
            title={
              <>
                <AppTokenName token={token.id} /> deposits will open in
              </>
            }
          />
        )}

        {/* Action Button */}
        <div className="flex flex-col gap-2.5">
          {wallet.connected ? (
            <button
              onClick={handleConfirmDeposit}
              disabled={isLoading || !canDeposit || exceedsRemainingQuota || exceedsBalance}
              className="bg-black h-14 rounded-lg w-full hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center size-full px-6 py-0">
                <div className="flex gap-2 items-center justify-center">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <p className="font-semibold text-lg leading-7 text-white">Processing...</p>
                    </>
                  ) : (
                    <p className="font-semibold text-lg leading-7 text-white">
                      {!vaultInfo
                        ? 'Loading...'
                        : !isDepositActive
                          ? 'Deposits Not Active Yet'
                          : !isDepositOpen
                            ? vaultInfo.state === 'purchasing'
                              ? 'Purchasing in Progress'
                              : 'Deposits Closed'
                            : !depositQuota?.canDeposit
                              ? (depositQuota?.reason ?? 'Cannot Deposit')
                              : 'Confirm Deposit'}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="bg-black h-14 rounded-lg w-full hover:bg-[#333] transition-colors"
            >
              <div className="flex items-center justify-center size-full px-6 py-0">
                <div className="flex gap-2 items-center justify-center">
                  <p className="font-semibold text-lg leading-7 text-white">Connect Wallet</p>
                </div>
              </div>
            </button>
          )}

          {/* Notice */}
          {escrowInfo && (
            <div className="bg-[rgba(255,255,255,0.5)] flex gap-2.5 items-center p-3 rounded-lg w-full">
              <Info className="w-3 h-3 text-[#666666] shrink-0" />
              <p className="flex-1 font-normal leading-[16.5px] text-[10px] text-black tracking-[0.0645px]">
                You have an active position in this auction. Check the top "My Position" card for real-time allocation
                updates.
              </p>
            </div>
          )}
        </div>

        {/* Pool Details */}
        <div className="relative flex flex-col gap-2 pt-4">
          <div
            aria-hidden="true"
            className="absolute border-t border-[rgba(210,210,210,0.1)] inset-x-0 top-0 pointer-events-none"
          />
          <div className="flex items-center w-full">
            <p className="font-semibold leading-[15px] text-[10px] text-black tracking-[0.1172px]">POOL DETAILS</p>
          </div>
          <div className="flex flex-col gap-2.5 items-start w-full">
            <div className="flex h-[15px] items-start justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">Address</p>
              <div className="bg-[rgba(0,0,0,0.1)] rounded flex items-center justify-center px-2 py-0.5">
                <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                  {shortenAddress(config.vault)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">Target Raise</p>
              <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                $<AppTokenAmount token={config.quoteToken} amount={targetRaise} />
              </p>
            </div>
            <div className="flex items-center justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">Current Raise</p>
              <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                $<AppTokenAmount token={config.quoteToken} amount={totalRaised} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
