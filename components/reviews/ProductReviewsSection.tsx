'use client'

import React, { useState } from 'react'
import { Star, MessageSquareQuote, Plus, CheckCircle2 } from 'lucide-react'
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
  const { getProductReviews, setAuthModalOpen, isLoggedIn } = useCustomer()
  const [modalOpen, setModalOpen] = useState(false)

  const reviews = getProductReviews(productId)
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0'

  const handleOpenWrite = () => {
    if (!isLoggedIn) {
      setAuthModalOpen('login')
    } else {
      setModalOpen(true)
    }
  }

  return (
    <div className="mt-6 pt-5 border-t border-[#424a70]/12 space-y-4">
      {/* Header and Average */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs uppercase tracking-wider text-[#424a70] font-semibold">
              Tactile Feedback & Appraisal
            </h4>
            <span className="text-[10px] text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
              Verified Patrons
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-[#1c2033]">{averageRating}</span>
            <span className="text-[11px] text-[#424a70]/60">
              ({reviews.length} {reviews.length === 1 ? 'appraisal' : 'appraisals'})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenWrite}
          className="px-3.5 py-2 bg-[#424a70]/5 hover:bg-[#424a70]/10 border border-[#424a70]/15 text-[#424a70] text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-xs text-[#424a70]/60 italic py-2">
          Be the first patron to share tactile feedback on this handcrafted piece.
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

      {/* Review Modal */}
      <WriteReviewModal
        productId={productId}
        productName={productName}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
