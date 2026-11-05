import type { Metadata } from 'next'
import { CartRoute } from '@/components/storefront/ClientRoutes'

export const metadata: Metadata = { title: 'Shopping bag', robots: { index: false } }

export default function CartPageRoute() {
  return <CartRoute />
}
