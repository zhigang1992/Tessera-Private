import { HelpCircle } from 'lucide-react'

export function LeaderboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Leaderboard</h1>
      <a
        href="#rules-faq"
        className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-[#d2d2d2]/50 hover:text-foreground dark:hover:text-[#d2d2d2]"
      >
        <HelpCircle className="h-4 w-4" />
        Rules & FAQ
      </a>
    </div>
  )
}
