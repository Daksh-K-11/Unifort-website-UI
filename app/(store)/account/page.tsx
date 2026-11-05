import type { Metadata } from 'next'
import { AccountRoute } from '@/components/storefront/ClientRoutes'

export const metadata: Metadata = { title: 'My account', robots: { index: false } }

export default function AccountPage() {
  return <AccountRoute />
}
