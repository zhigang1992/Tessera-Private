/**
 * Bid input card for placing bids
 * Includes validation and real-time total calculation
 */

import { useState } from 'react'
import { Send, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Auction, BidInput, BidValidation } from '../types/auction'
import { validateBidInput, calculateTotalPayment, formatPrice, formatNumber, getPhaseDisplay } from '../lib/utils'

interface BidInputCardProps {
  auction: Auction
  onSubmit?: (bid: BidInput) => void
  disabled?: boolean
}

export function BidInputCard({ auction, onSubmit, disabled = false }: BidInputCardProps) {
  const [pricePerToken, setPricePerToken] = useState<string>(auction.startingPrice.toString())
  const [tokenQuantity, setTokenQuantity] = useState<string>(auction.minBidQuantity.toString())
  const [errors, setErrors] = useState<BidValidation>({})

  const phaseInfo = getPhaseDisplay(auction.phase)

  const handlePriceChange = (value: string) => {
    setPricePerToken(value)
    validateForm(parseFloat(value) || 0, parseFloat(tokenQuantity) || 0)
  }

  const handleQuantityChange = (value: string) => {
    setTokenQuantity(value)
    validateForm(parseFloat(pricePerToken) || 0, parseFloat(value) || 0)
  }

  const validateForm = (price: number, quantity: number) => {
    const validationErrors = validateBidInput(price, quantity, auction, auction.userBid)
    setErrors(validationErrors)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const price = parseFloat(pricePerToken) || 0
    const quantity = parseFloat(tokenQuantity) || 0

    const validationErrors = validateBidInput(price, quantity, auction, auction.userBid)
    setErrors(validationErrors)

    if (!validationErrors.priceError && !validationErrors.quantityError) {
      onSubmit?.({ pricePerToken: price, tokenQuantity: quantity })
    }
  }

  const price = parseFloat(pricePerToken) || 0
  const quantity = parseFloat(tokenQuantity) || 0
  const totalPayment = calculateTotalPayment(price, quantity)
  const hasErrors = Boolean(errors.priceError || errors.quantityError)

  return (
    <Card className="border-2">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>Place Your Bid</CardTitle>
          <div className={`text-xs font-medium px-2 py-1 rounded ${phaseInfo.colorClass}`}>{phaseInfo.label}</div>
        </div>
        <CardDescription>{phaseInfo.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Price Per Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="price">
                Price per Token <span className="text-muted-foreground">({auction.paymentSymbol})</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                Min: ${formatPrice(auction.startingPrice)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                step="0.0001"
                value={pricePerToken}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder={auction.startingPrice.toString()}
                className="pl-7 font-mono"
                disabled={disabled}
                aria-invalid={Boolean(errors.priceError)}
              />
            </div>
            {errors.priceError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.priceError}
              </p>
            )}
          </div>

          {/* Token Quantity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Token Quantity</Label>
              <span className="text-xs text-muted-foreground">
                Min: {formatNumber(auction.minBidQuantity)} • Max: {formatNumber(auction.maxBidPerWallet)}
              </span>
            </div>
            <Input
              id="quantity"
              type="number"
              step="1"
              value={tokenQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder={auction.minBidQuantity.toString()}
              className="font-mono"
              disabled={disabled}
              aria-invalid={Boolean(errors.quantityError)}
            />
            {errors.quantityError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.quantityError}
              </p>
            )}
          </div>

          {/* Total Payment Display */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Payment</span>
              <span className="font-mono font-bold text-lg">
                ${formatPrice(totalPayment, 2)} {auction.paymentSymbol}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(quantity)} tokens × ${formatPrice(price)} = ${formatPrice(totalPayment, 2)}
            </div>
          </div>

          {/* Uniform Price Explainer */}
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Uniform Price Auction:</strong> All winners pay the same clearing price (the lowest winning
              bid). You'll be refunded the difference if your bid is higher.
            </div>
          </Alert>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={disabled || hasErrors}>
            <Send className="h-4 w-4 mr-2" />
            {auction.userBid ? 'Update Bid' : 'Place Bid'}
          </Button>

          {/* Current User Bid Display */}
          {auction.userBid && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
              <div className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">Current Bid</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 dark:text-green-300">
                  {formatNumber(auction.userBid.tokenQuantity)} tokens @ ${formatPrice(auction.userBid.pricePerToken)}
                </span>
                <span className="font-mono font-bold text-green-900 dark:text-green-100">
                  ${formatPrice(auction.userBid.totalPayment, 2)}
                </span>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
