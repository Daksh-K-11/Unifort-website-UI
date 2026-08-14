'use client'

import React from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { useBag } from '@/lib/bag-context'

export function BagToast() {
  const { toastMessage, setToastMessage, setIsBagOpen } = useBag()

  if (!toastMessage) return null

  const handleOpenBag = () => {
    setToastMessage(null)
    setIsBagOpen(true)
  }

  return (
    <div className="bag-toast" role="status" aria-live="polite">
      <div className="toast-icon">
        <ShoppingBag />
      </div>
      <div className="toast-content">
        <p className="toast-text">{toastMessage}</p>
        <button className="toast-action" onClick={handleOpenBag}>
          View Bag
        </button>
      </div>
      <button
        className="toast-close"
        onClick={() => setToastMessage(null)}
        aria-label="Close notification"
      >
        <X />
      </button>
    </div>
  )
}
