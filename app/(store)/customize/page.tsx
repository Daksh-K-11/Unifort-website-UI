import type { Metadata } from 'next'
import { CustomizeStudioRoute } from '@/components/storefront/ClientRoutes'

export const metadata: Metadata = {
  title: 'Customize in 3D',
  description: 'Design your own mug, plate, tumbler or bowl in the UNIFORT 3D studio.',
  alternates: { canonical: '/customize' },
}

export default function CustomizePage() {
  return <CustomizeStudioRoute />
}
