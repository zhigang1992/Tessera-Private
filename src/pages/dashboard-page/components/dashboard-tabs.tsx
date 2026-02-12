
interface DashboardTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'market-data', label: 'Market Data' },
  { id: 'my-dashboard', label: 'My Dashboard' },
  { id: 'transparency', label: 'Transparency' },
]

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {

  return (
    <div className="flex items-center gap-1 md:gap-2 p-1 bg-zinc-200 dark:bg-[#27272a] rounded-xl w-full md:w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 md:flex-initial px-1 md:px-6 py-1 text-sm lg:text-base font-normal rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-white dark:bg-[#323334] text-black dark:text-[#d2d2d2] shadow-sm'
              : 'text-[#71717a] dark:text-[#71717a] hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
