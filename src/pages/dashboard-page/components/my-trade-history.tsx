import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@/hooks/use-wallet'
import { Pagination } from '@/components/ui/pagination'
import { TableContainer } from '@/components/ui/table-header'
import { getUserTradeHistory } from '@/services'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { DEFAULT_BASE_TOKEN_ID, getAppToken, getTokenBySymbol } from '@/config'

const PAGE_SIZE = 10

export function MyTradeHistory() {
  const defaultToken = getAppToken(DEFAULT_BASE_TOKEN_ID)
  const [currentPage, setCurrentPage] = useState(1)
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()

  const { data, isLoading } = useQuery({
    queryKey: ['userTradeHistory', walletAddress, currentPage],
    queryFn: () => getUserTradeHistory(walletAddress, currentPage, PAGE_SIZE),
    enabled: connected,
  })

  const totalPages = data?.totalPages ?? 1
  const items = data?.items ?? []

  return (
    <TableContainer title="My Trading History">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b dark:border-[#393b3d] border-[#e0e0e0] bg-gray-50 dark:bg-[#27272a]">
              <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium text-gray-600 dark:text-[#71717a]">Token</th>
              <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium text-gray-600 dark:text-[#71717a] whitespace-nowrap">Amount</th>
              <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium text-gray-600 dark:text-[#71717a]">Type</th>
              <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium text-gray-600 dark:text-[#71717a]">Account</th>
              <th className="px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium text-gray-600 dark:text-[#71717a]">Time</th>
            </tr>
          </thead>
          <tbody>
            {!connected ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                    <span className="text-[14px] text-muted-foreground">Please connect your wallet to view trade history</span>
                  </div>
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                    <span className="text-[14px] text-muted-foreground">No trade history</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const rowToken = getTokenBySymbol(item.token) ?? defaultToken
                return (
                  <tr key={item.id} className="border-b dark:border-[#393b3d] border-[#e0e0e0] hover:bg-gray-50 dark:hover:bg-[#27272a] transition-colors">
                    {/* Token */}
                    <td className="px-4 md:px-6 py-3 md:py-4 text-[13px] md:text-[14px] text-black dark:text-[#d2d2d2]">
                      <div className="flex items-center gap-2">
                        <AppTokenIcon token={rowToken} className="w-5 h-5 lg:w-6 lg:h-6" size={24} />
                        <AppTokenName
                          token={rowToken}
                          variant="symbol"
                          className="font-semibold text-[#404040] dark:text-[#d2d2d2] uppercase"
                        />
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 md:px-6 py-3 md:py-4 text-[13px] md:text-[14px] text-black dark:text-[#d2d2d2]">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>{item.amountIn}</span>
                        <span className="text-[#06a800]">→</span>
                        <span>{item.amountOut}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 md:px-6 py-3 md:py-4 text-[13px] md:text-[14px] text-black dark:text-[#d2d2d2]">{item.type}</td>

                    {/* Account */}
                    <td className="px-4 md:px-6 py-3 md:py-4 text-[13px] md:text-[14px] text-black dark:text-[#d2d2d2]">{item.account}</td>

                    {/* Time */}
                    <td className="px-4 md:px-6 py-3 md:py-4 text-[13px] md:text-[14px] text-black dark:text-[#d2d2d2] whitespace-nowrap">{item.time}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {!connected ? (
          <div className="p-4">
            <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
              <span className="text-[14px] text-muted-foreground">Please connect your wallet to view trade history</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="px-4 py-10 text-center text-[14px] text-muted-foreground">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
              <span className="text-[14px] text-muted-foreground">No trade history</span>
            </div>
          </div>
        ) : (
          items.map((item, index) => {
            const rowToken = getTokenBySymbol(item.token) ?? defaultToken
            const isLastItem = index === items.length - 1

            return (
              <div
                key={item.id}
                className="relative"
              >
                {!isLastItem && (
                  <div
                    aria-hidden="true"
                    className="absolute border-[#e0e0e0] dark:border-[#393b3d] border-b inset-0 pointer-events-none"
                  />
                )}
                <div className="flex flex-col gap-3 p-4 relative w-full">
                  {/* Token and Type Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AppTokenIcon token={rowToken} className="w-8 h-8" size={32} />
                      <AppTokenName
                        token={rowToken}
                        variant="symbol"
                        className="font-semibold text-[#404040] dark:text-[#d2d2d2] uppercase text-sm"
                      />
                    </div>
                    <div className="bg-zinc-100 dark:bg-[#27272a] px-2 py-1 rounded">
                      <p className="text-xs text-black dark:text-[#d2d2d2]">{item.type}</p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-[10px] font-normal text-[#71717a] mb-1 uppercase">AMOUNT</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-black dark:text-[#d2d2d2]">{item.amountIn}</span>
                      <span className="text-[#06a800]">→</span>
                      <span className="text-sm text-black dark:text-[#d2d2d2]">{item.amountOut}</span>
                    </div>
                  </div>

                  {/* Account and Time */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-normal text-[#71717a] mb-1 uppercase">ACCOUNT</p>
                      <p className="text-xs text-black dark:text-[#d2d2d2]">{item.account}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-normal text-[#71717a] mb-1 uppercase">TIME</p>
                      <p className="text-xs text-black dark:text-[#d2d2d2] whitespace-nowrap">{item.time}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex gap-[5px] items-center justify-center py-4 md:py-5 border-t dark:border-[#393b3d] border-[#e0e0e0]">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="justify-center"
        />
      </div>
    </TableContainer>
  )
}
