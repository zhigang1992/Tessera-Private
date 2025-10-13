import React, { useState } from 'react';
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
import { UserIcon } from 'lucide-react';
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
  const { isAuthenticated, isAuthenticating, authenticate, showUrlKeyAlert, setShowUrlKeyAlert } = useReferralAuth();
  const [newReferralCode, setNewReferralCode] = useState(referralCode);

  const handleUrlKeyConfirm = async () => {
    const handlers = (window as any)._urlKeyAlertHandlers;
    if (handlers?.handleConfirm) {
      await handlers.handleConfirm();
    }
  };

  const handleUrlKeyCancel = () => {
    const handlers = (window as any)._urlKeyAlertHandlers;
    if (handlers?.handleCancel) {
      handlers.handleCancel();
    }
  };

  const handleConnectWallet = () => {
    // We'll let the WalletDropdown handle the connection
    // No need to close the modal here
  };

  const handleBindReferralCode = async () => {
    if (!connected || !account?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!newReferralCode.trim()) {
      toast.error('Please enter a referral code');
      return;
    }

    // If not authenticated, require sign message first
    if (!isAuthenticated) {
      const signedIn = await authenticate();
      if (!signedIn) return;
    }

    try {
      await bindMutation.mutateAsync(newReferralCode.toUpperCase());
      toast.success('Referral code bound successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to bind referral code:', error);
      toast.error('Failed to bind referral code. Please try again.');
    }
  };

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
                <div className="flex items-center gap-2">
                  <div className="text-xs text-[#2B664B] font-medium">
                    Please Connect Wallet
                  </div>
                  <WalletDropdown />
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
          <Button
            onClick={connected ? handleBindReferralCode : handleConnectWallet}
            className="w-full bg-black hover:bg-black/90 text-white rounded-lg py-3 text-sm font-medium"
          >
            {connected ? 'Bind Referral Code' : 'Connect Wallet'}
          </Button>

          {/* Change Code Link */}
          <button
            onClick={handleChangeCode}
            className="text-xs text-[#2B664B] hover:text-[#2B664B]/80 mx-auto"
          >
            Change Referral Code
          </button>
        </div>
      </DialogContent>

      {/* URL Key Alert Dialog for wallet authentication */}
      <UrlKeyAlertDialog
        open={showUrlKeyAlert}
        onOpenChange={setShowUrlKeyAlert}
        onConfirm={handleUrlKeyConfirm}
        onCancel={handleUrlKeyCancel}
      />
    </Dialog>
  );
}