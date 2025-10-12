import { useState } from 'react';
import { useTraderData, useBindReferralCode } from '../hooks/use-referral-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BindCodeCard() {
  const { data: traderData, isLoading } = useTraderData();
  const bindMutation = useBindReferralCode();

  const [referralCodeInput, setReferralCodeInput] = useState('');

  const isAlreadyBound = !!traderData?.referral?.referrerCode;

  const handleBindCode = async () => {
    if (!referralCodeInput.trim()) return;
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
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-normal text-black dark:text-white">Bind referral code</h2>
        <Card className="border border-[#E4E4E7] dark:border-[#404040]">
          <CardContent className="p-6">
            <p className="text-black/50 dark:text-white/50">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-normal text-black dark:text-white">Bind referral code</h2>

      <Card className="border border-[#E4E4E7] dark:border-[#404040] shadow-sm">
        <CardContent className="p-6 flex flex-col gap-4">
          {/* Input and button row */}
          <div className="flex items-center gap-2.5">
            <Input
              value={referralCodeInput}
              onChange={handleInputChange}
              placeholder="Enter a code"
              disabled={isAlreadyBound || bindMutation.isPending}
              className="flex-1 h-[42px] text-base border-[#E4E4E7] dark:border-[#404040] bg-[#E4E4E7] dark:bg-[#27272A] rounded-lg disabled:opacity-50"
            />
            <Button
              onClick={handleBindCode}
              disabled={!referralCodeInput.trim() || isAlreadyBound || bindMutation.isPending}
              size="lg"
              className="w-[160px] h-[42px] text-base bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-lg"
            >
              {bindMutation.isPending ? 'Binding...' : 'Bind Code'}
            </Button>
          </div>

          {/* Help text or bound status */}
          {isAlreadyBound ? (
            <p className="text-sm text-black dark:text-white">
              You are already bound to referral code:{' '}
              <span className="font-semibold">{traderData?.referral?.referrerCode}</span>
            </p>
          ) : (
            <p className="text-sm text-black/70 dark:text-white/70">
              The account linked to this referral code will earn rewards proportionate to your trading volume.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
