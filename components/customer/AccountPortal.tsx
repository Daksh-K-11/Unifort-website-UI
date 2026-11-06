'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight,
  ChevronDown,
  Copy,
  CreditCard,
  Home,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react'
import { useCustomer } from '@/lib/customer-context'
import type { CustomerAddress, CustomerOrder, CustomerSavedDesign } from '@/lib/customer-types'
import { api, errorMessage, formatINR } from '@/lib/api-client'
import { passwordProblem, PASSWORD_HINT } from './AuthForms'
import { OrderProgress, StatusBadge, statusHelp } from './order-ui'
import { PasswordInput } from '@/components/ui/PasswordInput'

type View = 'overview' | 'orders' | 'designs' | 'messages' | 'profile'

const TABS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'orders', label: 'My orders', icon: Package },
  { id: 'designs', label: 'My designs', icon: Sparkles },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile & addresses', icon: User },
]

const LEGACY_VIEW: Record<string, View> = { hub: 'overview', track: 'orders', inquiries: 'messages' }

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

const card = 'rounded-2xl border border-[#424a70]/12 bg-white shadow-sm'
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#424a70] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#363d5e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#424a70] disabled:opacity-50'
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#424a70]/25 bg-white px-4 py-2.5 text-sm font-medium text-[#1c2033] hover:bg-[#424a70]/5 disabled:opacity-50'
const btnDanger = 'inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50'
const inputCls = 'w-full rounded-xl border border-[#424a70]/20 bg-white px-3.5 py-2.5 text-sm text-[#1c2033] focus:border-[#424a70] focus:outline-none focus:ring-2 focus:ring-[#424a70]/15'
const labelCls = 'mb-1 block text-xs font-medium text-[#3b4266]'

