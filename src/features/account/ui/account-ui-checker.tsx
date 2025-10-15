import { useSolana } from '@/components/solana/use-solana'
import { address } from 'gill'
import { AccountUiBalanceCheck } from './account-ui-balance-check'

export function AccountUiChecker() {
  const { address: walletAddress } = useSolana()
  if (!walletAddress) {
    return null
  }
  return <AccountUiBalanceCheck address={address(walletAddress)} />
}
