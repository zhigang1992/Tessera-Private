import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useMeteoraSwap, type SwapDirection } from '@/hooks/use-meteora-swap'
import { getExplorerUrl } from '@/lib/solana/config'
import { formatBigNumber } from '@/lib/bignumber'
import TokenUsdcIcon from './_/token-usdc.svg?react'
import TokenTessIcon from './_/token-tess.svg?react'
import SwapIcon from './_/swap-icon.svg?react'
import { toast } from 'sonner'

interface TokenSwapPanelProps {
  disabled?: boolean
}

export function TokenSwapPanel({ disabled = false }: TokenSwapPanelProps) {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()

  const {
    isLoading,
    error,
    quote,
    txSignature,
    usdcBalance,
    tSpaceXBalance,
    usdcBalanceFormatted,
    tSpaceXBalanceFormatted,
    loadPool,
    getQuote,
    executeSwap,
    refreshBalances,
    clearError,
  } = useMeteoraSwap()

  // Default: USDC -> T-SpaceX (buying T-SpaceX)
  const [direction, setDirection] = useState<SwapDirection>('USDC_TO_TSPACEX')
  const [inputAmount, setInputAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)

  // Derived state
  const isBuying = direction === 'USDC_TO_TSPACEX' // Buying T-SpaceX with USDC
  const sellingToken = isBuying ? 'USDC' : 'T-SpaceX'
  const buyingToken = isBuying ? 'T-SpaceX' : 'USDC'
  // BigNumber value for max button calculation
  const sellingBalance = isBuying ? usdcBalance : tSpaceXBalance
  // Formatted strings for display
  const sellingBalanceFormatted = isBuying ? usdcBalanceFormatted : tSpaceXBalanceFormatted
  const buyingBalanceFormatted = isBuying ? tSpaceXBalanceFormatted : usdcBalanceFormatted

  // Load pool and balances on mount (skip if disabled)
  useEffect(() => {
    if (!disabled) {
      loadPool()
    }
  }, [loadPool, disabled])

  // Refresh balances when wallet changes (skip if disabled)
  useEffect(() => {
    if (!disabled && wallet.publicKey) {
      refreshBalances()
    }
  }, [wallet.publicKey, refreshBalances, disabled])

  // Get quote when input changes (debounced) - skip if disabled
  useEffect(() => {
    if (disabled) return

    const timer = setTimeout(() => {
      if (inputAmount && parseFloat(inputAmount) > 0) {
        getQuote(inputAmount, direction)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputAmount, direction, getQuote, disabled])

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  // Show success toast
  useEffect(() => {
    if (txSignature) {
      const explorerUrl = getExplorerUrl(txSignature, 'tx')
      toast.success(
        <div>
          Swap successful!{' '}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Explorer
          </a>
        </div>
      )
    }
  }, [txSignature])

  const handleSwapDirection = () => {
    setDirection((prev) => (prev === 'USDC_TO_TSPACEX' ? 'TSPACEX_TO_USDC' : 'USDC_TO_TSPACEX'))
    setInputAmount('')
  }

  const handleInputChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputAmount(value)
    }
  }

  const handleMaxClick = () => {
    if (sellingBalance) {
      // Format BigNumber to string for input (full precision, no thousands separators)
      // Use maximumFractionDigits to show full precision based on token type
      const maxDecimals = isBuying ? 6 : 6 // Both USDC and T-SpaceX have 6 decimals
      const formatted = formatBigNumber(sellingBalance, {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      })
      setInputAmount(formatted)
    }
  }

  const handleSwap = useCallback(async () => {
    if (!quote) return

    setIsSwapping(true)
    try {
      await executeSwap(quote, direction)
      setInputAmount('')
    } finally {
      setIsSwapping(false)
    }
  }, [quote, direction, executeSwap])

  const outputAmount = quote?.outAmountFormatted ?? '0'
  const minOutput = quote?.minOutAmountFormatted ?? '0'
  const rate = quote?.rate ?? '0'

  // Button state
  const isWalletConnected = wallet.connected
  const hasValidInput = inputAmount && parseFloat(inputAmount) > 0
  const hasQuote = !!quote
  const isDisabled = !isWalletConnected || !hasValidInput || !hasQuote || isLoading || isSwapping || disabled

  const getButtonText = () => {
    if (disabled) return 'Trading Not Enabled Yet'
    if (!isWalletConnected) return 'Connect Wallet'
    if (isSwapping) return 'Swapping...'
    if (isLoading) return 'Loading...'
    if (!hasValidInput) return 'Enter amount'
    return isBuying ? 'Buy T-SpaceX' : 'Sell T-SpaceX'
  }

  const handleButtonClick = () => {
    if (!isWalletConnected) {
      setVisible(true)
    } else {
      handleSwap()
    }
  }

  return (
    <div className="h-full rounded-2xl p-4 lg:p-6 py-6 lg:py-8 bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
      {/* Network indicator */}
      <div className="flex justify-end mb-2">
        <span className="text-xs px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-muted-foreground">
          Devnet
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:gap-4">
        {/* Token Input Blocks with centered swap button */}
        <div className="relative">
          {/* Selling Input */}
          <div className="bg-white dark:bg-[rgba(0,0,0,0.6)] border border-[#dddbd0] dark:border-[#393b3d] rounded-lg px-3 lg:px-4 pt-2 pb-3 lg:pb-4">
            <div className="flex justify-between items-center">
              <p className="text-xs lg:text-sm font-bold text-[#a1a1aa] dark:text-white dark:opacity-50 leading-5">
                Selling
              </p>
              {sellingBalanceFormatted && (
                <button
                  onClick={handleMaxClick}
                  className="text-xs text-zinc-600 dark:text-white dark:opacity-50 hover:text-black dark:hover:text-white dark:hover:opacity-100 transition-colors"
                >
                  Balance: {sellingBalanceFormatted} {sellingToken}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 lg:mt-1.5">
              <div className="flex-shrink-0 flex items-center gap-1.5 lg:gap-2.5 border border-[#dddbd0] dark:border-[rgba(255,255,255,0.15)] rounded-md px-2 lg:px-3 py-1.5 lg:py-2">
                {sellingToken === 'USDC' ? (
                  <TokenUsdcIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                ) : (
                  <TokenTessIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                )}
                <span className="text-base lg:text-xl font-semibold text-black dark:text-white">
                  {sellingToken}
                </span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={inputAmount}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0.00"
                className="flex-1 min-w-0 text-2xl lg:text-4xl font-semibold text-black dark:text-white text-right bg-transparent outline-none placeholder:text-black dark:placeholder:text-white"
              />
            </div>
          </div>

          {/* Swap Button - positioned between the two input blocks */}
          <button
            onClick={handleSwapDirection}
            className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black border border-[#dddbd0] dark:border-[rgba(210,210,210,0.1)] rounded-full p-1.5 lg:p-2 hover:bg-gray-50 dark:hover:bg-[#27272a] transition-colors z-10"
          >
            <SwapIcon className="w-4 h-4 lg:w-5 lg:h-5 rotate-90 text-[#999999] dark:text-[#ffffff]" />
          </button>
        </div>

        {/* Buying Input */}
        <div className="bg-white dark:bg-[rgba(0,0,0,0.6)] border border-[#dddbd0] dark:border-[#393b3d] rounded-lg px-3 lg:px-4 pt-2 pb-3 lg:pb-4">
          <div className="flex justify-between items-center">
            <p className="text-xs lg:text-sm font-bold text-[#a1a1aa] dark:text-white dark:opacity-50 leading-5">
              Buying
            </p>
            {buyingBalanceFormatted && (
              <span className="text-xs text-zinc-600 dark:text-white dark:opacity-50">
                Balance: {buyingBalanceFormatted} {buyingToken}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 lg:mt-1.5">
            <div className="flex-shrink-0 flex items-center gap-1.5 lg:gap-2.5 border border-[#dddbd0] dark:border-[rgba(255,255,255,0.15)] rounded-md px-2 lg:px-3 py-1.5 lg:py-2">
              {buyingToken === 'USDC' ? (
                <TokenUsdcIcon className="w-6 h-6 lg:w-8 lg:h-8" />
              ) : (
                <TokenTessIcon className="w-6 h-6 lg:w-8 lg:h-8" />
              )}
              <span className="text-base lg:text-xl font-semibold text-black dark:text-white">
                {buyingToken}
              </span>
            </div>
            <input
              type="text"
              value={isLoading ? '...' : outputAmount}
              readOnly
              placeholder="0"
              className="flex-1 min-w-0 text-2xl lg:text-4xl font-semibold text-black dark:text-white text-right bg-transparent outline-none placeholder:text-black dark:placeholder:text-white opacity-20"
            />
          </div>
        </div>

        {/* Swap Info */}
        {quote && hasValidInput && (
          <div className="bg-[rgba(255,255,255,0.5)] rounded-lg px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#52525b]">Rate</span>
              <span className="text-black">
                1 {sellingToken} = {rate} {buyingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52525b]">Min. received</span>
              <span className="text-[#1d8f00]">
                {minOutput} {buyingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52525b]">Slippage</span>
              <span className="text-[#1d8f00]">1%</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleButtonClick}
          disabled={disabled || (isWalletConnected && isDisabled)}
          className="w-full h-12 lg:h-14 bg-black text-white text-base lg:text-lg font-semibold rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  )
}
