import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTokens, getSwapQuote, type Token } from '@/services'
import TokenUsdcIcon from './_/token-usdc.svg?react'
import TokenSpacexIcon from './_/token-spacex.svg?react'
import SwapIcon from './_/swap-icon.svg?react'
import ChevronDownIcon from './_/chevron-down.svg?react'

interface TokenSwapPanelProps {
  onTokenChange?: (token: Token) => void
}

// Token icon mapping
function TokenIcon({ symbol, className }: { symbol: string; className?: string }) {
  const symbolLower = symbol.toLowerCase()
  if (symbolLower === 'usdc') {
    return <TokenUsdcIcon className={className} />
  }
  // Default to SpaceX icon for all tokenized assets
  return <TokenSpacexIcon className={className} />
}

export function TokenSwapPanel({ onTokenChange }: TokenSwapPanelProps) {
  const [sellingTokenSymbol, setSellingTokenSymbol] = useState('USDC')
  const [buyingTokenSymbol, setBuyingTokenSymbol] = useState('T-SpaceX')
  const [sellingAmount, setSellingAmount] = useState('')
  const [showSellingDropdown, setShowSellingDropdown] = useState(false)
  const [showBuyingDropdown, setShowBuyingDropdown] = useState(false)

  // Fetch tokens list
  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens'],
    queryFn: getTokens,
  })

  // Get swap quote
  const { data: quote } = useQuery({
    queryKey: ['swapQuote', sellingTokenSymbol, buyingTokenSymbol, sellingAmount],
    queryFn: () => getSwapQuote(sellingTokenSymbol, buyingTokenSymbol, parseFloat(sellingAmount) || 0),
    enabled: !!sellingAmount && parseFloat(sellingAmount) > 0,
  })

  const sellingToken = tokens.find((t) => t.symbol === sellingTokenSymbol)
  const buyingToken = tokens.find((t) => t.symbol === buyingTokenSymbol)

  // Notify parent when buying token changes
  useEffect(() => {
    if (buyingToken && onTokenChange) {
      onTokenChange(buyingToken)
    }
  }, [buyingToken, onTokenChange])

  const handleSwapTokens = () => {
    const tempSymbol = sellingTokenSymbol
    setSellingTokenSymbol(buyingTokenSymbol)
    setBuyingTokenSymbol(tempSymbol)
    setSellingAmount('')
  }

  const handleSellingAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSellingAmount(value)
    }
  }

  const handleSelectSellingToken = (token: Token) => {
    if (token.symbol === buyingTokenSymbol) {
      setBuyingTokenSymbol(sellingTokenSymbol)
    }
    setSellingTokenSymbol(token.symbol)
    setShowSellingDropdown(false)
    setSellingAmount('')
  }

  const handleSelectBuyingToken = (token: Token) => {
    if (token.symbol === sellingTokenSymbol) {
      setSellingTokenSymbol(buyingTokenSymbol)
    }
    setBuyingTokenSymbol(token.symbol)
    setShowBuyingDropdown(false)
    setSellingAmount('')
  }

  const sellingUsdValue = sellingAmount && sellingToken
    ? `$${(parseFloat(sellingAmount) * sellingToken.price).toFixed(2)}`
    : '$0'

  const buyingAmount = quote?.toAmount?.toFixed(4) ?? '0'
  const buyingUsdValue = quote && buyingToken
    ? `$${(quote.toAmount * buyingToken.price).toFixed(2)}`
    : '$0'

  return (
    <div className="rounded-2xl p-6 py-8 bg-gradient-to-b from-white to-[#d2fb95]">
      <div className="relative flex flex-col gap-4">
        {/* Selling Input */}
        <div className="bg-white border border-[#dddbd0] rounded-lg px-4 pt-2 pb-4">
          <p className="text-sm font-bold text-black/30 leading-5">Selling</p>
          <div className="flex items-center justify-between mt-1.5">
            <div className="relative">
              <button
                onClick={() => setShowSellingDropdown(!showSellingDropdown)}
                className="flex items-center gap-2.5 border border-[#dddbd0] rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <TokenIcon symbol={sellingTokenSymbol} className="w-8 h-8" />
                <div className="flex items-center gap-1">
                  <span className="text-xl font-semibold text-black">{sellingTokenSymbol}</span>
                  <ChevronDownIcon className="w-4 h-4 opacity-50" />
                </div>
              </button>
              {showSellingDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                  {tokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => handleSelectSellingToken(token)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <TokenIcon symbol={token.symbol} className="w-6 h-6" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-black">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <input
                type="text"
                value={sellingAmount}
                onChange={(e) => handleSellingAmountChange(e.target.value)}
                placeholder="0.00"
                className="text-4xl font-semibold text-black text-right bg-transparent outline-none w-32 placeholder:text-black/20"
              />
              <p className="text-sm text-black/30">{sellingUsdValue}</p>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwapTokens}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[#dddbd0] rounded-full p-2 hover:bg-gray-50 transition-colors z-10"
        >
          <SwapIcon className="w-5 h-5 rotate-90" />
        </button>

        {/* Buying Input */}
        <div className="bg-white border border-[#dddbd0] rounded-lg px-4 pt-2 pb-4">
          <p className="text-sm font-bold text-black/30 leading-5">Buying</p>
          <div className="flex items-center justify-between mt-1.5">
            <div className="relative">
              <button
                onClick={() => setShowBuyingDropdown(!showBuyingDropdown)}
                className="flex items-center gap-2.5 border border-[#dddbd0] rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <TokenIcon symbol={buyingTokenSymbol} className="w-8 h-8" />
                <div className="flex items-center gap-1">
                  <span className="text-xl font-semibold text-black">{buyingTokenSymbol}</span>
                  <ChevronDownIcon className="w-4 h-4 opacity-50" />
                </div>
              </button>
              {showBuyingDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                  {tokens
                    .filter((t) => t.symbol !== 'USDC')
                    .map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => handleSelectBuyingToken(token)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <TokenIcon symbol={token.symbol} className="w-6 h-6" />
                        <div className="text-left">
                          <div className="text-sm font-medium text-black">{token.symbol}</div>
                          <div className="text-xs text-gray-500">{token.name}</div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <input
                type="text"
                value={buyingAmount}
                readOnly
                placeholder="0"
                className="text-4xl font-semibold text-black/20 text-right bg-transparent outline-none w-32 placeholder:text-black/20"
              />
              <p className="text-sm text-black/30">{buyingUsdValue}</p>
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <button
          className="w-full h-14 bg-black text-white text-lg font-semibold rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!sellingAmount || parseFloat(sellingAmount) <= 0}
        >
          {sellingTokenSymbol === 'USDC' ? 'Buy' : 'Sell'}
        </button>
      </div>

      {/* Click outside to close dropdowns */}
      {(showSellingDropdown || showBuyingDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowSellingDropdown(false)
            setShowBuyingDropdown(false)
          }}
        />
      )}
    </div>
  )
}
