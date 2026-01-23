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
    <div className="flex items-center gap-2 p-1 bg-zinc-200 dark:bg-[#1e1f20] rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 lg:px-6 py-2 text-sm lg:text-base font-medium rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm'
              : 'text-muted-foreground dark:text-[#d2d2d2]/50 hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
