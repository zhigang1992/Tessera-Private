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
    <div className="min-h-screen bg-white pb-12 dark:bg-black">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-12 px-6 pt-8 sm:px-10 lg:flex-row lg:items-start lg:gap-16 lg:px-16 lg:pt-12">
        <div className="flex w-full max-w-[560px] flex-shrink-0 flex-col gap-6 lg:gap-8">
          <SimpleReferralHeader />

          <div className="h-px rounded-full bg-[#E7E7EA] dark:bg-[#27272A]" />

          <HeroSection />

          <div className="h-px rounded-full bg-[#E7E7EA] dark:bg-[#27272A]" />

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
          <div className="mt-8 text-center text-xs text-black/50 dark:text-white/50">
            © 2025 Tessera PE. All rights reserved.
          </div>
        </div>

        <div className="relative w-full overflow-hidden rounded-[32px] bg-[#F4F4F5] dark:bg-[#09090B] sm:max-h-[520px] lg:sticky lg:top-16 lg:max-h-none lg:flex-1 lg:self-start">
          <img
            src={heroShot}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>

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
