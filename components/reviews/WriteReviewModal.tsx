'use client'

import React, { useState } from 'react'
import { X, Star, Loader2 } from 'lucide-react'
import { useCustomer } from '@/lib/customer-context'

interface WriteReviewModalProps {
  productId: string
  productName: string
  isOpen: boolean
  onClose: () => void
}

export function WriteReviewModal({
  productId,
  productName,
  isOpen,
  onClose,
}: WriteReviewModalProps) {
  const { customer, submitReview } = useCustomer()
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setErrorMsg('Please share your tactile impression or feedback.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    const res = await submitReview(productId, {
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
    })

    setLoading(false)

    if (res.success) {
      setSuccessMsg(res.message || 'Thank you for your appraisal.')
      setTimeout(() => {
        setSuccessMsg('')
        onClose()
      }, 1500)
    } else {
      setErrorMsg(res.message || 'Failed to submit review.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-[#424a70]/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#424a70]/60 hover:text-[#424a70] hover:bg-[#424a70]/5"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-[10px] uppercase tracking-[0.2em] text-[#424a70] font-semibold block mb-1">
          Tactile Appraisal
        </span>
        <h2 className="text-xl font-serif font-medium text-[#1c2033] mb-1">
          Review {productName}
        </h2>
        <p className="text-xs text-[#424a70]/70 mb-5">
          Share your impression of weight, mineral glaze depth, and dining performance.
        </p>

        {successMsg ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs rounded-2xl text-center leading-relaxed">
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Star Rating Selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1.5">
                Rating Appraisal
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating !== null ? hoverRating : rating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  )
                })}
                <span className="text-xs font-mono text-[#424a70] font-medium ml-2">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                Headline / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Substantial weight, exquisite reduction finish"
                className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs text-[#1c2033] focus:outline-none focus:border-[#424a70]"
              />
            </div>

            {/* Detailed Comment */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                Your Appraisal & Notes *
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How does the piece feel in hand? Describe the glaze patina, rim profile, and banquet ritual."
                className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs text-[#1c2033] focus:outline-none focus:border-[#424a70] resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[#424a70]/70 hover:text-[#1c2033]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#424a70] hover:bg-[#4f5987] text-white text-xs font-medium rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Publish Tactile Review</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
