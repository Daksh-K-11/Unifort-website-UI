'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { api, errorMessage, formatINR } from '@/lib/api-client'
import { mapBackendOrder, useCustomer } from '@/lib/customer-context'
import type { CustomerOrder } from '@/lib/customer-types'
import { getOrderToken, payOrder } from '@/lib/razorpay'
import { UnifortButton } from '@/components/ui/UnifortButton'

export function OrderConfirmation({ orderNumber }: { orderNumber: string }) {
  const params = useSearchParams()
  const { isLoggedIn, authLoading, refreshOrders } = useCustomer()
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [notice, setNotice] = useState<string | null>(() => {
    const p = params.get('payment')
    return p === 'cancelled' ? 'Payment was not completed. Your order is reserved — you can pay below.' : p === 'failed' ? 'The payment did not go through. You can try again below.' : null
  })
  const token = typeof window !== 'undefined' ? getOrderToken(orderNumber) : null

  const load = useCallback(async () => {
    const res = await api.get(`/orders/${encodeURIComponent(orderNumber)}`, { headers: token ? { 'X-Order-Token': token } : {} })
    if (res.success && res.data) {
      setOrder(mapBackendOrder(res.data))
      setError(null)
    } else {
      setError(res.status === 404 || res.status === 401 ? 'not-found' : errorMessage(res))
    }
  }, [orderNumber, token])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  // An online payment may still be settling (webhook): poll briefly.
  useEffect(() => {
    if (!order || order.paymentMethod !== 'RAZORPAY' || order.paymentStatus === 'PAID' || order.status !== 'PENDING' || params.get('payment')) return
    let n = 0
    const t = setInterval(() => {
      if (++n > 10) return clearInterval(t)
      load()
    }, 3000)
    return () => clearInterval(t)
  }, [order, load, params])

  const retryPayment = async () => {
    if (!order) return
    setPaying(true)
    setNotice(null)
    const outcome = await payOrder(order.id, token)
    setPaying(false)
    if (outcome.status === 'paid') {
      setOrder(mapBackendOrder(outcome.order))
      if (isLoggedIn) refreshOrders()
    } else if (outcome.status === 'failed') setNotice(outcome.message)
    else setNotice('Payment was not completed.')
  }

  if (error === 'not-found') {
    return (
      <main className="below-header min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-serif mb-2">We couldn&apos;t open this order here</h1>
          <p className="text-sm text-[#687194] mb-6">
            {isLoggedIn ? 'This order is not linked to your account.' : 'Sign in to the account used for the order, or track it with your email address.'}
          </p>
          <div className="flex gap-3 justify-center">
            <UnifortButton href={`/track?order=${encodeURIComponent(orderNumber)}`} variant="primary">
              Track order
            </UnifortButton>
            {!isLoggedIn && (
              <UnifortButton href={`/login?next=${encodeURIComponent(`/orders/${orderNumber}`)}`} variant="outline">
                Sign in
              </UnifortButton>
            )}
          </div>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="below-header min-h-[70vh] flex items-center justify-center" aria-busy="true">
        {error ? <p className="text-sm text-red-600">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-[#424a70]" />}
      </main>
    )
  }

  const paid = order.paymentStatus === 'PAID'
  const awaitingPayment = order.canPay
  const cancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED'

  return (
    <main className="below-header min-h-screen bg-[#faf9fc] text-[#1c2033] pb-12 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="p-8 bg-white border border-[#424a70]/12 rounded-3xl text-center">
          {cancelled ? (
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
          ) : awaitingPayment ? (
            <Clock className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          ) : (
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
          )}
          <h1 className="text-2xl font-serif mb-1">
            {cancelled ? 'Order cancelled' : awaitingPayment ? 'Complete your payment' : 'Thank you for your order'}
          </h1>
          <p className="text-sm text-[#687194]">
            Order <strong className="text-[#1c2033]">{order.orderNumber}</strong>
            {!cancelled && !awaitingPayment && ' — a confirmation has been emailed to you.'}
          </p>
          {awaitingPayment && order.paymentExpiresAt && (
            <p className="text-xs text-[#687194] mt-2">
              Your items are reserved until {new Date(order.paymentExpiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.
            </p>
          )}
          {notice && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3 mt-4" role="status">
              {notice}
            </p>
          )}
          {awaitingPayment && (
            <button onClick={retryPayment} disabled={paying} className="mt-5 px-6 py-3 rounded-xl bg-[#424a70] text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
              {paying && <Loader2 className="w-4 h-4 animate-spin" />} Pay {formatINR(order.totalAmount)}
            </button>
          )}
        </div>

        <section className="p-6 bg-white border border-[#424a70]/12 rounded-2xl">
          <h2 className="text-sm font-semibold mb-4">Summary</h2>
          <ul className="flex flex-col gap-3 mb-4">
            {order.items.map((it) => (
              <li key={it.id} className="flex gap-3 items-center">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f3f2f7] shrink-0">
                  <Image src={it.productImage} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{it.productName}</p>
                  <p className="text-xs text-[#687194]">Qty {it.quantity}</p>
                </div>
                <span className="text-sm">{formatINR(it.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <dl className="text-xs flex flex-col gap-1.5 border-t border-[#424a70]/10 pt-3">
            <div className="flex justify-between"><dt className="text-[#687194]">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt><dd>−{formatINR(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-[#687194]">Shipping</dt><dd>{order.shippingFee ? formatINR(order.shippingFee) : 'Free'}</dd></div>
            <div className="flex justify-between"><dt className="text-[#687194]">GST</dt><dd>{formatINR(order.tax)}</dd></div>
            <div className="flex justify-between text-sm font-semibold pt-2"><dt>Total</dt><dd>{formatINR(order.totalAmount)}</dd></div>
          </dl>
        </section>

        <section className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 bg-white border border-[#424a70]/12 rounded-2xl text-sm">
            <h2 className="text-sm font-semibold mb-2">Delivery to</h2>
            <p>{order.shippingAddress.fullName}</p>
            <p className="text-[#687194]">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </div>
          <div className="p-6 bg-white border border-[#424a70]/12 rounded-2xl text-sm">
            <h2 className="text-sm font-semibold mb-2">Payment</h2>
            <p>{order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online (Razorpay)'}</p>
            <p className="text-[#687194]">{paid ? 'Paid' : order.paymentStatus === 'REFUNDED' ? 'Refunded' : order.paymentMethod === 'COD' ? 'Pay when your order arrives' : 'Awaiting payment'}</p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 justify-center">
          {isLoggedIn ? (
            <UnifortButton href={`/account?view=orders&order=${encodeURIComponent(order.orderNumber)}`} variant="primary">
              View in my account
            </UnifortButton>
          ) : (
            <UnifortButton href={`/track?order=${encodeURIComponent(order.orderNumber)}`} variant="primary">
              Track this order
            </UnifortButton>
          )}
          <UnifortButton href="/collection" variant="outline">
            Continue shopping
          </UnifortButton>
        </div>
        <p className="text-xs text-center text-[#687194]">
          Questions? <Link href="/contact" className="underline">Contact us</Link> and quote your order number.
        </p>
      </div>
    </main>
  )
}
