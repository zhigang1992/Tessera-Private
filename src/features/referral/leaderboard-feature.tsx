import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useLeaderboard } from './hooks/use-referral-queries';
import { Card, CardContent } from '@/components/ui/card';

export default function LeaderboardFeature() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'trading' | 'referral'>('referral');
  const { data: leaderboardData, isLoading } = useLeaderboard(100);

  const maskWalletAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-5)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const userWalletAddress = publicKey?.toBase58();

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex space-x-8 border-b">
        <button
          className={`pb-2 px-1 font-medium ${
            activeTab === 'trading'
              ? 'border-b-2 border-black dark:border-white'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('trading')}
        >
          Trading Leaderboard
        </button>
        <button
          className={`pb-2 px-1 font-medium ${
            activeTab === 'referral'
              ? 'border-b-2 border-black dark:border-white'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('referral')}
        >
          Referral Leaderboard
        </button>
      </div>

      {/* Content */}
      {activeTab === 'trading' ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Trading leaderboard coming soon...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : !leaderboardData || leaderboardData.entries.length === 0 ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">No leaderboard data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold">Rank(Top100)</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold">User</th>
                      <th className="text-right py-4 px-6 text-sm font-semibold">Total Rebates</th>
                      <th className="text-right py-4 px-6 text-sm font-semibold">Referral Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.entries.map((entry) => {
                      const isCurrentUser = entry.walletAddress === userWalletAddress;

                      return (
                        <tr
                          key={entry.rank}
                          className={`border-b hover:bg-muted/30 ${
                            isCurrentUser ? 'bg-green-50 dark:bg-green-950/20' : ''
                          }`}
                        >
                          <td className="py-4 px-6 font-medium">
                            {entry.rank}
                            {isCurrentUser && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded">
                                You
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-sm">
                            {entry.displayName || maskWalletAddress(entry.walletAddress)}
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-green-600">
                            {formatCurrency(entry.rebatesTotal)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {entry.referralPoints.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {leaderboardData && (
              <div className="p-4 border-t text-sm text-muted-foreground text-center">
                Last updated: {new Date(leaderboardData.snapshotAt).toLocaleString()}
                {leaderboardData.cached && ' (cached)'}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
