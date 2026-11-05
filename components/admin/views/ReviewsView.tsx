'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  XCircle,
  Search,
  Edit3,
  X,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { ReviewRecord, ReviewStatus } from '../admin-types'
import { api } from '../../../lib/api-client'
import { notify, useDebounced, Spinner, confirmAction } from '../admin-ui'
import { AdminPagination } from '../AdminPagination'

export function ReviewsView() {
  const { canModerateReviews } = useAdminAuth()

  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [modifyingReviewId, setModifyingReviewId] = useState<string | null>(null)
  const debouncedSearch = useDebounced(searchQuery)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [meta, setMeta] = useState<{ total: number; totalPages: number; statusCounts: Record<string, number> }>({ total: 0, totalPages: 1, statusCounts: {} })

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter !== 'ALL') q.set('status', statusFilter)
      if (debouncedSearch.trim()) q.set('search', debouncedSearch.trim())
      const res = await api.get(`/reviews/admin/all?${q}`)
      if (!res.success) notify(res)
      if (res.meta) setMeta({ total: res.meta.total ?? 0, totalPages: res.meta.totalPages ?? 1, statusCounts: res.meta.statusCounts || {} })
      if (res.success && Array.isArray(res.data)) {
        const mapped: ReviewRecord[] = res.data.map((r: any) => {
          let status: ReviewStatus = 'PENDING'
          if (r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'PENDING') {
            status = r.status as ReviewStatus
          } else if (r.isApproved === true) {
            status = 'APPROVED'
          }
          return {
            id: r.id,
            productId: r.productId,
            product: r.product
              ? {
                  name: r.product.name,
                  slug: r.product.slug,
                }
              : undefined,
            userId: r.userId,
            user: r.user
              ? {
                  name: `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || r.user.email,
                  email: r.user.email,
                }
              : undefined,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            status,
            createdAt: r.createdAt,
          }
        })
        setReviews(mapped)
      }
    } catch (e) {
      console.error('Failed to load reviews', e)
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, debouncedSearch])

  useEffect(() => setPage(1), [statusFilter, debouncedSearch])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleModerate = async (id: string, newStatus: ReviewStatus) => {
    const res = await api.patch(`/reviews/${id}/moderate`, { status: newStatus })
    if (notify(res, newStatus === 'APPROVED' ? 'Review approved — now visible on the product page' : `Review ${newStatus.toLowerCase()}`)) fetchReviews()
  }

  const handleDeleteReview = async (id: string) => {
    if (!confirmAction('Permanently delete this review?')) return
    const res = await api.delete(`/reviews/${id}`)
    if (notify(res, 'Review deleted')) fetchReviews()
  }

  const pendingCount = meta.statusCounts.PENDING || 0
  const approvedCount = meta.statusCounts.APPROVED || 0
  const rejectedCount = meta.statusCounts.REJECTED || 0

  const filteredReviews = reviews

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Product reviews
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            New reviews start as pending and appear on the storefront only once approved.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: `All reviews (${pendingCount + approvedCount + rejectedCount})` },
            { id: 'PENDING', label: `Pending (${pendingCount})` },
            { id: 'APPROVED', label: `Approved (${approvedCount})` },
            { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.id
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                  : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
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
      {loading && reviews.length === 0 ? (
        <div className="adm-card border adm-border rounded-2xl"><Spinner /></div>
      ) : filteredReviews.length === 0 ? (
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
        <div className="adm-card border adm-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
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
                    {/* If status is PENDING, show direct Approve and Reject buttons */}
                    {rev.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleModerate(rev.id, 'APPROVED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Approve Review"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerate(rev.id, 'REJECTED')}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Reject Review (Hides from storefront)"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : modifyingReviewId === rev.id ? (
                      /* When modifying already completed review, allow switching decision */
                      <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-150">
                        {rev.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await handleModerate(rev.id, 'APPROVED')
                              setModifyingReviewId(null)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}
                        {rev.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await handleModerate(rev.id, 'REJECTED')
                              setModifyingReviewId(null)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setModifyingReviewId(null)}
                          className="p-1 rounded-lg adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* If already approved or rejected, show Modify & Delete */
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setModifyingReviewId(rev.id)}
                          className="px-2.5 py-1 rounded-lg border adm-border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium adm-text-secondary hover:adm-text-primary inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#424a70] dark:text-indigo-400" />
                          <span>Modify</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      <AdminPagination page={page} limit={limit} total={meta.total} totalPages={meta.totalPages} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} itemName="reviews" />
    </div>
  )
}

