import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useMeteoraSwap, type SwapDirection } from '@/hooks/use-meteora-swap'
import { getExplorerUrl } from '@/lib/solana/config'
import TokenUsdcIcon from './_/token-usdc.svg?react'
import TokenTessIcon from './_/token-tess.svg?react'
import SwapIcon from './_/swap-icon.svg?react'
import { toast } from 'sonner'

export function TokenSwapPanel() {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()

  const {
    isLoading,
    error,
    quote,
    txSignature,
    usdcBalance,
    tessBalance,
    usdcBalanceFormatted,
    tessBalanceFormatted,
    loadPool,
    getQuote,
    executeSwap,
    refreshBalances,
    clearError,
  } = useMeteoraSwap()

  // Default: USDC -> TESS (buying TESS)
  const [direction, setDirection] = useState<SwapDirection>('USDC_TO_TESS')
  const [inputAmount, setInputAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)

  // Derived state
  const isBuying = direction === 'USDC_TO_TESS' // Buying TESS with USDC
  const sellingToken = isBuying ? 'USDC' : 'TESS'
  const buyingToken = isBuying ? 'TESS' : 'USDC'
  // BigNumber value for max button calculation
  const sellingBalance = isBuying ? usdcBalance : tessBalance
  // Formatted strings for display
  const sellingBalanceFormatted = isBuying ? usdcBalanceFormatted : tessBalanceFormatted
  const buyingBalanceFormatted = isBuying ? tessBalanceFormatted : usdcBalanceFormatted

  // Load pool and balances on mount
  useEffect(() => {
    loadPool()
  }, [loadPool])

  // Refresh balances when wallet changes
  useEffect(() => {
    if (wallet.publicKey) {
      refreshBalances()
    }
  }, [wallet.publicKey, refreshBalances])

  // Get quote when input changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputAmount && parseFloat(inputAmount) > 0) {
        getQuote(inputAmount, direction)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputAmount, direction, getQuote])

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
    setDirection((prev) => (prev === 'USDC_TO_TESS' ? 'TESS_TO_USDC' : 'USDC_TO_TESS'))
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
      // Convert BigNumber to string for input (full precision, no formatting)
      setInputAmount(sellingBalance.toString())
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
  const isDisabled = !isWalletConnected || !hasValidInput || !hasQuote || isLoading || isSwapping

  const getButtonText = () => {
    if (!isWalletConnected) return 'Connect Wallet'
    if (isSwapping) return 'Swapping...'
    if (isLoading) return 'Loading...'
    if (!hasValidInput) return 'Enter amount'
    return isBuying ? 'Buy TESS' : 'Sell TESS'
  }

  const handleButtonClick = () => {
    if (!isWalletConnected) {
      setVisible(true)
    } else {
      handleSwap()
    }
  }

  return (
    <div className="h-full rounded-2xl p-4 lg:p-6 py-6 lg:py-8 bg-gradient-to-b from-white to-[#d2fb95] dark:from-[#1e1f20] dark:to-[#d2fb95]">
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
          <div className="bg-white dark:bg-[rgba(0,0,0,0.5)] border border-[#dddbd0] dark:border-[#393b3d] rounded-lg px-3 lg:px-4 pt-2 pb-3 lg:pb-4">
            <div className="flex justify-between items-center">
              <p className="text-xs lg:text-sm font-bold text-black/30 dark:text-[#d2d2d2]/30 leading-5">
                Selling
              </p>
              {sellingBalanceFormatted && (
                <button
                  onClick={handleMaxClick}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                <span className="text-base lg:text-xl font-semibold text-foreground dark:text-[#d2d2d2]">
                  {sellingToken}
                </span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={inputAmount}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0.00"
                className="flex-1 min-w-0 text-2xl lg:text-4xl font-semibold text-foreground dark:text-white text-right bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Swap Button - positioned between the two input blocks */}
          <button
            onClick={handleSwapDirection}
            className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black border border-[#dddbd0] dark:border-[#393b3d] rounded-full p-1.5 lg:p-2 hover:bg-gray-50 dark:hover:bg-black/80 transition-colors z-10"
          >
            <SwapIcon className="w-4 h-4 lg:w-5 lg:h-5 rotate-90 dark:text-[#d2d2d2]" />
          </button>
        </div>

        {/* Buying Input */}
        <div className="bg-white dark:bg-[rgba(0,0,0,0.5)] border border-[#dddbd0] dark:border-[#393b3d] rounded-lg px-3 lg:px-4 pt-2 pb-3 lg:pb-4">
          <div className="flex justify-between items-center">
            <p className="text-xs lg:text-sm font-bold text-black/30 dark:text-[#d2d2d2]/30 leading-5">
              Buying
            </p>
            {buyingBalanceFormatted && (
              <span className="text-xs text-muted-foreground">
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
              <span className="text-base lg:text-xl font-semibold text-foreground dark:text-[#d2d2d2]">
                {buyingToken}
              </span>
            </div>
            <input
              type="text"
              value={isLoading ? '...' : outputAmount}
              readOnly
              placeholder="0"
              className="flex-1 min-w-0 text-2xl lg:text-4xl font-semibold text-foreground dark:text-white text-right bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Swap Info */}
        {quote && hasValidInput && (
          <div className="bg-white/50 dark:bg-black/30 rounded-lg px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Rate</span>
              <span>
                1 {sellingToken} = {rate} {buyingToken}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Min. received</span>
              <span>
                {minOutput} {buyingToken}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Slippage</span>
              <span>1%</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleButtonClick}
          disabled={isWalletConnected && isDisabled}
          className="w-full h-12 lg:h-14 bg-black dark:bg-white text-white dark:text-black text-base lg:text-lg font-semibold rounded-lg hover:bg-black/90 dark:hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  )
}
