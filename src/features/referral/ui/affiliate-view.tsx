import { useState } from 'react';
import { useAffiliateData, useCreateReferralCode, useRequestEmailVerification } from '../hooks/use-referral-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function AffiliateView() {
  const { data: affiliateData, isLoading } = useAffiliateData();
  const createCodeMutation = useCreateReferralCode();
  const emailMutation = useRequestEmailVerification();

  const [showCreateCode, setShowCreateCode] = useState(false);
  const [newCodeSlug, setNewCodeSlug] = useState('');
  const [activeLayer, setActiveLayer] = useState(3);

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const handleCreateCode = async () => {
    await createCodeMutation.mutateAsync({
      codeSlug: newCodeSlug.trim() || undefined,
      activeLayer,
    });
    setShowCreateCode(false);
    setNewCodeSlug('');
  };

  const handleAddEmail = async () => {
    if (!emailInput.trim()) return;
    await emailMutation.mutateAsync(emailInput.trim());
    setShowEmailDialog(false);
    setEmailInput('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading affiliate data...</p>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Failed to load affiliate data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rebates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Rebates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${affiliateData.metrics.rebatesTotal.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Upcoming</p>
          </CardContent>
        </Card>

        {/* Referral Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Referral Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {affiliateData.metrics.referralPoints.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Upcoming</p>
          </CardContent>
        </Card>

        {/* Email Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Email Linked to account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {affiliateData.email ? (
              <div>
                <p className="text-lg font-medium">{affiliateData.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {affiliateData.emailVerified ? '✓ Verified' : 'Pending verification'}
                </p>
              </div>
            ) : (
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Add Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <Button onClick={handleAddEmail} className="w-full" disabled={emailMutation.isPending}>
                      {emailMutation.isPending ? 'Sending...' : 'Send Verification Email'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tree Visualization & Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tree Diagram */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="flex flex-col items-center space-y-6">
                  {/* You */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold">
                    You
                  </div>

                  {/* L1 */}
                  <div className="flex space-x-8">
                    <div className="w-12 h-12 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <div className="w-12 h-12 rounded-full bg-slate-400 dark:bg-slate-600" />
                  </div>

                  {/* L2 */}
                  <div className="flex space-x-4">
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>

                  {/* L3 */}
                  <div className="flex space-x-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Table */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium">Trader Layers</th>
                    <th className="text-right py-2 text-sm font-medium">Traders Referred</th>
                    <th className="text-right py-2 text-sm font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3">L1</td>
                    <td className="text-right">{affiliateData.tree.l1TraderCount}</td>
                    <td className="text-right">-</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">L2</td>
                    <td className="text-right">{affiliateData.tree.l2TraderCount}</td>
                    <td className="text-right">-</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">L3</td>
                    <td className="text-right">{affiliateData.tree.l3TraderCount}</td>
                    <td className="text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Codes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Code</h3>
          <Dialog open={showCreateCode} onOpenChange={setShowCreateCode}>
            <DialogTrigger asChild>
              <Button>Create New Code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Referral Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Code Slug (leave empty for auto-generate)
                  </label>
                  <Input
                    value={newCodeSlug}
                    onChange={(e) => setNewCodeSlug(e.target.value.toUpperCase())}
                    placeholder="MYCODE123"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Active Layers</label>
                  <select
                    value={activeLayer}
                    onChange={(e) => setActiveLayer(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={1}>L1 only</option>
                    <option value={2}>L1 + L2</option>
                    <option value={3}>L1 + L2 + L3</option>
                  </select>
                </div>
                <Button onClick={handleCreateCode} className="w-full" disabled={createCodeMutation.isPending}>
                  {createCodeMutation.isPending ? 'Creating...' : 'Create Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Codes Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">Referral Code</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Total Volume</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Traders Referred</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Active Layers</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Total Rebates</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliateData.referralCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No referral codes yet. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    affiliateData.referralCodes.map((code) => (
                      <tr key={code.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono font-semibold">{code.codeSlug}</td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">
                          {code.activeLayer === 1 && 'L1'}
                          {code.activeLayer === 2 && 'L1 → L2'}
                          {code.activeLayer === 3 && 'L1 → L2 → L3'}
                        </td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(code.codeSlug)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
