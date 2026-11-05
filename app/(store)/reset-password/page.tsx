import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/customer/AuthForms'

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } }

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
