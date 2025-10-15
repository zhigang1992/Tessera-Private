import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { Navigate } from 'react-router'

export default function AccountFeatureIndex() {
  const { address } = useSolana()

  if (address) {
    return <Navigate to={`/account/${address}`} replace />
  }

  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <WalletDropdown />
      </div>
    </div>
  )
}
