'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/** Display snapshot of a product in the bag. Prices here are estimates; the server re-prices at checkout. */
export interface Product {
  id: string
  name: string
  slug?: string
  type: string
  price: string
  rawPrice: number
  image: string
  category: string
  description?: string
  status?: string
}

export interface BagItem {
  key: string
  product: Product
  quantity: number
  /** Saved 3D design attached to this line (server id). */
  customDesignId?: string
  designTitle?: string
}

export const MAX_LINE_QTY = 50

interface BagContextType {
  items: BagItem[]
  isBagOpen: boolean
  setIsBagOpen: (open: boolean) => void
  addToBag: (product: Product, quantity?: number, design?: { id: string; title: string; image?: string; price?: number }) => void
  removeFromBag: (key: string) => void
  updateQuantity: (key: string, delta: number) => void
  setQuantity: (key: string, quantity: number) => void
  clearBag: () => void
  /** Replace display prices with authoritative server prices after a quote. */
  syncPrices: (lines: { productId: string; customDesignId?: string | null; unitPrice: number; name?: string; image?: string }[]) => void
  totalCount: number
  totalPrice: number
  toastMessage: string | null
  setToastMessage: (msg: string | null) => void
  hydrated: boolean
}

const STORAGE_KEY = 'unifort_bag_v3'
const BagContext = createContext<BagContextType | undefined>(undefined)

export const bagKey = (productId: string, designId?: string | null) => `${productId}::${designId || ''}`

export function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr
  const num = parseFloat(String(priceStr).replace(/[^0-9.]/g, ''))
  return isNaN(num) ? 0 : num
}

const isValidItem = (i: any): i is BagItem =>
  i && typeof i.key === 'string' && i.product && typeof i.product.id === 'string' && Number.isInteger(i.quantity) && i.quantity > 0

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([])
  const [isBagOpen, setIsBagOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      localStorage.removeItem('unifort_bag_v1')
      localStorage.removeItem('unifort_bag_v2') // old name-keyed format
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setItems(parsed.filter(isValidItem))
      }
    } catch {
      // corrupt storage: start with an empty bag
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage full / disabled: bag still works for this session
    }
  }, [items, hydrated])

  // Keep the bag in sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      try {
        const parsed = JSON.parse(e.newValue || '[]')
        if (Array.isArray(parsed)) setItems(parsed.filter(isValidItem))
      } catch {}
    }
    const onLogout = () => setItems([])
    window.addEventListener('storage', onStorage)
    window.addEventListener('unifort:logged-out', onLogout)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('unifort:logged-out', onLogout)
    }
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const addToBag: BagContextType['addToBag'] = useCallback((product, quantityToAdd = 1, design) => {
    const key = bagKey(product.id, design?.id)
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key)
      if (idx > -1) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: Math.min(MAX_LINE_QTY, next[idx].quantity + quantityToAdd) }
        return next
      }
      const snapshot: Product = design
        ? {
            ...product,
            image: design.image || product.image,
            ...(design.price !== undefined && { rawPrice: design.price, price: `₹${design.price}` }),
          }
        : product
      return [...prev, { key, product: snapshot, quantity: Math.min(MAX_LINE_QTY, quantityToAdd), customDesignId: design?.id, designTitle: design?.title }]
    })
    setToastMessage(`Added "${design?.title || product.name}" to your bag`)
  }, [])

  const removeFromBag = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_LINE_QTY, quantity) } : i))
    )
  }, [])

  const updateQuantity = useCallback((key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_LINE_QTY, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    )
  }, [])

  const clearBag = useCallback(() => setItems([]), [])

  const syncPrices: BagContextType['syncPrices'] = useCallback((lines) => {
    setItems((prev) =>
      prev.map((i) => {
        const l = lines.find((x) => bagKey(x.productId, x.customDesignId) === i.key || (x.productId === i.product.id && (x.customDesignId || '') === (i.customDesignId || '')))
        if (!l || l.unitPrice === i.product.rawPrice) return i
        return { ...i, product: { ...i.product, rawPrice: l.unitPrice, price: `₹${l.unitPrice}` } }
      })
    )
  }, [])

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const totalPrice = useMemo(() => items.reduce((s, i) => s + (i.product.rawPrice ?? parsePrice(i.product.price)) * i.quantity, 0), [items])

  return (
    <BagContext.Provider
      value={{
        items,
        isBagOpen,
        setIsBagOpen,
        addToBag,
        removeFromBag,
        updateQuantity,
        setQuantity,
        clearBag,
        syncPrices,
        totalCount,
        totalPrice,
        toastMessage,
        setToastMessage,
        hydrated,
      }}
    >
      {children}
    </BagContext.Provider>
  )
}

export function useBag() {
  const context = useContext(BagContext)
  if (!context) throw new Error('useBag must be used within a BagProvider')
  return context
}
