import { useCallback } from 'react';
import { useWalletUi } from '@wallet-ui/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WalletDropdown } from '@/components/wallet-dropdown';
import { UserIcon, Loader2 } from 'lucide-react';
import { useBindReferralCode } from '../hooks/use-referral-queries';
import { useReferralAuth } from '../hooks/use-referral-auth';
import { UrlKeyAlertDialog } from './url-key-alert-dialog';
import { toast } from 'sonner';

interface ReferralCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

export default function ReferralCodeModal({
  isOpen,
  onClose,
  referralCode
}: ReferralCodeModalProps) {
  const { connected, account } = useWalletUi();
  const bindMutation = useBindReferralCode();
  const hasAccount = Boolean(connected && account);
  const handleChangeCode = () => {
    // For now, just close the modal. In the future, this could open a code input
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[342px] max-w-[342px] p-0 bg-[#F4F4F5] dark:bg-[#F4F4F5] rounded-2xl">
        <div className="flex flex-col gap-4 p-6">
          {/* Header */}
          <DialogHeader className="p-0">
            <DialogTitle className="text-base font-normal text-black">
              Join Tessera
            </DialogTitle>
          </DialogHeader>

          {/* Wallet Connection Status */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D2FB95] rounded-full flex items-center justify-center">
              {connected ? (
                <UserIcon className="w-6 h-6 text-[#979797]" />
              ) : (
                <div className="w-6 h-6 bg-[#979797] rounded-full" />
              )}
            </div>
            <div className="flex-1">
              {connected ? (
                <div>
                  <div className="text-sm font-medium text-black">
                    {account?.address
                      ? `${account.address.slice(0, 10)}...${account.address.slice(-8)}`
                      : 'Wallet Connected'
                    }
                  </div>
                  <button className="text-xs text-black/50 hover:text-black">
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="text-xs font-medium text-[#2B664B]">
                  Please Connect Wallet
                </div>
              )}
            </div>
          </div>

          {/* Referral Code Section */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-normal text-black">
              Referral code (Who invited you?)
            </label>
            <Card className="border border-[#D4D4D8] bg-white dark:bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold uppercase text-[#2B664B] font-inria-serif">
                    {referralCode}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          {hasAccount ? (
            <ReferralCodeModalConnected
              referralCode={referralCode}
              bindReferralCode={bindMutation.mutateAsync}
              bindPending={bindMutation.isPending}
              accountAddress={account!.address}
            />
          ) : (
            <WalletDropdown
              triggerVariant="default"
              triggerSize="lg"
              triggerClassName="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-black/90"
            />
          )}

          {/* Change Code Link */}
          <button
            onClick={handleChangeCode}
            className="text-xs text-[#2B664B] hover:text-[#2B664B]/80 mx-auto"
          >
            Change Referral Code
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ReferralCodeModalConnectedProps {
  referralCode: string;
  bindReferralCode: (referralCode: string) => Promise<unknown>;
  bindPending: boolean;
  accountAddress: string;
}

function ReferralCodeModalConnected({
  referralCode,
  bindReferralCode,
  bindPending,
  accountAddress,
}: ReferralCodeModalConnectedProps) {
  const { isAuthenticated, isAuthenticating, authenticate, showUrlKeyAlert, setShowUrlKeyAlert } = useReferralAuth();

  const handleUrlKeyConfirm = useCallback(async () => {
    const handlers = (window as any)._urlKeyAlertHandlers;
    if (handlers?.handleConfirm) {
      await handlers.handleConfirm();
    }
  }, []);

  const handleUrlKeyCancel = useCallback(() => {
    const handlers = (window as any)._urlKeyAlertHandlers;
    if (handlers?.handleCancel) {
      handlers.handleCancel();
    }
  }, []);

  const handleBindReferralCode = useCallback(async () => {
    if (!accountAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!referralCode.trim()) {
      toast.error('Please enter a referral code');
      return;
    }

    if (!isAuthenticated) {
      const signedIn = await authenticate();
      if (!signedIn) return;
    }

    await bindReferralCode(referralCode.toUpperCase());
  }, [accountAddress, authenticate, bindReferralCode, isAuthenticated, referralCode]);

  return (
    <>
      <Button
        onClick={handleBindReferralCode}
        disabled={bindPending || isAuthenticating}
        className="w-full bg-black hover:bg-black/90 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
      >
        {(bindPending || isAuthenticating) && <Loader2 className="w-4 h-4 animate-spin" />}
        {bindPending || isAuthenticating ? 'Binding...' : 'Bind Referral Code'}
      </Button>

      <UrlKeyAlertDialog
        open={showUrlKeyAlert}
        onOpenChange={setShowUrlKeyAlert}
        onConfirm={handleUrlKeyConfirm}
        onCancel={handleUrlKeyCancel}
      />
    </>
  );
}
