import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { StorefrontProduct } from '@/lib/product-mapper'

export function ProductCard({ product, index }: { product: StorefrontProduct; index: number }) {
  return (
    <Link href={`/collection/${product.slug}`} className="product-card">
      <div className="product-image">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 90vw, 30vw" />
        <span className="product-number">{product.category}</span>
        <span className="quick-view">
          View piece <ArrowUpRight />
        </span>
      </div>
      <div className="product-meta">
        <div>
          <h3>{product.name}</h3>
          <p>{product.type}</p>
        </div>
        <strong>{product.price}</strong>
      </div>
    </Link>
  )
}
