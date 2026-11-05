'use client'

import React, { useState, useEffect } from 'react'
import {
  Star,
  MessageSquareQuote,
  Plus,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  X,
  ShoppingBag,
} from 'lucide-react'
import { useCustomer } from '@/lib/customer-context'
import { WriteReviewModal } from './WriteReviewModal'

interface ProductReviewsSectionProps {
  productId: string
  productName: string
}

export function ProductReviewsSection({
  productId,
  productName,
}: ProductReviewsSectionProps) {
  const {
    customer,
    getProductReviews,
    reviewStats,
    fetchProductReviews,
    checkReviewEligibility,
    setAuthModalOpen,
    isLoggedIn,
  } = useCustomer()

  const [modalOpen, setModalOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [ineligibleModalOpen, setIneligibleModalOpen] = useState(false)
  const [eligibilityData, setEligibilityData] = useState<{
    canReview: boolean
    hasPurchased: boolean
    alreadyReviewed: boolean
    existingReview?: any
    orderNumber?: string
    message: string
  } | null>(null)

  // Dynamically fetch reviews whenever product opens or changes
  useEffect(() => {
    if (productId) {
      fetchProductReviews(productId)
    }
  }, [productId, fetchProductReviews])

  const reviews = getProductReviews(productId)
  const stats = reviewStats[productId]
  const count = stats?.count ?? reviews.length
  const avg = stats?.averageRating ?? (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0)
  const averageRating = count > 0 ? avg.toFixed(1) : '—'
  const userReview = eligibilityData?.alreadyReviewed ? eligibilityData.existingReview : null

  const handleOpenWrite = async () => {
    // 1. Force the user to sign in first before entering a review
    if (!isLoggedIn || !customer) {
      setAuthModalOpen('login')
      return
    }

    // 2. Verify that the user has bought the product at least once
    setIsVerifying(true)
    try {
      const elig = await checkReviewEligibility(productId)
      setEligibilityData(elig)

      if (!elig.hasPurchased) {
        setIneligibleModalOpen(true)
      } else {
        setModalOpen(true)
      }
    } catch (e) {
      console.error('Failed to verify review eligibility', e)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div id="reviews" className="mt-6 pt-5 border-t border-[#424a70]/12 space-y-4 scroll-mt-24">
      {/* Header and Average */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs uppercase tracking-wider text-[#424a70] font-semibold">
              Customer reviews
            </h4>
            <span className="text-[10px] text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
              Verified purchases
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} aria-hidden className={`w-3.5 h-3.5 ${count > 0 && i <= Math.round(avg) ? 'fill-amber-400' : 'text-amber-200'}`} />
              ))}
              <span className="sr-only">{count > 0 ? `Rated ${averageRating} out of 5` : 'No ratings yet'}</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#1c2033]">{averageRating}</span>
            <span className="text-[11px] text-[#424a70]/60">
              ({count} {count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenWrite}
          disabled={isVerifying}
          className="px-3.5 py-2 bg-[#424a70]/5 hover:bg-[#424a70]/10 border border-[#424a70]/15 text-[#424a70] text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer disabled:opacity-60"
        >
          {isVerifying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{userReview ? 'Edit Your Appraisal' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-xs text-[#424a70]/60 italic py-2">
          Be the first verified patron to share tactile feedback on this handcrafted piece.
        </p>
      ) : (
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3 bg-[#faf9fc] rounded-2xl border border-[#424a70]/10 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-[#1c2033] text-[11px]">{rev.userName}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-[10px] text-[#424a70]/50 font-mono">
                  {new Date(rev.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {rev.title && (
                <h5 className="font-medium text-[#1c2033] text-xs mt-0.5">{rev.title}</h5>
              )}
              <p className="text-[#424a70]/80 leading-relaxed text-[11px]">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ineligible Purchase Alert Modal */}
      {ineligibleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIneligibleModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-[#424a70]/15 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIneligibleModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#424a70]/60 hover:text-[#424a70] hover:bg-[#424a70]/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3.5">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>

            <span className="text-[10px] uppercase tracking-[0.2em] text-[#424a70] font-semibold block mb-1">
              Verified Patron Authentication
            </span>
            <h3 className="text-lg font-serif font-medium text-[#1c2033] mb-2">
              Purchase Required to Review
            </h3>
            <p className="text-xs text-[#424a70]/80 leading-relaxed mb-5">
              To preserve authentic appraisals from patrons who have experienced our ceramics firsthand, reviews are reserved exclusively for verified purchasers.
            </p>

            <div className="p-3 bg-[#faf9fc] border border-[#424a70]/10 rounded-2xl text-[11px] text-[#424a70]/80 mb-5 text-left space-y-1">
              <p className="font-medium text-[#1c2033]">No confirmed purchase found:</p>
              <p className="text-[#424a70]/70">
                Piece: <span className="font-mono text-[#1c2033] font-semibold">{productName}</span>
              </p>
              <p className="text-[#424a70]/70">
                Patron: <span className="font-mono text-[#1c2033]">{customer?.email}</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIneligibleModalOpen(false)}
                className="w-full py-2.5 bg-[#424a70] hover:bg-[#4f5987] text-white text-xs font-medium rounded-xl shadow-md transition-all cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <WriteReviewModal
        productId={productId}
        productName={productName}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        existingReview={eligibilityData?.existingReview}
        orderNumber={eligibilityData?.orderNumber}
      />
    </div>
  )
}
