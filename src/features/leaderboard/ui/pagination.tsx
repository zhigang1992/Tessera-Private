import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-[5px]">
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-lg bg-[#D4D4D8]/40 text-xs text-black dark:text-white cursor-default hover:bg-[#D4D4D8]/40"
              disabled
            >
              ...
            </Button>
          )
        }

        const pageNum = page as number
        const isActive = pageNum === currentPage

        return (
          <Button
            key={pageNum}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className={cn(
              'h-10 w-10 rounded-lg text-xs font-normal',
              isActive
                ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90'
                : 'bg-[#D4D4D8]/40 text-black dark:text-white hover:bg-[#D4D4D8]/60'
            )}
          >
            {pageNum}
          </Button>
        )
      })}
    </div>
  )
}
