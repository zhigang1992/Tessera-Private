import { TrendingUp } from 'lucide-react'
// import { useQuery } from '@tanstack/react-query'
// import { getDashboardStats } from '@/services'

export function StatsCards() {
  // Note: Currently using static data, will integrate with API later
  // const { data: stats } = useQuery({
  //   queryKey: ['dashboardStats'],
  //   queryFn: getDashboardStats,
  // })

  const statCards = [
    {
      label: 'Total Market Cap',
      value: '$485.2B',
      change: '+4.2%',
      hasChange: true,
    },
    {
      label: 'Total Trading Volume',
      value: '$42.5M',
      change: '+12.5%',
      hasChange: true,
    },
    {
      label: 'Active Traders',
      value: '24,285',
      change: '124',
      hasChange: true,
    },
    {
      label: 'Assets Tokenized',
      value: '6',
      hasChange: false,
    },
  ]

  return (
    <div>
      <h2 className="font-semibold text-sm text-foreground dark:text-[#d2d2d2] mb-4">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl px-4 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-normal text-foreground dark:text-[#d2d2d2]">{card.label}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center">
                  <p className="font-['Martian_Mono',monospace] font-medium text-base leading-8 text-foreground dark:text-[#d2d2d2]">
                    {card.value}
                  </p>
                </div>
                {card.hasChange && (
                  <div className="bg-[rgba(210,251,149,0.5)] flex items-center gap-1.5 px-2 py-1 rounded w-fit">
                    <TrendingUp className="w-3 h-3 text-foreground dark:text-white" />
                    <p className="text-xs font-normal text-foreground dark:text-white">{card.change}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
