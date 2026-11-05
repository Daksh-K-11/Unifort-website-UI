import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TrackOrder } from '@/components/track/TrackOrder'

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Check the status of your UNIFORT order.',
  alternates: { canonical: '/track' },
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackOrder />
    </Suspense>
  )
}
