import { useState, useEffect, useMemo, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { User, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, getReferralUsersByCode } from '@/services'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { Pagination } from '@/components/ui/pagination'
import CopyIcon from './_/copy.svg?react'
import XIcon from './_/x.svg?react'
import AddIcon from './_/add.svg?react'
import { CreateReferralCodeModal } from './create-referral-code-modal'
import { ShareReferralCodeModal } from './share-referral-code-modal'
import { useAffiliateData } from '@/features/referral/hooks/use-referral-queries'

const PAGE_SIZE = 3

export function CodeSection() {
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const [activeTab, setActiveTab] = useState<'code' | 'reward'>('code')
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [shareModalCode, setShareModalCode] = useState<string | null>(null)

  const { data: affiliateData, isLoading: codesLoading } = useAffiliateData(connected, walletAddress)

  // Transform affiliate data to match the expected format
  const codes = useMemo(() => {
    if (!affiliateData?.referralCodes) return []
    return affiliateData.referralCodes.map((code) => ({
      code: code.codeSlug,
      totalVolume: 0, // This data is not available from affiliate endpoint
      tradersReferred: code.referredTraderCount,
      totalRewards: 0, // This data is not available from affiliate endpoint
    }))
  }, [affiliateData])

  // Fetch users for selected code
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['referralUsers', selectedCode],
    queryFn: () => getReferralUsersByCode(selectedCode!),
    enabled: !!selectedCode,
  })

  // Pagination logic
  const totalPages = Math.ceil(codes.length / PAGE_SIZE)
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return codes.slice(start, start + PAGE_SIZE)
  }, [codes, currentPage])

  const handleCopyCode = useCallback((e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
  }, [])

  const handleShareOnX = useCallback((e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    const text = `Check out this referral code: ${code}`
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }, [])

  const handleOpenShareModal = useCallback((e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    setShareModalCode(code)
  }, [])

  useEffect(() => {
    if (codes.length > 0 && !selectedCode) {
      setSelectedCode(codes[0].code)
    }
  }, [codes, selectedCode])

  // Reset page when codes change
  useEffect(() => {
    setCurrentPage(1)
  }, [codes.length])

  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded-xl px-1 sm:px-2 py-1.5 dark:bg-[#1E1F20]">
          <button
            onClick={() => setActiveTab('code')}
            className={cn(
              'rounded-md px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors',
              activeTab === 'code' ? 'bg-white dark:bg-[#3F3F46] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('reward')}
            className={cn(
              'rounded-md px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors',
              activeTab === 'reward' ? 'bg-white dark:bg-[#3F3F46] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Reward distribution
          </button>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg bg-black dark:bg-[#D2D2D2] px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80"
        >
          <AddIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sm:inline">Create new code</span>
        </button>
      </div>

      {/* Code Table */}
      {activeTab === 'code' && (
        <div className="rounded-2xl bg-white dark:bg-[#18181B] overflow-x-auto">
          <table className="w-full min-w-[550px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#27272A]">
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">
                  Referral Code
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">
                  Total Volume
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">
                  Traders Referred
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">
                  Total Rewards
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-right text-xs lg:text-sm font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {codesLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : !connected ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <div className="flex justify-center">
                      <WalletDropdown
                        triggerVariant="default"
                        triggerSize="lg"
                        triggerClassName="h-11 rounded-lg bg-black px-8 text-sm font-medium text-white hover:bg-black/90"
                      />
                    </div>
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No Referral Code
                  </td>
                </tr>
              ) : (
                paginatedCodes.map((row) => (
                  <tr
                    key={row.code}
                    onClick={() => setSelectedCode(row.code)}
                    className={cn(
                      'cursor-pointer border-b border-gray-50 dark:border-[#27272A]/50 last:border-0 transition-colors',
                      selectedCode === row.code ? 'bg-[#D2FB95] text-black' : 'hover:bg-gray-50 dark:hover:bg-[#27272A]',
                    )}
                  >
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <span className={cn("text-xs lg:text-sm font-medium", selectedCode === row.code ? "text-black" : "text-foreground")}>{row.code}</span>
                        <button
                          onClick={(e) => handleCopyCode(e, row.code)}
                          className={cn("hover:text-foreground", selectedCode === row.code ? "text-black/60 hover:text-black" : "text-muted-foreground")}
                          title="Copy code"
                        >
                          <CopyIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        </button>
                        <button
                          onClick={(e) => handleShareOnX(e, row.code)}
                          className={cn("hover:text-foreground", selectedCode === row.code ? "text-black/60 hover:text-black" : "text-muted-foreground")}
                          title="Share on X"
                        >
                          <XIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        </button>
                      </div>
                    </td>
                    <td className={cn("px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm", selectedCode === row.code ? "text-black" : "text-foreground")}>
                      {formatCurrency(row.totalVolume)}
                    </td>
                    <td className={cn("px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm", selectedCode === row.code ? "text-black" : "text-foreground")}>{row.tradersReferred}</td>
                    <td className={cn("px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm", selectedCode === row.code ? "text-black" : "text-foreground")}>
                      {formatCurrency(row.totalRewards)}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-right">
                      <button
                        onClick={(e) => handleOpenShareModal(e, row.code)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="border-t border-gray-100 dark:border-[#27272A] px-3 lg:px-6 py-3 lg:py-4"
          />
        </div>
      )}

      {/* Selected Code Details */}
      {selectedCode && (
        <div className="rounded-2xl bg-white dark:bg-[#18181B] p-3 lg:p-6 overflow-x-auto">
          <div className="mb-3 lg:mb-4 flex items-center gap-2 justify-center">
            <span className="text-base lg:text-lg font-bold text-foreground">{selectedCode}</span>
            <span className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground">
              (<User className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> {users.length})
            </span>
          </div>

          <table className="w-full min-w-[550px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#27272A]">
                <th className="pb-2 lg:pb-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">
                  Email/Wallet
                </th>
                <th className="pb-2 lg:pb-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">
                  Date Joined
                </th>
                <th className="pb-2 lg:pb-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">Type</th>
                <th className="pb-2 lg:pb-4 text-left text-xs lg:text-sm font-medium text-muted-foreground">
                  Reward Earned
                </th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={4} className="py-3 lg:py-4 text-center text-xs lg:text-sm text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 lg:py-4 text-center text-xs lg:text-sm text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 dark:border-[#27272A]/50 last:border-0">
                    <td className="py-3 lg:py-4 text-xs lg:text-sm text-foreground">{user.email}</td>
                    <td className="py-3 lg:py-4 text-xs lg:text-sm text-muted-foreground">{user.dateJoined}</td>
                    <td className="py-3 lg:py-4 text-xs lg:text-sm text-muted-foreground">{user.layer}</td>
                    <td className="py-3 lg:py-4 text-xs lg:text-sm text-foreground">
                      <div className="flex flex-col gap-0.5">
                        {user.rewards.map((reward, idx) => (
                          <span key={idx}>{reward.amount} {reward.token}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Referral Code Modal */}
      <CreateReferralCodeModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {/* Share Referral Code Modal */}
      <ShareReferralCodeModal
        open={shareModalCode !== null}
        onOpenChange={(open) => !open && setShareModalCode(null)}
        codeSlug={shareModalCode}
      />
    </div>
  )
}
