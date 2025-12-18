import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, X, Plus, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getReferralCodes, getReferralUsersByCode, formatCurrency, formatSOL } from '@/services'

const PAGE_SIZE = 3

export function CodeSection() {
  const [activeTab, setActiveTab] = useState<'code' | 'reward'>('code')
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['referralCodes'],
    queryFn: getReferralCodes,
  })

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

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
    return pages
  }, [currentPage, totalPages])

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
        <div className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5">
          <button
            onClick={() => setActiveTab('code')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'code'
                ? 'bg-white text-black shadow-sm'
                : 'text-muted-foreground hover:text-black'
            )}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('reward')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'reward'
                ? 'bg-white text-black shadow-sm'
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
              {codesLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : (
                paginatedCodes.map((row) => (
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
                    <td className="px-6 py-4 text-black">{formatCurrency(row.totalVolume)}</td>
                    <td className="px-6 py-4 text-black">{row.tradersReferred}</td>
                    <td className="px-6 py-4 text-black">{formatSOL(row.totalRewards)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-gray-100'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageNumbers.map((page, i) => (
                <button
                  key={i}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={typeof page !== 'number'}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
                    page === currentPage
                      ? 'bg-black text-white'
                      : typeof page === 'number'
                        ? 'text-muted-foreground hover:bg-gray-100'
                        : 'text-muted-foreground cursor-default'
                  )}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-gray-100'
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected Code Details */}
      {selectedCode && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg font-bold text-black">{selectedCode}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              (<User className="h-4 w-4" /> {users.length})
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
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 text-black">{user.email}</td>
                    <td className="py-4 text-muted-foreground">{user.dateJoined}</td>
                    <td className="py-4 text-muted-foreground">{user.layer}</td>
                    <td className="py-4 text-black">{user.pointsEarned.toLocaleString()}</td>
                    <td className="py-4 text-black">{formatSOL(user.rewardEarned)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
