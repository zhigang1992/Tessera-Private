import { useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  const handlePrevPage = useCallback(() => {
    onPageChange(Math.max(1, currentPage - 1))
  }, [currentPage, onPageChange])

  const handleNextPage = useCallback(() => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }, [currentPage, totalPages, onPageChange])

  const handlePageClick = useCallback(
    (page: number | string) => {
      if (typeof page === 'number') {
        onPageChange(page)
      }
    },
    [onPageChange],
  )

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn('flex items-center justify-center gap-1 lg:gap-2', className)}>
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        className={cn(
          'flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-lg text-xs lg:text-sm',
          currentPage === 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted',
        )}
      >
        <ChevronLeft className="h-3 w-3 lg:h-4 lg:w-4" />
      </button>

      {pageNumbers.map((page, i) => (
        <button
          key={i}
          onClick={() => handlePageClick(page)}
          disabled={typeof page !== 'number'}
          className={cn(
            'flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-lg text-xs lg:text-sm',
            page === currentPage
              ? 'bg-black dark:bg-[#d2d2d2] text-white dark:text-black'
              : typeof page === 'number'
                ? 'text-muted-foreground dark:text-[#d2d2d2] hover:bg-gray-100 dark:bg-black/40 dark:hover:bg-black/50'
                : 'text-muted-foreground dark:text-[#d2d2d2] dark:bg-black/40 cursor-default',
          )}
        >
          {page}
        </button>
      ))}

      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className={cn(
          'flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-lg text-xs lg:text-sm',
          currentPage === totalPages ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted',
        )}
      >
        <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4" />
      </button>
    </div>
  )
}
