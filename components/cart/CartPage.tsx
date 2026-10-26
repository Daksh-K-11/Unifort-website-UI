'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  Check,
} from 'lucide-react'
import { parsePrice, useBag } from '@/lib/bag-context'
import { UnifortButton } from '@/components/ui/UnifortButton'

export function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeFromBag, clearBag, totalPrice, totalCount } = useBag()

  const [promoCode, setPromoCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    setPromoError(null)
    setPromoSuccess(null)

    const clean = promoCode.trim().toUpperCase()
    if (!clean) return

    if (clean === 'ATELIER10' || clean === 'WELCOME10') {
      const discount = Math.round(totalPrice * 0.1)
      setAppliedDiscount(discount)
      setPromoSuccess(`Voucher applied: 10% atelier patronage discount (Saved ₹${discount})`)
    } else if (clean === 'FREESHIP') {
      setAppliedDiscount(40)
      setPromoSuccess('Complimentary priority shipping code applied!')
    } else {
      setPromoError('Invalid promotion code. Try "ATELIER10" for 10% off.')
    }
  }

  const shippingFee = totalPrice >= 500 ? 0 : 40
  const finalTotal = Math.max(0, totalPrice - appliedDiscount + shippingFee)

  if (items.length === 0) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#faf9fc]">
        <div className="w-full max-w-md p-8 sm:p-10 bg-white border border-[#424a70]/12 rounded-3xl text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#424a70]/10 flex items-center justify-center text-[#424a70]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-[#1c2033] mb-2">
            Your Tableware Bag is Empty
          </h1>
          <p className="text-xs text-[#687194] leading-relaxed mb-6">
            Discover our permanent stoneware forms, reduction glazes, and hand-blown crystal glass before proceeding.
          </p>
          <UnifortButton
            href="/collection"
            variant="primary"
            size="md"
            fullWidth
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="end"
          >
            Explore Tableware Collection
          </UnifortButton>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf9fc] text-[#1c2033] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Navigation */}
        <div className="mb-8">
          <Link
            href="/collection"
            className="inline-flex items-center gap-1.5 text-xs text-[#687194] hover:text-[#1c2033] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#1c2033]">
                Your Shopping Bag
              </h1>
              <p className="text-xs text-[#687194] mt-0.5">
                {totalCount} {totalCount === 1 ? 'consignment item' : 'consignment items'} ready for dispatch
              </p>
            </div>
            <button
              onClick={clearBag}
              className="text-xs text-red-500/80 hover:text-red-600 transition-colors self-start sm:self-auto"
            >
              Clear Entire Bag
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {items.map(({ product, quantity }) => {
              const itemPrice = parsePrice(product.price)
              const itemTotal = itemPrice * quantity

              return (
                <div
                  key={product.name}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 bg-white border border-[rgba(66,74,112,0.14)] rounded-2xl shadow-xs transition-all hover:border-[rgba(66,74,112,0.3)]"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#faf9fc] border border-[rgba(66,74,112,0.1)] shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold">
                      {product.category}
                    </span>
                    <h3 className="text-sm font-semibold text-[#1c2033] truncate mt-0.5">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#687194] mt-0.5">
                      {product.type}
                    </p>
                    <p className="text-xs font-mono font-medium text-[#424a70] mt-1 sm:hidden">
                      ₹{itemPrice.toLocaleString()} each
                    </p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(66,74,112,0.08)]">
                    {/* Stepper */}
                    <div className="flex items-center border border-[rgba(66,74,112,0.2)] rounded-lg bg-[#faf9fc]">
                      <button
                        onClick={() => updateQuantity(product.name, -1)}
                        className="p-1.5 text-[#424a70] hover:text-[#1c2033] hover:bg-slate-200/50 rounded-l-lg transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-mono font-semibold text-[#1c2033]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.name, 1)}
                        className="p-1.5 text-[#424a70] hover:text-[#1c2033] hover:bg-slate-200/50 rounded-r-lg transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total Price */}
                    <div className="text-right min-w-[70px]">
                      <strong className="text-sm font-serif font-bold text-[#1c2033] block">
                        ₹{itemTotal.toLocaleString()}
                      </strong>
                      <span className="hidden sm:inline text-[11px] text-[#687194]">
                        ₹{itemPrice.toLocaleString()} ea
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromBag(product.name)}
                      className="p-2 text-[#687194] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from bag"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Atelier Assurance Badge */}
            <div className="p-4 bg-white/70 border border-[rgba(66,74,112,0.12)] rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-xs text-[#687194]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Damage-Free Transit Guarantee</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-[rgba(66,74,112,0.15)]" />
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#424a70] shrink-0" />
                <span>Complimentary Delivery Above ₹500</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-[rgba(66,74,112,0.15)]" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>100% Food-Safe Stoneware & Glass</span>
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-sm sticky top-24">
              <h2 className="text-base font-serif font-semibold text-[#1c2033] mb-4 pb-3 border-b border-[rgba(66,74,112,0.1)]">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs mb-6">
                <div className="flex justify-between text-[#687194]">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-[#1c2033]">₹{totalPrice.toLocaleString()}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Atelier Patron Discount</span>
                    <span className="font-mono">-₹{appliedDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#687194]">
                  <span>Archival Insured Delivery</span>
                  <span className="font-medium text-emerald-600">
                    {shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-[#687194]">
                  <span>Estimated GST (12%)</span>
                  <span className="font-mono text-[#687194]">Included in price</span>
                </div>

                <div className="border-t border-[rgba(66,74,112,0.12)] pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-[#1c2033]">Total Amount</span>
                  <strong className="text-xl font-serif font-bold text-[#424a70]">
                    ₹{finalTotal.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="mb-6">
                <label className="text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#424a70]" />
                  Promotion or Gift Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. ATELIER10"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                  <UnifortButton type="submit" variant="outline" size="sm">
                    Apply
                  </UnifortButton>
                </div>
                {promoError && (
                  <p className="text-[11px] text-red-500 mt-1">{promoError}</p>
                )}
                {promoSuccess && (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{promoSuccess}</span>
                  </p>
                )}
              </form>

              {/* Action Button */}
              <UnifortButton
                onClick={() => router.push('/checkout')}
                variant="primary"
                size="md"
                fullWidth
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="end"
              >
                Proceed to Checkout (₹{finalTotal.toLocaleString()})
              </UnifortButton>

              <p className="text-[11px] text-center text-[#687194] mt-3">
                Secure checkout powered by Razorpay. All major UPI, cards & netbanking supported.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
