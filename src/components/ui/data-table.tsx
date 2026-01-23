import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  className?: string
  headerClassName?: string
  render?: (value: any, row: T, index: number) => ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  headerClassName?: string
  rowClassName?: string | ((row: T, index: number) => string)
  onRowClick?: (row: T, index: number) => void
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  className,
  headerClassName,
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn('flex flex-col gap-[10px]', className)}>
      {/* Header - hidden on mobile */}
      <div className={cn('hidden lg:flex items-center gap-[10px] px-[10px]', headerClassName)}>
        {columns.map((column, index) => (
          <div
            key={index}
            className={cn(
              'text-[12px] leading-4 text-zinc-500 dark:text-[#71717a]',
              column.headerClassName
            )}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Divider - hidden on mobile */}
      <div className="hidden lg:block px-[10px]">
        <div className="h-px bg-black/15 dark:bg-white/15" />
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-[5px]">
        {loading ? (
          <div className="p-[10px] text-center text-[14px] text-muted-foreground">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="p-4">
            <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
              <span className="text-[14px] text-muted-foreground">{emptyMessage}</span>
            </div>
          </div>
        ) : (
          data.map((row, rowIndex) => {
            const rowClass =
              typeof rowClassName === 'function' ? rowClassName(row, rowIndex) : rowClassName

            return (
              <div
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={cn(
                  'flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-[10px] p-3 lg:p-[10px] rounded-lg lg:rounded-none',
                  onRowClick && 'cursor-pointer',
                  rowIndex % 2 === 0 ? 'bg-zinc-50 dark:bg-[#323334]' : 'bg-white dark:bg-transparent',
                  rowClass
                )}
              >
                {columns.map((column, colIndex) => {
                  const value =
                    typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : row[column.accessor]

                  const content = column.render
                    ? column.render(value, row, rowIndex)
                    : value

                  return (
                    <div
                      key={colIndex}
                      className={cn(
                        'flex flex-col lg:flex-1',
                        column.className
                      )}
                    >
                      {/* Mobile: Show label */}
                      <span className="text-[10px] text-zinc-500 lg:hidden">
                        {column.header}
                      </span>
                      {/* Content */}
                      <div className="text-[12px] lg:text-[14px] leading-5 text-black dark:text-[#d2d2d2]">
                        {content}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
