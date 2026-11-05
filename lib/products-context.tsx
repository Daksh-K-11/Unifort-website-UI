'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, mediaUrl } from '@/lib/api-client'
import { CustomizableProduct } from '@/lib/customize/types'

import { toStorefrontProduct, StorefrontProduct } from './product-mapper'
export { toStorefrontProduct } from './product-mapper'
export type { StorefrontProduct } from './product-mapper'

interface ProductsContextType {
  products: StorefrontProduct[]
  collectionProducts: StorefrontProduct[]
  customizableProducts: StorefrontProduct[]
  /** Full 3D specs for the studio, served by the API (database products + studio spec). */
  customizableItems: CustomizableProduct[]
  categories: string[]
  collectionCategories: string[]
  customizeCategories: string[]
  loading: boolean
  error: string | null
  refreshProducts: () => Promise<void>
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [studioItems, setStudioItems] = useState<CustomizableProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const [prodRes, catRes, studioRes] = await Promise.all([
      api.get<any[]>('/products?limit=100&sortBy=newest'),
      api.get<any[]>('/categories'),
      api.get<any[]>('/customize/products'),
    ])

    if (prodRes.success && Array.isArray(prodRes.data)) {
      setProducts(prodRes.data.map(toStorefrontProduct))
      setError(null)
    } else {
      setError(prodRes.message || 'We could not load the collection right now.')
    }
    if (catRes.success && Array.isArray(catRes.data)) {
      setCategories(catRes.data.filter((c: any) => (c._count?.products ?? 1) > 0).map((c: any) => c.name))
    }
    if (studioRes.success && Array.isArray(studioRes.data)) {
      setStudioItems(studioRes.data.map((p: any) => ({ ...p, image: mediaUrl(p.image), currency: '₹' })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const collectionProducts = useMemo(() => products.filter((p) => !p.isCustomizable), [products])
  const customizableProducts = useMemo(() => products.filter((p) => p.isCustomizable), [products])

  const collectionCategories = useMemo(() => {
    const present = new Set(collectionProducts.map((p) => p.category).filter(Boolean))
    const ordered = categories.filter((c) => present.has(c))
    for (const c of present) if (!ordered.includes(c)) ordered.push(c)
    return ['All pieces', ...ordered]
  }, [categories, collectionProducts])

  const customizeCategories = useMemo(
    () => ['All', ...Array.from(new Set(studioItems.map((p) => p.category).filter(Boolean)))],
    [studioItems]
  )

  return (
    <ProductsContext.Provider
      value={{
        products,
        collectionProducts,
        customizableProducts,
        customizableItems: studioItems,
        categories,
        collectionCategories,
        customizeCategories,
        loading,
        error,
        refreshProducts: fetchProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) throw new Error('useProducts must be used within a ProductsProvider')
  return context
}
