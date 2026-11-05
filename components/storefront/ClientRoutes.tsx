'use client'

import dynamic from 'next/dynamic'

function RouteLoading({ label }: { label: string }) {
  return (
    <main className="page route-loading flex items-center justify-center min-h-[60vh]" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin" />
        <span className="text-xs uppercase tracking-wider text-[#424a70] font-medium">{label}</span>
      </div>
    </main>
  )
}

// Browser-only views (WebGL, localStorage, payment SDK) are loaded on the client.
export const CustomizeStudioRoute = dynamic(() => import('@/components/customize/CustomizeStudio').then((m) => m.CustomizeStudio), {
  ssr: false,
  loading: () => <RouteLoading label="Loading 3D studio…" />,
})

export const AccountRoute = dynamic(() => import('@/components/customer/AccountPortal').then((m) => m.AccountPortal), {
  ssr: false,
  loading: () => <RouteLoading label="Loading your account…" />,
})

export const CheckoutRoute = dynamic(() => import('@/components/checkout/CheckoutPage').then((m) => m.CheckoutPage), {
  ssr: false,
  loading: () => <RouteLoading label="Loading checkout…" />,
})

export const CartRoute = dynamic(() => import('@/components/cart/CartPage').then((m) => m.CartPage), {
  ssr: false,
  loading: () => <RouteLoading label="Loading your bag…" />,
})

export const OrderConfirmationRoute = dynamic(() => import('@/components/checkout/OrderConfirmation').then((m) => m.OrderConfirmation), {
  ssr: false,
  loading: () => <RouteLoading label="Loading your order…" />,
})
