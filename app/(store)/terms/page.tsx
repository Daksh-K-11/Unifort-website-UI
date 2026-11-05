import type { Metadata } from 'next'
import { LegalPage } from '@/components/storefront/LegalPage'

export const metadata: Metadata = { title: 'Terms of sale', alternates: { canonical: '/terms' } }

// NOTE: template text — have it reviewed for your business before launch.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of sale"
      updated="November 2026"
      sections={[
        { heading: 'Orders', body: ['An order is accepted once payment is confirmed (online payment) or once we confirm a cash-on-delivery order. Prices are in Indian Rupees; GST and shipping are shown at checkout before you pay.'] },
        { heading: 'Customised pieces', body: ['Pieces made from your 3D studio design are produced to order. Because each is made for you, customised pieces cannot be returned unless they arrive damaged or faulty. Colours on screen may differ slightly from fired glazes.', 'You confirm that you have the right to use any text or images you upload, and that they do not infringe anyone else’s rights.'] },
        { heading: 'Cancellations', body: ['You can cancel an order from your account until it is being prepared. Online payments are refunded to the original payment method.'] },
        { heading: 'Liability', body: ['Handmade pieces have natural variations in glaze and form; these are not defects.'] },
      ]}
    />
  )
}
