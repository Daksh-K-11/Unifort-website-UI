'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Lock, ShoppingBag } from 'lucide-react'
import { useBag } from '@/lib/bag-context'
import { useCustomer } from '@/lib/customer-context'
import { api, errorMessage, fieldErrors, formatINR } from '@/lib/api-client'
import { readStoredCoupon, toOrderLines, useQuote } from '@/lib/use-quote'
import { loadRazorpay, payOrder, rememberOrderToken } from '@/lib/razorpay'
import { CouponField, SummaryRows } from '@/components/cart/CartPage'
import { UnifortButton } from '@/components/ui/UnifortButton'

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

type Form = {
  name: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  notes: string
}

const EMPTY: Form = { name: '', email: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', notes: '' }

function validate(f: Form): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = 'Please enter the recipient name.'
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Please enter a valid email.'
  if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(f.phone.replace(/[\s()-]/g, '').replace(/^0/, ''))) e.phone = 'Please enter a valid 10-digit Indian mobile number.'
  if (!f.addressLine1.trim()) e.addressLine1 = 'Please enter the street address.'
  if (!f.city.trim()) e.city = 'Please enter the city.'
  if (!f.state) e.state = 'Please choose a state.'
  if (!/^\d{6}$/.test(f.postalCode.trim())) e.postalCode = 'PIN code must be 6 digits.'
  return e
}

