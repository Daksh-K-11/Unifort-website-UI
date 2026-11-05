import { getApiBaseUrl } from './api-client'
import { toStorefrontProduct, StorefrontProduct } from './product-mapper'

/** Server-side GET against the API with ISR-style caching. Returns null on failure. */
async function serverGet<T>(path: string, revalidate = 60): Promise<{ data: T; meta?: any } | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    })
    if (!res.ok) return null
    const json = await res.json()
    return { data: json.data as T, meta: json.meta }
  } catch {
    return null
  }
}

export async function getProducts(params: Record<string, string> = {}): Promise<StorefrontProduct[] | null> {
  const qs = new URLSearchParams({ limit: '100', ...params }).toString()
  const r = await serverGet<any[]>(`/products?${qs}`)
  return r ? r.data.map(toStorefrontProduct) : null
}

export async function getProduct(slug: string): Promise<StorefrontProduct | null> {
  const r = await serverGet<any>(`/products/${encodeURIComponent(slug)}`)
  return r?.data ? toStorefrontProduct(r.data) : null
}

export async function getCategories(): Promise<{ name: string; slug: string; count: number }[]> {
  const r = await serverGet<any[]>('/categories', 300)
  return (r?.data || []).map((c) => ({ name: c.name, slug: c.slug, count: c._count?.products ?? 0 }))
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const SITE_NAME = 'UNIFORT'
