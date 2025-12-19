import { useState } from 'react'
import TokenUsdcIcon from './_/token-usdc.svg?react'
import TokenSpacexIcon from './_/token-spacex.svg?react'
import SwapIcon from './_/swap-icon.svg?react'
import ChevronDownIcon from './_/chevron-down.svg?react'

interface Token {
  symbol: string
  name: string
  icon: React.ReactNode
}

const tokens: Token[] = [
  { symbol: 'USDC', name: 'USD Coin', icon: <TokenUsdcIcon className="w-8 h-8" /> },
  { symbol: 'T-Tsla', name: 'Tokenized Tesla', icon: <TokenSpacexIcon className="w-8 h-8" /> },
  { symbol: 'T-SpaceX', name: 'Tokenized SpaceX', icon: <TokenSpacexIcon className="w-8 h-8" /> },
]

export function TokenSwapPanel() {
  const [sellingToken, setSellingToken] = useState(tokens[0])
  const [buyingToken, setBuyingToken] = useState(tokens[1])
  const [sellingAmount, setSellingAmount] = useState('')
  const [buyingAmount, setBuyingAmount] = useState('')

  const handleSwapTokens = () => {
    const tempToken = sellingToken
    const tempAmount = sellingAmount
    setSellingToken(buyingToken)
    setBuyingToken(tempToken)
    setSellingAmount(buyingAmount)
    setBuyingAmount(tempAmount)
  }

  const handleSellingAmountChange = (value: string) => {
    setSellingAmount(value)
    // Mock conversion rate
    if (value && !isNaN(parseFloat(value))) {
      const converted = parseFloat(value) * 0.3
      setBuyingAmount(converted.toFixed(4))
    } else {
      setBuyingAmount('')
    }
  }

  const sellingUsdValue = sellingAmount ? `$${parseFloat(sellingAmount || '0').toFixed(2)}` : '$0'
  const buyingUsdValue = buyingAmount ? `$${(parseFloat(buyingAmount || '0') * 449.94).toFixed(2)}` : '$0'

  return (
    <div className="rounded-2xl p-6 py-8 bg-gradient-to-b from-white to-[#d2fb95]">
      <div className="relative flex flex-col gap-4">
        {/* Selling Input */}
        <div className="bg-white border border-[#dddbd0] rounded-lg px-4 pt-2 pb-4 overflow-hidden">
          <p className="text-sm font-bold text-black/30 leading-5">Selling</p>
          <div className="flex items-center justify-between mt-1.5">
            <button className="flex items-center gap-2.5 border border-[#dddbd0] rounded-md px-3 py-2">
              {sellingToken.icon}
              <div className="flex items-center gap-1">
                <span className="text-xl font-semibold text-black">{sellingToken.symbol}</span>
                <ChevronDownIcon className="w-4 h-4 opacity-50" />
              </div>
            </button>
            <div className="text-right">
              <input
                type="text"
                value={sellingAmount}
                onChange={(e) => handleSellingAmountChange(e.target.value)}
                placeholder="0.00"
                className="text-4xl font-semibold text-black/20 text-right bg-transparent outline-none w-32 placeholder:text-black/20"
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
        <div className="bg-white border border-[#dddbd0] rounded-lg px-4 pt-2 pb-4 overflow-hidden">
          <p className="text-sm font-bold text-black/30 leading-5">Buying</p>
          <div className="flex items-center justify-between mt-1.5">
            <button className="flex items-center gap-2.5 border border-[#dddbd0] rounded-md px-3 py-2">
              {buyingToken.icon}
              <div className="flex items-center gap-1">
                <span className="text-xl font-semibold text-black">{buyingToken.symbol}</span>
                <ChevronDownIcon className="w-4 h-4 opacity-50" />
              </div>
            </button>
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
        <button className="w-full h-14 bg-black text-white text-lg font-semibold rounded-lg hover:bg-black/90 transition-colors">
          Buy
        </button>
      </div>
    </div>
  )
}
