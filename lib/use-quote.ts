'use client'

import { useEffect, useRef, useState } from 'react'
import { api, errorMessage } from './api-client'
import { BagItem, useBag } from './bag-context'

export interface Quote {
  items: { productId: string; customDesignId: string | null; name: string; unitPrice: number; quantity: number; lineTotal: number; stock: number }[]
  subtotal: number
  discount: number
  shippingFee: number
  tax: number
  taxRate: number
  taxIncluded: boolean
  total: number
  coupon: { code: string; type: string; description?: string } | null
  couponMessage: string | null
  freeShippingThreshold: number
  codAvailable: boolean
  onlinePaymentAvailable: boolean
}

const COUPON_KEY = 'unifort_coupon'

export function readStoredCoupon(): string {
  try {
    return sessionStorage.getItem(COUPON_KEY) || ''
  } catch {
    return ''
  }
}

export function storeCoupon(code: string) {
  try {
    if (code) sessionStorage.setItem(COUPON_KEY, code)
    else sessionStorage.removeItem(COUPON_KEY)
  } catch {}
}

export const toOrderLines = (items: BagItem[]) =>
  items.map((i) => ({ productId: i.product.id, quantity: i.quantity, ...(i.customDesignId && { customDesignId: i.customDesignId }) }))

/**
 * Authoritative totals from the server for the current bag. Re-runs (debounced) whenever the
 * bag, coupon or shipping method changes, and writes server prices back into the bag.
 */
export function useQuote(couponCode: string, shippingMethod: 'STANDARD' | 'EXPRESS' = 'STANDARD') {
  const { items, syncPrices, hydrated } = useBag()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [problemProductId, setProblemProductId] = useState<string | null>(null)
  const seq = useRef(0)

  const linesKey = JSON.stringify(toOrderLines(items))

  useEffect(() => {
    if (!hydrated) return
    if (items.length === 0) {
      setQuote(null)
      setError(null)
      return
    }
    const id = ++seq.current
    setLoading(true)
    const t = setTimeout(async () => {
      const res = await api.post<Quote>('/orders/quote', {
        items: JSON.parse(linesKey),
        couponCode: couponCode || undefined,
        shippingMethod,
      })
      if (id !== seq.current) return
      setLoading(false)
      if (res.success && res.data) {
        setQuote(res.data)
        setError(null)
        setProblemProductId(null)
        syncPrices(res.data.items)
      } else {
        setQuote(null)
        setError(errorMessage(res, 'We could not price your bag. Please try again.'))
        setProblemProductId((res.errors?.[0] as any)?.productId ?? null)
      }
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, couponCode, shippingMethod, hydrated])

  return { quote, loading, error, problemProductId }
}
