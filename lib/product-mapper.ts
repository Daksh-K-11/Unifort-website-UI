import { formatINR, mediaUrl } from './api-client'

export interface StorefrontProduct {
  id: string
  name: string
  slug: string
  type: string
  price: string
  rawPrice: number
  compareAtPrice?: number | null
  image: string
  gallery?: string[]
  category: string
  description?: string
  status: string
  stock: number
  isCustomizable?: boolean
  modelType?: string | null
  rating?: number | null
  reviewCount?: number
  material?: string | null
  dimensions?: string | null
  careInstructions?: string | null
}

/** Normalise an API product into the storefront shape. */
export function toStorefrontProduct(item: any): StorefrontProduct {
  const rawPrice = Number(item.price) || 0
  return {
    id: String(item.id),
    name: item.name,
    slug: item.slug,
    type: item.type || '',
    price: formatINR(rawPrice),
    rawPrice,
    compareAtPrice: item.compareAtPrice ?? null,
    image: mediaUrl(item.image || item.gallery?.[0]),
    gallery: Array.isArray(item.gallery) ? item.gallery.map((g: string) => mediaUrl(g)) : [],
    category: item.category?.name || item.categoryName || '',
    description: item.description || undefined,
    status: item.status,
    stock: Number(item.stock ?? 0),
    isCustomizable: Boolean(item.isCustomizable),
    modelType: item.modelType,
    rating: item.rating ?? null,
    reviewCount: item.reviewCount ?? 0,
    material: item.material,
    dimensions: item.dimensions,
    careInstructions: item.careInstructions,
  }
}
