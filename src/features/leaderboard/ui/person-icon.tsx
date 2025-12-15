import { cn } from '@/lib/utils'

interface PersonIconProps {
  className?: string
}

export function PersonIcon({ className }: PersonIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-black dark:text-white', className)}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20C4 16.6863 7.13401 14 11 14H13C16.866 14 20 16.6863 20 20V21H4V20Z" />
    </svg>
  )
}