export function AccountPortal({ initialView }: { initialView?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { customer, isLoggedIn, authLoading } = useCustomer()

  const raw = searchParams.get('view') || initialView || 'overview'
  const view: View = (TABS.some((t) => t.id === raw) ? raw : LEGACY_VIEW[raw] || 'overview') as View
  const go = (v: View) => router.push(v === 'overview' ? '/account' : `/account?view=${v}`, { scroll: false })

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace(`/login?next=${encodeURIComponent(`/account${raw !== 'overview' ? `?view=${raw}` : ''}`)}`)
  }, [authLoading, isLoggedIn, router, raw])

  if (authLoading || !customer) {
    return (
      <main className="below-header flex min-h-[60vh] items-center justify-center" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#424a70] border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="below-header min-h-screen bg-[#faf9fc] px-4 pb-16 text-[#1c2033] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#687194]">My account</p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl">Hello, {customer.firstName || customer.name}</h1>
        </header>

        {!customer.emailVerified && <VerifyBanner />}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Navigation: horizontal scroll on phones, sidebar on desktop */}
          <nav aria-label="Account sections" className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:overflow-visible lg:px-0">
            <ul className="flex gap-2 lg:sticky lg:top-24 lg:flex-col">
              {TABS.map((t) => {
                const Icon = t.icon
                const active = view === t.id
                return (
                  <li key={t.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => go(t.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-[#424a70] text-white shadow-sm' : 'bg-white text-[#1c2033] ring-1 ring-[#424a70]/12 hover:bg-[#424a70]/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {t.label}
                    </button>
                  </li>
                )
              })}
              <li className="hidden lg:block lg:pt-4">
                <SignOutButton />
              </li>
            </ul>
          </nav>

          <section className="min-w-0">
            {view === 'overview' && <Overview go={go} />}
            {view === 'orders' && <Orders />}
            {view === 'designs' && <Designs />}
            {view === 'messages' && <Messages />}
            {view === 'profile' && <Profile />}
            <div className="mt-8 lg:hidden">
              <SignOutButton />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */

function SignOutButton() {
  const { logout } = useCustomer()
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        await logout()
        router.replace('/')
      }}
      className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
    >
      <LogOut className="h-4 w-4" aria-hidden /> Sign out
    </button>
  )
}

function VerifyBanner() {
  const { resendVerification } = useCustomer()
  const [sent, setSent] = useState(false)
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Please confirm your email address so we can send you order updates.
      </p>
      <button
        type="button"
        disabled={sent}
        onClick={async () => {
          const r = await resendVerification()
          if (r.success) {
            setSent(true)
            toast.success('Verification email sent')
          } else toast.error(r.message || 'Could not send the email')
        }}
        className="shrink-0 rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-950 disabled:opacity-60"
      >
        {sent ? 'Email sent' : 'Resend email'}
      </button>
    </div>
  )
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-serif text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-[#687194]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function Empty({ icon: Icon, title, text, action }: { icon: React.ElementType; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className={`${card} flex flex-col items-center px-6 py-12 text-center`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#424a70]/10 text-[#424a70]">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[#687194]">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function Loading() {
  return (
    <div className={`${card} flex justify-center py-14`} aria-busy="true">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#424a70] border-t-transparent" />
    </div>
  )
}

/* ------------------------------ Overview ------------------------------ */

function Overview({ go }: { go: (v: View) => void }) {
  const { orders, ordersLoading, savedDesigns, inquiries } = useCustomer()
  const active = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status))
  const latest = active[0] || orders[0]
  const needsPayment = orders.filter((o) => o.canPay)

  const stats = [
    { label: 'Orders in progress', value: active.length, view: 'orders' as View, icon: Truck },
    { label: 'Saved designs', value: savedDesigns.length, view: 'designs' as View, icon: Sparkles },
    { label: 'Messages', value: inquiries.length, view: 'messages' as View, icon: MessageSquare },
  ]

  return (
    <div className="space-y-6">
      {needsPayment.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-950">
            <strong>{needsPayment.length === 1 ? 'One order is' : `${needsPayment.length} orders are`} waiting for payment.</strong> Items are reserved for a limited time.
          </p>
          <Link href={`/orders/${encodeURIComponent(needsPayment[0].orderNumber)}`} className="shrink-0 rounded-xl bg-amber-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-amber-950">
            Complete payment
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <button key={s.label} type="button" onClick={() => go(s.view)} className={`${card} flex items-center gap-4 p-4 text-left transition-colors hover:border-[#424a70]/40`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#424a70]/10 text-[#424a70]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-2xl font-semibold">{s.value}</span>
                <span className="text-sm text-[#687194]">{s.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div>
        <SectionTitle
          title={active.length ? 'Your latest order' : 'Recent order'}
          action={
            orders.length > 0 && (
              <button type="button" onClick={() => go('orders')} className="inline-flex items-center gap-1 text-sm font-medium text-[#424a70] hover:underline">
                See all orders <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )
          }
        />
        {ordersLoading && orders.length === 0 ? (
          <Loading />
        ) : latest ? (
          <OrderCard order={latest} defaultOpen={false} />
        ) : (
          <Empty
            icon={Package}
            title="No orders yet"
            text="When you place an order it will appear here with live delivery updates."
            action={
              <Link href="/collection" className={btnPrimary}>
                Start shopping
              </Link>
            }
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Link href="/customize" className={`${card} flex items-center justify-between gap-3 p-4 hover:border-[#424a70]/40`}>
          <span>
            <span className="block font-medium">Design your own piece</span>
            <span className="text-sm text-[#687194]">Open the 3D studio</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-[#424a70]" aria-hidden />
        </Link>
        <Link href="/contact" className={`${card} flex items-center justify-between gap-3 p-4 hover:border-[#424a70]/40`}>
          <span>
            <span className="block font-medium">Need help with an order?</span>
            <span className="text-sm text-[#687194]">Write to our studio team</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-[#424a70]" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------ Orders ------------------------------ */

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled'

function Orders() {
  const { orders, ordersLoading, refreshOrders } = useCustomer()
  const params = useSearchParams()
  const focus = params.get('order')
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    refreshOrders()
  }, [refreshOrders])

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase()
    return orders.filter((o) => {
      const f =
        filter === 'all' ||
        (filter === 'active' && !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)) ||
        (filter === 'delivered' && o.status === 'DELIVERED') ||
        (filter === 'cancelled' && ['CANCELLED', 'REFUNDED'].includes(o.status))
      const m = !query || o.orderNumber.toLowerCase().includes(query) || o.items.some((i) => i.productName.toLowerCase().includes(query))
      return f && m
    })
  }, [orders, filter, q])

  const filters: [OrderFilter, string][] = [
    ['all', 'All'],
    ['active', 'In progress'],
    ['delivered', 'Delivered'],
    ['cancelled', 'Cancelled'],
  ]

  return (
    <div>
      <SectionTitle title="My orders" subtitle="Track deliveries, pay pending orders, cancel or review your pieces." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter orders">
          {filters.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${filter === id ? 'bg-[#424a70] text-white' : 'bg-white text-[#1c2033] ring-1 ring-[#424a70]/15 hover:bg-[#424a70]/5'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687194]" aria-hidden />
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <input id="order-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number or product" className={`${inputCls} pl-9`} />
        </div>
      </div>

      {ordersLoading && orders.length === 0 ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty
          icon={Package}
          title={orders.length ? 'No orders match' : 'No orders yet'}
          text={orders.length ? 'Try a different filter or search.' : 'Your orders will appear here once you place one.'}
          action={
            !orders.length && (
              <Link href="/collection" className={btnPrimary}>
                Browse the collection
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {shown.map((o) => (
            <li key={o.id}>
              <OrderCard order={o} defaultOpen={focus === o.orderNumber || focus === o.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderCard({ order, defaultOpen }: { order: CustomerOrder; defaultOpen: boolean }) {
  const { cancelOrder, markOrderReceived } = useCustomer()
  const [open, setOpen] = useState(defaultOpen)
  const [busy, setBusy] = useState(false)
  const preview = order.items.slice(0, 4)

  const act = async (fn: () => Promise<{ success: boolean; message?: string }>) => {
    setBusy(true)
    const r = await fn()
    setBusy(false)
    if (r.success) toast.success(r.message || 'Done')
    else toast.error(r.message || 'Something went wrong')
  }

  return (
    <article className={`${card} overflow-hidden`} aria-labelledby={`order-${order.id}`}>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 id={`order-${order.id}`} className="flex flex-wrap items-center gap-2 text-base font-semibold">
              <span className="break-all">Order {order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </h3>
            <p className="mt-1 text-sm text-[#687194]">
              Placed {fmtDate(order.createdAt)} · {order.items.reduce((s, i) => s + i.quantity, 0)} item(s) ·{' '}
              <span className="font-medium text-[#1c2033]">{formatINR(order.totalAmount)}</span>
            </p>
          </div>
          <div className="flex -space-x-2">
            {preview.map((it) => (
              <span key={it.id} className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-slate-100">
                <Image src={it.productImage} alt="" fill sizes="48px" className="object-cover" />
              </span>
            ))}
            {order.items.length > 4 && (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-xs font-medium">+{order.items.length - 4}</span>
            )}
          </div>
        </div>

        <OrderProgress status={order.status} dates={{ PLACED: order.createdAt, CONFIRMED: order.paidAt, SHIPPED: order.shippedAt, DELIVERED: order.deliveredAt }} />
        {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && <p className="text-sm text-[#3b4266]">{statusHelp(order.status)}</p>}

        {order.trackingNumber && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#424a70]/5 px-3 py-2.5 text-sm">
            <Truck className="h-4 w-4 text-[#424a70]" aria-hidden />
            <span>
              {order.carrier || 'Courier'} tracking number: <strong className="font-mono">{order.trackingNumber}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(order.trackingNumber || '')
                toast.success('Tracking number copied')
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#424a70] hover:bg-white"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
            </button>
          </div>
        )}

        {/* Actions: the most relevant one first */}
        <div className="flex flex-wrap gap-2">
          {order.canPay && (
            <Link href={`/orders/${encodeURIComponent(order.orderNumber)}`} className={btnPrimary}>
              <CreditCard className="h-4 w-4" aria-hidden /> Pay {formatINR(order.totalAmount)}
            </Link>
          )}
          {order.canConfirmDelivery && (
            <button type="button" disabled={busy} onClick={() => act(() => markOrderReceived(order.id))} className={btnPrimary}>
              I&apos;ve received it
            </button>
          )}
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={btnSecondary}>
            {open ? 'Hide details' : 'View details'}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {order.canCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Cancel order ${order.orderNumber}?${order.paymentStatus === 'PAID' ? ' Your payment will be refunded.' : ''}`)) act(() => cancelOrder(order.id))
              }}
              className={btnDanger}
            >
              Cancel order
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="grid gap-5 border-t border-[#424a70]/10 bg-[#faf9fc] p-4 sm:p-5 md:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            <h4 className="mb-2 text-sm font-semibold">Items</h4>
            <ul className="divide-y divide-[#424a70]/10">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image src={it.productImage} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{it.productName}</span>
                    <span className="text-xs text-[#687194]">
                      Qty {it.quantity} · {formatINR(it.price)} each
                    </span>
                    {it.customerInstructions && (
                      <span className="mt-1 block whitespace-pre-wrap break-words rounded-lg bg-white px-2 py-1.5 text-xs text-[#3b4266] ring-1 ring-[#424a70]/10">
                        <b className="font-semibold">Your instructions:</b> {it.customerInstructions}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium">{formatINR(it.totalPrice)}</span>
                    {order.status === 'DELIVERED' && it.productSlug && !it.bespokeDesignId && (
                      <Link href={`/collection/${it.productSlug}#reviews`} className="inline-flex items-center gap-1 text-xs font-medium text-[#424a70] hover:underline">
                        <Star className="h-3.5 w-3.5" aria-hidden /> Write a review
                      </Link>
                    )}
                    {it.bespokeDesignId && (
                      <Link href={`/customize?design=${it.bespokeDesignId}`} className="text-xs font-medium text-[#424a70] hover:underline">
                        View design
                      </Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="mb-1 font-semibold">Delivery address</h4>
              <p className="text-[#3b4266]">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold">Payment</h4>
              <dl className="space-y-1 text-[#3b4266]">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatINR(order.subtotal)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Discount</dt>
                    <dd>−{formatINR(order.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{order.shippingFee ? formatINR(order.shippingFee) : 'Free'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>GST</dt>
                  <dd>{formatINR(order.tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-[#424a70]/10 pt-1 font-semibold text-[#1c2033]">
                  <dt>Total</dt>
                  <dd>{formatINR(order.totalAmount)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-[#687194]">
                {order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online payment'} ·{' '}
                {order.paymentStatus === 'PAID' ? 'paid' : order.paymentStatus === 'REFUNDED' ? 'refunded' : 'not paid yet'}
                {order.refundedAmount > 0 && order.paymentStatus !== 'REFUNDED' ? ` · ${formatINR(order.refundedAmount)} refunded` : ''}
              </p>
            </div>
            <Link
              href={`/contact?type=GENERAL&order=${encodeURIComponent(`Question about order ${order.orderNumber}: `)}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#424a70] hover:underline"
            >
              Get help with this order <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}

/* ------------------------------ Designs ------------------------------ */

const DESIGN_STATUS: Record<string, string> = {
  DRAFT: 'Draft',
  SAVED: 'Saved',
  SUBMITTED: 'Ordered',
  IN_REVIEW: 'In review',
  APPROVED: 'Approved',
  IN_PRODUCTION: 'In production',
  COMPLETED: 'Completed',
  REJECTED: 'Needs changes',
}

function Designs() {
  const { savedDesigns, designsLoading, refreshSavedDesigns, deleteBespokeDesign, renameBespokeDesign, duplicateBespokeDesign } = useCustomer()
  const [renaming, setRenaming] = useState<CustomerSavedDesign | null>(null)
  const [title, setTitle] = useState('')

  useEffect(() => {
    refreshSavedDesigns()
  }, [refreshSavedDesigns])

  const res = (r: { success: boolean; message?: string }, ok: string) => (r.success ? toast.success(ok) : toast.error(r.message || 'Something went wrong'))

  return (
    <div>
      <SectionTitle
        title="My designs"
        subtitle="Pieces you created in the 3D studio. Open one to edit it or add it to your bag."
        action={
          <Link href="/customize" className={btnPrimary}>
            <Plus className="h-4 w-4" aria-hidden /> New design
          </Link>
        }
      />
      {designsLoading && savedDesigns.length === 0 ? (
        <Loading />
      ) : savedDesigns.length === 0 ? (
        <Empty
          icon={Sparkles}
          title="No saved designs"
          text="Customise a mug, plate or tumbler in the 3D studio and press Save to keep it here."
          action={
            <Link href="/customize" className={btnPrimary}>
              Open the 3D studio
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {savedDesigns.map((d) => (
            <li key={d.id} className={`${card} flex flex-col overflow-hidden`}>
              <div className="relative aspect-[4/3] bg-slate-100">
                {d.previewUrl && <Image src={d.previewUrl} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#1c2033] shadow-sm">{DESIGN_STATUS[d.status] || d.status}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{d.title}</h3>
                  <p className="text-sm text-[#687194]">
                    {d.productName} · from {formatINR(d.estimatedPrice)}
                  </p>
                  {d.status === 'REJECTED' && <p className="mt-1 text-xs text-rose-700">Our studio asked for changes — open the design to update it.</p>}
                  {d.customerInstructions && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-[#3b4266]" title={d.customerInstructions}>
                      <b className="font-semibold">Instructions:</b> {d.customerInstructions}
                    </p>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link href={`/customize?design=${d.id}`} className={`${btnPrimary} flex-1`}>
                    {d.editable ? 'Open & edit' : 'Open a copy'}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Rename ${d.title}`}
                    title="Rename"
                    onClick={() => {
                      setRenaming(d)
                      setTitle(d.title)
                    }}
                    className={btnSecondary}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" aria-label={`Duplicate ${d.title}`} title="Duplicate" onClick={async () => res(await duplicateBespokeDesign(d.id), 'Design duplicated')} className={btnSecondary}>
                    <Copy className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${d.title}`}
                    title="Delete"
                    onClick={async () => {
                      if (window.confirm(`Delete "${d.title}"?`)) res(await deleteBespokeDesign(d.id), 'Design deleted')
                    }}
                    className={btnDanger}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {renaming && (
        <Dialog title="Rename design" onClose={() => setRenaming(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!title.trim()) return
              const r = await renameBespokeDesign(renaming.id, title.trim())
              res(r, 'Design renamed')
              if (r.success) setRenaming(null)
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="rename-title" className={labelCls}>
                Design name
              </label>
              <input id="rename-title" autoFocus value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenaming(null)} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" className={btnPrimary}>
                Save
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}

/* ------------------------------ Messages ------------------------------ */

const INQ_STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: 'Received', tone: 'bg-sky-100 text-sky-900' },
  IN_PROGRESS: { label: 'We are on it', tone: 'bg-indigo-100 text-indigo-900' },
  RESOLVED: { label: 'Resolved', tone: 'bg-emerald-100 text-emerald-900' },
  ARCHIVED: { label: 'Closed', tone: 'bg-slate-200 text-slate-900' },
}

function Messages() {
  const { inquiries, refreshInquiries } = useCustomer()
  useEffect(() => {
    refreshInquiries()
  }, [refreshInquiries])
  return (
    <div>
      <SectionTitle
        title="Messages"
        subtitle="Questions and commission requests you sent us. Replies arrive by email."
        action={
          <Link href="/contact" className={btnPrimary}>
            <Mail className="h-4 w-4" aria-hidden /> New message
          </Link>
        }
      />
      {inquiries.length === 0 ? (
        <Empty icon={MessageSquare} title="No messages yet" text="Have a question or a custom project in mind? We'd love to hear from you." />
      ) : (
        <ul className="space-y-3">
          {inquiries.map((m) => (
            <li key={m.id} className={`${card} p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold capitalize">{m.subject}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${INQ_STATUS[m.status]?.tone ?? 'bg-slate-100'}`}>{INQ_STATUS[m.status]?.label ?? m.status}</span>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-[#3b4266]">{m.message}</p>
              <p className="mt-2 text-xs text-[#687194]">Sent {fmtDate(m.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------ Profile ------------------------------ */

function Profile() {
  const { customer, updateProfile, changePassword } = useCustomer()
  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    setName(customer?.name || '')
    setPhone(customer?.phone || '')
  }, [customer?.name, customer?.phone])

  if (!customer) return null

  return (
    <div className="space-y-6">
      <SectionTitle title="Profile & addresses" subtitle="Keep your details up to date for faster checkout." />

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <form
          className={`${card} space-y-4 p-5`}
          onSubmit={async (e) => {
            e.preventDefault()
            setSavingProfile(true)
            const r = await updateProfile({ name, phone })
            setSavingProfile(false)
            if (r.success) toast.success('Profile saved')
            else toast.error(r.message || 'Could not save your profile')
          }}
        >
          <h3 className="flex items-center gap-2 font-semibold">
            <User className="h-4 w-4 text-[#424a70]" aria-hidden /> Personal details
          </h3>
          <div>
            <label htmlFor="pf-name" className={labelCls}>
              Full name
            </label>
            <input id="pf-name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-email" className={labelCls}>
              Email
            </label>
            <input id="pf-email" value={customer.email} readOnly className={`${inputCls} bg-slate-50 text-[#687194]`} />
            <p className="mt-1 text-xs text-[#687194]">{customer.emailVerified ? '✓ Verified' : 'Not verified yet'} · contact us to change your email.</p>
          </div>
          <div>
            <label htmlFor="pf-phone" className={labelCls}>
              Mobile number
            </label>
            <input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="98765 43210" className={inputCls} />
          </div>
          <button type="submit" disabled={savingProfile} className={btnPrimary}>
            {savingProfile ? 'Saving…' : 'Save details'}
          </button>
        </form>

        <form
          className={`${card} space-y-4 p-5`}
          onSubmit={async (e) => {
            e.preventDefault()
            const problem = passwordProblem(next) || (next !== confirm ? 'The new passwords do not match.' : null)
            setPwError(problem)
            if (problem) return
            setSavingPw(true)
            const r = await changePassword({ currentPassword: current, newPassword: next })
            setSavingPw(false)
            if (r.success) {
              toast.success('Password updated. Other devices were signed out.')
              setCurrent('')
              setNext('')
              setConfirm('')
            } else setPwError(r.message || 'Could not update your password')
          }}
        >
          <h3 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#424a70]" aria-hidden /> Password &amp; security
          </h3>
          <div>
            <label htmlFor="pw-current" className={labelCls}>
              Current password
            </label>
            <PasswordInput id="pw-current" required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pw-new" className={labelCls}>
                New password
              </label>
              <PasswordInput id="pw-new" required value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={inputCls} />
            </div>
            <div>
              <label htmlFor="pw-confirm" className={labelCls}>
                Confirm new password
              </label>
              <PasswordInput id="pw-confirm" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputCls} />
            </div>
          </div>
          <p className="text-xs text-[#687194]">{PASSWORD_HINT}</p>
          {pwError && (
            <p role="alert" className="text-sm text-rose-700">
              {pwError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={savingPw} className={btnPrimary}>
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
            <SignOutEverywhere />
          </div>
        </form>
      </div>

      <AddressBook />
    </div>
  )
}

function SignOutEverywhere() {
  const router = useRouter()
  const { logout } = useCustomer()
  return (
    <button
      type="button"
      className={btnSecondary}
      onClick={async () => {
        if (!window.confirm('Sign out of UNIFORT on all your devices?')) return
        await api.post('/auth/logout-all')
        await logout()
        router.replace('/login')
      }}
    >
      Sign out everywhere
    </button>
  )
}

const emptyAddress = { label: '', recipientName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', isDefault: false }

function AddressBook() {
  const { customer, refreshProfile } = useCustomer()
  const addresses = customer?.addresses || []
  const [editing, setEditing] = useState<CustomerAddress | 'new' | null>(null)
  const [form, setForm] = useState(emptyAddress)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = (a: CustomerAddress | 'new') => {
    setEditing(a)
    setError(null)
    setForm(
      a === 'new'
        ? { ...emptyAddress, recipientName: customer?.name || '', phone: customer?.phone || '', isDefault: addresses.length === 0 }
        : {
            label: a.label || '',
            recipientName: a.recipientName,
            phone: a.phone,
            addressLine1: a.addressLine1,
            addressLine2: a.addressLine2 || '',
            city: a.city,
            state: a.state,
            postalCode: a.postalCode,
            isDefault: a.isDefault,
          }
    )
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(form.postalCode.trim())) return setError('PIN code must be 6 digits.')
    setSaving(true)
    const payload = { ...form, label: form.label || null, addressLine2: form.addressLine2 || null, country: 'India' }
    const res = editing === 'new' ? await api.post('/addresses', payload) : await api.put(`/addresses/${(editing as CustomerAddress).id}`, payload)
    setSaving(false)
    if (!res.success) return setError(errorMessage(res))
    toast.success('Address saved')
    setEditing(null)
    refreshProfile()
  }

  const remove = async (a: CustomerAddress) => {
    if (!window.confirm('Delete this address?')) return
    const res = await api.delete(`/addresses/${a.id}`)
    if (res.success) {
      toast.success('Address deleted')
      refreshProfile()
    } else toast.error(errorMessage(res))
  }

  const makeDefault = async (a: CustomerAddress) => {
    const res = await api.put(`/addresses/${a.id}`, { isDefault: true })
    if (res.success) {
      toast.success('Default address updated')
      refreshProfile()
    } else toast.error(errorMessage(res))
  }

  const f = (k: keyof typeof emptyAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className={`${card} p-5`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <MapPin className="h-4 w-4 text-[#424a70]" aria-hidden /> Saved addresses
        </h3>
        <button type="button" onClick={() => open('new')} className={btnSecondary}>
          <Plus className="h-4 w-4" aria-hidden /> Add address
        </button>
      </div>
      {addresses.length === 0 ? (
        <p className="text-sm text-[#687194]">No saved addresses yet. Addresses you add here are offered at checkout.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className={`rounded-xl border p-4 text-sm ${a.isDefault ? 'border-[#424a70] bg-[#424a70]/5' : 'border-[#424a70]/15'}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-semibold">{a.label || a.recipientName}</span>
                {a.isDefault && <span className="rounded-full bg-[#424a70] px-2 py-0.5 text-[11px] font-semibold text-white">Default</span>}
              </div>
              <p className="text-[#3b4266]">
                {a.recipientName} · {a.phone}
                <br />
                {a.addressLine1}
                {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                <br />
                {a.city}, {a.state} {a.postalCode}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
                <button type="button" onClick={() => open(a)} className="text-[#424a70] hover:underline">
                  Edit
                </button>
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault(a)} className="text-[#424a70] hover:underline">
                    Make default
                  </button>
                )}
                <button type="button" onClick={() => remove(a)} className="text-rose-700 hover:underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Dialog title={editing === 'new' ? 'Add address' : 'Edit address'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
              <div>
                <label htmlFor="ad-label" className={labelCls}>
                  Label (optional)
                </label>
                <input id="ad-label" value={form.label} onChange={f('label')} placeholder="Home, Office…" className={inputCls} />
              </div>
              <div>
                <label htmlFor="ad-name" className={labelCls}>
                  Recipient name
                </label>
                <input id="ad-name" required value={form.recipientName} onChange={f('recipientName')} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="ad-phone" className={labelCls}>
                Mobile number
              </label>
              <input id="ad-phone" required type="tel" value={form.phone} onChange={f('phone')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="ad-l1" className={labelCls}>
                Address line 1
              </label>
              <input id="ad-l1" required value={form.addressLine1} onChange={f('addressLine1')} autoComplete="address-line1" className={inputCls} />
            </div>
            <div>
              <label htmlFor="ad-l2" className={labelCls}>
                Address line 2 (optional)
              </label>
              <input id="ad-l2" value={form.addressLine2} onChange={f('addressLine2')} autoComplete="address-line2" className={inputCls} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="ad-city" className={labelCls}>
                  City
                </label>
                <input id="ad-city" required value={form.city} onChange={f('city')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="ad-state" className={labelCls}>
                  State
                </label>
                <input id="ad-state" required value={form.state} onChange={f('state')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="ad-pin" className={labelCls}>
                  PIN code
                </label>
                <input id="ad-pin" required inputMode="numeric" maxLength={6} value={form.postalCode} onChange={f('postalCode')} className={inputCls} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={f('isDefault')} className="h-4 w-4" /> Use as my default address
            </label>
            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Saving…' : 'Save address'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}

/* ------------------------------ Dialog ------------------------------ */

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="acct-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="acct-dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[#687194] hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
