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
    <div className="flex items-center gap-2 p-1 bg-zinc-200 rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 lg:px-6 py-1 text-sm lg:text-base font-normal rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-500 hover:text-black'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
