import { useState, useMemo } from 'react'
import { useWallet, useWalletModal } from '@/hooks/use-wallet'
import { Info, Loader2, AlertCircle } from 'lucide-react'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenAmount } from '@/components/app-token-amount'
import { getExplorerUrl } from '@/config'
import { toast } from 'sonner'
import { BigNumber, math, fromTokenAmount, mathIs } from '@/lib/bignumber'
import { useAuctionToken } from '../../context'
import type { UsePresaleVaultReturn } from '@/hooks/use-presale-vault'

interface PresaleDepositCardProps {
  presaleVault: UsePresaleVaultReturn
}

export function PresaleDepositCard({ presaleVault }: PresaleDepositCardProps) {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const [depositAmount, setDepositAmount] = useState('')
  const token = useAuctionToken()

  if (!presaleVault.available) return null

  const {
    config,
    isLoading,
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    depositQuota,
    usdcBalance,
    totalRaised,
    targetRaise,
    deposit,
    error,
    clearError,
  } = presaleVault

  const presaleLabel = config.label
  const quoteDecimals = config?.quoteDecimals ?? 6

  const quoteToken = config?.quoteToken ?? null

  const isDepositOpen = vaultInfo?.state === 'deposit_open'
  const depositsNotStarted = vaultInfo?.presaleStartTime && vaultInfo.presaleStartTime.getTime() > Date.now()
  const canDeposit = !depositsNotStarted && isDepositOpen && depositQuota?.canDeposit && wallet.connected

  const existingDepositAmount = useMemo(() => {
    return escrowInfo?.totalDeposited ?? BigNumber.from(0)
  }, [escrowInfo?.totalDeposited])

  const afterThisDepositAmount = useMemo(() => {
    const existing = escrowInfo?.totalDeposited ?? BigNumber.from(0)
    if (!depositAmount || parseFloat(depositAmount) <= 0) return existing
    try {
      const newAmount = BigNumber.from(depositAmount)
      return math`${existing} + ${newAmount}`
    } catch {
      return existing
    }
  }, [escrowInfo?.totalDeposited, depositAmount])

  const exceedsBalance = useMemo(() => {
    if (!depositAmount || !usdcBalance) return false
    try {
      const amountBN = BigNumber.from(depositAmount)
      return mathIs`${amountBN} > ${usdcBalance}`
    } catch {
      return false
    }
  }, [depositAmount, usdcBalance])

  const exceedsRemainingQuota = useMemo(() => {
    if (!depositAmount || !depositQuota) return false
    try {
      const amountBN = BigNumber.from(depositAmount)
      const remainingQuotaBN = fromTokenAmount(depositQuota.remainingQuota, quoteDecimals)
      return mathIs`${amountBN} > ${remainingQuotaBN}`
    } catch {
      return false
    }
  }, [depositAmount, depositQuota, quoteDecimals])

  const handleConfirmDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount')
      return
    }

    if (!wallet.connected) {
      toast.error('Please connect your wallet')
      return
    }

    clearError()

    try {
      const signature = await deposit(depositAmount, () => {
        setDepositAmount('')
      })

      if (signature) {
        toast.success(`${presaleLabel} deposit successful!`, {
          description: `Transaction: ${signature.slice(0, 8)}...`,
          action: {
            label: 'View',
            onClick: () => window.open(getExplorerUrl(signature), '_blank'),
          },
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed'
      toast.error('Deposit failed', { description: message })
    }
  }

  const handleMaxClick = () => {
    const balanceBN = usdcBalance ?? BigNumber.from(0)
    const quotaBN = fromTokenAmount(depositQuota?.remainingQuota ?? '0', quoteDecimals)
    const maxAmountBN = math`min(${balanceBN}, ${quotaBN})`
    setDepositAmount(BigNumber.toString(maxAmountBN))
  }

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className="w-full rounded-2xl border p-6 bg-gradient-to-b from-[#d4e8ff] to-[#95c5fb] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-black">
            {presaleLabel} Deposit {quoteToken && <AppTokenName token={quoteToken} variant="symbol" />}
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
                    Balance: {quoteToken && <AppTokenAmount token={quoteToken} amount={usdcBalance ?? BigNumber.from(0)} />} {quoteToken && <AppTokenName token={quoteToken} variant="symbol" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="relative rounded-md flex-shrink-0">
                  <div className="flex gap-2.5 items-center overflow-clip px-3 py-2 rounded-[inherit]">
                    {quoteToken && (
                      <>
                        <div className="relative flex-shrink-0 size-8">
                          <AppTokenIcon token={quoteToken} size={32} className="block size-full" />
                        </div>
                        <div className="flex gap-1 items-center flex-shrink-0">
                          <p className="font-semibold leading-7 text-xl text-black dark:text-[#ffffff]">
                            <AppTokenName token={quoteToken} variant="symbol" />
                          </p>
                        </div>
                      </>
                    )}
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
            className="absolute border border-solid inset-0 pointer-events-none rounded-lg transition-colors border-[#dddbd0] dark:border-[#393b3d] group-focus-within:border-black dark:group-focus-within:border-[#95c5fb]"
          />
        </div>

        {/* Balance Warning */}
        {exceedsBalance && (
          <div className="bg-[#fef2f2] dark:bg-[#7f1d1d] flex gap-2 items-start p-3 rounded-lg w-full border border-[#fca5a5] dark:border-[#dc2626]">
            <AlertCircle className="w-4 h-4 text-[#dc2626] dark:text-[#fca5a5] shrink-0 mt-0.5" />
            <p className="flex-1 font-normal leading-[16.5px] text-xs text-[#991b1b] dark:text-[#fca5a5]">
              Insufficient balance. Your wallet balance is{' '}
              {quoteToken && <AppTokenAmount token={quoteToken} amount={usdcBalance ?? BigNumber.from(0)} />}{' '}
              {quoteToken && <AppTokenName token={quoteToken} variant="symbol" />}.
            </p>
          </div>
        )}

        {/* Quota Warning */}
        {exceedsRemainingQuota && depositQuota && quoteToken && (
          <div className="bg-[#fef2f2] dark:bg-[#7f1d1d] flex gap-2 items-start p-3 rounded-lg w-full border border-[#fca5a5] dark:border-[#dc2626]">
            <AlertCircle className="w-4 h-4 text-[#dc2626] dark:text-[#fca5a5] shrink-0 mt-0.5" />
            <p className="flex-1 font-normal leading-[16.5px] text-xs text-[#991b1b] dark:text-[#fca5a5]">
              Amount exceeds remaining quota. Your remaining deposit quota is{' '}
              <AppTokenAmount token={quoteToken} amount={fromTokenAmount(depositQuota.remainingQuota, quoteDecimals)} />{' '}
              <AppTokenName token={quoteToken} variant="symbol" />.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between h-[18px]">
            <span className="font-normal leading-[18px] text-xs text-[#666]">Current Deposit</span>
            <span className="font-normal leading-[18px] text-xs text-black font-mono flex items-center gap-1">
              {quoteToken && <AppTokenAmount token={quoteToken} amount={existingDepositAmount} />}
              {quoteToken && <AppTokenName token={quoteToken} variant="symbol" />}
            </span>
          </div>
          <div className="flex items-start justify-between h-[18px]">
            <span className="font-normal leading-[18px] text-xs text-[#666]">After This Deposit</span>
            <span className="font-normal leading-[18px] text-xs text-black font-mono flex items-center gap-1">
              {quoteToken && <AppTokenAmount token={quoteToken} amount={afterThisDepositAmount} />}
              {quoteToken && <AppTokenName token={quoteToken} variant="symbol" />}
            </span>
          </div>
        </div>

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
                        : depositsNotStarted
                          ? `${presaleLabel} Not Started`
                          : !isDepositOpen
                            ? vaultInfo.state === 'completed'
                              ? `${presaleLabel} Complete`
                              : `${presaleLabel} Ended`
                            : !depositQuota?.canDeposit
                              ? (depositQuota?.reason ?? 'Cannot Deposit')
                              : `Confirm ${presaleLabel} Deposit`}
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

          {escrowInfo && (
            <div className="bg-[rgba(255,255,255,0.5)] flex gap-2.5 items-center p-3 rounded-lg w-full">
              <Info className="w-3 h-3 text-[#666666] shrink-0" />
              <p className="flex-1 font-normal leading-[16.5px] text-[10px] text-black tracking-[0.0645px]">
                You have an active position in this {presaleLabel.toLowerCase()}. Check the "My Position" card for details.
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
            <p className="font-semibold leading-[15px] text-[10px] text-black tracking-[0.1172px]">{presaleLabel.toUpperCase()} DETAILS</p>
          </div>
          <div className="flex flex-col gap-2.5 items-start w-full">
            <div className="flex h-[15px] items-start justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">Address</p>
              <div className="bg-[rgba(0,0,0,0.1)] rounded flex items-center justify-center px-2 py-0.5">
                <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                  {config?.presaleAddress ? shortenAddress(config.presaleAddress) : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">Max Cap</p>
              <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                {quoteToken && <>$<AppTokenAmount token={quoteToken} amount={targetRaise} /></>}
              </p>
            </div>
            <div className="flex items-center justify-between w-full">
              <p className="font-normal leading-[15px] text-[#666] text-[10px] tracking-[0.1172px]">Current Raised</p>
              <p className="font-mono font-normal leading-[15px] text-[10px] text-black">
                {quoteToken && <>$<AppTokenAmount token={quoteToken} amount={totalRaised} /></>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
