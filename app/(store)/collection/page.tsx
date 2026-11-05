import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Collection } from '@/components/storefront/Collection'
import { getCategories, getProducts } from '@/lib/server-api'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'The Collection',
  description: 'Handcrafted stoneware plates, bowls and mouth-blown glassware, made in small editions in Chennai.',
  alternates: { canonical: '/collection' },
}

export default async function CollectionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const [products, categories] = await Promise.all([getProducts({ isCustomizable: 'false' }), getCategories()])

  // Legacy links: /collection?piece=<name or slug> -> /collection/<slug>
  const piece = typeof sp.piece === 'string' ? sp.piece.toLowerCase() : null
  if (piece && products) {
    const match = products.find((p) => p.slug === piece || p.name.toLowerCase() === piece || p.id === sp.piece)
    if (match) redirect(`/collection/${match.slug}`)
  }

  return (
    <Suspense>
      <Collection products={products} categories={categories.map((c) => c.name)} />
    </Suspense>
  )
}
