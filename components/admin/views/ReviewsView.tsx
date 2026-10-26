'use client'

import React, { useState } from 'react'
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { ReviewRecord, ReviewStatus } from '../admin-types'

export function ReviewsView() {
  const { canModerateReviews } = useAdminAuth()

  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const handleModerate = (id: string, newStatus: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
  }

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    const matchesSearch =
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.user && r.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.product && r.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Product Reviews & Tactile Feedback
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Customer star ratings, tactile appraisal, and moderation verification.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                  : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {st === 'ALL' ? 'All Reviews' : st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback, patron, piece..."
            className="w-full pl-9 pr-3 py-1.5 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] transition-colors"
          />
        </div>
      </div>

      {/* Reviews Table or Empty State */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <MessageSquareQuote className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Reviews in Queue</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            When patrons submit tactile ratings and reviews for stoneware pieces, they will appear here for staff moderation.
          </p>
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                <th className="py-3 px-4">Patron & Piece</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Title & Feedback</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border text-xs adm-text-secondary">
              {filteredReviews.map((rev) => (
                <tr key={rev.id} className="adm-table-hover transition-colors">
                  <td className="py-3.5 px-4 font-medium adm-text-primary">
                    <div className="flex flex-col">
                      <span>{rev.user?.name || 'Customer'}</span>
                      <span className="text-[10px] adm-text-muted">{rev.product?.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <span className="font-medium adm-text-primary block">{rev.title}</span>
                    <span className="adm-text-muted line-clamp-2 text-[11px] mt-0.5 not-italic">{rev.comment}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                        rev.status === 'APPROVED'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : rev.status === 'PENDING'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                          : 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleModerate(rev.id, 'APPROVED')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-medium inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerate(rev.id, 'REJECTED')}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
