'use client'

import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import type { StorefrontProduct } from '@/lib/product-mapper'
import { ProductCard } from './ProductCard'

export function Collection({ products, categories }: { products: StorefrontProduct[] | null; categories: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('category') || 'All pieces'

  const filters = useMemo(() => {
    const present = new Set((products || []).map((p) => p.category).filter(Boolean))
    const ordered = categories.filter((c) => present.has(c))
    for (const c of present) if (!ordered.includes(c)) ordered.push(c)
    return ['All pieces', ...ordered]
  }, [products, categories])

  const shown = useMemo(
    () => (products || []).filter((p) => active === 'All pieces' || p.category.toLowerCase() === active.toLowerCase()),
    [products, active]
  )

  const setFilter = (f: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (f === 'All pieces') params.delete('category')
    else params.set('category', f)
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false })
  }

  return (
    <main className="page">
      <section className="collection-intro section-pad">
        <div className="page-intro-header">
          <span className="eyebrow">The collection</span>
          <h1 className="display">
            Objects for
            <br />
            <em>the long table.</em>
          </h1>
          <p className="intro-copy">
            A considered vocabulary of forms, textures, and shadows. Each piece is designed to be used, touched, and kept. Handcrafted in small editions in
            Chennai, India.
          </p>
        </div>
      </section>
      <section className="catalog section-pad">
        <div className="filter-bar">
          <div className="filter-buttons" role="group" aria-label="Filter by category">
            {filters.map((f) => (
              <button key={f} className={active === f ? 'selected' : ''} aria-pressed={active === f} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <span className="muted" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
        {products === null ? (
          <div className="text-center py-16 text-[#687194] text-sm" role="alert">
            We could not load the collection right now. Please refresh the page in a moment.
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16 text-[#687194] text-sm">No pieces are currently available in &ldquo;{active}&rdquo;.</div>
        ) : (
          <div className="catalog-grid">
            {shown.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
      <section className="ritual-strip">
        <div className="ritual-image">
          <Image src="/products/unifort-collection-light.jpg" alt="UNIFORT stacked tableware collection in natural light" fill sizes="50vw" />
        </div>
        <div className="ritual-copy">
          <span className="eyebrow">The ritual of use</span>
          <p className="display display-small">
            Form follows the <em>hand.</em>
          </p>
          <p className="muted">Every curve, weight, and glaze is calibrated for the beautiful, unconscious gestures that happen around a table.</p>
        </div>
      </section>
    </main>
  )
}
