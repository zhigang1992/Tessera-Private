import { cn } from '@/lib/utils'

interface CrownIconProps {
  className?: string
}

export function CrownIcon({ className }: CrownIconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-[#F5A524]', className)}
    >
      <path
        d="M12 6L15 10L21 8L18 16H6L3 8L9 10L12 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 16H18V18C18 18.5523 17.5523 19 17 19H7C6.44772 19 6 18.5523 6 18V16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
