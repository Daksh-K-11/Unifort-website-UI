import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RegisterForm } from '@/components/customer/AuthForms'

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } }

export default function Page() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
