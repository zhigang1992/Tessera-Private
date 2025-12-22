import { useQuery } from '@tanstack/react-query'
import { User } from 'lucide-react'
import TreeIcon from './_/tree.svg?react'
import { getTraderLayers } from '@/services'

export function ReferralTree() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['traderLayers'],
    queryFn: getTraderLayers,
  })

  return (
    <div className="flex flex-col lg:flex-row rounded-2xl overflow-hidden p-4 bg-white dark:bg-card gap-4 lg:gap-6">
      {/* Tree Visualization */}
      <div className="flex items-center justify-center p-4 lg:p-6 text-foreground">
        <TreeIcon className="w-full max-w-[288px] h-auto lg:w-[288px] lg:h-[202px]" />
      </div>

      <div className="h-[1px] lg:h-auto lg:w-[1px] bg-[#D9D9D9] dark:bg-border" />

      {/* Data Table */}
      <div className="p-4 lg:p-6 flex-1 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-border">
              <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                Trader Layers
              </th>
              <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                Traders Referred
              </th>
              <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.layer} className="border-b border-gray-50 dark:border-border/50 last:border-0">
                  <td className="py-4 font-medium text-foreground">{row.layer}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {row.tradersReferred}
                    </div>
                  </td>
                  <td className="py-4 font-medium text-foreground">{row.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
