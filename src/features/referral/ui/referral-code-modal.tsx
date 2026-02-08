import { useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { Loader2, UserIcon } from 'lucide-react'
import { useBindReferralCode } from '../hooks/use-referral-onchain'
import { toast } from 'sonner'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

interface ReferralCodeModalProps {
  isOpen: boolean
  onClose: () => void
  referralCode: string
}

export default function ReferralCodeModal({ isOpen, onClose, referralCode }: ReferralCodeModalProps) {
  const { connected, publicKey, disconnect } = useWallet()
  const accountAddress = publicKey?.toBase58()
  const bindMutation = useBindReferralCode()
  const hasAccount = Boolean(connected && accountAddress)
  const { visible } = useWalletModal()

  const handleChangeCode = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen && !visible} onOpenChange={onClose}>
      <DialogContent className="w-[342px] max-w-[342px] rounded-2xl bg-secondary p-0">
        <div className="flex flex-col gap-4 p-6">
          <DialogHeader className="p-0">
            <DialogTitle className="text-base font-normal">Join Tessera</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-200 dark:bg-green-900/30">
              {connected ? (
                <UserIcon className="h-6 w-6 text-muted-foreground" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              {connected ? (
                <div>
                  <div className="text-sm font-medium">
                    {accountAddress
                      ? `${accountAddress.slice(0, 10)}...${accountAddress.slice(-8)}`
                      : 'Wallet Connected'}
                  </div>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => disconnect().catch((error) => console.error('Failed to disconnect', error))}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="text-xs font-medium text-green-700 dark:text-green-500">Please Connect Wallet</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base font-normal">Referral code (Who invited you?)</label>
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="font-inria-serif text-4xl font-bold uppercase text-green-700 dark:text-green-500">{referralCode}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {hasAccount ? (
            <ReferralCodeModalConnected
              referralCode={referralCode}
              bindReferralCode={bindMutation.mutateAsync}
              bindPending={bindMutation.isPending}
              accountAddress={accountAddress!}
              onClose={onClose}
            />
          ) : (
            <WalletDropdown
              triggerVariant="default"
              triggerSize="lg"
              triggerClassName="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            />
          )}

          <button onClick={handleChangeCode} className="mx-auto text-xs text-green-700 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400">
            Change Referral Code
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ReferralCodeModalConnectedProps {
  referralCode: string
  bindReferralCode: (referralCode: string) => Promise<{ code: string; txSignature: string }>
  bindPending: boolean
  accountAddress: string
  onClose: () => void
}

function ReferralCodeModalConnected({
  referralCode,
  bindReferralCode,
  bindPending,
  accountAddress,
  onClose,
}: ReferralCodeModalConnectedProps) {
  const handleBindReferralCode = useCallback(async () => {
    if (!accountAddress) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!referralCode.trim()) {
      toast.error('Please enter a referral code')
      return
    }

    const normalizedCode = referralCode.trim().toUpperCase()

    try {
      await bindReferralCode(normalizedCode)
      onClose()
    } catch (error) {
      console.error('Failed to bind referral code', error)
    }
  }, [accountAddress, bindReferralCode, onClose, referralCode])

  const isProcessing = bindPending
  const buttonLabel = bindPending ? 'Binding...' : 'Bind Referral Code'

  return (
    <>
      <Button
        onClick={handleBindReferralCode}
        disabled={isProcessing}
        className="flex w-full items-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonLabel}
      </Button>
    </>
  )
}
