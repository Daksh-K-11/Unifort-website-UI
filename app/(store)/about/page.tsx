import type { Metadata } from 'next'
import { About } from '@/components/storefront/About'

export const metadata: Metadata = {
  title: 'About',
  description: 'UNIFORT marries architectural clarity with the artistry of master ceramicists in Chennai, India.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <About />
}
