'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { parsePrice, useBag } from '@/lib/bag-context'

export function BagDrawer() {
  const { items, isBagOpen, setIsBagOpen, updateQuantity, removeFromBag, clearBag, totalPrice, totalCount } = useBag()
  const router = useRouter()

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

    const itemLines = items.map(
      (item) =>
        `• ${item.quantity} × ${item.product.name} (${item.product.price} each) — ₹${(
          parsePrice(item.product.price) * item.quantity
        ).toLocaleString()}`
    )

    const message = `Hello UNIFORT Studio,

I would like to inquire about ordering the following pieces:

${itemLines.join('\n')}

Estimated Total: ₹${totalPrice.toLocaleString()}

Please confirm availability, lead time, and shipping details.`

    setIsBagOpen(false)
    router.push(`/contact?order=${encodeURIComponent(message)}`)
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
              {items.map(({ product, quantity }) => {
                const itemTotal = parsePrice(product.price) * quantity
                return (
                  <div key={product.name} className="bag-item">
                    <div className="bag-item-image">
                      <Image src={product.image} alt={product.name} fill sizes="80px" />
                    </div>
                    <div className="bag-item-details">
                      <div className="bag-item-head">
                        <div>
                          <h4>{product.name}</h4>
                          <p className="muted">{product.type}</p>
                        </div>
                        <button
                          className="bag-remove-btn"
                          onClick={() => removeFromBag(product.name)}
                          aria-label={`Remove ${product.name} from bag`}
                          title="Remove item"
                        >
                          <Trash2 />
                        </button>
                      </div>

                      <div className="bag-item-foot">
                        <div className="quantity-control">
                          <button
                            onClick={() => updateQuantity(product.name, -1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            <Minus />
                          </button>
                          <span className="qty-value">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.name, 1)}
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
                <span>Subtotal</span>
                <strong>₹{totalPrice.toLocaleString()}</strong>
              </div>
              <p className="shipping-note muted">
                Taxes, availability & bespoke shipping calculated upon studio inquiry.
              </p>

              <button className="button bag-order-btn" onClick={handleOrder}>
                Order pieces <ArrowUpRight />
              </button>

              <button className="clear-bag-link" onClick={clearBag}>
                Clear bag
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
