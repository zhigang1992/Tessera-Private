import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TableHeaderProps {
  columns: {
    label: string
    className?: string
  }[]
  className?: string
}

/**
 * Reusable table header component with consistent dark mode styling
 * Used across referral page tables for uniform appearance
 */
export function TableHeader({ columns, className }: TableHeaderProps) {
  return (
    <>
      {/* Header - hidden on mobile */}
      <div className={cn('hidden lg:flex items-center gap-[10px] px-[10px]', className)}>
        {columns.map((column, index) => (
          <div
            key={index}
            className={cn(
              'text-[12px] leading-4 text-zinc-500 dark:text-[#71717a]',
              column.className
            )}
          >
            {column.label}
          </div>
        ))}
      </div>

      {/* Divider - hidden on mobile */}
      <div className="hidden lg:block px-[10px]">
        <div className="h-px bg-black/15 dark:bg-white/15" />
      </div>
    </>
  )
}

export interface TableContainerProps {
  title?: string
  children: ReactNode
  className?: string
}

/**
 * Reusable table container with consistent styling
 */
export function TableContainer({ title, children, className }: TableContainerProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-white dark:bg-[#323334] px-3 lg:px-[14px] py-4 lg:py-6 flex flex-col gap-[10px] border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]',
        className
      )}
    >
      {title && (
        <h2 className="text-base lg:text-[18px] leading-7 text-foreground dark:text-[#d2d2d2] px-1 lg:px-0">
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}
