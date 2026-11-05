import type { Metadata } from 'next'
import { CheckoutRoute } from '@/components/storefront/ClientRoutes'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPageRoute() {
  return <CheckoutRoute />
}
