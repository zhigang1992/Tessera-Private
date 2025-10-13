import { useAffiliateData, useCreateReferralCode } from '../hooks/use-referral-queries';
import { useReferralAuth } from '../hooks/use-referral-auth';
import { useWalletUi } from '@wallet-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Plus, Share2 } from 'lucide-react';
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
    const url = `${window.location.origin}/referral?code=${code}`;
    copyToClipboard(url);
    toast.success('Referral link copied!');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-white">Create my referral code</h2>
        <Card className="border border-[#E4E4E7] dark:border-[#404040]">
          <CardContent className="p-6">
            <p className="text-black/50 dark:text-white/50">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Section header with create button */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-black dark:text-white">Create my referral code</h2>
          {!hasNoCodes && (
            <Button
              onClick={handleCreateCode}
              disabled={createCodeMutation.isPending || isAuthenticating}
              size="sm"
              className="h-10 px-3 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {createCodeMutation.isPending || isAuthenticating ? 'Creating...' : 'Create new code'}
            </Button>
          )}
        </div>

        <Card className="border border-[#D4D4D8] dark:border-[#404040] shadow-sm">
          <CardContent className="p-6 flex flex-col gap-6">
            {hasNoCodes ? (
              /* Empty state */
              <div className="flex items-center justify-center h-[200px] bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)] rounded-lg">
                <Button
                  onClick={handleCreateCode}
                  disabled={createCodeMutation.isPending || isAuthenticating}
                  size="sm"
                  className="h-10 px-3 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-lg flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  {createCodeMutation.isPending || isAuthenticating ? 'Creating...' : 'Create new code to earn Rewards'}
                </Button>
              </div>
            ) : (
              /* Filled state - Table of codes */
              <div className="flex flex-col gap-4">
                {/* Table header */}
                <div className="flex items-center gap-2.5 px-2.5">
                  <div className="w-[240px]">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Referral Code</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Traders Referred</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[rgba(17,17,17,0.15)] dark:bg-[rgba(255,255,255,0.15)] mx-2.5" />

                {/* Table rows */}
                <div className="flex flex-col gap-[5px]">
                  {referralCodes.map((code, index) => (
                    <div
                      key={code.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded ${
                        index % 2 === 0
                          ? 'bg-[#FAFAFA] dark:bg-[#18181B]'
                          : 'bg-white dark:bg-black'
                      }`}
                    >
                      {/* Code with copy and share buttons */}
                      <div className="w-[240px] flex items-center gap-[5px]">
                        <span className="text-sm font-semibold uppercase text-[#404040] dark:text-[#D4D4D8]">
                          {code.codeSlug}
                        </span>
                        <button
                          onClick={() => copyToClipboard(code.codeSlug)}
                          className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4 text-[#A1A1AA] dark:text-[#71717A]" />
                        </button>
                        <button
                          onClick={() => shareCode(code.codeSlug)}
                          className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
                          title="Share referral link"
                        >
                          <Share2 className="w-4 h-4 text-[#A1A1AA] dark:text-[#71717A]" />
                        </button>
                      </div>

                      {/* Traders count */}
                      <div className="flex-1 flex items-center">
                        <span className="text-sm text-black dark:text-white">
                          {/* We don't have this data from backend yet, show placeholder */}
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
                      className="w-10 h-10 p-0 bg-black dark:bg-white text-white dark:text-black rounded-lg"
                    >
                      1
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-10 h-10 p-0 bg-[rgba(212,212,216,0.4)] dark:bg-[rgba(255,255,255,0.1)] text-black dark:text-white rounded-lg"
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
