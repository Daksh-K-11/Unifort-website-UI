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
    <div className="p-3.5 border-t adm-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[rgba(66,74,112,0.02)]">
      {/* Summary and rows selector */}
      <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-2">
        <span className="text-slate-700 dark:text-slate-300">
          Showing{' '}
          <strong className="text-slate-900 dark:text-white font-bold">{startEntry}</strong>{' '}
          to{' '}
          <strong className="text-slate-900 dark:text-white font-bold">{endEntry}</strong>{' '}
          of{' '}
          <strong className="text-slate-900 dark:text-white font-bold">{total}</strong>{' '}
          {itemName}
        </span>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-2 sm:border-l adm-border sm:pl-3">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Rows:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="raw-select px-2 py-1 bg-white dark:bg-[#141827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#424a70] cursor-pointer shadow-2xs"
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
          className="p-1.5 rounded-lg bg-white dark:bg-[#141827] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-[#424a70]/10 hover:text-[#424a70] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 rounded-lg bg-white dark:bg-[#141827] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-[#424a70]/10 hover:text-[#424a70] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Mobile Page Indicator */}
        <span className="sm:hidden px-2 text-xs font-semibold text-slate-900 dark:text-white">
          Page {page} of {totalPages}
        </span>

        {/* Desktop Numbered Page Buttons */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {visiblePages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-slate-500 dark:text-slate-400 font-bold select-none"
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
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? '!bg-[#424a70] !text-white font-bold shadow-xs border border-[#424a70]'
                    : 'bg-white dark:bg-[#141827] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 hover:border-[#424a70] hover:text-[#424a70] shadow-2xs'
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
          className="p-1.5 rounded-lg bg-white dark:bg-[#141827] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-[#424a70]/10 hover:text-[#424a70] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg bg-white dark:bg-[#141827] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-[#424a70]/10 hover:text-[#424a70] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
