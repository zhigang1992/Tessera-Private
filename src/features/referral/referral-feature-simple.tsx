import { useWalletUi } from '@wallet-ui/react';
import { useReferralAuth } from './hooks/use-referral-auth';
import { Button } from '@/components/ui/button';
import SimpleReferralHeader from './ui/simple-referral-header';
import HeroSection from './ui/hero-section';
import BindCodeCard from './ui/bind-code-card';
import CreateCodeCard from './ui/create-code-card';
import heroShot from '@/assets/heroShot.jpg';

export default function ReferralFeatureSimple() {
  const { connected } = useWalletUi();
  const { isAuthenticated, isAuthenticating, authenticate } = useReferralAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Main container with side-by-side layout */}
      <div className="flex gap-20 p-20 max-w-[1600px] mx-auto">
        {/* Left side - Content (600px fixed width) */}
        <div className="w-[600px] flex-shrink-0 flex flex-col gap-6">
          {/* Header */}
          <SimpleReferralHeader />

          {/* Divider */}
          <div className="h-px bg-[#DDDDDD]" />

          {/* Hero Section */}
          <HeroSection />

          {/* Divider */}
          <div className="h-px bg-[#DDDDDD]" />

          {/* Main Content */}
          {!connected ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <h2 className="text-2xl font-bold text-black dark:text-white">Referral Program</h2>
              <p className="text-black/50 dark:text-white/50">
                Connect your wallet to access the referral program
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <h2 className="text-2xl font-bold text-black dark:text-white">Sign In Required</h2>
              <p className="text-black/50 dark:text-white/50">
                Sign a message to verify your wallet and access the referral program
              </p>
              <Button onClick={authenticate} disabled={isAuthenticating} size="lg">
                {isAuthenticating ? 'Signing...' : 'Sign Message'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Bind referral code section */}
              <BindCodeCard />

              {/* Create referral code section */}
              <CreateCodeCard />
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-black/50 dark:text-white/50 mt-12">
            © 2025 Tessera PE. All rights reserved.
          </div>
        </div>

        {/* Right side - Background image (fixed proportion) */}
        <div className="flex-1 min-w-0 sticky top-20 self-start">
          <img
            src={heroShot}
            alt=""
            className="w-full h-[calc(100vh-10rem)] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
