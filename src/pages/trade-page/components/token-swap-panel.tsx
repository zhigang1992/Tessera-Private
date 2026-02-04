import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useMeteoraSwap, type SwapDirection } from '@/hooks/use-meteora-swap'
import { DEFAULT_BASE_TOKEN_ID, QUOTE_TOKEN_ID, getAppToken, getExplorerUrl } from '@/config'
import { BigNumber } from '@/lib/bignumber'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenCount } from '@/components/app-token-count'
import SwapIcon from './_/swap-icon.svg?react'
import { toast } from 'sonner'

const BASE_TOKEN = getAppToken(DEFAULT_BASE_TOKEN_ID)
const QUOTE_TOKEN = getAppToken(QUOTE_TOKEN_ID)

function getTokenPrecision(decimals: number) {
  return {
    minimumFractionDigits: decimals >= 2 ? 2 : 0,
    maximumFractionDigits: Math.min(decimals, 6),
  }
}

interface TokenSwapPanelProps {
  disabled?: boolean
}

export function TokenSwapPanel({ disabled = false }: TokenSwapPanelProps) {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()

  const {
    isLoading,
    error,
    poolInfo,
    quote,
    txSignature,
    usdcBalance,
    tSpaceXBalance,
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
  const sellingTokenConfig = isBuying ? QUOTE_TOKEN : BASE_TOKEN
  const buyingTokenConfig = isBuying ? BASE_TOKEN : QUOTE_TOKEN
  // BigNumber value for max button calculation
  const sellingBalance = isBuying ? usdcBalance : tSpaceXBalance
  const sellingPrecision = getTokenPrecision(sellingTokenConfig.decimals)
  const buyingPrecision = getTokenPrecision(buyingTokenConfig.decimals)
  const outputAmountValue = quote?.outAmountValue ?? null
  const hasOutputAmount = Boolean(outputAmountValue)
  const rateValue = quote?.rateValue ?? null
  const outputLength = outputAmountValue ? BigNumber.toString(outputAmountValue).length : 0
  const outputSizeClass =
    outputLength === 0 ? 'text-[28px]' : outputLength <= 6 ? 'text-[36px]' : outputLength <= 10 ? 'text-[28px]' : 'text-[20px]'

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
    // Only allow numbers and decimal point, limit to 6 decimals
    if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
      setInputAmount(value)
    }
  }

  const handleMaxClick = () => {
    if (sellingBalance) {
      setInputAmount(BigNumber.toString(sellingBalance))
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
    return 'Swap'
  }

  const handleButtonClick = () => {
    if (!isWalletConnected) {
      setVisible(true)
    } else {
      handleSwap()
    }
  }

  return (
    <div className="relative rounded-2xl w-full bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
      <div className="size-full">
        <div className="flex flex-col items-start px-6 py-8 w-full">
          <div className="flex flex-col gap-4 items-center w-full">
        {/* Token Input Blocks with centered swap button */}
        <div className="relative w-full">
          {/* Pay Input */}
          <div className="relative rounded-lg w-full group bg-white dark:bg-[rgba(0,0,0,0.6)]">
            <div className="rounded-[inherit] size-full">
              <div className="flex flex-col gap-1.5 items-start pb-4 pt-2 px-4 w-full">
                <div className="flex items-center justify-between leading-5 text-sm w-full text-[#a1a1aa] dark:text-[#ffffff] dark:opacity-50">
                  <p className="font-bold">Pay</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMaxClick}
                      className="text-xs text-zinc-600 dark:text-white dark:opacity-50 hover:text-black dark:hover:text-white dark:hover:opacity-100 transition-colors disabled:opacity-30"
                      disabled={!sellingBalance}
                    >
                      MAX:{' '}
                      <AppTokenCount
                        token={sellingTokenConfig}
                        value={sellingBalance}
                        fallback="0.00"
                        showSymbol={false}
                        minimumFractionDigits={sellingPrecision.minimumFractionDigits}
                        maximumFractionDigits={sellingPrecision.maximumFractionDigits}
                      />
                    </button>
                    {inputAmount && (
                      <button
                        onClick={() => setInputAmount('')}
                        className="flex items-center justify-center size-4 transition-opacity hover:opacity-60"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 16 16">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-[#a1a1aa] dark:text-[#d2d2d2]" />
                          <path d="M10 6L6 10M6 6L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-[#a1a1aa] dark:text-[#d2d2d2]" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="relative rounded-md flex-shrink-0">
                    <div className="flex gap-2.5 items-center overflow-clip px-3 py-2 rounded-[inherit]">
                    <div className="relative flex-shrink-0 size-8">
                      <AppTokenIcon token={sellingTokenConfig} className="block size-full" size={32} />
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <p className="font-semibold leading-7 text-xl text-black dark:text-[#ffffff]">
                        <AppTokenName token={sellingTokenConfig} variant="symbol" />
                      </p>
                    </div>
                    </div>
                    <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-md border-[#dddbd0] dark:border-[rgba(255,255,255,0.15)]" />
                  </div>
                  <div className="flex flex-col items-end justify-center flex-1 min-w-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputAmount}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="0.0"
                      className={`font-semibold leading-10 bg-transparent outline-none border-none text-right w-full overflow-hidden text-black dark:text-white placeholder:text-black dark:placeholder:text-white ${
                        inputAmount.length <= 6 ? 'text-[36px]' : inputAmount.length <= 10 ? 'text-[28px]' : 'text-[20px]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-lg transition-colors border-[#dddbd0] dark:border-[#393b3d] group-focus-within:border-black dark:group-focus-within:border-[#d2fb95]" />
          </div>

          {/* Swap Button - positioned between the two input blocks */}
          <button
            onClick={handleSwapDirection}
            className="absolute left-1/2 top-[86px] -translate-x-1/2 bg-white dark:bg-black border border-[#dddbd0] dark:border-[rgba(210,210,210,0.1)] rounded-full p-2 hover:bg-gray-50 dark:hover:bg-[#27272a] transition-colors z-10"
          >
            <SwapIcon className="w-5 h-5 rotate-[270deg] text-[#999999] dark:text-[#ffffff]" />
          </button>
        </div>

        {/* Receive Input */}
        <div className="relative rounded-lg w-full group bg-white dark:bg-[rgba(0,0,0,0.6)]">
          <div className="rounded-[inherit] size-full">
            <div className="flex flex-col gap-1.5 items-start pb-4 pt-2 px-4 w-full">
              <div className="flex items-center justify-between leading-5 text-sm w-full text-[#a1a1aa] dark:text-[#ffffff] dark:opacity-50">
                <p className="font-bold">Receive</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs">Estimated</p>
                  {hasOutputAmount && (
                    <button
                      className="flex items-center justify-center size-4 transition-opacity hover:opacity-60"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-[#a1a1aa] dark:text-[#d2d2d2]" />
                        <path d="M10 6L6 10M6 6L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-[#a1a1aa] dark:text-[#d2d2d2]" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="relative rounded-md flex-shrink-0">
                  <div className="flex gap-2.5 items-center overflow-clip px-3 py-2 rounded-[inherit]">
                    <div className="relative flex-shrink-0 size-8">
                      <AppTokenIcon token={buyingTokenConfig} className="block size-full" size={32} />
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <p className="font-semibold leading-7 text-xl text-black dark:text-[#ffffff]">
                        <AppTokenName token={buyingTokenConfig} variant="symbol" />
                      </p>
                    </div>
                  </div>
                  <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-md border-[#dddbd0] dark:border-[rgba(255,255,255,0.15)]" />
                </div>
                <div className="flex flex-col items-end justify-center flex-1 min-w-0">
                  <AppTokenCount
                    token={buyingTokenConfig}
                    value={outputAmountValue}
                    showSymbol={false}
                    fallback={isLoading ? '...' : '0.0'}
                    minimumFractionDigits={buyingPrecision.minimumFractionDigits}
                    maximumFractionDigits={buyingPrecision.maximumFractionDigits}
                    className={`block font-semibold leading-10 text-right w-full overflow-hidden text-black dark:text-white ${hasOutputAmount ? '' : 'opacity-20'} ${outputSizeClass}`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-lg transition-colors border-[#dddbd0] dark:border-[#393b3d] group-focus-within:border-black dark:group-focus-within:border-[#d2fb95]" />
        </div>

        {/* Rate Info */}
        {quote && hasValidInput && (
          <div className="bg-[rgba(255,255,255,0.5)] rounded-lg px-6 py-4 self-stretch">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs leading-4">
                <div className="flex flex-col justify-center text-[#52525b]">
                  <p className="leading-4">Rate</p>
                </div>
                <div className="flex flex-col justify-center text-black">
                  <p className="leading-4">
                    1 <AppTokenName token={sellingTokenConfig} variant="symbol" /> ={' '}
                    <AppTokenCount
                      token={buyingTokenConfig}
                      value={rateValue}
                      showSymbol={false}
                      minimumFractionDigits={buyingPrecision.minimumFractionDigits}
                      maximumFractionDigits={Math.max(4, buyingPrecision.maximumFractionDigits)}
                      fallback="0.0000"
                    />{' '}
                    <AppTokenName token={buyingTokenConfig} variant="symbol" />
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs leading-4">
                <div className="flex flex-col justify-center text-[#52525b]">
                  <p className="leading-4">Dynamic Fee</p>
                </div>
                <div className="flex flex-col justify-center text-[#1d8f00]">
                  <p className="leading-4">{poolInfo?.dynamicFeePercentage ?? '...'}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs leading-4">
                <div className="flex flex-col justify-center text-[#52525b]">
                  <p className="leading-4">Price Impact</p>
                </div>
                <div className="flex flex-col justify-center text-[#1d8f00]">
                  <p className="leading-4">{quote.priceImpact}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

            {/* SWAP Button */}
            <button
              onClick={handleButtonClick}
              disabled={disabled || (isWalletConnected && isDisabled)}
              className="w-full h-14 bg-black text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center size-full px-6 py-0">
                <div className="flex gap-2 items-center justify-center">
                  <p className="font-semibold text-lg leading-7">{getButtonText()}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
