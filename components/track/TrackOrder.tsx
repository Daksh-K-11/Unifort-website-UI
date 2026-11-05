'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Copy, HelpCircle, Loader2, MapPin, Package, Search, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage, formatINR, mediaUrl } from '@/lib/api-client'
import { useCustomer } from '@/lib/customer-context'
import { OrderProgress, StatusBadge, statusHelp } from '@/components/customer/order-ui'

interface Tracking {
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  carrier: string | null
  trackingNumber: string | null
  createdAt: string
  paidAt?: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  totalAmount: number
  destination: { city: string | null; state: string | null }
  items: { productName: string; productImage?: string | null; quantity: number }[]
  stages: { key: string; label: string; completed: boolean; timestamp: string | null }[]
}

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '')

const inputCls =
  'w-full rounded-xl border border-[#424a70]/20 bg-white px-3.5 py-3 text-base text-[#1c2033] focus:border-[#424a70] focus:outline-none focus:ring-2 focus:ring-[#424a70]/15 sm:text-sm'

export function TrackOrder() {
  const params = useSearchParams()
  const { customer, orders } = useCustomer()
  const [orderNumber, setOrderNumber] = useState(params.get('order') || '')
  const [contact, setContact] = useState('')
  const [data, setData] = useState<Tracking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const autoRan = useRef(false)

  // Signed-in customers don't need to type their email.
  useEffect(() => {
    if (customer?.email && !contact) setContact(customer.email)
  }, [customer?.email, contact])

  const lookup = async (num = orderNumber, who = contact) => {
    if (!num.trim() || !who.trim()) {
      setError('Enter your order number and the email or mobile number used for the order.')
      return
    }
    setBusy(true)
    setError(null)
    const res = await api.post<Tracking>('/orders/track', { orderNumber: num.trim().toUpperCase(), contact: who.trim() })
    setBusy(false)
    if (res.success && res.data) {
      setData(res.data)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } else {
      setData(null)
      setError(errorMessage(res, 'We could not find an order with those details. Please check the order number and contact details.'))
    }
  }

  // Deep link from emails: /track?order=… (signed in → look up straight away)
  useEffect(() => {
    if (autoRan.current) return
    const num = params.get('order')
    if (num && customer?.email) {
      autoRan.current = true
      lookup(num, customer.email)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.email])

  const cancelled = data && (data.status === 'CANCELLED' || data.status === 'REFUNDED')
  const recent = orders.slice(0, 4)

  return (
    <main className="below-header min-h-screen bg-[#faf9fc] px-4 pb-16 text-[#1c2033] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#424a70]/10 text-[#424a70]">
            <Truck className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl">Track your order</h1>
          <p className="mt-2 text-sm text-[#687194]">Your order number is in your confirmation email and starts with “UNI-”.</p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            lookup()
          }}
          className="rounded-2xl border border-[#424a70]/12 bg-white p-4 shadow-sm sm:p-6"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            <div>
              <label htmlFor="trk-order" className="mb-1 block text-sm font-medium text-[#3b4266]">
                Order number
              </label>
              <input
                id="trk-order"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="UNI-261105-ABC123"
                autoComplete="off"
                autoCapitalize="characters"
                className={`${inputCls} font-mono uppercase`}
              />
            </div>
            <div>
              <label htmlFor="trk-contact" className="mb-1 block text-sm font-medium text-[#3b4266]">
                Email or mobile number
              </label>
              <input id="trk-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputCls} />
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#424a70] px-5 py-3 text-sm font-medium text-white hover:bg-[#363d5e] disabled:opacity-60 sm:w-auto"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            {busy ? 'Looking up your order…' : 'Track order'}
          </button>
        </form>

        {customer && recent.length > 0 && !data && (
          <section className="mt-6" aria-labelledby="recent-orders">
            <h2 id="recent-orders" className="mb-2 text-sm font-semibold text-[#3b4266]">
              Your recent orders
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {recent.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderNumber(o.orderNumber)
                      lookup(o.orderNumber, customer.email)
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#424a70]/12 bg-white px-4 py-3 text-left hover:border-[#424a70]/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-sm font-semibold">{o.orderNumber}</span>
                      <span className="text-xs text-[#687194]">{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                    </span>
                    <StatusBadge status={o.status} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data && (
          <div ref={resultRef} className="mt-6 scroll-mt-24 space-y-4" aria-live="polite">
            <section className="rounded-2xl border border-[#424a70]/12 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#687194]">Order {data.orderNumber}</p>
                  <h2 className="mt-1 font-serif text-2xl">{statusHelp(data.status) || data.status}</h2>
                </div>
                <StatusBadge status={data.status} className="self-start" />
              </div>

              <div className="mt-6">
                <OrderProgress
                  status={data.status}
                  dates={{ PLACED: data.createdAt, CONFIRMED: data.paidAt, SHIPPED: data.shippedAt, DELIVERED: data.deliveredAt }}
                />
              </div>

              {data.paymentMethod === 'RAZORPAY' && data.paymentStatus !== 'PAID' && !cancelled && (
                <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                  Payment for this order hasn’t been completed yet.{' '}
                  <Link href={`/orders/${encodeURIComponent(data.orderNumber)}`} className="font-semibold underline">
                    Complete payment
                  </Link>
                </p>
              )}

              {data.trackingNumber && (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-[#424a70]/5 px-4 py-3 text-sm">
                  <Truck className="h-5 w-5 text-[#424a70]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-xs text-[#687194]">{data.carrier || 'Courier'} tracking number</span>
                    <strong className="break-all font-mono text-base">{data.trackingNumber}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(data.trackingNumber || '')
                      toast.success('Tracking number copied')
                    }}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[#424a70] ring-1 ring-[#424a70]/20"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
                  </button>
                </div>
              )}
            </section>

            <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
              <section className="min-w-0 rounded-2xl border border-[#424a70]/12 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4 text-[#424a70]" aria-hidden /> What’s in this order
                </h3>
                <ul className="space-y-3">
                  {data.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {it.productImage && <Image src={mediaUrl(it.productImage)} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block truncate font-medium">{it.productName}</span>
                        <span className="text-xs text-[#687194]">Qty {it.quantity}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-[#424a70]/10 pt-3 text-sm">
                  Total <strong>{formatINR(data.totalAmount)}</strong> · {data.paymentMethod === 'COD' ? 'Cash on delivery' : 'Paid online'}
                </p>
              </section>

              <section className="min-w-0 rounded-2xl border border-[#424a70]/12 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-[#424a70]" aria-hidden /> Delivery details
                </h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-[#687194]">Delivering to</dt>
                    <dd>{[data.destination.city, data.destination.state].filter(Boolean).join(', ') || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#687194]">Ordered</dt>
                    <dd>{fmt(data.createdAt)}</dd>
                  </div>
                  {data.shippedAt && (
                    <div>
                      <dt className="text-xs text-[#687194]">Shipped</dt>
                      <dd>{fmt(data.shippedAt)}</dd>
                    </div>
                  )}
                  {data.deliveredAt && (
                    <div>
                      <dt className="text-xs text-[#687194]">Delivered</dt>
                      <dd>{fmt(data.deliveredAt)}</dd>
                    </div>
                  )}
                  {data.cancelledAt && (
                    <div>
                      <dt className="text-xs text-[#687194]">Cancelled</dt>
                      <dd>{fmt(data.cancelledAt)}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[#424a70]/12 bg-white p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-[#3b4266]">
                <HelpCircle className="h-4 w-4 shrink-0 text-[#424a70]" aria-hidden />
                Something not right with this order?
              </p>
              <div className="flex flex-wrap gap-2">
                {customer && (
                  <Link
                    href={`/account?view=orders&order=${encodeURIComponent(data.orderNumber)}`}
                    className="rounded-xl border border-[#424a70]/25 px-4 py-2 font-medium text-[#1c2033] hover:bg-[#424a70]/5"
                  >
                    Manage order
                  </Link>
                )}
                <Link
                  href={`/contact?type=GENERAL&order=${encodeURIComponent(`Question about order ${data.orderNumber}: `)}`}
                  className="rounded-xl bg-[#424a70] px-4 py-2 font-medium text-white hover:bg-[#363d5e]"
                >
                  Contact us
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setData(null)
                setOrderNumber('')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="text-sm font-medium text-[#424a70] hover:underline"
            >
              Track another order
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
