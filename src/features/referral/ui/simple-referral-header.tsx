import { useWalletUi, ellipsify } from '@wallet-ui/react';
import { WalletDropdown } from '@/components/wallet-dropdown';
import TesseraLogo from '@/assets/Terrera Logo.svg?react';

export default function SimpleReferralHeader() {
  const { account, connected, disconnect } = useWalletUi();

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center">
        <TesseraLogo className="text-black dark:text-white" />
      </div>

      {/* Wallet info or connect button */}
      {connected && account ? (
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#D2FB95] flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white" />
          </div>

          {/* Wallet address and disconnect */}
          <div className="flex flex-col gap-0">
            <span className="text-base font-normal text-black dark:text-white">
              {ellipsify(account.address, 6)}
            </span>
            <button
              onClick={disconnect}
              className="text-xs text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors text-left"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <WalletDropdown />
      )}
    </div>
  );
}
