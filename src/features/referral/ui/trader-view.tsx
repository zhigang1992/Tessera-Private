import { useState } from 'react';
import { useTraderData, useBindReferralCode } from '../hooks/use-referral-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';

export function TraderView() {
  const { data: traderData, isLoading } = useTraderData();
  const bindMutation = useBindReferralCode();

  const [isEditingCode, setIsEditingCode] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');

  const handleBindCode = async () => {
    if (!referralCodeInput.trim()) return;

    await bindMutation.mutateAsync(referralCodeInput.toUpperCase());
    setIsEditingCode(false);
    setReferralCodeInput('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading trader data...</p>
      </div>
    );
  }

  if (!traderData) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Failed to load trader data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trading Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Your trading vol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${traderData.metrics.tradingVolume.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Active Referral Code & Fee Rebate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Active referral code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingCode ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  maxLength={10}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleBindCode}
                  disabled={bindMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingCode(false);
                    setReferralCodeInput('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">
                  {traderData.referral?.referrerCode || '-'}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditingCode(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground mb-1">Fee Rebate</p>
              <p className="text-xl font-semibold">
                ${traderData.metrics.feeRebateTotal.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trading Points & Fee Discount */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Your trading point
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">
              {traderData.metrics.tradingPoints.toLocaleString()}
            </p>

            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground mb-1">Fee Discount</p>
              <p className="text-xl font-semibold">
                {traderData.metrics.feeDiscountPct}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discount Distribution Table */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Discount Distribution</h3>
        <Card className="bg-slate-900 text-white dark:bg-slate-950">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-normal text-slate-400">DATE</th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-slate-400">TYPE</th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-slate-400">AMOUNT</th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-slate-400">TRANSACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 text-sm" colSpan={4}>
                      <p className="text-center text-slate-500">No distribution history</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
