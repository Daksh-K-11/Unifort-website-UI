'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Mail, MessageSquareQuote, Package, RefreshCw, ShoppingBag, Sparkles, TrendingUp, Users, Clock } from 'lucide-react'
import { api, formatINR, mediaUrl } from '@/lib/api-client'
import { useAdminAuth } from '../admin-auth-context'
import { AdminSection } from '../admin-types'
import { notify, Spinner } from '../admin-ui'

interface Stats {
  revenue?: { totalPaid: number; last30Days: number; paidOrdersLast30Days: number }
  users?: { customers: number; staff: number }
  coupons?: { active: number }
  orders: {
    total: number
    toFulfil: number
    awaitingPayment: number
    recent: { id: string; orderNumber: string; customerName: string; totalAmount: number; status: string; paymentStatus: string; paymentMethod: string; createdAt: string }[]
  }
  catalog: { publishedCount: number; draftsCount: number; lowStockItems: { id: string; name: string; sku: string | null; stock: number; image: string }[]; lowStockThreshold: number }
  inquiries: { pendingNew: number }
  designs: { awaitingReview: number }
  reviews: { pending: number }
}

export function OverviewView({ onNavigate }: { onNavigate: (section: AdminSection) => void }) {
  const { currentUser, canViewRevenue } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.get<Stats>('/admin/dashboard-stats')
    if (res.success && res.data) setStats(res.data)
    else notify(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !stats) return <Spinner />
  if (!stats) return <p className="text-sm adm-text-muted">Dashboard figures are unavailable right now.</p>

  const tiles: { title: string; value: string | number; caption: string; icon: React.ElementType; section?: AdminSection; tone: string }[] = [
    ...(canViewRevenue && stats.revenue
      ? [
          { title: 'Revenue (30 days)', value: formatINR(stats.revenue.last30Days), caption: `${stats.revenue.paidOrdersLast30Days} paid orders · all time ${formatINR(stats.revenue.totalPaid)}`, icon: TrendingUp, tone: 'text-emerald-500' },
        ]
      : []),
    { title: 'To fulfil', value: stats.orders.toFulfil, caption: 'Confirmed or processing orders', icon: ShoppingBag, section: 'orders', tone: 'text-blue-500' },
    { title: 'Awaiting payment', value: stats.orders.awaitingPayment, caption: 'Online orders not yet paid', icon: Clock, section: 'orders', tone: 'text-amber-500' },
    { title: 'Designs to review', value: stats.designs.awaitingReview, caption: 'Submitted 3D designs', icon: Sparkles, section: '3d-studio', tone: 'text-purple-500' },
    { title: 'New inquiries', value: stats.inquiries.pendingNew, caption: 'Awaiting a first reply', icon: Mail, section: 'inquiries', tone: 'text-sky-500' },
    { title: 'Reviews to moderate', value: stats.reviews.pending, caption: 'Pending approval', icon: MessageSquareQuote, section: 'reviews', tone: 'text-pink-500' },
    { title: 'Catalogue', value: stats.catalog.publishedCount, caption: `${stats.catalog.draftsCount} drafts`, icon: Package, section: 'products', tone: 'text-slate-500' },
    ...(stats.users ? [{ title: 'Customers', value: stats.users.customers, caption: `${stats.users.staff} staff accounts`, icon: Users, section: 'users' as AdminSection, tone: 'text-teal-500' }] : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">Welcome, {currentUser?.name?.split(' ')[0]}</h2>
          <p className="text-xs adm-text-muted mt-0.5">Today&apos;s work across orders, production and customer care.</p>
        </div>
        <button type="button" onClick={load} className="px-3 py-2 rounded-xl border adm-border text-xs inline-flex items-center gap-1.5" aria-label="Refresh dashboard">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon
          const body = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider adm-text-muted font-medium">{t.title}</span>
                <Icon className={`w-4 h-4 ${t.tone}`} aria-hidden />
              </div>
              <div className="text-2xl font-serif adm-text-primary mt-2">{t.value}</div>
              <div className="text-[11px] adm-text-muted mt-1">{t.caption}</div>
            </>
          )
          return t.section ? (
            <button key={t.title} type="button" onClick={() => onNavigate(t.section!)} className="text-left adm-card border adm-border rounded-2xl p-4 hover:border-[#424a70] transition-colors">
              {body}
            </button>
          ) : (
            <div key={t.title} className="adm-card border adm-border rounded-2xl p-4">
              {body}
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 adm-card border adm-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold adm-text-primary">Recent orders</h3>
            <button type="button" className="text-xs underline adm-text-muted" onClick={() => onNavigate('orders')}>
              All orders
            </button>
          </div>
          {stats.orders.recent.length === 0 ? (
            <p className="text-xs adm-text-muted">No orders yet.</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {stats.orders.recent.map((o) => (
                  <tr key={o.id} className="border-b adm-border last:border-0">
                    <td className="py-2 font-mono adm-text-primary">{o.orderNumber}</td>
                    <td className="py-2">{o.customerName}</td>
                    <td className="py-2 adm-text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-2">
                      {o.status.toLowerCase()} · {o.paymentMethod === 'COD' ? 'COD' : o.paymentStatus.toLowerCase()}
                    </td>
                    <td className="py-2 text-right font-mono">{formatINR(o.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="adm-card border adm-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden />
            <h3 className="text-sm font-semibold adm-text-primary">Low stock (≤ {stats.catalog.lowStockThreshold})</h3>
          </div>
          {stats.catalog.lowStockItems.length === 0 ? (
            <p className="text-xs adm-text-muted">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {stats.catalog.lowStockItems.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(p.image)} alt="" className="w-8 h-8 rounded object-cover" />
                  <span className="flex-1 truncate adm-text-primary">{p.name}</span>
                  <span className={`font-mono ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="mt-3 text-xs underline adm-text-muted" onClick={() => onNavigate('products')}>
            Manage inventory
          </button>
        </section>
      </div>
    </div>
  )
}
