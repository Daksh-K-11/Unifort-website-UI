import type { Metadata } from 'next'
import { LegalPage } from '@/components/storefront/LegalPage'

export const metadata: Metadata = { title: 'Shipping & returns', alternates: { canonical: '/shipping-returns' } }

// NOTE: confirm these figures match the backend pricing settings (SHIPPING_FEE, FREE_SHIPPING_THRESHOLD).
export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping & returns"
      updated="November 2026"
      sections={[
        { heading: 'Shipping', body: ['We ship across India. Standard shipping is free above the threshold shown at checkout; express shipping is available for an additional fee. You will receive a tracking number by email when your order ships.', 'Customised pieces are made to order and usually ship within 2–3 weeks.'] },
        { heading: 'Damaged on arrival', body: ['Please photograph the packaging and the piece and write to us within 48 hours of delivery. We will replace or refund damaged items.'] },
        { heading: 'Returns', body: ['Unused, non-customised pieces can be returned within 7 days of delivery in their original packaging. Refunds are issued to the original payment method once the return is received.'] },
      ]}
    />
  )
}
