'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { api } from '@/lib/api-client'
import { CustomizableProduct } from '@/lib/customize/types'
import { CUSTOMIZABLE_PRODUCTS } from '@/lib/customize/products'

export interface StorefrontProduct {
  id: string
  name: string
  slug?: string
  type: string
  price: string
  rawPrice: number
  image: string
  category: string
  description?: string
  status: string
  isCustomizable?: boolean
  modelType?: string | null
}

export function buildCustomizableProduct(
  apiProduct: StorefrontProduct,
  templateFallback?: CustomizableProduct
): CustomizableProduct {
  const modelType = (apiProduct.modelType as any) || 'mug'
  const matchedTemplate =
    CUSTOMIZABLE_PRODUCTS.find((p) => p.modelType === modelType) ||
    CUSTOMIZABLE_PRODUCTS.find((p) => p.name.toLowerCase() === apiProduct.name.toLowerCase()) ||
    templateFallback ||
    CUSTOMIZABLE_PRODUCTS[0]

  return {
    ...matchedTemplate,
    id: apiProduct.id,
    name: apiProduct.name,
    type: apiProduct.type,
    category: (apiProduct.category as any) || matchedTemplate.category,
    basePrice: apiProduct.rawPrice || matchedTemplate.basePrice,
    currency: '₹',
    description: apiProduct.description || matchedTemplate.description,
    image: apiProduct.image || matchedTemplate.image,
    modelType: (apiProduct.modelType as any) || matchedTemplate.modelType,
  }
}

interface ProductsContextType {
  products: StorefrontProduct[]
  collectionProducts: StorefrontProduct[] // Non-3D products only
  customizableProducts: StorefrontProduct[] // 3D products only
  customizableItems: CustomizableProduct[] // Full 3D spec products for 3D studio
  categories: string[]
  collectionCategories: string[]
  customizeCategories: string[]
  loading: boolean
  error: string | null
  refreshProducts: () => Promise<void>
}

const fallbackProducts: StorefrontProduct[] = [
  { id: 'fallback-01', name: 'No. 01 Obsidian Plate', type: 'Dinner plate · 28 cm', price: '₹84', rawPrice: 84, image: '/products/unifort-plate-light.jpg', category: 'Table', status: 'PUBLISHED', isCustomizable: false },
  { id: 'fallback-04', name: 'No. 04 Violet Tumbler', type: 'Hand-blown glass · 320 ml', price: '₹62', rawPrice: 62, image: '/products/unifort-tumbler-light.jpg', category: 'Glass', status: 'PUBLISHED', isCustomizable: false },
  { id: 'fallback-07', name: 'No. 07 Arc Carafe', type: 'Smoked glass · 1.2 L', price: '₹148', rawPrice: 148, image: '/products/unifort-carafe-light.jpg', category: 'Glass', status: 'PUBLISHED', isCustomizable: false },
  { id: 'fallback-12', name: 'No. 12 Basalt Bowl', type: 'Stoneware · 22 cm', price: '₹96', rawPrice: 96, image: '/products/unifort-bowl-light.jpg', category: 'Table', status: 'PUBLISHED', isCustomizable: false },
]

