import { useState } from 'react';
import { useTraderData, useBindReferralCode } from '../hooks/use-referral-queries';
import { useReferralAuth } from '../hooks/use-referral-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { UrlKeyAlertDialog } from './url-key-alert-dialog';

export default function BindCodeCard() {
  const { data: traderData, isLoading } = useTraderData();
  const bindMutation = useBindReferralCode();
  const { isAuthenticated, isAuthenticating, authenticate, showUrlKeyAlert, setShowUrlKeyAlert } = useReferralAuth();

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

  const [referralCodeInput, setReferralCodeInput] = useState('');

  const isAlreadyBound = !!traderData?.referral?.referrerCode;

  const handleBindCode = async () => {
    if (!referralCodeInput.trim()) return;

    // If not authenticated, require sign message first
    if (!isAuthenticated) {
      const signedIn = await authenticate();
      if (!signedIn) return;
    }

    await bindMutation.mutateAsync(referralCodeInput.toUpperCase());
    setReferralCodeInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and limit to reasonable length
    const value = e.target.value.toUpperCase().slice(0, 20);
    setReferralCodeInput(value);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-base text-black font-semibold dark:text-white">Referral code (Who invited you?)</h2>
        <Card className="rounded-[24px] border border-[#E4E4E7] bg-[#F7F7FA] shadow-none dark:border-[#27272A] dark:bg-[#111827]">
          <CardContent className="p-6">
            <p className="text-black/50 dark:text-white/50">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-white">Referral code (Who invited you?)</h2>

        <Card className="rounded-[24px] border border-[#E4E4E7] bg-[#F7F7FA] shadow-none dark:border-[#27272A] dark:bg-[#111827]">
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <Input
                value={referralCodeInput}
                onChange={handleInputChange}
                placeholder="Enter a code"
                disabled={isAlreadyBound || bindMutation.isPending}
                className="flex-1 h-[52px] rounded-[16px] border-0 bg-[#E9ECF2] px-4 text-base text-[#111827] placeholder:text-[#9CA3AF] focus-visible:border-[#111827]/20 focus-visible:ring-[#111827]/20 dark:bg-[#27272A] dark:text-white dark:placeholder:text-[#71717A]"
              />
              <Button
                onClick={handleBindCode}
                disabled={!referralCodeInput.trim() || isAlreadyBound || bindMutation.isPending || isAuthenticating}
                size="lg"
                className="h-[52px] min-w-[160px] rounded-[16px] bg-black px-6 text-base font-semibold text-white transition-colors hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                {(bindMutation.isPending || isAuthenticating) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {bindMutation.isPending || isAuthenticating ? 'Binding...' : 'Bind Code'}
              </Button>
            </div>

            {isAlreadyBound ? (
              <p className="text-sm font-medium text-[#111827] dark:text-white">
                You are already bound to referral code:{' '}
                <span className="font-semibold">{traderData?.referral?.referrerCode}</span>
              </p>
            ) : (
              <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">
                The account linked to this referral code will earn rewards.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <UrlKeyAlertDialog
        open={showUrlKeyAlert}
        onOpenChange={setShowUrlKeyAlert}
        onConfirm={handleUrlKeyConfirm}
        onCancel={handleUrlKeyCancel}
      />
    </>
  );
}
