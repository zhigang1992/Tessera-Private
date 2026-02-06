import { useState, useEffect, useMemo, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, getReferralUsersByCode } from '@/services'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { Pagination } from '@/components/ui/pagination'
import { TableContainer, tableStyles } from '@/components/ui/table-header'
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

  const { data: affiliateData, isLoading: codesLoading } = useAffiliateData(true, walletAddress)

  // Transform affiliate data to match the expected format
  const codes = useMemo(() => {
    if (!affiliateData?.referralCodes) return []
    return affiliateData.referralCodes.map((code) => ({
      code: code.codeSlug,
      totalVolume: code.totalVolume ?? 0,
      tradersReferred: code.referredTraderCount,
      totalRewards: code.totalRewards ?? 0,
    }))
  }, [affiliateData])

  // Fetch users for selected code
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['referralUsers', walletAddress, selectedCode],
    queryFn: () => getReferralUsersByCode(selectedCode!),
    enabled: !!selectedCode,
    staleTime: 0, // Always refetch when code changes
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

  const handleCodeCreated = useCallback((code: string) => {
    // Reset to page 1 and auto-select the newly created code
    setCurrentPage(1)
    setSelectedCode(code)
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
      {/* Code Table */}
      <TableContainer className="overflow-x-auto !p-0 !gap-0">
        {/* Tab Header - Inside Card */}
        <div className="flex flex-row items-end justify-between border-b dark:border-[#393b3d] border-[#e0e0e0] px-4 pt-3 pb-0 gap-3">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                'px-0 py-3.5 text-[13px] font-medium border-b-[1.617px] transition-colors whitespace-nowrap mr-10 tracking-[-0.0762px]',
                activeTab === 'code'
                  ? 'border-black dark:border-[#d2fb95] text-black dark:text-[#d2d2d2]'
                  : 'border-transparent text-[#6a7282]'
              )}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab('reward')}
              className={cn(
                'px-0 py-3.5 text-[13px] font-medium border-b-[1.617px] transition-colors whitespace-nowrap tracking-[-0.0762px]',
                activeTab === 'reward'
                  ? 'border-black dark:border-[#d2fb95] text-black dark:text-[#d2d2d2]'
                  : 'border-transparent text-[#6a7282]'
              )}
            >
              Distribution
            </button>
          </div>
          {activeTab === 'code' && (
            <div className="flex flex-col pb-[5px]">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2 rounded-[10px] flex items-center justify-center gap-2 text-[13px] font-medium tracking-[-0.0762px] transition-colors cursor-pointer whitespace-nowrap bg-white dark:bg-white text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-100 border border-[#e0e0e0] dark:border-[#e0e0e0]"
              >
                <AddIcon className="h-[18px] w-[18px]" />
                <span>New code</span>
              </button>
            </div>
          )}
        </div>

        {activeTab === 'code' && (
          <>
            {/* Table */}
            <div className={tableStyles.wrapper}>
              <table className={tableStyles.table}>
                <thead>
                  <tr className={tableStyles.thead}>
                    <th className={tableStyles.th}>Referral Code</th>
                    <th className={cn(tableStyles.th, 'whitespace-nowrap')}>Total Volume</th>
                    <th className={cn(tableStyles.th, 'whitespace-nowrap')}>Traders Referred</th>
                    <th className={cn(tableStyles.th, 'whitespace-nowrap')}>Total Rewards</th>
                    <th className={tableStyles.th}>{/* Share button column */}</th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {codesLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-muted-foreground">
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
                            triggerClassName="h-11 rounded-lg bg-black dark:bg-[#d2fb95] px-8 text-sm font-medium text-white dark:text-black hover:bg-black/90 dark:hover:bg-[#d2fb95]/80"
                          />
                        </div>
                      </td>
                    </tr>
                  ) : codes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4">
                        <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                          <span className="text-[14px] text-muted-foreground">No Referral Code</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCodes.map((row) => (
                      <tr
                        key={row.code}
                        onClick={() => setSelectedCode(row.code)}
                        className={cn(
                          tableStyles.tr,
                          'cursor-pointer',
                          selectedCode === row.code && 'bg-[#d2fb95] dark:bg-[#d2fb95] hover:bg-[#d2fb95] dark:hover:bg-[#d2fb95]'
                        )}
                      >
                        <td className={tableStyles.td}>
                          <div className="flex items-center gap-1 md:gap-2">
                            <span className={cn('font-medium', selectedCode === row.code && 'text-black dark:text-black')}>
                              {row.code}
                            </span>
                            <button
                              onClick={(e) => handleCopyCode(e, row.code)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3f3f46]"
                              title="Copy code"
                            >
                              <CopyIcon className={cn('size-[14px]', selectedCode === row.code ? 'text-black dark:text-black' : 'text-zinc-500 dark:text-[#999]')} />
                            </button>
                            <button
                              onClick={(e) => handleShareOnX(e, row.code)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3f3f46] hidden sm:block"
                              title="Share on X"
                            >
                              <XIcon className={cn('size-[14px]', selectedCode === row.code ? 'text-black dark:text-black' : 'text-zinc-500 dark:text-[#999]')} />
                            </button>
                          </div>
                        </td>
                        <td className={cn(tableStyles.td, 'whitespace-nowrap', selectedCode === row.code && 'text-black dark:text-black')}>
                          {formatCurrency(row.totalVolume)}
                        </td>
                        <td className={cn(tableStyles.td, selectedCode === row.code && 'text-black dark:text-black')}>
                          {row.tradersReferred}
                        </td>
                        <td className={cn(tableStyles.td, 'whitespace-nowrap', selectedCode === row.code && 'text-black dark:text-black')}>
                          {formatCurrency(row.totalRewards)}
                        </td>
                        <td className={tableStyles.td}>
                          <button
                            onClick={(e) => handleOpenShareModal(e, row.code)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 transition-colors"
                          >
                            <Share2 className="size-3.5" />
                            Share
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={tableStyles.paginationWrapper}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="justify-center"
              />
            </div>
          </>
        )}

        {activeTab === 'reward' && (
          <div className="p-4">
            <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
              <span className="text-[14px] text-muted-foreground">Reward Distribution Coming Soon</span>
            </div>
          </div>
        )}
      </TableContainer>

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
                  users.map((user) => (
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
                        {user.rewards.length > 0 ? (
                          user.rewards.map((reward, idx) => (
                            <div key={idx}>{reward.amount} {reward.token}</div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
        onSuccess={handleCodeCreated}
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
