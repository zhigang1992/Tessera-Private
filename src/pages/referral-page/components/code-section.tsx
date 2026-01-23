import { useState, useEffect, useMemo, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, getReferralUsersByCode } from '@/services'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { Pagination } from '@/components/ui/pagination'
import CopyIcon from './_/copy.svg?react'
import XIcon from './_/x.svg?react'
import AddIcon from './_/add.svg?react'
import PersonIcon from './_/person.svg?react'
import { CreateReferralCodeModal } from './create-referral-code-modal'
import { ShareReferralCodeModal } from './share-referral-code-modal'
import { useAffiliateData } from '@/features/referral/hooks/use-referral-onchain'

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
              activeTab === 'code' ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm' : 'text-muted-foreground dark:text-[#d2d2d2]/50 hover:text-foreground',
            )}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('reward')}
            className={cn(
              'rounded-md px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors',
              activeTab === 'reward' ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm' : 'text-muted-foreground dark:text-[#d2d2d2]/50 hover:text-foreground',
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
        <div className="rounded-[16px] bg-white dark:bg-[#323334] px-3 lg:px-[14px] py-4 lg:py-6 flex flex-col gap-[10px] overflow-x-auto border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
          {/* Header - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-[10px] px-[10px]">
            <div className="w-[240px] text-[12px] leading-4 text-zinc-500">Referral Code</div>
            <div className="flex-1 text-[12px] leading-4 text-zinc-500">Total Volume</div>
            <div className="flex-1 text-[12px] leading-4 text-zinc-500">Traders Referred</div>
            <div className="flex-1 text-[12px] leading-4 text-zinc-500">Total Rewards</div>
            {/* Placeholder for Share button column */}
            <div className="w-[85px] shrink-0" />
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden lg:block px-[10px]">
            <div className="h-px bg-black/15 dark:bg-white/15" />
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-[5px]">
            {codesLoading ? (
              <div className="p-[10px] text-center text-[14px] text-muted-foreground">
                Loading...
              </div>
            ) : !connected ? (
              <div className="py-12 flex justify-center">
                <WalletDropdown
                  triggerVariant="default"
                  triggerSize="lg"
                  triggerClassName="h-11 rounded-lg bg-black px-8 text-sm font-medium text-white hover:bg-black/90"
                />
              </div>
            ) : codes.length === 0 ? (
              <div className="p-4">
                <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                  <span className="text-[14px] text-muted-foreground">No Referral Code</span>
                </div>
              </div>
            ) : (
              paginatedCodes.map((row, index) => (
                <div
                  key={row.code}
                  onClick={() => setSelectedCode(row.code)}
                  className={cn(
                    'flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-[10px] p-3 lg:p-[10px] rounded-lg lg:rounded-none cursor-pointer transition-colors',
                    selectedCode === row.code
                      ? 'bg-[#d2fb95]'
                      : index % 2 === 0
                        ? 'bg-zinc-50 dark:bg-[#323334]'
                        : 'bg-white dark:bg-transparent'
                  )}
                >
                  {/* Mobile: Code with actions */}
                  <div className="flex items-center justify-between lg:w-[240px] lg:gap-[5px]">
                    <div className="flex items-center gap-[5px]">
                      <span className={cn(
                        "text-[14px] font-semibold uppercase",
                        selectedCode === row.code ? "text-black" : "text-[#404040] dark:text-[#d2d2d2]"
                      )}>
                        {row.code}
                      </span>
                      <button
                        onClick={(e) => handleCopyCode(e, row.code)}
                        className={cn(
                          "hover:text-zinc-600",
                          selectedCode === row.code ? "text-black/60" : "text-zinc-400"
                        )}
                        title="Copy code"
                      >
                        <CopyIcon className="size-4" />
                      </button>
                      <button
                        onClick={(e) => handleShareOnX(e, row.code)}
                        className={cn(
                          "hover:text-zinc-600",
                          selectedCode === row.code ? "text-black/60" : "text-zinc-400"
                        )}
                        title="Share on X"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                    {/* Mobile: Share button */}
                    <button
                      onClick={(e) => handleOpenShareModal(e, row.code)}
                      className="lg:hidden inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 transition-colors"
                    >
                      <Share2 className="size-3.5" />
                      Share
                    </button>
                  </div>
                  {/* Mobile: Stats grid */}
                  <div className="grid grid-cols-3 gap-2 lg:contents">
                    <div className="flex flex-col lg:flex-1">
                      <span className={cn(
                        "text-[10px] lg:hidden",
                        selectedCode === row.code ? "text-black/60" : "text-zinc-500"
                      )}>Volume</span>
                      <span className={cn(
                        "text-[12px] lg:text-[14px] leading-5",
                        selectedCode === row.code ? "text-black" : "text-black dark:text-[#d2d2d2]"
                      )}>
                        {formatCurrency(row.totalVolume)}
                      </span>
                    </div>
                    <div className="flex flex-col lg:flex-1">
                      <span className={cn(
                        "text-[10px] lg:hidden",
                        selectedCode === row.code ? "text-black/60" : "text-zinc-500"
                      )}>Referred</span>
                      <span className={cn(
                        "text-[12px] lg:text-[14px] leading-5",
                        selectedCode === row.code ? "text-black" : "text-black dark:text-[#d2d2d2]"
                      )}>
                        {row.tradersReferred}
                      </span>
                    </div>
                    <div className="flex flex-col lg:flex-1">
                      <span className={cn(
                        "text-[10px] lg:hidden",
                        selectedCode === row.code ? "text-black/60" : "text-zinc-500"
                      )}>Rewards</span>
                      <span className={cn(
                        "text-[12px] lg:text-[14px] leading-5",
                        selectedCode === row.code ? "text-black" : "text-black dark:text-[#d2d2d2]"
                      )}>
                        {formatCurrency(row.totalRewards)}
                      </span>
                    </div>
                  </div>
                  {/* Desktop: Share button */}
                  <div className="hidden lg:block shrink-0">
                    <button
                      onClick={(e) => handleOpenShareModal(e, row.code)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 transition-colors"
                    >
                      <Share2 className="size-3.5" />
                      Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="justify-center"
          />
        </div>
      )}

      {/* Selected Code Details */}
      {selectedCode && (
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-[#323334] dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b dark:border-[#393b3d] border-[#e0e0e0] flex items-center justify-center">
            <div className="flex gap-[10px] items-center justify-center">
              <div className="text-[18px] font-semibold uppercase leading-[28px] dark:text-[#d2d2d2] text-black">
                {selectedCode}
              </div>
              <div className="flex items-center">
                <span className="text-[12px] font-semibold uppercase leading-[20px] dark:text-[#999] text-[#404040]">(</span>
                <div className="flex items-center">
                  <PersonIcon className="size-4 dark:text-[#d2d2d2] text-black" />
                  <span className="text-[12px] font-semibold uppercase leading-[20px] dark:text-[#999] text-[#404040]">{users.length}</span>
                </div>
                <span className="text-[12px] font-semibold uppercase leading-[20px] dark:text-[#999] text-[#404040]">)</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b dark:border-[#393b3d] dark:bg-[#27272a] border-[#e0e0e0] bg-gray-50">
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium whitespace-nowrap dark:text-[#71717a] text-gray-600">
                    <span className="hidden sm:inline">Email/Wallet</span>
                    <span className="inline sm:hidden">Email</span>
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium whitespace-nowrap dark:text-[#71717a] text-gray-600">
                    <span className="hidden sm:inline">Date Joined</span>
                    <span className="inline sm:hidden">Date</span>
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium dark:text-[#71717a] text-gray-600">
                    Type
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium whitespace-nowrap dark:text-[#71717a] text-gray-600">
                    <span className="hidden sm:inline">Reward Earned</span>
                    <span className="inline sm:hidden">Reward</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-[14px] text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4">
                      <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                        <span className="text-[14px] text-muted-foreground">No users found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={cn(
                        'border-b transition-colors cursor-pointer',
                        'dark:border-[#393b3d] dark:hover:bg-[#27272a] border-[#e0e0e0] hover:bg-gray-50'
                      )}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 text-[12px] md:text-[13px] dark:text-[#d2d2d2] text-black">
                        <div className="max-w-[150px] md:max-w-none truncate">{user.email}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-[12px] md:text-[13px] whitespace-nowrap dark:text-[#d2d2d2] text-black">
                        {user.dateJoined}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-[12px] md:text-[13px] dark:text-[#d2d2d2] text-black">
                        {user.layer}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-[12px] md:text-[13px] whitespace-pre-line dark:text-[#d2d2d2] text-black">
                        {user.rewards.map((reward, idx) => (
                          <div key={idx}>{reward.amount} {reward.token}</div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex gap-[5px] items-center justify-center py-4 md:py-5 border-t dark:border-[#393b3d] border-[#e0e0e0]">
            {Array.from({ length: Math.min(Math.ceil(users.length / 10), 5) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg text-xs font-normal transition-colors cursor-pointer',
                  page === 1
                    ? 'dark:bg-[#d2fb95] dark:text-black bg-black text-white'
                    : 'dark:bg-[rgba(212,212,216,0.4)] dark:text-[#d2d2d2] dark:hover:bg-[#3f3f46] bg-[rgba(212,212,216,0.4)] text-black hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            ))}
            {Math.ceil(users.length / 10) > 5 && (
              <>
                <button
                  disabled
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-xs font-normal dark:bg-[rgba(212,212,216,0.4)] dark:text-[#d2d2d2] bg-[rgba(212,212,216,0.4)] text-black"
                >
                  ...
                </button>
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-xs font-normal transition-colors cursor-pointer dark:bg-[rgba(212,212,216,0.4)] dark:text-[#d2d2d2] dark:hover:bg-[#3f3f46] bg-[rgba(212,212,216,0.4)] text-black hover:bg-gray-100"
                >
                  {Math.ceil(users.length / 10)}
                </button>
              </>
            )}
          </div>
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