const fallbackCategories = ['All pieces', 'Table', 'Glass', 'Drinkware', 'Dinnerware', 'Objects & Decor']

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StorefrontProduct[]>(fallbackProducts)
  const [categories, setCategories] = useState<string[]>(fallbackCategories)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      // Explicitly request PUBLISHED status; storefront never sends admin token
      const [prodRes, catRes] = await Promise.all([
        api.get<any[]>('/products?limit=100&status=PUBLISHED', undefined, false),
        api.get<any[]>('/categories', undefined, false),
      ])

      if (prodRes.success && Array.isArray(prodRes.data)) {
        // STRICT FILTER: Only PUBLISHED products can appear on storefront.
        // DRAFT and ARCHIVED products are strictly excluded from user view.
        const publishedOnly = prodRes.data.filter((item: any) => item.status === 'PUBLISHED')

        const formatted: StorefrontProduct[] = publishedOnly.map((item: any) => {
          const rawPrice =
            typeof item.price === 'number'
              ? item.price
              : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
          const priceStr = String(item.price).startsWith('₹')
            ? String(item.price)
            : `₹${item.price ?? '0'}`
          const category = item.category?.name || item.categoryName || 'Table'
          const image =
            item.image ||
            (Array.isArray(item.gallery) && item.gallery[0]) ||
            '/products/unifort-plate-light.jpg'

          return {
            id: String(item.id),
            name: item.name || 'Untitled Piece',
            slug: item.slug,
            type: item.type || 'Handcrafted Tableware',
            price: priceStr,
            rawPrice,
            image,
            category,
            description: item.description,
            status: item.status,
            isCustomizable: Boolean(item.isCustomizable),
            modelType: item.modelType,
          }
        })

        if (formatted.length > 0) {
          setProducts(formatted)
        }

        // Merge categories from categories API and categories from published products
        const apiCats: string[] =
          catRes.success && Array.isArray(catRes.data)
            ? catRes.data.map((c: any) => c.name).filter(Boolean)
            : []
        const productCats: string[] = publishedOnly
          .map((item: any) => item.category?.name || item.categoryName)
          .filter(Boolean)

        const uniqueCats = Array.from(new Set([...apiCats, ...productCats]))
        setCategories(['All pieces', ...uniqueCats])
        setError(null)
      } else {
        setError(prodRes.message || 'Unable to fetch collection')
      }
    } catch (err: any) {
      console.error('Failed to fetch storefront collection from API:', err)
      setError(err?.message || 'Network error fetching collection')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()

    // Sync listener for cross-tab or focus updates
    const onSync = () => {
      fetchProducts()
    }

    window.addEventListener('focus', onSync)
    window.addEventListener('unifort_products_updated', onSync)

    let channel: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('unifort_product_sync')
        channel.onmessage = (event) => {
          if (event.data?.type === 'PRODUCTS_CHANGED') {
            fetchProducts()
          }
        }
      }
    } catch {
      // BroadcastChannel optional fallback
    }

    return () => {
      window.removeEventListener('focus', onSync)
      window.removeEventListener('unifort_products_updated', onSync)
      channel?.close()
    }
  }, [fetchProducts])

  // Filter 1: Strictly non-3D products for Collection page
  const collectionProducts = useMemo(
    () => products.filter((p) => !p.isCustomizable),
    [products]
  )

  // Filter 2: Strictly 3D customizable products for Customize page
  const customizableProducts = useMemo(
    () => products.filter((p) => Boolean(p.isCustomizable)),
    [products]
  )

  // Full 3D specification objects ready for CustomizeStudio and ThreeProductViewer
  const customizableItems = useMemo<CustomizableProduct[]>(() => {
    if (customizableProducts.length > 0) {
      return customizableProducts.map((p) => buildCustomizableProduct(p))
    }
    return CUSTOMIZABLE_PRODUCTS
  }, [customizableProducts])

  // Collection category pills
  const collectionCategories = useMemo(() => {
    const cats = Array.from(new Set(collectionProducts.map((p) => p.category).filter(Boolean)))
    return ['All pieces', ...cats]
  }, [collectionProducts])

  // Customize page category pills (combines admin taxonomy collections and 3D customizable product categories)
  const customizeCategories = useMemo(() => {
    const adminCatNames = categories.filter((c) => c !== 'All pieces' && c !== 'All')
    const itemCatNames = customizableItems.map((p) => p.category).filter(Boolean)
    const set = new Set<string>()
    for (const c of adminCatNames) set.add(c)
    for (const c of itemCatNames) set.add(c)
    return ['All', ...Array.from(set)]
  }, [categories, customizableItems])

  return (
    <ProductsContext.Provider
      value={{
        products,
        collectionProducts,
        customizableProducts,
        customizableItems,
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
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }
  return context
}
