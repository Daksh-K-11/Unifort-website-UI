import type { MetadataRoute } from 'next'
import { getProducts, SITE_URL } from '@/lib/server-api'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = (await getProducts({ isCustomizable: 'false' })) || []
  const staticPages = ['', '/collection', '/customize', '/about', '/contact', '/track', '/shipping-returns', '/privacy', '/terms']
  return [
    ...staticPages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.6 })),
    ...products.map((p) => ({ url: `${SITE_URL}/collection/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
