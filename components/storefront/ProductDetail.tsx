'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { MAX_LINE_QTY, useBag } from '@/lib/bag-context'
import type { StorefrontProduct } from '@/lib/product-mapper'
import { formatINR } from '@/lib/api-client'
import { useCustomer } from '@/lib/customer-context'
import { UnifortButton } from '@/components/ui/UnifortButton'
import { ProductReviewsSection } from '@/components/reviews/ProductReviewsSection'

export function ProductDetail({ product }: { product: StorefrontProduct }) {
  const router = useRouter()
  const { addToBag, setIsBagOpen, items } = useBag()
  const { requireAuth } = useCustomer()
  const images = [product.image, ...(product.gallery || []).filter((g) => g !== product.image)]
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)

  const inBag = items.filter((i) => i.product.id === product.id).reduce((s, i) => s + i.quantity, 0)
  const maxQty = Math.max(0, Math.min(MAX_LINE_QTY, product.stock - inBag))
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= 5

  const add = (thenCheckout: boolean) => {
    if (qty < 1 || qty > maxQty) return
    const reason = thenCheckout ? 'Sign in or create an account to buy this piece.' : 'Sign in or create an account to add this to your bag.'
    if (!requireAuth(reason, () => addNow(thenCheckout))) return
    addNow(thenCheckout)
  }

  const addNow = (thenCheckout: boolean) => {
    addToBag(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type,
        price: product.price,
        rawPrice: product.rawPrice,
        image: product.image,
        category: product.category,
      },
      qty
    )
    setQty(1)
    if (thenCheckout) router.push('/checkout')
    else setIsBagOpen(true)
  }

  const specs = [
    { label: 'Material', value: product.material },
    { label: 'Dimensions', value: product.dimensions },
    { label: 'Care', value: product.careInstructions },
    { label: 'Category', value: product.category },
  ].filter((s) => s.value)

  return (
    <main className="page">
      <section className="section-pad" style={{ paddingTop: 24, paddingLeft: 'clamp(16px, 4vw, 48px)', paddingRight: 'clamp(16px, 4vw, 48px)' }}>
        <Link href="/collection" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          <ChevronLeft size={16} /> Back to the collection
        </Link>
        <div className="quick-modal product-page">
          <div className="modal-primary-row">
            <div className="modal-image-col">
              <div className="modal-image-frame">
                <Image src={images[activeImage]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 520px" className="modal-fit-image" preload />
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      onClick={() => setActiveImage(i)}
                      aria-label={`Show image ${i + 1}`}
                      aria-pressed={i === activeImage}
                      style={{
                        position: 'relative',
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: i === activeImage ? '2px solid #424a70' : '1px solid rgba(66,74,112,0.2)',
                      }}
                    >
                      <Image src={src} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-main-content">
              <span className="eyebrow">UNIFORT / {product.category}</span>
              <h1 className="display display-small">{product.name}</h1>
              <span className="modal-piece-type">{product.type}</span>

              <div className="modal-price">
                <div className="flex flex-col">
                  <span className="modal-price-number">
                    {product.price}
                    {product.compareAtPrice ? (
                      <s style={{ marginLeft: 10, fontSize: '0.6em', color: '#8a90a8' }}>{formatINR(product.compareAtPrice)}</s>
                    ) : null}
                  </span>
                  <span className="modal-price-tax">GST and shipping calculated at checkout</span>
                </div>
                <div className="modal-dispatch-badge" aria-live="polite">
                  <span className="dispatch-dot" style={outOfStock ? { background: '#b42318' } : lowStock ? { background: '#d97706' } : undefined} />
                  <span>{outOfStock ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : 'In stock'}</span>
                </div>
              </div>

              {!outOfStock && (
                <div className="flex items-center gap-3 my-3">
                  <span className="text-xs text-[#687194] font-medium" id="qty-label">
                    Quantity
                  </span>
                  <div className="flex items-center border border-[rgba(66,74,112,0.2)] rounded-lg bg-[#faf9fc]" role="group" aria-labelledby="qty-label">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-1.5 text-[#424a70]" aria-label="Decrease quantity" disabled={qty <= 1}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-mono font-semibold text-[#1c2033]" aria-live="polite">
                      {qty}
                    </span>
                    <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="p-1.5 text-[#424a70]" aria-label="Increase quantity" disabled={qty >= maxQty}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {inBag > 0 && <span className="text-xs text-[#687194]">{inBag} already in your bag</span>}
                </div>
              )}

              <div className="modal-actions-wrap">
                <UnifortButton variant="primary" onClick={() => add(false)} disabled={outOfStock || maxQty < 1}>
                  {outOfStock ? 'Out of stock' : maxQty < 1 ? 'Maximum in bag' : 'Add to Bag'}
                </UnifortButton>
                {!outOfStock && maxQty > 0 && (
                  <UnifortButton variant="outline" onClick={() => add(true)}>
                    Buy Now
                  </UnifortButton>
                )}
                {product.isCustomizable && (
                  <UnifortButton href={`/customize?piece=${encodeURIComponent(product.slug)}`} variant="ghost">
                    Customize in 3D
                  </UnifortButton>
                )}
              </div>
            </div>
          </div>

          <div className="modal-rest-content">
            {product.description && (
              <div className="modal-details-block">
                <h2 className="modal-section-title">Design &amp; materiality</h2>
                <p className="modal-piece-desc">{product.description}</p>
              </div>
            )}
            {specs.length > 0 && (
              <dl className="modal-spec-grid">
                {specs.map((s) => (
                  <div className="spec-item" key={s.label}>
                    <dt className="spec-label">{s.label}</dt>
                    <dd className="spec-value">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ProductReviewsSection productId={product.id} productName={product.name} />
          </div>
        </div>
      </section>
    </main>
  )
}
