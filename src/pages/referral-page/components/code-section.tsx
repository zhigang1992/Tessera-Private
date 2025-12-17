import { useState } from 'react'
import { Copy, X, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReferralCode {
  code: string
  totalVolume: string
  tradersReferred: number
  totalRewards: string
}

interface ReferralUser {
  email: string
  dateJoined: string
  type: string
  pointsEarned: number
  rewardEarned: string
}

const mockCodes: ReferralCode[] = [
  { code: 'JFHDKSKL9', totalVolume: '$3,029,483.00', tradersReferred: 100, totalRewards: '$2,939.00' },
  { code: 'JFHDKSKL1', totalVolume: '$3,029,483.00', tradersReferred: 100, totalRewards: '$2,939.00' },
  { code: 'JFHDKSKL2', totalVolume: '$3,029,483.00', tradersReferred: 100, totalRewards: '$2,939.00' },
]

const mockUsers: ReferralUser[] = [
  { email: 'm****@hotmain.com', dateJoined: 'Dec 12, 2025', type: 'L1', pointsEarned: 0, rewardEarned: '0 SOL' },
]

export function CodeSection() {
  const [activeTab, setActiveTab] = useState<'code' | 'reward'>('code')
  const [selectedCode, setSelectedCode] = useState<string | null>('JFHDKSKL2')

  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('code')}
            className={cn(
              'pb-2 text-sm font-medium transition-colors',
              activeTab === 'code'
                ? 'border-b-2 border-black text-black'
                : 'text-muted-foreground hover:text-black'
            )}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('reward')}
            className={cn(
              'pb-2 text-sm font-medium transition-colors',
              activeTab === 'reward'
                ? 'border-b-2 border-black text-black'
                : 'text-muted-foreground hover:text-black'
            )}
          >
            Reward distribution
          </button>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80">
          <Plus className="h-4 w-4" />
          Create new code
        </button>
      </div>

      {/* Code Table */}
      {activeTab === 'code' && (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Referral Code
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Total Volume
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Traders Referred
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Total Rewards
                </th>
              </tr>
            </thead>
            <tbody>
              {mockCodes.map((row) => (
                <tr
                  key={row.code}
                  onClick={() => setSelectedCode(row.code)}
                  className={cn(
                    'cursor-pointer border-b border-gray-50 last:border-0 transition-colors',
                    selectedCode === row.code ? 'bg-[#D2FB95]' : 'hover:bg-gray-50'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">{row.code}</span>
                      <button className="text-muted-foreground hover:text-black">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="text-muted-foreground hover:text-black">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-black">{row.totalVolume}</td>
                  <td className="px-6 py-4 text-black">{row.tradersReferred}</td>
                  <td className="px-6 py-4 text-black">{row.totalRewards}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-6 py-4">
            {[1, 2, 3, 4, 5, '...', 10].map((page, i) => (
              <button
                key={i}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
                  page === 1
                    ? 'bg-black text-white'
                    : 'text-muted-foreground hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Code Details */}
      {selectedCode && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg font-bold text-black">{selectedCode}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              (<User className="h-4 w-4" /> 9)
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                  Email/Wallet
                </th>
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                  Date Joined
                </th>
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                  Points Earned
                </th>
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                  Reward Earned
                </th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-4 text-black">{user.email}</td>
                  <td className="py-4 text-muted-foreground">{user.dateJoined}</td>
                  <td className="py-4 text-muted-foreground">{user.type}</td>
                  <td className="py-4 text-black">{user.pointsEarned}</td>
                  <td className="py-4 text-black">{user.rewardEarned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
