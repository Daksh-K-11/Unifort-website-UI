'use client'

import { api, errorMessage } from './api-client'

declare global {
  interface Window {
    Razorpay?: any
  }
}

let scriptPromise: Promise<boolean> | null = null

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.async = true
      s.onload = () => resolve(true)
      s.onerror = () => {
        scriptPromise = null
        resolve(false)
      }
      document.body.appendChild(s)
    })
  }
  return scriptPromise
}

export type PayOutcome = { status: 'paid'; order: any } | { status: 'dismissed' } | { status: 'failed'; message: string }

const tokenHeaders = (guestToken?: string | null): Record<string, string> => (guestToken ? { 'X-Order-Token': guestToken } : {})

/**
 * Open Razorpay Checkout for one of our orders. The payment is only considered
 * successful once the server has verified the signature and the captured amount.
 */
export async function payOrder(orderId: string, guestToken?: string | null): Promise<PayOutcome> {
  const loaded = await loadRazorpay()
  if (!loaded) return { status: 'failed', message: 'The payment window could not be loaded. Please check your connection and try again.' }

  const session = await api.post('/payment/create-order', { orderId }, { headers: tokenHeaders(guestToken) })
  if (!session.success || !session.data) return { status: 'failed', message: errorMessage(session, 'Could not start the payment.') }
  const s = session.data

  return new Promise<PayOutcome>((resolve) => {
    let settled = false
    const done = (o: PayOutcome) => {
      if (!settled) {
        settled = true
        resolve(o)
      }
    }

    const rzp = new window.Razorpay({
      key: s.keyId,
      amount: s.amount,
      currency: s.currency,
      order_id: s.razorpayOrderId,
      name: s.name,
      description: `Order ${s.orderNumber}`,
      prefill: s.prefill,
      notes: { orderNumber: s.orderNumber },
      theme: { color: '#424a70' },
      retry: { enabled: true, max_count: 3 },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verified = await api.post('/payment/verify', { orderId, ...response }, { headers: tokenHeaders(guestToken) })
        if (verified.success) done({ status: 'paid', order: verified.data })
        else done({ status: 'failed', message: errorMessage(verified, 'We could not confirm your payment yet. Your order will update automatically.') })
      },
      modal: {
        ondismiss: () => done({ status: 'dismissed' }),
        confirm_close: true,
      },
    })

    rzp.on('payment.failed', (resp: any) => {
      const reason = resp?.error?.description || 'Payment failed'
      void api.post('/payment/failed', { orderId, reason }, { headers: tokenHeaders(guestToken) })
      // Razorpay keeps the modal open so the customer can retry; we only record the failure here.
    })

    rzp.open()
  })
}

/** Remember the guest token for an order so the confirmation page / retry can use it. */
export function rememberOrderToken(orderNumber: string, token: string | null) {
  if (!token) return
  try {
    const all = JSON.parse(sessionStorage.getItem('unifort_order_tokens') || '{}')
    all[orderNumber] = token
    sessionStorage.setItem('unifort_order_tokens', JSON.stringify(all))
  } catch {}
}

export function getOrderToken(orderNumber: string): string | null {
  try {
    return JSON.parse(sessionStorage.getItem('unifort_order_tokens') || '{}')[orderNumber] || null
  } catch {
    return null
  }
}
