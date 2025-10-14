import { useAffiliateData, useCreateReferralCode } from '../hooks/use-referral-queries';
import { useReferralAuth } from '../hooks/use-referral-auth';
import { useWalletUi } from '@wallet-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Plus, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UrlKeyAlertDialog } from './url-key-alert-dialog';

export default function CreateCodeCard() {
  const { account, connected } = useWalletUi();
  const { data: affiliateData, isLoading } = useAffiliateData(connected, account?.address);
  const createCodeMutation = useCreateReferralCode();
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

  const referralCodes = affiliateData?.referralCodes || [];
  const hasNoCodes = referralCodes.length === 0;

  const handleCreateCode = async () => {
    // If not authenticated, require sign message first
    if (!isAuthenticated) {
      const signedIn = await authenticate();
      if (!signedIn) return;
    }

    // Auto-generate code (no custom slug or active layer)
    await createCodeMutation.mutateAsync({});
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareCode = (code: string) => {
    // Simple share functionality - can be enhanced with native share API
    const url = `${window.location.origin}/?code=${code}`;
    copyToClipboard(url);
    toast.success('Referral link copied!');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-white">Create my referral code</h2>
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
        {/* Section header with create button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-white">Create my referral code</h2>
          {!hasNoCodes && (
            <Button
              onClick={handleCreateCode}
              disabled={createCodeMutation.isPending || isAuthenticating}
              size="sm"
              className="flex h-10 items-center gap-2 rounded-full bg-black px-4 text-xs font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {(createCodeMutation.isPending || isAuthenticating) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {createCodeMutation.isPending || isAuthenticating ? 'Creating...' : 'Create new code'}
            </Button>
          )}
        </div>

        <Card className="rounded-[24px] border border-[#E4E4E7] bg-[#F7F7FA] shadow-none dark:border-[#27272A] dark:bg-[#111827]">
          <CardContent className="flex flex-col gap-5 p-5">
            {hasNoCodes ? (
              /* Empty state */
              <div className="flex min-h-[200px] items-center justify-center rounded-[20px] border border-dashed border-[#D4D4D8] bg-white px-6 py-10 text-center dark:border-[#3F3F46] dark:bg-[#1F1F23]">
                <Button
                  onClick={handleCreateCode}
                  disabled={createCodeMutation.isPending || isAuthenticating}
                  size="sm"
                  className="flex h-12 items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {(createCodeMutation.isPending || isAuthenticating) ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  {createCodeMutation.isPending || isAuthenticating ? 'Creating...' : 'Create new code to earn Rewards'}
                </Button>
              </div>
            ) : (
              /* Filled state - Table of codes */
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-[240px]">
                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#6B7280] dark:text-[#A1A1AA]">
                      Referral Code
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#6B7280] dark:text-[#A1A1AA]">
                      Traders Referred
                    </span>
                  </div>
                </div>

                <div className="mx-2 h-px bg-[#E2E4E9] dark:bg-[#27272A]" />

                <div className="flex flex-col gap-2">
                  {referralCodes.map((code, index) => (
                    <div
                      key={code.id}
                      className={`flex items-center gap-3 rounded-[16px] px-3 py-4 transition-colors ${
                        index % 2 === 0
                          ? 'bg-white dark:bg-[#1F1F23]'
                          : 'bg-[#F1F2F6] dark:bg-[#131318]'
                      }`}
                    >
                      <div className="flex w-[240px] items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[#111827] dark:text-[#E4E4E7]">
                          {code.codeSlug}
                        </span>
                        <button
                          onClick={() => copyToClipboard(code.codeSlug)}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5E7EB] text-[#4B5563] transition hover:bg-[#D1D5DB] dark:bg-[#27272A] dark:text-[#D1D5DB]"
                          title="Copy code"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => shareCode(code.codeSlug)}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5E7EB] text-[#4B5563] transition hover:bg-[#D1D5DB] dark:bg-[#27272A] dark:text-[#D1D5DB]"
                          title="Share referral link"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-1 items-center">
                        <span className="text-sm font-medium text-[#111827] dark:text-white">
                          -
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination (if needed in the future) */}
                {referralCodes.length > 10 && (
                  <div className="flex items-center justify-center gap-[5px] mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-10 w-10 rounded-full bg-black p-0 text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      1
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 w-10 rounded-full bg-[rgba(212,212,216,0.4)] p-0 text-black hover:bg-[rgba(212,212,216,0.6)] dark:bg-[rgba(255,255,255,0.1)] dark:text-white dark:hover:bg-[rgba(255,255,255,0.18)]"
                    >
                      2
                    </Button>
                  </div>
                )}
              </div>
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
