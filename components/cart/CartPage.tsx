'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from 'lucide-react'
import { MAX_LINE_QTY, useBag } from '@/lib/bag-context'
import { formatINR } from '@/lib/api-client'
import { readStoredCoupon, storeCoupon, useQuote } from '@/lib/use-quote'
import { UnifortButton } from '@/components/ui/UnifortButton'

export function SummaryRows({ quote, loading }: { quote: ReturnType<typeof useQuote>['quote']; loading: boolean }) {
  if (!quote) return <p className="text-xs text-[#687194]">{loading ? 'Calculating…' : '—'}</p>
  return (
    <dl className="flex flex-col gap-2 text-xs" aria-busy={loading}>
      <div className="flex justify-between">
        <dt className="text-[#687194]">Subtotal</dt>
        <dd>{formatINR(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-emerald-700">
          <dt>Discount {quote.coupon ? `(${quote.coupon.code})` : ''}</dt>
          <dd>−{formatINR(quote.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-[#687194]">Shipping</dt>
        <dd>{quote.shippingFee === 0 ? 'Free' : formatINR(quote.shippingFee)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[#687194]">
          GST ({Math.round(quote.taxRate * 100)}%){quote.taxIncluded ? ' included' : ''}
        </dt>
        <dd>{formatINR(quote.tax)}</dd>
      </div>
      <div className="flex justify-between border-t border-[#424a70]/12 pt-3 mt-1 text-sm font-semibold text-[#1c2033]">
        <dt>Total</dt>
        <dd>{formatINR(quote.total)}</dd>
      </div>
      {quote.shippingFee > 0 && quote.subtotal - quote.discount < quote.freeShippingThreshold && (
        <p className="text-[11px] text-[#687194]">Add {formatINR(quote.freeShippingThreshold - (quote.subtotal - quote.discount))} more for free shipping.</p>
      )}
    </dl>
  )
}

export function CouponField({ code, setCode }: { code: string; setCode: (c: string) => void }) {
  const [input, setInput] = useState(code)
  useEffect(() => setInput(code), [code])
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const c = input.trim().toUpperCase()
        setCode(c)
        storeCoupon(c)
      }}
    >
      <label htmlFor="promo-code" className="sr-only">
        Promo code
      </label>
      <div className="relative flex-1">
        <Tag className="w-3.5 h-3.5 text-[#424a70]/50 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
        <input
          id="promo-code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Promo code"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#424a70]/20 rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
          autoComplete="off"
        />
      </div>
      {code ? (
        <button
          type="button"
          className="px-3 text-xs rounded-xl border border-[#424a70]/20"
          onClick={() => {
            setCode('')
            storeCoupon('')
          }}
        >
          Remove
        </button>
      ) : (
        <button type="submit" className="px-4 text-xs rounded-xl bg-[#424a70] text-white disabled:opacity-50" disabled={!input.trim()}>
          Apply
        </button>
      )}
    </form>
  )
}

export function CartPage() {
  const { items, updateQuantity, removeFromBag, clearBag, totalCount, hydrated } = useBag()
  const [coupon, setCoupon] = useState('')
  useEffect(() => setCoupon(readStoredCoupon()), [])
  const { quote, loading, error, problemProductId } = useQuote(coupon)

  if (!hydrated) return <main className="below-header min-h-[75vh]" aria-busy="true" />

  if (items.length === 0) {
    return (
      <main className="below-header min-h-[75vh] flex items-center justify-center px-4 pb-16 bg-[#faf9fc]">
        <div className="w-full max-w-md p-8 sm:p-10 bg-white border border-[#424a70]/12 rounded-3xl text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#424a70]/10 flex items-center justify-center text-[#424a70]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-[#1c2033] mb-2">Your bag is empty</h1>
          <p className="text-xs text-[#687194] leading-relaxed mb-6">Discover our stoneware and glass, or design your own piece in the 3D studio.</p>
          <UnifortButton href="/collection" variant="primary" size="md" fullWidth icon={<ArrowRight className="w-4 h-4" />} iconPosition="end">
            Explore the collection
          </UnifortButton>
        </div>
      </main>
    )
  }

  return (
    <main className="below-header min-h-screen bg-[#faf9fc] text-[#1c2033] pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/collection" className="inline-flex items-center gap-1.5 text-xs text-[#687194] hover:text-[#1c2033] mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue shopping</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium">Your shopping bag</h1>
              <p className="text-xs text-[#687194] mt-0.5">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <button onClick={clearBag} className="text-xs text-red-600/80 hover:text-red-700 self-start sm:self-auto">
              Clear bag
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <ul className="lg:col-span-8 flex flex-col gap-4">
            {items.map(({ key, product, quantity, customDesignId, designTitle }) => {
              const line = quote?.items.find((l) => l.productId === product.id && (l.customDesignId || '') === (customDesignId || ''))
              const unit = line?.unitPrice ?? product.rawPrice
              const hasProblem = problemProductId === product.id
              return (
                <li
                  key={key}
                  className={`flex gap-4 p-4 bg-white border rounded-2xl ${hasProblem ? 'border-red-400' : 'border-[#424a70]/12'}`}
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#f3f2f7] shrink-0">
                    <Image src={product.image} alt={product.name} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-medium truncate">
                          {product.slug ? <Link href={customDesignId ? `/customize?design=${customDesignId}` : `/collection/${product.slug}`}>{product.name}</Link> : product.name}
                        </h2>
                        <p className="text-xs text-[#687194]">{designTitle ? `Custom design: ${designTitle}` : product.type}</p>
                        {line && line.stock < quantity && <p className="text-xs text-red-600 mt-1">Only {line.stock} left in stock</p>}
                      </div>
                      <button onClick={() => removeFromBag(key)} className="p-1.5 text-[#687194] hover:text-red-600" aria-label={`Remove ${product.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#424a70]/20 rounded-lg" role="group" aria-label={`Quantity of ${product.name}`}>
                        <button onClick={() => updateQuantity(key, -1)} className="p-1.5" aria-label="Decrease quantity">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-mono" aria-live="polite">
                          {quantity}
                        </span>
                        <button onClick={() => updateQuantity(key, 1)} className="p-1.5 disabled:opacity-40" aria-label="Increase quantity" disabled={quantity >= MAX_LINE_QTY}>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <strong className="text-sm">{formatINR(unit * quantity)}</strong>
                        {quantity > 1 && <span className="block text-[11px] text-[#687194]">{formatINR(unit)} each</span>}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <aside className="lg:col-span-4 p-6 bg-white border border-[#424a70]/12 rounded-2xl flex flex-col gap-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold">Order summary</h2>
            <CouponField code={coupon} setCode={setCoupon} />
            {quote?.couponMessage && (
              <p className="text-xs text-red-600" role="alert">
                {quote.couponMessage}
              </p>
            )}
            {quote?.coupon && <p className="text-xs text-emerald-700">Code {quote.coupon.code} applied{quote.coupon.description ? ` — ${quote.coupon.description}` : ''}</p>}
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <SummaryRows quote={quote} loading={loading} />
            <UnifortButton href="/checkout" variant="primary" fullWidth disabled={!quote || !!error} icon={<ArrowRight className="w-4 h-4" />} iconPosition="end">
              Proceed to checkout
            </UnifortButton>
          </aside>
        </div>
      </div>
    </main>
  )
}
