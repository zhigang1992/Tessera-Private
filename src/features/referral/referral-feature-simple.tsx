import { useWalletUi } from '@wallet-ui/react';
import { WalletDropdown } from '@/components/wallet-dropdown';
import SimpleReferralHeader from './ui/simple-referral-header';
import HeroSection from './ui/hero-section';
import BindCodeCard from './ui/bind-code-card';
import CreateCodeCard from './ui/create-code-card';
import ReferralCodeModal from './ui/referral-code-modal';
import heroShot from '@/assets/heroShot.png';
import { useEffect, useState } from 'react';

export default function ReferralFeatureSimple() {
  const { connected } = useWalletUi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Check for referral code in URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      setReferralCode(code);
      setIsModalOpen(true);

      // Optional: Clean up the URL by removing the code parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

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
              <WalletDropdown />
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
        <div className="flex-1 min-w-0 sticky top-20 self-start bg-white dark:bg-black rounded-lg overflow-hidden">
          <img
            src={heroShot}
            alt=""
            className="w-full h-[calc(100vh-10rem)] object-contain"
          />
        </div>
      </div>

      {/* Referral Code Modal */}
      {referralCode && (
        <ReferralCodeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          referralCode={referralCode}
        />
      )}
    </div>
  );
}
