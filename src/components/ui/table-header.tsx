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
 *
 * @deprecated Use standard HTML <table> structure instead for better consistency with Figma designs
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
 * Follows Figma design specifications for table layouts
 */
export function TableContainer({ title, children, className }: TableContainerProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-white dark:bg-[#323334] border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)] overflow-hidden',
        className
      )}
    >
      {title && (
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b dark:border-[#393b3d] border-[#e0e0e0]">
          <p className="text-base md:text-[18px] leading-6 md:leading-7 text-black dark:text-[#d2d2d2]">
            {title}
          </p>
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * Standard table styles for consistent appearance across all tables
 * Use these class names for table elements to match Figma designs
 */
export const tableStyles = {
  // Table wrapper
  wrapper: 'overflow-x-auto',
  table: 'w-full min-w-[600px]',

  // Table header
  thead: 'border-b dark:border-[#393b3d] border-[#e0e0e0] bg-gray-50 dark:bg-[#27272a]',
  th: 'px-4 md:px-6 py-3 text-left text-[11px] md:text-[12px] font-medium text-gray-600 dark:text-[#71717a]',

  // Table body
  tbody: '',
  tr: 'border-b dark:border-[#393b3d] border-[#e0e0e0] hover:bg-gray-50 dark:hover:bg-[#27272a] transition-colors',
  td: 'px-4 md:px-6 py-3 md:py-4 text-[13px] md:text-[14px] text-black dark:text-[#d2d2d2]',

  // Pagination wrapper (inside table container, with top border)
  paginationWrapper: 'flex gap-[5px] items-center justify-center py-4 md:py-5 border-t dark:border-[#393b3d] border-[#e0e0e0]',
} as const