export function CheckoutPage() {
  const router = useRouter()
  const { items, clearBag, hydrated } = useBag()
  const { customer, isLoggedIn, authLoading, setAuthModalOpen } = useCustomer()

  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY')
  const [coupon, setCoupon] = useState('')
  const [saveAddress, setSaveAddress] = useState(true)
  const [addressId, setAddressId] = useState<string>('')
  const [accept, setAccept] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { quote, loading, error: quoteError } = useQuote(coupon, shippingMethod)

  useEffect(() => {
    setCoupon(readStoredCoupon())
    void loadRazorpay() // warm up the payment script
  }, [])

  // Prefill from the account (default address first).
  useEffect(() => {
    if (!customer) return
    const def = customer.addresses.find((a) => a.isDefault) || customer.addresses[0]
    setForm((f) => ({
      ...f,
      name: f.name || def?.recipientName || customer.name,
      email: customer.email,
      phone: f.phone || def?.phone || customer.phone || '',
      ...(def && !f.addressLine1
        ? { addressLine1: def.addressLine1, addressLine2: def.addressLine2 || '', city: def.city, state: def.state, postalCode: def.postalCode }
        : {}),
    }))
    if (def) setAddressId(def.id)
  }, [customer])

  // Default to an available payment method.
  useEffect(() => {
    if (!quote) return
    if (paymentMethod === 'RAZORPAY' && !quote.onlinePaymentAvailable && quote.codAvailable) setPaymentMethod('COD')
    if (paymentMethod === 'COD' && !quote.codAvailable && quote.onlinePaymentAvailable) setPaymentMethod('RAZORPAY')
  }, [quote, paymentMethod])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: '' }))
  }

  const pickAddress = (id: string) => {
    setAddressId(id)
    const a = customer?.addresses.find((x) => x.id === id)
    if (a) {
      setForm((f) => ({ ...f, name: a.recipientName, phone: a.phone, addressLine1: a.addressLine1, addressLine2: a.addressLine2 || '', city: a.city, state: a.state, postalCode: a.postalCode }))
    } else {
      setForm((f) => ({ ...f, addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '' }))
    }
  }

  const paymentAvailable = useMemo(
    () => (paymentMethod === 'RAZORPAY' ? !!quote?.onlinePaymentAvailable : !!quote?.codAvailable),
    [quote, paymentMethod]
  )

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const errs = validate(form)
    if (!accept) errs.accept = 'Please accept the terms of sale.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`co-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    if (!quote || !paymentAvailable) return

    setSubmitting(true)
    const address = {
      recipientName: form.name.trim(),
      phone: form.phone.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || null,
      city: form.city.trim(),
      state: form.state,
      postalCode: form.postalCode.trim(),
      country: 'India',
    }
    const res = await api.post('/orders', {
      items: toOrderLines(items),
      paymentMethod,
      shippingMethod,
      couponCode: coupon || undefined,
      shippingAddress: address,
      customerName: form.name.trim(),
      customerEmail: form.email.trim().toLowerCase(),
      customerPhone: form.phone.trim(),
      notes: form.notes.trim() || undefined,
      saveAddress: isLoggedIn && !addressId && saveAddress,
    })

    if (!res.success || !res.data?.order) {
      setSubmitting(false)
      const fe = fieldErrors(res)
      const mapped: Record<string, string> = {}
      for (const [k, v] of Object.entries(fe)) mapped[k.replace(/^shippingAddress\./, '').replace('recipientName', 'name').replace('customerEmail', 'email')] = v
      setErrors(mapped)
      setSubmitError(errorMessage(res, 'Your order could not be placed. Please review your details.'))
      return
    }

    const { order, guestAccessToken } = res.data
    rememberOrderToken(order.orderNumber, guestAccessToken)
    // The order now holds the stock; the bag can be cleared.
    clearBag()
    try {
      sessionStorage.removeItem('unifort_coupon')
    } catch {}

    if (order.paymentMethod === 'RAZORPAY') {
      const outcome = await payOrder(order.id, guestAccessToken)
      const q = outcome.status === 'paid' ? '' : outcome.status === 'dismissed' ? '?payment=cancelled' : '?payment=failed'
      router.replace(`/orders/${encodeURIComponent(order.orderNumber)}${q}`)
      return
    }
    router.replace(`/orders/${encodeURIComponent(order.orderNumber)}?placed=1`)
  }

  if (!hydrated || authLoading) return <main className="below-header min-h-[75vh]" aria-busy="true" />

  // Orders are placed from an account so customers can track, cancel and review them.
  if (!isLoggedIn) {
    return (
      <main className="below-header min-h-[75vh] flex items-center justify-center px-4 pb-16 bg-[#faf9fc] text-[#1c2033]">
        <div className="w-full max-w-md p-6 sm:p-8 bg-white border border-[#424a70]/12 rounded-3xl text-center">
          <Lock className="w-8 h-8 mx-auto mb-3 text-[#424a70]" aria-hidden />
          <h1 className="text-xl font-serif mb-2">Sign in to check out</h1>
          <p className="text-sm text-[#687194] mb-6">
            You need an account to place an order. It lets you track delivery, see your custom designs and get help with your order. Your bag is kept.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setAuthModalOpen('login')}
              className="flex-1 px-4 py-3 rounded-xl bg-[#424a70] hover:bg-[#4f5987] text-white text-sm font-medium"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthModalOpen('register')}
              className="flex-1 px-4 py-3 rounded-xl border border-[#424a70]/30 text-[#424a70] hover:bg-[#424a70]/5 text-sm font-medium"
            >
              Create account
            </button>
          </div>
          <Link href="/cart" className="inline-block mt-5 text-xs text-[#687194] hover:text-[#1c2033] underline">
            Back to bag
          </Link>
        </div>
      </main>
    )
  }

  if (items.length === 0 && !submitting) {
    return (
      <main className="below-header min-h-[75vh] flex items-center justify-center px-4 pb-16 bg-[#faf9fc]">
        <div className="w-full max-w-md p-8 bg-white border border-[#424a70]/12 rounded-3xl text-center">
          <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-[#424a70]" />
          <h1 className="text-xl font-serif mb-2">Your bag is empty</h1>
          <p className="text-xs text-[#687194] mb-6">Add a piece to your bag to check out.</p>
          <UnifortButton href="/collection" variant="primary" fullWidth>
            Explore the collection
          </UnifortButton>
        </div>
      </main>
    )
  }

  const input = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={`co-${k}`} className="text-[11px] uppercase tracking-wider text-[#424a70]/80 font-medium">
        {label}
      </label>
      <input
        id={`co-${k}`}
        value={form[k]}
        onChange={set(k)}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `co-${k}-err` : undefined}
        className={`px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:border-[#424a70] ${errors[k] ? 'border-red-400' : 'border-[#424a70]/20'}`}
        {...props}
      />
      {errors[k] && (
        <span id={`co-${k}-err`} className="text-xs text-red-600">
          {errors[k]}
        </span>
      )}
    </div>
  )

  return (
    <main className="below-header min-h-screen bg-[#faf9fc] text-[#1c2033] pb-10 px-4 sm:px-6 lg:px-8">
      <form className="max-w-6xl mx-auto" onSubmit={placeOrder} noValidate>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs text-[#687194] hover:text-[#1c2033] mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to bag
        </Link>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <section className="p-6 bg-white border border-[#424a70]/12 rounded-2xl flex flex-col gap-4" aria-labelledby="co-contact">
              <div className="flex items-center justify-between">
                <h2 id="co-contact" className="text-sm font-semibold">
                  Contact
                </h2>
              </div>
              {input('email', 'Email', { type: 'email', autoComplete: 'email', readOnly: isLoggedIn })}
              {input('phone', 'Mobile number', { type: 'tel', autoComplete: 'tel', placeholder: '98765 43210' })}
            </section>

            <section className="p-6 bg-white border border-[#424a70]/12 rounded-2xl flex flex-col gap-4" aria-labelledby="co-ship">
              <h2 id="co-ship" className="text-sm font-semibold">
                Delivery address
              </h2>
              {customer && customer.addresses.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="co-saved" className="text-[11px] uppercase tracking-wider text-[#424a70]/80 font-medium">
                    Saved addresses
                  </label>
                  <select id="co-saved" value={addressId} onChange={(e) => pickAddress(e.target.value)} className="px-3.5 py-2.5 bg-white border border-[#424a70]/20 rounded-xl text-sm">
                    {customer.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label ? `${a.label} — ` : ''}
                        {a.recipientName}, {a.addressLine1}, {a.city}
                      </option>
                    ))}
                    <option value="">Use a new address</option>
                  </select>
                </div>
              )}
              {input('name', 'Full name', { autoComplete: 'name' })}
              {input('addressLine1', 'Address line 1', { autoComplete: 'address-line1' })}
              {input('addressLine2', 'Address line 2 (optional)', { autoComplete: 'address-line2' })}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {input('city', 'City', { autoComplete: 'address-level2' })}
                <div className="flex flex-col gap-1">
                  <label htmlFor="co-state" className="text-[11px] uppercase tracking-wider text-[#424a70]/80 font-medium">
                    State
                  </label>
                  <select
                    id="co-state"
                    value={form.state}
                    onChange={set('state')}
                    autoComplete="address-level1"
                    aria-invalid={!!errors.state}
                    className={`px-3.5 py-2.5 bg-white border rounded-xl text-sm ${errors.state ? 'border-red-400' : 'border-[#424a70]/20'}`}
                  >
                    <option value="">Select…</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <span className="text-xs text-red-600">{errors.state}</span>}
                </div>
                {input('postalCode', 'PIN code', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6 })}
              </div>
              {isLoggedIn && !addressId && (
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this address to my account
                </label>
              )}
              <div className="flex flex-col gap-1">
                <label htmlFor="co-notes" className="text-[11px] uppercase tracking-wider text-[#424a70]/80 font-medium">
                  Delivery notes (optional)
                </label>
                <textarea id="co-notes" rows={2} maxLength={1000} value={form.notes} onChange={set('notes')} className="px-3.5 py-2.5 bg-white border border-[#424a70]/20 rounded-xl text-sm" />
              </div>
            </section>

            <fieldset className="p-6 bg-white border border-[#424a70]/12 rounded-2xl flex flex-col gap-3">
              <legend className="text-sm font-semibold px-1">Shipping</legend>
              {(['STANDARD', 'EXPRESS'] as const).map((m) => (
                <label key={m} className={`flex items-center justify-between gap-3 p-3 border rounded-xl cursor-pointer ${shippingMethod === m ? 'border-[#424a70]' : 'border-[#424a70]/15'}`}>
                  <span className="flex items-center gap-2 text-sm">
                    <input type="radio" name="shipping" checked={shippingMethod === m} onChange={() => setShippingMethod(m)} />
                    {m === 'STANDARD' ? 'Standard delivery (5–7 business days)' : 'Express delivery (2–3 business days)'}
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset className="p-6 bg-white border border-[#424a70]/12 rounded-2xl flex flex-col gap-3">
              <legend className="text-sm font-semibold px-1">Payment</legend>
              <label className={`flex items-center gap-2 p-3 border rounded-xl text-sm ${paymentMethod === 'RAZORPAY' ? 'border-[#424a70]' : 'border-[#424a70]/15'} ${quote && !quote.onlinePaymentAvailable ? 'opacity-50' : 'cursor-pointer'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'RAZORPAY'} disabled={!!quote && !quote.onlinePaymentAvailable} onChange={() => setPaymentMethod('RAZORPAY')} />
                Pay online — UPI, cards, net banking, wallets (Razorpay)
                {quote && !quote.onlinePaymentAvailable && <span className="text-xs text-[#687194]">— currently unavailable</span>}
              </label>
              <label className={`flex items-center gap-2 p-3 border rounded-xl text-sm ${paymentMethod === 'COD' ? 'border-[#424a70]' : 'border-[#424a70]/15'} ${quote && !quote.codAvailable ? 'opacity-50' : 'cursor-pointer'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'COD'} disabled={!!quote && !quote.codAvailable} onChange={() => setPaymentMethod('COD')} />
                Cash on delivery
                {quote && !quote.codAvailable && <span className="text-xs text-[#687194]">— not available for this order</span>}
              </label>
            </fieldset>
          </div>

          <aside className="lg:col-span-5 p-6 bg-white border border-[#424a70]/12 rounded-2xl flex flex-col gap-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold">Your order</h2>
            <ul className="flex flex-col gap-3 max-h-72 overflow-auto">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f3f2f7] shrink-0">
                    <Image src={i.product.image} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{i.product.name}</p>
                    <p className="text-[11px] text-[#687194] truncate">
                      {i.designTitle ? `Custom: ${i.designTitle}` : i.product.type} · Qty {i.quantity}
                    </p>
                  </div>
                  <span className="text-xs">{formatINR(i.product.rawPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <CouponField code={coupon} setCode={setCoupon} />
            {quote?.couponMessage && (
              <p className="text-xs text-red-600" role="alert">
                {quote.couponMessage}
              </p>
            )}
            {quoteError && (
              <p className="text-xs text-red-600" role="alert">
                {quoteError} <Link href="/cart" className="underline">Review bag</Link>
              </p>
            )}
            <SummaryRows quote={quote} loading={loading} />

            <label className="flex items-start gap-2 text-xs">
              <input id="co-accept" type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5" />
              <span>
                I agree to the <Link href="/terms" className="underline" target="_blank">terms of sale</Link>, including that customised pieces are made to order and are non-returnable.
              </span>
            </label>
            {errors.accept && <span className="text-xs text-red-600">{errors.accept}</span>}

            {submitError && (
              <p className="text-xs text-red-600 p-3 bg-red-50 rounded-lg" role="alert">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !quote || !!quoteError || !paymentAvailable || (!!quote?.couponMessage && !!coupon)}
              className="w-full py-3.5 rounded-xl bg-[#424a70] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {submitting
                ? 'Placing your order…'
                : paymentMethod === 'RAZORPAY'
                  ? `Pay ${quote ? formatINR(quote.total) : ''}`
                  : `Place order${quote ? ` · ${formatINR(quote.total)}` : ''}`}
            </button>
            {!!quote?.couponMessage && !!coupon && <p className="text-[11px] text-[#687194]">Remove the invalid promo code to continue.</p>}
            <p className="text-[11px] text-[#687194] text-center">Payments are processed securely by Razorpay. We never see your card or UPI details.</p>
          </aside>
        </div>
      </form>
    </main>
  )
}
