import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Contact } from '@/components/storefront/Contact'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Commissions, hospitality projects, stockists and general enquiries for the UNIFORT studio.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <Suspense>
      <Contact />
    </Suspense>
  )
}
