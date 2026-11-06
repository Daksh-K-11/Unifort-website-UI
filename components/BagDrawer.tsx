'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { parsePrice, useBag } from '@/lib/bag-context'
import { useCustomer } from '@/lib/customer-context'

export function BagDrawer() {
  const { items, isBagOpen, setIsBagOpen, updateQuantity, removeFromBag, clearBag, totalPrice, totalCount } = useBag()
  const router = useRouter()
  const { requireAuth } = useCustomer()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBagOpen) {
        setIsBagOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isBagOpen, setIsBagOpen])

  useEffect(() => {
    if (isBagOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isBagOpen])

  if (!isBagOpen) return null

  const handleOrder = () => {
    if (items.length === 0) return
    setIsBagOpen(false)
    if (!requireAuth('Sign in or create an account to place your order.', () => router.push('/checkout'))) return
    router.push('/checkout')
  }

  const handleHospitalityInquiry = () => {
    setIsBagOpen(false)
    router.push('/contact?type=HOSPITALITY_COMMISSION')
  }

  const handleExplore = () => {
    setIsBagOpen(false)
    router.push('/collection')
  }

  return (
    <div className="bag-drawer-backdrop" onClick={() => setIsBagOpen(false)}>
      <div
        className="bag-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
      >
        <div className="bag-drawer-header">
          <div className="bag-drawer-title">
            <h2>Your Bag</h2>
            <span className="bag-count-badge">{totalCount} {totalCount === 1 ? 'item' : 'items'}</span>
          </div>
          <button
            className="close-button"
            onClick={() => setIsBagOpen(false)}
            aria-label="Close shopping bag"
          >
            <X />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bag-drawer-empty">
            <div className="empty-icon-wrap">
              <ShoppingBag />
            </div>
            <h3>Your bag is empty</h3>
            <p className="muted">
              Explore our collection of tableware crafted with intention for the long table.
            </p>
            <button className="button" onClick={handleExplore}>
              Explore collection <ArrowUpRight />
            </button>
          </div>
        ) : (
          <>
            <div className="bag-drawer-items">
              {items.map(({ key, product, quantity, designTitle }) => {
                const itemTotal = (product.rawPrice ?? parsePrice(product.price)) * quantity
                return (
                  <div key={key} className="bag-item">
                    <div className="bag-item-image">
                      <Image src={product.image} alt={product.name} fill sizes="80px" />
                    </div>
                    <div className="bag-item-details">
                      <div className="bag-item-head">
                        <div>
                          <h4>{product.name}</h4>
                          <p className="muted">{designTitle ? `Custom design: ${designTitle}` : product.type}</p>
                        </div>
                        <button
                          className="bag-remove-btn"
                          onClick={() => removeFromBag(key)}
                          aria-label={`Remove ${product.name} from bag`}
                          title="Remove item"
                        >
                          <Trash2 />
                        </button>
                      </div>

                      <div className="bag-item-foot">
                        <div className="quantity-control">
                          <button
                            onClick={() => updateQuantity(key, -1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            <Minus />
                          </button>
                          <span className="qty-value">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(key, 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            <Plus />
                          </button>
                        </div>
                        <div className="bag-item-price">
                          <strong>₹{itemTotal.toLocaleString()}</strong>
                          {quantity > 1 && (
                            <span className="unit-price">({product.price} ea)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bag-drawer-footer">
              <div className="summary-row">
                <span className="text-xs text-[#687194]">Subtotal (estimated)</span>
                <strong className="text-sm font-semibold text-[#1c2033]">₹{totalPrice.toLocaleString()}</strong>
              </div>
              <p className="shipping-note text-[11px] text-[#687194] leading-relaxed mt-1">
                Shipping, GST and promo codes are calculated at checkout.
              </p>

              <div className="flex flex-col gap-2 mt-4">
                <button
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#424a70] to-[#2e3452] !text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  onClick={handleOrder}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    className="text-[#687194] hover:text-[#1c2033] transition-colors"
                    onClick={() => {
                      setIsBagOpen(false)
                      router.push('/cart')
                    }}
                  >
                    View Full Cart
                  </button>
                  <button
                    type="button"
                    className="text-red-500/80 hover:text-red-600 transition-colors"
                    onClick={clearBag}
                  >
                    Clear Bag
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
