'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  QrCode,
  Package,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Sparkles,
  Zap,
  ExternalLink,
  Lock,
  Wallet,
  AlertCircle,
} from 'lucide-react'
import { useBag, parsePrice } from '@/lib/bag-context'
import { useCustomer } from '@/lib/customer-context'
import { PaymentMethod, ShippingAddress, CustomerOrder } from '@/lib/customer-types'
import { UnifortButton } from '@/components/ui/UnifortButton'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearBag } = useBag()
  const { customer, placeOrder } = useCustomer()

  // Form State
  const [fullName, setFullName] = useState(customer?.name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('India')
  const [customerNotes, setCustomerNotes] = useState('')

  // Shipping Speed State
  const [shippingSpeed, setShippingSpeed] = useState<'standard' | 'express'>('standard')

  // Payment Selection State
  // Default to online Razorpay payment (UPI / Cards / NetBanking)
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY')

  // Processing & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRazorpaySandboxModal, setShowRazorpaySandboxModal] = useState(false)
  const [pendingOrderData, setPendingOrderData] = useState<any>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<CustomerOrder | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Auto-fill from authenticated customer profile if available
  useEffect(() => {
    if (customer) {
      if (!fullName) setFullName(customer.name)
      if (!email) setEmail(customer.email)
      if (!phone && customer.phone) setPhone(customer.phone)
    }
  }, [customer])

  // Dynamically load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Quick fill helper for testing/patron experience
  const handleQuickFillAddress = () => {
    setFullName('Elena Vance')
    setEmail('elena@vance.design')
    setPhone('+91 98401 23456')
    setAddressLine1('42 Boat Club Road')
    setAddressLine2('Apt 4B, Coastal Pavilions')
    setCity('Chennai')
    setState('Tamil Nadu')
    setPostalCode('600028')
    setCustomerNotes('Please pack in signature cedar gift casing with unbleached linen wrap.')
  }

  // Calculate pricing
  const standardShippingFee = totalPrice >= 500 ? 0 : 40
  const shippingFee = shippingSpeed === 'express' ? standardShippingFee + 90 : standardShippingFee
  const tax = Math.round(totalPrice * 0.12) // GST included in display
  const grandTotal = totalPrice + shippingFee

  // Empty Bag Handling
  if (items.length === 0 && !confirmedOrder) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#faf9fc]">
        <div className="w-full max-w-md p-8 sm:p-10 bg-white border border-[#424a70]/12 rounded-3xl text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#424a70]/10 flex items-center justify-center text-[#424a70]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1c2033] mb-1">
            Your Tableware Bag is Empty
          </h2>
          <p className="text-xs text-[#687194] leading-relaxed mb-6">
            Explore our permanent stoneware and hand-blown glass pieces before proceeding to checkout.
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

  // Order Submission Trigger
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!fullName.trim() || !email.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      setValidationError('Please complete all required delivery details (Name, Email, Phone, Address, City, PIN code).')
      window.scrollTo({ top: 120, behavior: 'smooth' })
      return
    }

    const shippingAddress: ShippingAddress = {
      fullName,
      addressLine1,
      addressLine2,
      city,
      state: state || 'Tamil Nadu',
      postalCode,
      country,
    }

    const orderItems = items.map((item, idx) => ({
      id: `it-${Date.now()}-${idx}`,
      productId:
        (item.product as any).id ||
        (item.product as any).slug ||
        item.product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      productName: item.product.name,
      productType: item.product.type,
      productImage: item.product.image,
      price: parsePrice(item.product.price),
      quantity: item.quantity,
    }))

    const orderPayload = {
      items: orderItems,
      shippingAddress,
      paymentMethod: (paymentMethod === 'RAZORPAY' ? 'UPI' : 'COD') as PaymentMethod,
      customerNotes: `${customerNotes} [Delivery Speed: ${shippingSpeed.toUpperCase()}]`.trim(),
    }

    if (paymentMethod === 'RAZORPAY') {
      // Check if real window.Razorpay credentials exist, else launch sandbox simulator
      setIsSubmitting(true)
      setPendingOrderData(orderPayload)

      // Check backend public config
      try {
        const res = await fetch('http://localhost:5000/api/v1/payment/config')
        const data = await res.json()
        if (data?.data?.isConfigured && typeof window !== 'undefined' && window.Razorpay) {
          // Live Razorpay Mode
          const rzp = new window.Razorpay({
            key: data.data.keyId,
            amount: grandTotal * 100,
            currency: 'INR',
            name: 'UNIFORT Tableware',
            description: `Atelier consignment for ${orderItems.length} items`,
            prefill: {
              name: fullName,
              email: email,
              contact: phone,
            },
            theme: {
              color: '#424a70',
            },
            handler: async (response: any) => {
              await completeOrderPlacement(orderPayload, 'PAID', response)
            },
          })
          rzp.open()
          setIsSubmitting(false)
          return
        }
      } catch (err) {
        // Backend offline or config unavailable; fallback to integrated sandbox
      }

      // Launch friendly sandbox payment modal
      setIsSubmitting(false)
      setShowRazorpaySandboxModal(true)
    } else {
      // Cash on Delivery
      setIsSubmitting(true)
      await completeOrderPlacement(orderPayload, 'PENDING')
      setIsSubmitting(false)
    }
  }

  // Finalizes the order in state and customer context
  const completeOrderPlacement = async (orderPayload: any, paymentStatus: 'PAID' | 'PENDING', rzpDetails?: any) => {
    setIsSubmitting(true)
    setShowRazorpaySandboxModal(false)

    const result = await placeOrder({
      ...orderPayload,
      customerNotes: rzpDetails
        ? `${orderPayload.customerNotes} [Razorpay ID: ${rzpDetails.razorpay_payment_id || 'sandbox_captured'}]`
        : orderPayload.customerNotes,
    })

    setIsSubmitting(false)

    if (result.success && result.order) {
      setConfirmedOrder(result.order)
      clearBag()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ================= ORDER CONFIRMATION VIEW =================
  if (confirmedOrder) {
    return (
      <main className="min-h-screen bg-[#faf9fc] text-[#1c2033] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white border border-[#424a70]/15 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#424a70] font-semibold block mb-1">
              Atelier Consignment Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#1c2033]">
              Thank You for Your Order
            </h1>
            <p className="text-xs text-[#687194] mt-1.5 max-w-md mx-auto leading-relaxed">
              Order <span className="font-mono font-bold text-[#424a70]">{confirmedOrder.orderNumber}</span> has been committed to our Chennai studio for reduction inspection and archival packing.
            </p>
          </div>

          {/* Quick Consignment Summary Card */}
          <div className="p-5 bg-[#faf9fc] border border-[#424a70]/10 rounded-2xl text-left text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#424a70]/10 pb-2">
              <span className="text-[#687194]">Consignment Reference:</span>
              <span className="font-mono font-semibold text-[#424a70]">
                {confirmedOrder.orderNumber}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#424a70]/10 pb-2">
              <span className="text-[#687194]">Tracking Waybill:</span>
              <span className="font-mono font-semibold text-[#1c2033]">
                {confirmedOrder.trackingNumber || 'UNI-AIR-TRACK'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#424a70]/10 pb-2">
              <span className="text-[#687194]">Estimated Delivery:</span>
              <span className="font-medium text-[#1c2033]">{confirmedOrder.estimatedDelivery || 'In 3–5 Business Days'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#424a70]/10 pb-2">
              <span className="text-[#687194]">Payment Method:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {confirmedOrder.paymentMethod === 'UPI' ? 'Razorpay (PAID)' : 'Cash on Delivery (PENDING)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#687194]">Delivery Address:</span>
              <span className="text-right text-[#1c2033] max-w-[240px] truncate">
                {confirmedOrder.shippingAddress.addressLine1}, {confirmedOrder.shippingAddress.city}
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <UnifortButton
              href={`/track?order=${confirmedOrder.orderNumber}`}
              variant="primary"
              size="md"
              icon={<Truck className="w-4 h-4" />}
            >
              Track Live Delivery Status
            </UnifortButton>
            <UnifortButton
              href="/account"
              variant="outline"
              size="md"
              icon={<Package className="w-4 h-4" />}
            >
              View in Patron Portal
            </UnifortButton>
            <UnifortButton
              href="/collection"
              variant="ghost"
              size="md"
            >
              Continue Shopping
            </UnifortButton>
          </div>
        </div>
      </main>
    )
  }

  // ================= MAIN CHECKOUT VIEW =================
  return (
    <main className="min-h-screen bg-[#faf9fc] text-[#1c2033] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs text-[#687194] hover:text-[#1c2033] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Shopping Bag</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#1c2033]">
                Atelier Consignment Checkout
              </h1>
              <p className="text-xs text-[#687194] mt-0.5">
                Archival tableware dispatched with insurance from our Chennai studio.
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickFillAddress}
              className="text-xs text-[#424a70] hover:underline font-medium self-start sm:self-auto bg-[#424a70]/5 px-2.5 py-1 rounded-lg border border-[#424a70]/15"
            >
              Quick-Fill Sample Address
            </button>
          </div>
        </div>

        {validationError && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Contact & Delivery Address */}
            <div className="p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-1">
                Step 1 of 3
              </span>
              <h2 className="text-base font-serif font-semibold text-[#1c2033] mb-4">
                Delivery Address & Contact
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    Email Address (For Updates & Receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. patron@unifort.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    Mobile Number (For Courier Tracking) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98401 23456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    Street Address & House / Studio Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 42 Boat Club Road"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    Apartment, Suite, Unit (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apt 4B, Coastal Pavilions"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    PIN / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 600028"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#1c2033] uppercase tracking-wider mb-1">
                    Special Packaging & Delivery Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notes for the atelier team (e.g. gift card message, gate code)..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70] text-xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delivery Method */}
            <div className="p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-1">
                Step 2 of 3
              </span>
              <h2 className="text-base font-serif font-semibold text-[#1c2033] mb-4">
                Consignment Speed & Insurance
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setShippingSpeed('standard')}
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    shippingSpeed === 'standard'
                      ? 'border-[#424a70] bg-[#424a70]/5 ring-1 ring-[#424a70]/30 shadow-xs'
                      : 'border-[rgba(66,74,112,0.16)] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#1c2033] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#424a70]" />
                      Atelier Insured Standard
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">
                      {totalPrice >= 500 ? 'FREE' : '₹40'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#687194] leading-relaxed">
                    3 to 5 business days. Reduction inspection & protective linen cushioning.
                  </p>
                </label>

                <label
                  onClick={() => setShippingSpeed('express')}
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    shippingSpeed === 'express'
                      ? 'border-[#424a70] bg-[#424a70]/5 ring-1 ring-[#424a70]/30 shadow-xs'
                      : 'border-[rgba(66,74,112,0.16)] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#1c2033] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Priority Studio Air Express
                    </span>
                    <span className="text-xs font-semibold text-[#1c2033]">
                      ₹{standardShippingFee + 90}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#687194] leading-relaxed">
                    1 to 2 business days. Dedicated priority courier dispatch directly to your doorstep.
                  </p>
                </label>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-1">
                Step 3 of 3
              </span>
              <h2 className="text-base font-serif font-semibold text-[#1c2033] mb-1">
                Payment Method
              </h2>
              <p className="text-xs text-[#687194] mb-4">
                All transactions are encrypted and processed through our verified gateway.
              </p>

              <div className="space-y-3">
                {/* Razorpay Option */}
                <label
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-[#424a70] bg-[#424a70]/5 ring-1 ring-[#424a70]/30 shadow-xs'
                      : 'border-[rgba(66,74,112,0.16)] bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="mt-1 accent-[#424a70]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1c2033] flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-[#424a70]" />
                        Razorpay Online (UPI, Credit/Debit Cards, NetBanking, Wallets)
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-[#687194] mt-1 leading-relaxed">
                      Instant verification via Google Pay, PhonePe, Paytm, Visa, Mastercard, RuPay & 50+ NetBanking options.
                    </p>
                  </div>
                </label>

                {/* COD Option */}
                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-[#424a70] bg-[#424a70]/5 ring-1 ring-[#424a70]/30 shadow-xs'
                      : 'border-[rgba(66,74,112,0.16)] bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 accent-[#424a70]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1c2033] flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-[#424a70]" />
                        Pay on Delivery (Inspection & Cash/UPI at Doorstep)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#687194] mt-1 leading-relaxed">
                      Inspect packaging upon arrival; payment collected by our logistics executive via Cash or QR code.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order Button */}
          <div className="lg:col-span-5">
            <div className="p-6 bg-white border border-[rgba(66,74,112,0.15)] rounded-2xl shadow-sm sticky top-24">
              <h2 className="text-base font-serif font-semibold text-[#1c2033] mb-4 pb-3 border-b border-[rgba(66,74,112,0.1)] flex items-center justify-between">
                <span>Consignment Review</span>
                <span className="text-xs font-mono font-normal text-[#687194]">{items.length} items</span>
              </h2>

              {/* Items mini list */}
              <div className="flex flex-col gap-3 mb-6 max-h-60 overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => (
                  <div key={product.name} className="flex items-center gap-3 text-xs">
                    <div className="relative w-12 h-12 rounded-lg bg-[#faf9fc] border border-[rgba(66,74,112,0.1)] overflow-hidden shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="50px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1c2033] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#687194]">Qty: {quantity} × {product.price}</p>
                    </div>
                    <span className="font-mono font-medium text-[#1c2033]">
                      ₹{(parsePrice(product.price) * quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2.5 text-xs pb-4 border-b border-[rgba(66,74,112,0.1)] mb-4">
                <div className="flex justify-between text-[#687194]">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-[#1c2033]">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#687194]">
                  <span>Insured Packaging & Delivery</span>
                  <span className="font-mono text-[#1c2033]">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-semibold">Complimentary</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[#687194]">
                  <span>Atelier GST (12%)</span>
                  <span className="font-mono text-[#687194]">Included (₹{tax})</span>
                </div>
              </div>

              {/* Total Row */}
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-sm font-semibold text-[#1c2033]">Total Due</span>
                <strong className="text-2xl font-serif font-bold text-[#424a70]">
                  ₹{grandTotal.toLocaleString()}
                </strong>
              </div>

              {/* Submit Button */}
              <UnifortButton
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isSubmitting}
                icon={<Lock className="w-4 h-4" />}
              >
                {paymentMethod === 'RAZORPAY'
                  ? `Authorize & Pay via Razorpay (₹${grandTotal.toLocaleString()})`
                  : `Confirm Order on Delivery (₹${grandTotal.toLocaleString()})`}
              </UnifortButton>

              <div className="mt-4 pt-4 border-t border-[rgba(66,74,112,0.1)] flex items-center justify-center gap-2 text-[11px] text-[#687194]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit Encrypted Atelier Transaction</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Razorpay Sandbox / Live Simulator Modal */}
      {showRazorpaySandboxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[rgba(66,74,112,0.2)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(66,74,112,0.12)] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#424a70] text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1c2033]">Razorpay Payment Gateway</h3>
                  <span className="text-[10px] text-emerald-600 font-mono font-medium">Gateway Ready (Sandbox Simulation)</span>
                </div>
              </div>
              <button
                onClick={() => setShowRazorpaySandboxModal(false)}
                className="text-[#687194] hover:text-[#1c2033] text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#faf9fc] p-4 rounded-2xl border border-[rgba(66,74,112,0.1)] mb-5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#687194]">Merchant:</span>
                <span className="font-semibold text-[#1c2033]">UNIFORT Tableware Atelier</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687194]">Amount to Authorize:</span>
                <strong className="font-mono text-base text-[#424a70]">₹{grandTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687194]">Customer:</span>
                <span className="text-[#1c2033] truncate">{fullName} ({email})</span>
              </div>
            </div>

            <p className="text-xs text-[#687194] leading-relaxed mb-6">
              Razorpay credentials will be connected in production. You can now test the complete end-to-end payment confirmation flow, status updates, delivery tracking, and receipt generation.
            </p>

            <div className="flex flex-col gap-2.5">
              <UnifortButton
                onClick={() =>
                  completeOrderPlacement(pendingOrderData, 'PAID', {
                    razorpay_payment_id: `pay_mock_${Date.now()}`,
                    razorpay_order_id: `order_mock_${Date.now()}`,
                  })
                }
                variant="primary"
                size="md"
                fullWidth
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Simulate Successful Payment (₹{grandTotal.toLocaleString()})
              </UnifortButton>

              <UnifortButton
                onClick={() => setShowRazorpaySandboxModal(false)}
                variant="ghost"
                size="sm"
                fullWidth
              >
                Cancel & Return
              </UnifortButton>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
