import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useReferralAuth } from './hooks/use-referral-auth';
import { Button } from '@/components/ui/button';
import { TraderView } from './ui/trader-view';
import { AffiliateView } from './ui/affiliate-view';
import { Link } from 'react-router';

export default function ReferralFeature() {
  const { connected } = useWallet();
  const { isAuthenticated, isAuthenticating, authenticate } = useReferralAuth();
  const [activeTab, setActiveTab] = useState<'traders' | 'affiliates'>('traders');

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Referral Program</h2>
        <p className="text-muted-foreground">Connect your wallet to access the referral program</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Sign In Required</h2>
        <p className="text-muted-foreground">Sign a message to verify your wallet and access the referral program</p>
        <Button onClick={authenticate} disabled={isAuthenticating}>
          {isAuthenticating ? 'Signing...' : 'Sign Message'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Referral</h1>
        <Link to="/leaderboard" className="text-green-600 hover:underline">
          Leaderboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 border-b">
        <button
          className={`pb-2 px-1 font-medium ${
            activeTab === 'affiliates'
              ? 'border-b-2 border-black dark:border-white'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('affiliates')}
        >
          Affiliates
        </button>
        <button
          className={`pb-2 px-1 font-medium ${
            activeTab === 'traders'
              ? 'border-b-2 border-black dark:border-white'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('traders')}
        >
          Traders
        </button>
      </div>

      {/* Content */}
      {activeTab === 'traders' ? <TraderView /> : <AffiliateView />}

      {/* Rules & FAQ */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-4">Rules & FAQ</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>More information about the referral program rules and frequently asked questions will appear here.</p>
        </div>
      </div>
    </div>
  );
}
