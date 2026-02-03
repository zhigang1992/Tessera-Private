import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Info, Loader2, AlertCircle } from 'lucide-react'
import { useAlphaVault } from '@/hooks/use-alpha-vault'
import { ALPHA_VAULT_CONFIG } from '@/services/alpha-vault'
import { toast } from 'sonner'
import UsdcIcon from '@/pages/trade-page/components/_/token-usdc.svg?react'
import { BigNumber, math, fromTokenAmount, mathIs } from '@/lib/bignumber'

export function DepositUSDCCard() {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const [depositAmount, setDepositAmount] = useState('')

  const {
    isLoading,
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    depositQuota,
    usdcBalance,
    totalRaised,
    targetRaise,
    estimatedAllocation,
    deposit,
    error,
    clearError,
  } = useAlphaVault()

  const isDepositOpen = vaultInfo?.state === 'deposit_open'
  const canDeposit = depositQuota?.canDeposit && isDepositOpen && wallet.connected

  // Calculate current total deposit (existing + new input amount)
  const calculatedCurrentDeposit = useMemo(() => {
    if (!escrowInfo && !depositAmount) return '0 USDC'

    const existingDeposit = escrowInfo?.totalDeposited ? BigNumber.from(escrowInfo.totalDeposited) : BigNumber.from(0)

    try {
      if (depositAmount && parseFloat(depositAmount) > 0) {
        const newAmount = BigNumber.from(depositAmount)
        // Convert to raw amount with 6 decimals for USDC
        const newAmountRaw = math`${newAmount} * ${Math.pow(10, 6)}`
        const totalRaw = math`${existingDeposit} + ${newAmountRaw}`
        const totalFormatted = math`${totalRaw} / ${Math.pow(10, 6)}`
        return `${BigNumber.toNumber(totalFormatted).toLocaleString()} USDC`
      }
    } catch {
      // If parsing fails, just show existing
    }

    if (escrowInfo?.totalDeposited) {
      return `${(parseFloat(escrowInfo.totalDeposited) / 10 ** 6).toLocaleString()} USDC`
    }

    return '0 USDC'
  }, [escrowInfo, depositAmount])

  // Calculate estimated allocation based on current deposit + input
  const calculatedEstAllocation = useMemo(() => {
    if (!vaultInfo || !totalRaised) return '0 TESS'

    const existingDeposit = escrowInfo?.totalDeposited ? BigNumber.from(escrowInfo.totalDeposited) : BigNumber.from(0)

    try {
      let totalUserDeposit = existingDeposit

      if (depositAmount && parseFloat(depositAmount) > 0) {
        const newAmount = BigNumber.from(depositAmount)
        const newAmountRaw = math`${newAmount} * ${Math.pow(10, 6)}`
        totalUserDeposit = math`${existingDeposit} + ${newAmountRaw}`
      }

      // Get total raised in raw format
      const totalRaisedStr = totalRaised.replace(/,/g, '')
      const totalRaisedBN = math`${BigNumber.from(totalRaisedStr)} * ${Math.pow(10, 6)}`

      // If no deposits yet, allocation would be 100% of tokens
      if (mathIs`${totalRaisedBN} === ${0}`) {
        return '0 TESS'
      }

      // Calculate user's share: (user deposit / total raised) * total tokens
      // For now, assume 1:1 USDC to TESS ratio for simplicity
      const userShare = math`${totalUserDeposit} / ${Math.pow(10, 6)}`

      return `${BigNumber.toNumber(userShare).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} TESS`
    } catch {
      // Fallback to existing allocation if calculation fails
      return estimatedAllocation ? `${estimatedAllocation} TESS` : '0 TESS'
    }
  }, [vaultInfo, totalRaised, escrowInfo, depositAmount, estimatedAllocation])

  // Check if deposit amount exceeds wallet balance
  const exceedsBalance = useMemo(() => {
    if (!depositAmount || !usdcBalance) return false

    try {
      const balanceStr = (usdcBalance ?? '0').replace(/,/g, '')
      const balanceBN = BigNumber.from(balanceStr)
      const amountBN = BigNumber.from(depositAmount)

      return mathIs`${amountBN} > ${balanceBN}`
    } catch {
      return false
    }
  }, [depositAmount, usdcBalance])

  const handleConfirmDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount')
      return
    }

    if (!wallet.connected) {
      toast.error('Please connect your wallet')
      return
    }

    const signature = await deposit(depositAmount)

    if (signature) {
      toast.success('Deposit successful!', {
        description: `Transaction: ${signature.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              '_blank'
            ),
        },
      })
      setDepositAmount('')
    } else if (error) {
      toast.error('Deposit failed', { description: error })
      clearError()
    }
  }

  const handleMaxClick = () => {
    // Use the smaller of: user's USDC balance or remaining deposit quota
    // Convert both to BigNumber for precise comparison
    const balanceStr = (usdcBalance ?? '0').replace(/,/g, '') // Remove locale formatting
    const balanceBN = BigNumber.from(balanceStr)

    // remainingQuota is a raw token amount (with USDC decimals)
    const quotaBN = fromTokenAmount(depositQuota?.remainingQuota ?? '0', ALPHA_VAULT_CONFIG.usdcDecimals)

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
          <h3 className="text-base font-semibold text-black">Deposit USDC</h3>
        </div>
        <span
          className="text-white text-[10px] font-semibold px-2 py-1 rounded tracking-wider"
          style={{ backgroundColor: vaultStateDisplay?.color ?? '#6b7280' }}
        >
          {vaultStateDisplay?.label ?? 'LOADING'}
        </span>
      </div>

      <div className="flex flex-col gap-4">

        {/* Input Section */}
        <div className="relative rounded-lg w-full group bg-white dark:bg-[rgba(0,0,0,0.6)]">
          <div className="rounded-[inherit] size-full">
            <div className="flex flex-col gap-1.5 items-start pb-4 pt-2 px-4 w-full">
              <div className="flex items-center justify-between leading-5 text-sm w-full text-[#a1a1aa] dark:text-[#ffffff] dark:opacity-50">
                <p className="font-bold">You Deposit</p>
                <button
                  onClick={handleMaxClick}
                  className="text-xs hover:text-black dark:hover:text-white dark:hover:opacity-100 transition-colors"
                  disabled={!canDeposit}
                >
                  MAX: {usdcBalance ?? '0.00'}
                </button>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="relative rounded-md flex-shrink-0">
                  <div className="flex gap-2.5 items-center overflow-clip px-3 py-2 rounded-[inherit]">
                    <div className="relative flex-shrink-0 size-8">
                      <UsdcIcon className="block size-full" />
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <p className="font-semibold leading-7 text-xl text-black dark:text-[#ffffff]">
                        USDC
                      </p>
                    </div>
                  </div>
                  <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-md border-[#dddbd0] dark:border-[rgba(255,255,255,0.15)]" />
                </div>
                <div className="flex flex-col items-end justify-center flex-1 min-w-0">
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0"
                    disabled={!canDeposit}
                    className="font-semibold leading-10 bg-transparent outline-none border-none text-right w-full overflow-hidden text-black dark:text-white placeholder:text-black dark:placeholder:text-white text-[36px]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-lg transition-colors border-[#dddbd0] dark:border-[#393b3d] group-focus-within:border-black dark:group-focus-within:border-[#d2fb95]" />
        </div>

        {/* Balance Warning */}
        {exceedsBalance && (
          <div className="bg-[#fef2f2] dark:bg-[#7f1d1d] flex gap-2 items-start p-3 rounded-lg w-full border border-[#fca5a5] dark:border-[#dc2626]">
            <AlertCircle className="w-4 h-4 text-[#dc2626] dark:text-[#fca5a5] shrink-0 mt-0.5" />
            <p className="flex-1 font-normal leading-[16.5px] text-xs text-[#991b1b] dark:text-[#fca5a5]">
              Insufficient balance. Your wallet balance is {usdcBalance} USDC.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between h-[18px]">
            <span className="font-normal leading-[18px] text-xs text-[#666]">
              Current Deposit
            </span>
            <span className="font-normal leading-[18px] text-xs text-black font-mono">
              {calculatedCurrentDeposit}
            </span>
          </div>
          <div className="flex items-start justify-between h-[18px]">
            <div className="flex items-center gap-1">
              <span className="font-normal leading-[18px] text-xs text-[#666]">
                Est. Allocation
              </span>
              <div className="relative group">
                <Info className="w-3 h-3 text-[#666] cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  In pro-rata mode, your final allocation may change as more users deposit before the auction ends.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            <span className="font-normal leading-[18px] text-xs text-[#06a800] font-mono">
              {calculatedEstAllocation}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2.5">
          {wallet.connected ? (
            <button
              onClick={handleConfirmDeposit}
              disabled={isLoading || !canDeposit}
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
                      {!isDepositOpen
                        ? 'Deposits Closed'
                        : !depositQuota?.canDeposit
                        ? depositQuota?.reason ?? 'Cannot Deposit'
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
            <div className="bg-[rgba(255,255,255,0.5)] flex gap-2.5 items-start p-3 rounded-lg w-full">
              <Info className="w-3 h-3 text-[#666666] shrink-0" />
              <p className="flex-1 font-normal leading-[16.5px] text-[10px] text-black tracking-[0.0645px]">
                You have an active position in this auction. Check the top "My Position" card for
                real-time allocation updates.
              </p>
            </div>
          )}
        </div>

        {/* Pool Details */}
        <div className="relative flex flex-col gap-2 pt-4">
          <div aria-hidden="true" className="absolute border-t border-[rgba(210,210,210,0.1)] inset-x-0 top-0 pointer-events-none" />
          <div className="flex items-center w-full">
            <p className="font-semibold leading-[15px] text-[10px] text-black tracking-[0.1172px]">
              POOL DETAILS
            </p>
          </div>
          <div className="flex flex-col gap-2.5 items-start w-full">
            <div className="flex h-[15px] items-start justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">
                Address
              </p>
              <div className="bg-[rgba(0,0,0,0.1)] rounded flex items-center justify-center px-2 py-0.5">
                <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                  {shortenAddress(ALPHA_VAULT_CONFIG.vault)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">
                Target Raise
              </p>
              <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                ${targetRaise}
              </p>
            </div>
            <div className="flex items-center justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">
                Current Raise
              </p>
              <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                ${totalRaised}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
