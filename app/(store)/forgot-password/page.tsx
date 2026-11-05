import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/customer/AuthForms'

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false } }

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
