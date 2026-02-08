import { HelpCircle } from 'lucide-react'

export function ReferralHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground dark:text-[#D2D2D2]">Referral</h1>
      <a
        href="https://docs.tessera.pe/features/referral-systems"
        target='_blank'
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground dark:text-[#D2D2D2]"
      >
        <HelpCircle className="h-4 w-4" />
        Rules & FAQ
      </a>
    </div>
  )
}
