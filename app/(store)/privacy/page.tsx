import type { Metadata } from 'next'
import { LegalPage } from '@/components/storefront/LegalPage'

export const metadata: Metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy' } }

// NOTE: template text — have it reviewed for your business and applicable law (e.g. India's DPDP Act 2023) before launch.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="November 2026"
      sections={[
        { heading: 'What we collect', body: ['When you create an account or place an order we collect your name, email address, phone number and delivery address. When you use the 3D studio we store the designs and images you choose to save.', 'Payments are processed by Razorpay; we never see or store your card or UPI credentials.'] },
        { heading: 'How we use it', body: ['To process and deliver your orders, to send order and account emails, to answer your enquiries, and to prevent fraud. We do not sell your personal data.'] },
        { heading: 'Cookies', body: ['We use strictly necessary cookies to keep you signed in and to remember your bag and saved designs. We do not use advertising cookies.'] },
        { heading: 'Retention and your rights', body: ['We keep order records for as long as required by tax law. You can ask us to access, correct or delete your personal data by writing to studio@unifort.co.'] },
        { heading: 'Contact', body: ['UNIFORT Tableware, Chennai, India — studio@unifort.co'] },
      ]}
    />
  )
}
