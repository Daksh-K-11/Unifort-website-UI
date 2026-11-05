import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/storefront/ProductDetail'
import { getProduct, SITE_URL } from '@/lib/server-api'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Piece not found' }
  const description = (product.description || `${product.name} — ${product.type}`).slice(0, 160)
  return {
    title: product.name,
    description,
    alternates: { canonical: `/collection/${product.slug}` },
    openGraph: { title: product.name, description, images: [{ url: product.image }], type: 'website' },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: [product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`],
    category: product.category,
    brand: { '@type': 'Brand', name: 'UNIFORT' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.rawPrice,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/collection/${product.slug}`,
    },
    ...(product.reviewCount && product.rating
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }} />
      <ProductDetail product={product} />
    </>
  )
}
