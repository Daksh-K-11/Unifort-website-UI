'use client'

import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

export interface AdminPaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (newPage: number) => void
  onLimitChange: (newLimit: number) => void
  itemName?: string
  limitOptions?: number[]
}

export function AdminPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  itemName = 'entries',
  limitOptions = [10, 20, 50, 100],
}: AdminPaginationProps) {
  if (total <= 0) return null

  const startEntry = (page - 1) * limit + 1
  const endEntry = Math.min(page * limit, total)

  // Calculate visible page numbers (max 5 visible buttons)
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('ellipsis')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (page < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="p-3.5 border-t adm-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs adm-text-muted bg-[rgba(66,74,112,0.02)]">
      {/* Summary and rows selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Showing{' '}
          <strong className="adm-text-primary font-semibold">{startEntry}</strong>{' '}
          to{' '}
          <strong className="adm-text-primary font-semibold">{endEntry}</strong>{' '}
          of{' '}
          <strong className="adm-text-primary font-semibold">{total}</strong>{' '}
          {itemName}
        </span>

        <div className="flex items-center gap-1.5 ml-2 border-l adm-border pl-3">
          <span>Rows:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70] cursor-pointer"
            title="Rows per page"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border adm-border hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border adm-border hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 mx-1">
          {visiblePages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-slate-400 select-none"
                >
                  …
                </span>
              )
            }
            const isCurrent = p === page
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-[#424a70] text-white font-bold shadow-2xs'
                    : 'border adm-border hover:bg-black/5 dark:hover:bg-white/5 adm-text-secondary'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border adm-border hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border adm-border hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

