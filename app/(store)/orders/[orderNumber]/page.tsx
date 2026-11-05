import type { Metadata } from 'next'
import { OrderConfirmationRoute } from '@/components/storefront/ClientRoutes'

export const metadata: Metadata = { title: 'Your order', robots: { index: false } }

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  return <OrderConfirmationRoute orderNumber={decodeURIComponent(orderNumber)} />
}
