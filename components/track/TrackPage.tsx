'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  XCircle,
  Check,
  AlertCircle,
} from 'lucide-react'
import { useCustomer } from '@/lib/customer-context'
import { CustomerOrder, OrderStatus } from '@/lib/customer-types'
import { UnifortButton } from '@/components/ui/UnifortButton'
import { api } from '@/lib/api-client'

export function TrackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] flex items-center justify-center bg-[#faf9fc]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin" />
            <span className="text-xs uppercase tracking-wider text-[#424a70] font-medium">
              Loading Consignment Tracking...
            </span>
          </div>
        </main>
      }
    >
      <TrackContent />
    </Suspense>
  )
}

function TrackContent() {
  const searchParams = useSearchParams()
  const { orders, markOrderReceived, submitReview } = useCustomer()

  const [query, setQuery] = useState('')
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isMarkingReceived, setIsMarkingReceived] = useState(false)
  const [deliveryConfirmedSuccess, setDeliveryConfirmedSuccess] = useState(false)

  // Review state
  const [selectedProductForReview, setSelectedProductForReview] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  // Check query parameter on mount
  useEffect(() => {
    const orderParam = searchParams.get('order') || searchParams.get('tracking')
    if (orderParam) {
      setQuery(orderParam)
      performLookup(orderParam)
    } else if (orders.length > 0) {
      // Default to most recent order if available
      setCurrentOrder(orders[0])
      setQuery(orders[0].orderNumber)
    }
  }, [searchParams, orders])

  const performLookup = async (searchRef: string) => {
    setNotFound(false)
    setDeliveryConfirmedSuccess(false)
    const clean = searchRef.trim().toUpperCase()
    if (!clean) return

    const found = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === clean ||
        o.id.toUpperCase() === clean ||
        (o.trackingNumber && o.trackingNumber.toUpperCase() === clean)
    )

    if (found) {
      setCurrentOrder(found)
      return
    }

    // Query backend public tracking API
    try {
      const res = await api.get(`/orders/track/${encodeURIComponent(clean)}`)
      if (res.success && res.data) {
        const o = res.data
        const rawAddr = o.shippingAddress || {}
        const fetchedOrder: CustomerOrder = {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          totalAmount: Number(o.totalAmount || 0),
          items: (o.items || []).map((it: any) => ({
            id: it.id,
            productId: it.productId,
            productName: it.productName,
            productType: it.productType,
            productImage: it.productImage || '/products/unifort-plate-light.jpg',
            price: Number(it.price || 0),
            quantity: it.quantity,
            bespokeDesignId: it.customDesignId,
          })),
          shippingAddress: {
            fullName: rawAddr.recipientName || rawAddr.fullName || 'Patron',
            addressLine1: rawAddr.addressLine1 || '',
            addressLine2: rawAddr.addressLine2 || '',
            city: rawAddr.city || '',
            state: rawAddr.state || '',
            postalCode: rawAddr.postalCode || '',
            country: rawAddr.country || 'India',
          },
          trackingNumber: o.trackingNumber,
          carrier: o.carrier,
          estimatedDelivery: o.estimatedDelivery,
          createdAt: o.createdAt,
        }
        setCurrentOrder(fetchedOrder)
        return
      }
    } catch (e) {
      console.error('Error fetching tracking info', e)
    }

    setCurrentOrder(null)
    setNotFound(true)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performLookup(query)
  }

  const handleConfirmReceived = async () => {
    if (!currentOrder) return
    setIsMarkingReceived(true)
    await markOrderReceived(currentOrder.id)
    setIsMarkingReceived(false)
    setDeliveryConfirmedSuccess(true)
    // Update local display immediately
    setCurrentOrder({
      ...currentOrder,
      status: 'DELIVERED',
      updatedAt: new Date().toISOString(),
    })
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductForReview || !reviewComment.trim()) return

    await submitReview(selectedProductForReview, {
      rating: reviewRating,
      title: 'Verified Consignment Delivery Review',
      comment: reviewComment,
    })
    setReviewSubmitted(true)
  }

  // Determine stage progression
  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 0
      case 'CONFIRMED':
      case 'PROCESSING':
        return 1
      case 'SHIPPED':
        return 2
      case 'DELIVERED':
        return 3
      case 'CANCELLED':
        return -1
      default:
        return 0
    }
  }

  const stageIndex = currentOrder ? getStageIndex(currentOrder.status) : 0

  return (
    <main className="min-h-screen bg-[#faf9fc] text-[#1c2033] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Breadcrumb */}
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs text-[#687194] hover:text-[#1c2033] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Patron Portal</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#1c2033]">
                Consignment Tracking & Delivery
              </h1>
              <p className="text-xs text-[#687194] mt-0.5">
                Real-time transit updates from reduction kilns to doorstep reception.
              </p>
            </div>
            <Link
              href="/collection"
              className="text-xs text-[#424a70] hover:underline font-medium self-start sm:self-auto"
            >
              Explore Collection
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#687194]" />
              <input
                type="text"
                placeholder="Enter Consignment or Waybill Ref (e.g. UNI-2026-8910)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#faf9fc] border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70] uppercase font-mono tracking-wider"
              />
            </div>
            <UnifortButton type="submit" variant="primary" size="md">
              Track Consignment
            </UnifortButton>
          </form>

          {/* Quick Select Pill Helpers */}
          {orders.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[rgba(66,74,112,0.08)]">
              <span className="text-[11px] text-[#687194]">Your Recent Orders:</span>
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => performLookup(o.orderNumber)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                    currentOrder?.id === o.id
                      ? 'bg-[#424a70] text-white border-transparent'
                      : 'bg-[#faf9fc] border-[rgba(66,74,112,0.15)] text-[#424a70] hover:bg-white'
                  }`}
                >
                  {o.orderNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {notFound && (
          <div className="p-8 bg-white border border-dashed border-[rgba(66,74,112,0.2)] rounded-3xl text-center space-y-3">
            <XCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-semibold text-[#1c2033]">Consignment Not Found</h3>
            <p className="text-xs text-[#687194] max-w-sm mx-auto">
              We couldn&apos;t locate an order with reference &ldquo;{query}&rdquo;. Please verify your tracking number or check your patron email receipt.
            </p>
          </div>
        )}

        {/* Active Order Tracking Display */}
        {currentOrder && (
          <div className="space-y-6">
            {/* Header Status Card */}
            <div className="p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(66,74,112,0.1)]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-serif font-semibold text-[#1c2033]">
                      Consignment {currentOrder.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        currentOrder.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentOrder.status === 'SHIPPED'
                          ? 'bg-blue-100 text-blue-800'
                          : currentOrder.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {currentOrder.status}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        currentOrder.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {currentOrder.paymentStatus === 'PAID' ? 'PAID' : 'COD PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-[#687194] mt-0.5">
                    Committed on {new Date(currentOrder.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })} · Total Amount: ₹{currentOrder.totalAmount.toLocaleString()}
                  </p>
                </div>

                {/* Waybill Badge */}
                <div className="text-left sm:text-right bg-[#faf9fc] p-3 rounded-xl border border-[rgba(66,74,112,0.1)]">
                  <span className="text-[10px] text-[#687194] uppercase tracking-wider block">Carrier & Waybill</span>
                  <span className="font-mono text-xs font-semibold text-[#424a70]">
                    {currentOrder.trackingNumber || 'UNI-AIR-TRACK'}
                  </span>
                  <span className="text-[11px] text-[#687194] block mt-0.5">
                    {currentOrder.carrier || 'BlueDart Fine Art Logistics'}
                  </span>
                </div>
              </div>

              {/* Delivery Confirmation Success Banner */}
              {deliveryConfirmedSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold block">Consignment Successfully Received!</span>
                    <span>Your delivery timestamp has been recorded. We hope you enjoy living with your new tableware pieces.</span>
                  </div>
                </div>
              )}

              {/* 4-Step Interactive Timeline */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-4">
                  Consignment Milestone Progression
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  {/* Step 1 */}
                  <div
                    className={`flex flex-col p-4 rounded-xl border transition-all ${
                      stageIndex >= 0
                        ? 'border-[#424a70] bg-[#424a70]/5 shadow-2xs'
                        : 'border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#424a70] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <span className="text-xs font-semibold text-[#1c2033]">Order Committed</span>
                    </div>
                    <p className="text-[11px] text-[#687194] leading-relaxed">
                      Payment secured & order specifications verified.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`flex flex-col p-4 rounded-xl border transition-all ${
                      stageIndex >= 1
                        ? 'border-[#424a70] bg-[#424a70]/5 shadow-2xs'
                        : 'border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          stageIndex >= 1 ? 'bg-[#424a70] text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {stageIndex > 1 ? '✓' : '2'}
                      </div>
                      <span className="text-xs font-semibold text-[#1c2033]">Atelier Firing</span>
                    </div>
                    <p className="text-[11px] text-[#687194] leading-relaxed">
                      Reduction kiln curing & artisanal glaze inspection.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`flex flex-col p-4 rounded-xl border transition-all ${
                      stageIndex >= 2
                        ? 'border-[#424a70] bg-[#424a70]/5 shadow-2xs'
                        : 'border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          stageIndex >= 2 ? 'bg-[#424a70] text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {stageIndex > 2 ? '✓' : '3'}
                      </div>
                      <span className="text-xs font-semibold text-[#1c2033]">In Transit</span>
                    </div>
                    <p className="text-[11px] text-[#687194] leading-relaxed">
                      Dispatched via BlueDart insured courier casing.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`flex flex-col p-4 rounded-xl border transition-all ${
                      stageIndex >= 3
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          stageIndex >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {stageIndex >= 3 ? '✓' : '4'}
                      </div>
                      <span className="text-xs font-semibold text-[#1c2033]">Delivered & Received</span>
                    </div>
                    <p className="text-[11px] text-[#687194] leading-relaxed">
                      Safely accepted at patron delivery residence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Delivery Confirmation Action */}
              {currentOrder.status !== 'DELIVERED' && currentOrder.status !== 'CANCELLED' && (
                <div className="p-4 bg-[#edf0f8] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-[rgba(66,74,112,0.18)]">
                  <div>
                    <span className="text-xs font-semibold text-[#1c2033] block">
                      Has your consignment arrived?
                    </span>
                    <span className="text-[11px] text-[#687194]">
                      Click below to confirm receipt once your tableware pieces are safely in hand.
                    </span>
                  </div>
                  <UnifortButton
                    onClick={handleConfirmReceived}
                    variant="primary"
                    size="sm"
                    loading={isMarkingReceived}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Confirm Order Received
                  </UnifortButton>
                </div>
              )}
            </div>

            {/* Consignment Items & Address Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Items Card */}
              <div className="md:col-span-8 p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-xs space-y-4">
                <h3 className="text-sm font-serif font-semibold text-[#1c2033] pb-2 border-b border-[rgba(66,74,112,0.1)]">
                  Items in Consignment ({currentOrder.items.length})
                </h3>

                <div className="divide-y divide-[rgba(66,74,112,0.08)]">
                  {currentOrder.items.map((it) => (
                    <div key={it.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-[#faf9fc] border border-[rgba(66,74,112,0.1)] overflow-hidden shrink-0">
                          <Image
                            src={it.productImage || '/products/unifort-plate-light.jpg'}
                            alt={it.productName}
                            fill
                            sizes="60px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1c2033]">{it.productName}</p>
                          <p className="text-[11px] text-[#687194]">
                            {it.productType || 'Artisanal stoneware'} · Qty: {it.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-[#1c2033]">
                          ₹{(it.price * it.quantity).toLocaleString()}
                        </span>
                        {currentOrder.status === 'DELIVERED' && (
                          <button
                            onClick={() => {
                              setSelectedProductForReview(it.productName)
                              setReviewSubmitted(false)
                            }}
                            className="text-[11px] text-[#424a70] hover:underline font-semibold bg-[#424a70]/5 px-2 py-1 rounded"
                          >
                            Review Piece
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address & Details */}
              <div className="md:col-span-4 p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-xs space-y-4">
                <h3 className="text-sm font-serif font-semibold text-[#1c2033] pb-2 border-b border-[rgba(66,74,112,0.1)]">
                  Delivery Destination
                </h3>

                <div className="text-xs text-[#687194] space-y-1 leading-relaxed">
                  <p className="font-semibold text-[#1c2033]">{currentOrder.shippingAddress.fullName}</p>
                  <p>{currentOrder.shippingAddress.addressLine1}</p>
                  {currentOrder.shippingAddress.addressLine2 && (
                    <p>{currentOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} –{' '}
                    {currentOrder.shippingAddress.postalCode}
                  </p>
                  <p>{currentOrder.shippingAddress.country}</p>
                </div>

                <div className="pt-3 border-t border-[rgba(66,74,112,0.1)] text-xs text-[#687194]">
                  <span className="block font-semibold text-[#1c2033] mb-0.5">Estimated Arrival</span>
                  <span>{currentOrder.estimatedDelivery || 'In 3 to 5 business days'}</span>
                </div>
              </div>
            </div>

            {/* Verified Review Modal (if customer selects a product to review) */}
            {selectedProductForReview && (
              <div className="p-6 bg-white border border-[#424a70]/20 rounded-2xl shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-serif font-semibold text-[#1c2033] flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Review & Rate &ldquo;{selectedProductForReview}&rdquo;
                  </h4>
                  <button
                    onClick={() => setSelectedProductForReview(null)}
                    className="text-xs text-[#687194] hover:text-[#1c2033]"
                  >
                    Close
                  </button>
                </div>

                {reviewSubmitted ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    Thank you! Your verified patron review has been added to the product page.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#687194]">Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= reviewRating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      required
                      placeholder="Share your thoughts on the weight, mineral glaze, and hand-feel of this piece..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full p-3 text-xs bg-[#faf9fc] border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70] resize-none"
                    />

                    <UnifortButton type="submit" variant="primary" size="sm">
                      Submit Verified Review
                    </UnifortButton>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
