'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Package,
  Sparkles,
  Mail,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  LogOut,
  MapPin,
  Lock,
  Phone,
  Copy,
  Plus,
  AlertCircle,
  X,
  Search,
  ArrowLeft,
  Calendar,
  ArrowUpRight,
  ShoppingBag,
  FileText,
  Star,
  Check,
  ArrowRight,
} from 'lucide-react'
import { useCustomer } from '@/lib/customer-context'
import { useBag } from '@/lib/bag-context'
import { CustomerOrder, CustomerSavedDesign, CustomerInquiry } from '@/lib/customer-types'
import { UnifortButton } from '@/components/ui/UnifortButton'

type PortalView = 'hub' | 'orders' | 'designs' | 'inquiries' | 'profile'

interface AccountPortalProps {
  initialView?: 'hub' | 'orders' | 'designs' | 'inquiries' | 'profile' | 'track'
}

export function AccountPortal({ initialView }: AccountPortalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    customer,
    isLoggedIn,
    logout,
    orders,
    savedDesigns,
    inquiries,
    cancelOrder,
    markOrderReceived,
    duplicateBespokeDesign,
    renameBespokeDesign,
    deleteBespokeDesign,
    updateProfile,
    changePassword,
    setAuthModalOpen,
    trackConsignment,
  } = useCustomer()

  const { addToBag, setIsBagOpen, setToastMessage } = useBag()

  // Multi-page navigation state driven by URL search params.
  // Note: 'track' is seamlessly consolidated under 'orders'
  const viewParam = searchParams.get('view')
  const currentView: PortalView =
    viewParam === 'orders' || viewParam === 'track'
      ? 'orders'
      : viewParam === 'designs'
      ? 'designs'
      : viewParam === 'inquiries'
      ? 'inquiries'
      : viewParam === 'profile'
      ? 'profile'
      : initialView === 'orders' || initialView === 'track'
      ? 'orders'
      : initialView === 'designs'
      ? 'designs'
      : initialView === 'inquiries'
      ? 'inquiries'
      : initialView === 'profile'
      ? 'profile'
      : 'hub'

  const navigateToView = (view: PortalView) => {
    if (view === 'hub') {
      router.push('/account')
    } else {
      router.push(`/account?view=${view}`)
    }
  }

  // Modals & Selection state
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null)
  const [renamingDesign, setRenamingDesign] = useState<CustomerSavedDesign | null>(null)
  const [newTitle, setNewTitle] = useState('')

  // Profile Form State
  const [profileName, setProfileName] = useState(customer?.name || '')
  const [profilePhone, setProfilePhone] = useState(customer?.phone || '')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Password Form State
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [passError, setPassError] = useState('')

  // Tracking State inside Acquisitions
  const [trackingInput, setTrackingInput] = useState('')
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingResult, setTrackingResult] = useState<any>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [expandedTrackingOrderId, setExpandedTrackingOrderId] = useState<string | null>(null)
  const [copiedWaybill, setCopiedWaybill] = useState(false)

  // Sync profile details when customer object is hydrated
  useEffect(() => {
    if (customer) {
      setProfileName(customer.name || '')
      setProfilePhone(customer.phone || '')
    }
  }, [customer])

  // Automatically trigger tracking lookup if orderNumber is in URL
  useEffect(() => {
    const orderNumberFromUrl = searchParams.get('orderNumber') || searchParams.get('order')
    if (orderNumberFromUrl) {
      setTrackingInput(orderNumberFromUrl)
      handlePerformTrack(orderNumberFromUrl)
    }
  }, [searchParams])

  const handlePerformTrack = async (ref: string) => {
    const q = ref.trim()
    if (!q) return
    setTrackingLoading(true)
    setTrackingError(null)

    const res = await trackConsignment(q)
    setTrackingLoading(false)

    if (res.success && res.data) {
      setTrackingResult(res.data)
      setExpandedTrackingOrderId(res.data.id || res.data.orderNumber)
    } else {
      setTrackingResult(null)
      setTrackingError(res.message || `No consignment found for "${q}". Please verify the order reference or waybill number.`)
    }
  }

  const handleCopyWaybill = (waybill: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(waybill)
      setCopiedWaybill(true)
      setTimeout(() => setCopiedWaybill(false), 2000)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccess('')
    const res = await updateProfile({ name: profileName, phone: profilePhone })
    if (res.success) {
      setProfileSuccess(res.message || 'Profile details updated.')
      setTimeout(() => setProfileSuccess(''), 3500)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')
    setPassSuccess('')
    const res = await changePassword({ currentPassword: currentPass, newPassword: newPass })
    if (res.success) {
      setPassSuccess(res.message || 'Passphrase updated successfully.')
      setCurrentPass('')
      setNewPass('')
      setTimeout(() => setPassSuccess(''), 3500)
    } else {
      setPassError(res.message || 'Failed to update passphrase.')
    }
  }

  const handleOrderCustomPiece = (design: CustomerSavedDesign) => {
    addToBag({
      name: `${design.title} (Bespoke)`,
      type: `${(design.modelType || 'STONEWARE').toUpperCase()} · Handcrafted Glaze · ${design.finish || 'Mineral Satin'}`,
      price: '₹148',
      image: '/products/unifort-plate-light.jpg',
      category: 'Bespoke Studio',
    })
    setIsBagOpen(true)
    setToastMessage(`Added "${design.title}" to your order bag`)
  }

  const handleSaveRename = async () => {
    if (!renamingDesign || !newTitle.trim()) return
    await renameBespokeDesign(renamingDesign.id, newTitle.trim())
    setRenamingDesign(null)
    setNewTitle('')
  }

  // High-contrast status badges in light and dark mode
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold'
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold'
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-900 border border-rose-300 font-semibold'
      case 'PENDING':
      default:
        return 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
    }
  }

  // Portal Hub feature items (tracked internally without standalone Track Order card)
  const portalItems = [
    {
      id: 'orders',
      title: 'Acquisitions & Consignments',
      eyebrow: 'Provenance & Deliveries',
      description: 'Review permanent tableware orders, live courier progress, waybills, and manifests.',
      badge: `${orders.length} Orders`,
      badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      icon: <Package className="w-5 h-5" />,
      actionLabel: `View Acquisitions (${orders.length})`,
      onClick: () => navigateToView('orders'),
    },
    {
      id: 'designs',
      title: '3D Bespoke Pieces',
      eyebrow: 'Kiln Formulations',
      description: 'Browse saved reduction glazes, ceramic stamps, and re-order custom tableware pieces.',
      badge: `${savedDesigns.length} Pieces`,
      badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300',
      icon: <Sparkles className="w-5 h-5" />,
      actionLabel: `View Bespoke Queue (${savedDesigns.length})`,
      onClick: () => navigateToView('designs'),
    },
    {
      id: 'inquiries',
      title: 'Hospitality & Trade Quotes',
      eyebrow: 'Trade Desk',
      description: 'Track custom banquet proposals, restaurant opening suites, and studio correspondence.',
      badge: `${inquiries.length} Quotes`,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
      icon: <Mail className="w-5 h-5" />,
      actionLabel: `Review Inquiries (${inquiries.length})`,
      onClick: () => navigateToView('inquiries'),
    },
    {
      id: 'profile',
      title: 'Registry & Security',
      eyebrow: 'Patron Registry',
      description: 'Update patron contact coordinates, delivery phone, and manage passphrase access keys.',
      badge: 'Protected',
      badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300',
      icon: <Shield className="w-5 h-5" />,
      actionLabel: 'Security Credentials',
      onClick: () => navigateToView('profile'),
    },
    {
      id: 'studio',
      title: 'Launch 3D Studio',
      eyebrow: 'Interactive Kiln',
      description: 'Formulate mineral glazes and inspect reduction stoneware in real-time 3D.',
      badge: '3D WebGL',
      badgeClass: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
      icon: <Sparkles className="w-5 h-5" />,
      actionLabel: 'Launch 3D Studio',
      onClick: () => router.push('/customize'),
    },
  ]

  return (
    <main className="page min-h-screen bg-[#faf9fc] text-[#1c2033] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* ================= PATRON HEADER BANNER ================= */}
        <section className="bg-white border border-[#424a70]/15 rounded-3xl p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#424a70] !text-white [&_*]:!text-white flex items-center justify-center text-lg sm:text-xl font-serif font-medium shrink-0 shadow-xs">
              {customer
                ? customer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'P'
                : 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#424a70]">
                  Patron Registry · UNIFORT
                </span>
                {isLoggedIn ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-semibold">
                    Authenticated Patron
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-semibold">
                    Guest Session
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-medium text-[#1c2033] mt-1">
                {customer ? customer.name : 'Atelier Guest Patron'}
              </h1>
              <p className="text-xs text-[#424a70]/70 mt-0.5">
                {customer
                  ? `${customer.email} · ${customer.phone || 'No phone recorded'}`
                  : 'Track consignments, manage bespoke glazes, and review acquisitions'}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => navigateToView('orders')}
              className="px-3.5 py-2 rounded-xl bg-[#424a70]/5 border border-[#424a70]/15 text-center hover:bg-[#424a70]/10 transition-colors"
            >
              <span className="block text-base font-serif font-bold text-[#424a70]">
                {orders.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#424a70]/70">
                Orders
              </span>
            </button>
            <button
              onClick={() => navigateToView('designs')}
              className="px-3.5 py-2 rounded-xl bg-[#424a70]/5 border border-[#424a70]/15 text-center hover:bg-[#424a70]/10 transition-colors"
            >
              <span className="block text-base font-serif font-bold text-[#424a70]">
                {savedDesigns.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#424a70]/70">
                Bespoke
              </span>
            </button>
            <button
              onClick={() => navigateToView('inquiries')}
              className="px-3.5 py-2 rounded-xl bg-[#424a70]/5 border border-[#424a70]/15 text-center hover:bg-[#424a70]/10 transition-colors"
            >
              <span className="block text-base font-serif font-bold text-[#424a70]">
                {inquiries.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#424a70]/70">
                Quotes
              </span>
            </button>

            {isLoggedIn ? (
              <UnifortButton
                variant="outline"
                size="sm"
                icon={<LogOut className="w-3.5 h-3.5" />}
                onClick={logout}
                title="Sign Out of Atelier"
                className="hover:!text-red-600 hover:!border-red-400 shrink-0"
              >
                Sign Out
              </UnifortButton>
            ) : (
              <button
                onClick={() => setAuthModalOpen('login')}
                className="px-4 py-2 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shrink-0 shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </section>

        {/* ================= TRUE PAGE HEADER WITH BACK BUTTON (NO TABS) ================= */}
        {currentView !== 'hub' && (
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#424a70]/12">
            <button
              onClick={() => navigateToView('hub')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#424a70] hover:text-[#1c2033] transition-colors py-2 px-3.5 rounded-xl bg-white border border-[#424a70]/15 hover:bg-[#424a70]/5 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Profile Hub</span>
            </button>
            <div className="text-[11px] text-[#424a70]/60 font-mono hidden sm:block">
              Patron Portal /{' '}
              <span className="text-[#1c2033] font-semibold uppercase">
                {currentView === 'orders'
                  ? 'Acquisitions & Consignments'
                  : currentView === 'designs'
                  ? '3D Bespoke Studio Pieces'
                  : currentView === 'inquiries'
                  ? 'Hospitality Quotes'
                  : 'Registry & Security'}
              </span>
            </div>
          </div>
        )}

        {/* ================= PAGE 0: PROFILE HUB ================= */}
        {currentView === 'hub' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1c2033]">
                  Atelier Service Portals
                </h2>
                <p className="text-xs text-[#424a70]/70 mt-0.5">
                  Select a department to manage your tableware acquisitions, 3D glazes, trade quotes, or account registry.
                </p>
              </div>
            </div>

            {/* MOBILE PHONE VIEW: SLEEK VERTICAL LIST MANNER */}
            <div className="md:hidden bg-white border border-[#424a70]/15 rounded-3xl overflow-hidden divide-y divide-[#424a70]/10 shadow-xs">
              {portalItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#424a70]/5 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className="w-11 h-11 rounded-2xl bg-[#424a70] !text-white [&_*]:!text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-serif font-semibold text-[#1c2033] group-hover:text-[#424a70] transition-colors truncate">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold shrink-0 ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#424a70]/70 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center text-[#424a70]/40 group-hover:text-[#424a70] group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>

            {/* DESKTOP VIEW: ARCHITECTURAL CARDS GRID */}
            <div className="hidden md:grid md:grid-cols-2 gap-5">
              {portalItems.map((item) => (
                <div
                  key={item.id}
                  onClick={item.onClick}
                  className="group cursor-pointer bg-white border border-[#424a70]/15 rounded-3xl p-6 shadow-xs hover:border-[#424a70] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#424a70] !text-white [&_*]:!text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#424a70]">
                        {item.eyebrow}
                      </span>
                      <h3 className="text-lg font-serif font-medium text-[#1c2033] mt-0.5 group-hover:text-[#424a70] transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#424a70]/75 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-5 mt-4 border-t border-[#424a70]/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#424a70] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {item.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Recent Activity Preview on Hub */}
            {orders.length > 0 && (
              <div className="bg-white border border-[#424a70]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold">
                      Recent Consignment Activity
                    </span>
                    <h3 className="text-base font-serif font-medium text-[#1c2033]">
                      Latest Consignment: {orders[0].orderNumber}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      navigateToView('orders')
                      setExpandedTrackingOrderId(orders[0].id)
                      handlePerformTrack(orders[0].orderNumber)
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Live</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf9fc] border border-[#424a70]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#424a70]">
                        {orders[0].orderNumber}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${getStatusBadge(orders[0].status)}`}>
                        {orders[0].status}
                      </span>
                      {orders[0].trackingNumber && (
                        <span className="text-[10px] font-mono text-[#424a70]/80">
                          Waybill: {orders[0].trackingNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#424a70]/60 block mt-1">
                      {orders[0].items.length} piece(s) · Placed on{' '}
                      {new Date(orders[0].createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(orders[0])}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#424a70]/20 text-xs font-medium text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
                    >
                      Receipt
                    </button>
                    <button
                      onClick={() => navigateToView('orders')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#424a70]/20 text-xs font-medium text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
                    >
                      All Orders ({orders.length}) →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 1: ACQUISITIONS & CONSIGNMENTS (WITH INTEGRATED TRACKING) ================= */}
        {currentView === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-medium text-[#1c2033]">
                  Acquisitions & Consignments
                </h2>
                <p className="text-xs text-[#424a70]/70">
                  Review historical tableware orders, live courier progress, waybills, and manifests.
                </p>
              </div>

              <Link
                href="/collection"
                className="px-4 py-2 bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium rounded-xl shadow-xs hover:bg-[#4f5987] transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Acquire Pieces</span>
              </Link>
            </div>

            {/* Quick Waybill / Reference Tracker Search Bar */}
            <div className="bg-white border border-[#424a70]/15 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block">
                Track Any Consignment Waybill or Reference
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handlePerformTrack(trackingInput)
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#424a70]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter Order # (e.g. UNI-2026-0001) or Waybill (e.g. UNI-AIR-0001)"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs font-mono text-[#1c2033] focus:outline-none focus:border-[#424a70]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackingLoading || !trackingInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 shrink-0"
                >
                  {trackingLoading ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Truck className="w-3.5 h-3.5" />
                  )}
                  <span>Track Status</span>
                </button>
              </form>

              {trackingError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{trackingError}</span>
                </div>
              )}

              {/* Real-time Tracking Result View */}
              {trackingResult && (
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#424a70]">
                          {trackingResult.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${getStatusBadge(trackingResult.status)}`}>
                          {trackingResult.status}
                        </span>
                        {trackingResult.trackingNumber && (
                          <span className="text-[10px] font-mono text-[#424a70] font-semibold">
                            Waybill: {trackingResult.trackingNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#424a70]/70 block mt-0.5">
                        Carrier: {trackingResult.carrier || 'BlueDart Atelier Courier'} · Estimated: {trackingResult.estimatedDelivery || 'In 3–5 Business Days'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {trackingResult.trackingNumber && (
                        <button
                          onClick={() => handleCopyWaybill(trackingResult.trackingNumber)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#424a70]/20 text-[10px] font-mono text-[#424a70] hover:bg-[#424a70]/5 flex items-center gap-1"
                        >
                          {copiedWaybill ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedWaybill ? 'Copied' : 'Copy Waybill'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setTrackingResult(null)}
                        className="p-1 rounded-lg hover:bg-neutral-200/60 text-neutral-500"
                        title="Dismiss Tracking"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tracking Stepper */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(trackingResult.stages || [
                      { label: 'Consignment Placed', completed: true, current: trackingResult.status === 'PENDING' },
                      { label: 'Kiln Production', completed: trackingResult.status !== 'PENDING' && trackingResult.status !== 'CANCELLED', current: trackingResult.status === 'CONFIRMED' || trackingResult.status === 'PROCESSING' },
                      { label: 'Dispatched via Air', completed: trackingResult.status === 'SHIPPED' || trackingResult.status === 'DELIVERED', current: trackingResult.status === 'SHIPPED' },
                      { label: 'Delivered', completed: trackingResult.status === 'DELIVERED', current: trackingResult.status === 'DELIVERED' },
                    ]).map((stg: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 ${
                          stg.current
                            ? 'bg-blue-100/70 border-blue-300 font-semibold'
                            : stg.completed
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-[#424a70]/10 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            stg.completed
                              ? 'bg-emerald-600 !text-white [&_*]:!text-white'
                              : stg.current
                              ? 'bg-[#424a70] !text-white [&_*]:!text-white animate-pulse'
                              : 'bg-[#424a70]/10 text-[#424a70]/60'
                          }`}
                        >
                          {stg.completed ? <Check className="w-3 h-3" /> : idx + 1}
                        </div>
                        <span className="text-[10px] font-medium text-[#1c2033] leading-tight">
                          {stg.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="p-12 bg-white border border-[#424a70]/15 rounded-3xl text-center space-y-3">
                <Package className="w-10 h-10 text-[#424a70]/40 mx-auto" />
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  No Acquisitions Recorded Yet
                </h3>
                <p className="text-xs text-[#424a70]/70 max-w-sm mx-auto leading-relaxed">
                  When you acquire pieces from our permanent collection or place custom reduction tableware orders, your orders and tracking stream here.
                </p>
                <div className="pt-2">
                  <Link
                    href="/collection"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
                  >
                    <span>Explore Permanent Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const steps = [
                    { key: 'CONFIRMED', label: 'Order Confirmed' },
                    { key: 'PROCESSING', label: 'Kiln Production' },
                    { key: 'SHIPPED', label: 'Dispatched' },
                    { key: 'DELIVERED', label: 'Delivered' },
                  ]

                  const currentStepIdx =
                    order.status === 'DELIVERED'
                      ? 3
                      : order.status === 'SHIPPED'
                      ? 2
                      : order.status === 'PROCESSING'
                      ? 1
                      : 0

                  const isExpandedTracking = expandedTrackingOrderId === order.id

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-[#424a70]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 transition-all hover:border-[#424a70]/30"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#424a70]/10 pb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[#424a70]">
                              {order.orderNumber}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold">
                              Payment: {order.paymentStatus} ({order.paymentMethod})
                            </span>
                          </div>
                          <span className="text-[11px] text-[#424a70]/60 mt-1 block">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-serif font-bold text-[#1c2033] mr-2">
                            ₹{order.totalAmount.toLocaleString()}
                          </span>

                          <button
                            onClick={() => {
                              if (isExpandedTracking) {
                                setExpandedTrackingOrderId(null)
                              } else {
                                setExpandedTrackingOrderId(order.id)
                                handlePerformTrack(order.orderNumber)
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isExpandedTracking ? 'Hide Tracking' : 'Track Delivery'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#424a70]/20 text-xs font-medium text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
                          >
                            Receipt
                          </button>

                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => markOrderReceived(order.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 !text-white [&_*]:!text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              Mark Received
                            </button>
                          )}

                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Embedded Shipment Tracking Stepper */}
                      {order.status !== 'CANCELLED' && (
                        <div className="py-2.5 px-3 bg-[#424a70]/3 rounded-2xl border border-[#424a70]/8 my-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                            <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold">
                              Consignment Tracking · {order.carrier || 'BlueDart Atelier Courier'}
                            </span>
                            {order.trackingNumber && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-[#1c2033]">
                                  Waybill: {order.trackingNumber}
                                </span>
                                <button
                                  onClick={() => handleCopyWaybill(order.trackingNumber || '')}
                                  title="Copy Waybill"
                                  className="p-1 rounded hover:bg-[#424a70]/10 text-[#424a70]"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative">
                            {steps.map((step, idx) => {
                              const isComplete = idx <= currentStepIdx
                              const isCurrent = idx === currentStepIdx
                              return (
                                <div
                                  key={step.key}
                                  className="flex items-center sm:flex-col sm:text-center gap-2 sm:gap-1 p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border border-[#424a70]/10 sm:border-0"
                                >
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors ${
                                      isComplete
                                        ? 'bg-[#424a70] !text-white [&_*]:!text-white shadow-xs font-bold'
                                        : 'bg-[#424a70]/10 text-[#424a70]/60'
                                    }`}
                                  >
                                    {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[11px] font-medium leading-tight ${
                                      isCurrent
                                        ? 'text-[#424a70] font-bold'
                                        : isComplete
                                        ? 'text-[#1c2033]'
                                        : 'text-[#424a70]/60'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Expanded Tracking Details View */}
                      {isExpandedTracking && (
                        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#424a70]">
                              Live Consignment Coordinates
                            </span>
                            <span className="text-[10px] font-mono font-medium text-[#424a70]">
                              Destination: {order.shippingAddress.city}, {order.shippingAddress.state}
                            </span>
                          </div>
                          <p className="text-xs text-[#424a70]/80">
                            Consignment dispatched from UNIFORT Coastal Atelier, Chennai. Signature proof of delivery required upon arrival.
                          </p>
                          {order.status === 'DELIVERED' && (
                            <div className="pt-1 flex items-center gap-2">
                              <Link
                                href="/collection"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987]"
                              >
                                <Star className="w-3 h-3" />
                                <span>Write a Review for this Piece</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Items Preview */}
                      <div className="space-y-2 pt-2 border-t border-[#424a70]/5">
                        <span className="text-[10px] uppercase tracking-wider text-[#424a70]/60 font-semibold block">
                          Included Tableware ({order.items.length} pieces)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-2xl bg-[#faf9fc] border border-[#424a70]/10 flex items-center gap-3"
                            >
                              <div className="w-10 h-10 rounded-xl bg-white relative overflow-hidden shrink-0 border border-[#424a70]/10">
                                <Image
                                  src={item.productImage || '/products/unifort-plate-light.jpg'}
                                  alt={item.productName}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-[#1c2033] truncate">
                                  {item.productName}
                                </h4>
                                <span className="text-[10px] text-[#424a70]/70 block font-mono">
                                  Qty: {item.quantity} · ₹{item.price} each
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 2: 3D BESPOKE STUDIO PIECES ================= */}
        {currentView === 'designs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-medium text-[#1c2033]">
                  Your Saved 3D Tableware Formulations
                </h2>
                <p className="text-xs text-[#424a70]/70">
                  Custom reduction-fired stoneware, studio mineral glazes, and bespoke finishes.
                </p>
              </div>
              <Link
                href="/customize"
                className="px-4 py-2 bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium rounded-xl shadow-xs hover:bg-[#4f5987] transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New 3D Formulation</span>
              </Link>
            </div>

            {savedDesigns.length === 0 ? (
              <div className="p-12 bg-white border border-[#424a70]/15 rounded-3xl text-center space-y-3">
                <Sparkles className="w-10 h-10 text-[#424a70]/40 mx-auto" />
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  No Bespoke Formulations in Queue
                </h3>
                <p className="text-xs text-[#424a70]/70 max-w-sm mx-auto leading-relaxed">
                  Open the UNIFORT 3D Studio to apply mineral glazes, ceramic stamps, and gold decals to our core architectural silhouettes.
                </p>
                <div className="pt-2">
                  <Link
                    href="/customize"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch 3D Studio</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedDesigns.map((design) => {
                  const statusColors: Record<string, string> = {
                    DRAFT: 'bg-slate-100 text-slate-800 border border-slate-300 font-semibold',
                    SUBMITTED: 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold',
                    IN_PRODUCTION: 'bg-purple-100 text-purple-900 border border-purple-300 font-semibold',
                    COMPLETED: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold',
                  }

                  return (
                    <div
                      key={design.id}
                      className="bg-white border border-[#424a70]/15 rounded-3xl p-5 shadow-xs space-y-4 hover:border-[#424a70]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              statusColors[design.status] || 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {design.status.replace(/_/g, ' ')}
                          </span>
                          <h3 className="text-base font-serif font-medium text-[#1c2033] mt-1.5">
                            {design.title}
                          </h3>
                          <span className="text-[11px] text-[#424a70]/60 block font-mono">
                            Silhouette: {(design.modelType || 'STONEWARE').toUpperCase()} · Finish: {design.finish || 'Mineral Satin'}
                          </span>
                        </div>

                        {/* Glaze Swatches */}
                        <div className="flex items-center gap-1">
                          <div
                            className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                            style={{ backgroundColor: design.primaryGlazeColor }}
                            title={`Primary Glaze: ${design.primaryGlazeColor}`}
                          />
                          {design.accentGlazeColor && (
                            <div
                              className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                              style={{ backgroundColor: design.accentGlazeColor }}
                              title={`Accent Glaze: ${design.accentGlazeColor}`}
                            />
                          )}
                        </div>
                      </div>

                      {design.craftsmanNotes && (
                        <div className="p-3 bg-[#faf9fc] rounded-xl border border-[#424a70]/10 text-xs text-[#424a70]/80">
                          <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-0.5">
                            Ceramist Studio Notes:
                          </span>
                          <p className="italic">{design.craftsmanNotes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#424a70]/10">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setRenamingDesign(design)
                              setNewTitle(design.title)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#424a70]/20 text-[11px] font-medium text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => duplicateBespokeDesign(design.id)}
                            title="Duplicate Formulation"
                            className="p-1 rounded-lg bg-white border border-[#424a70]/20 text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBespokeDesign(design.id)}
                            title="Remove Formulation"
                            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-medium hover:bg-rose-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/customize?piece=${encodeURIComponent(design.productName)}`}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#424a70]/20 text-xs font-medium text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
                          >
                            Edit in 3D
                          </Link>
                          <button
                            onClick={() => handleOrderCustomPiece(design)}
                            className="px-3 py-1.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
                          >
                            Order Piece (₹148)
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 3: HOSPITALITY INQUIRIES ================= */}
        {currentView === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-medium text-[#1c2033]">
                  Hospitality & Trade Inquiries
                </h2>
                <p className="text-xs text-[#424a70]/70">
                  Track bespoke dinnerware quotes, restaurant commissions, and studio proposals.
                </p>
              </div>

              <Link
                href="/contact"
                className="px-4 py-2 bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium rounded-xl shadow-xs hover:bg-[#4f5987] transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Commission Inquiry</span>
              </Link>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-12 bg-white border border-[#424a70]/15 rounded-3xl text-center space-y-3">
                <Mail className="w-10 h-10 text-[#424a70]/40 mx-auto" />
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  No Inquiries on File
                </h3>
                <p className="text-xs text-[#424a70]/70 max-w-sm mx-auto leading-relaxed">
                  Planning a restaurant opening or private estate banquet suite? Our ceramists prepare custom proposals and mineral glaze samples.
                </p>
                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Studio Inquiry</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => {
                  const statusColors: Record<string, string> = {
                    NEW: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
                    IN_PROGRESS: 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold',
                    RESOLVED: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold',
                    CLOSED: 'bg-slate-100 text-slate-800 border border-slate-300 font-semibold',
                  }

                  return (
                    <div
                      key={inq.id}
                      className="bg-white border border-[#424a70]/15 rounded-3xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-mono font-semibold px-2 py-0.5 rounded-full bg-[#424a70]/10 text-[#424a70]">
                            {inq.type.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              statusColors[inq.status] || 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            Status: {inq.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#424a70]/60 font-mono">
                          {new Date(inq.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-[#1c2033]">{inq.subject}</h3>
                      <p className="text-xs text-[#424a70]/80 leading-relaxed bg-[#faf9fc] p-3 rounded-xl border border-[#424a70]/5">
                        {inq.message}
                      </p>

                      {inq.notes && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                          <span className="text-[10px] uppercase tracking-wider font-semibold block mb-0.5 text-emerald-800">
                            Atelier Response:
                          </span>
                          <p>{inq.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 4: REGISTRY & SECURITY ================= */}
        {currentView === 'profile' && (
          <div className="space-y-6">
            {!isLoggedIn ? (
              <div className="p-12 bg-white border border-[#424a70]/15 rounded-3xl text-center space-y-4">
                <Shield className="w-12 h-12 text-[#424a70] mx-auto" />
                <h3 className="text-xl font-serif font-medium text-[#1c2033]">
                  Patron Identification Required
                </h3>
                <p className="text-xs text-[#424a70]/70 max-w-md mx-auto leading-relaxed">
                  Please sign in or register your atelier account to inspect and manage your coordinates, default delivery destinations, and access passphrase keys.
                </p>
                <button
                  onClick={() => setAuthModalOpen('login')}
                  className="px-6 py-2.5 rounded-2xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
                >
                  Sign In to Patron Registry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Coordinates */}
                <div className="bg-white border border-[#424a70]/15 rounded-3xl p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-serif font-medium text-[#1c2033]">
                      Patron Identity & Coordinates
                    </h3>
                    <p className="text-xs text-[#424a70]/70">
                      Manage your personal details for consignment manifests and provenance certificates.
                    </p>
                  </div>

                  {profileSuccess && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-medium">
                      {profileSuccess}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                        Patron Full Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                        Account Email (Immutable)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={customer?.email || ''}
                        className="w-full px-3.5 py-2.5 bg-black/5 border border-[#424a70]/10 rounded-xl text-xs text-[#424a70]/60 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                        Mobile Phone Coordinates
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+91 98401 23456"
                        className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
                    >
                      Save Profile Details
                    </button>
                  </form>
                </div>

                {/* Passphrase / Security */}
                <div className="bg-white border border-[#424a70]/15 rounded-3xl p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-serif font-medium text-[#1c2033]">
                      Atelier Passphrase Security
                    </h3>
                    <p className="text-xs text-[#424a70]/70">
                      Update your authentication key for secure patron account access.
                    </p>
                  </div>

                  {passSuccess && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-medium">
                      {passSuccess}
                    </div>
                  )}
                  {passError && (
                    <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 text-xs rounded-xl font-medium">
                      {passError}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                        Current Passphrase
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                        New Passphrase
                      </label>
                      <input
                        type="password"
                        required
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
                    >
                      Update Passphrase
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= ORDER DETAILS RECEIPT MODAL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white border border-[#424a70]/15 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors"
              aria-label="Close Manifest"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] uppercase tracking-[0.2em] text-[#424a70] font-semibold block mb-1">
              Atelier Consignment Manifest
            </span>
            <h2 className="text-xl font-serif font-medium text-[#1c2033] mb-1">
              Order {selectedOrder.orderNumber}
            </h2>
            <p className="text-xs text-[#424a70]/70 mb-4 font-mono">
              Status: {selectedOrder.status} · Payment: {selectedOrder.paymentStatus}
            </p>

            <div className="space-y-4 text-xs">
              {/* Shipping Destination */}
              <div className="p-3.5 bg-[#faf9fc] rounded-2xl border border-[#424a70]/10">
                <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-1">
                  Delivery Destination
                </span>
                <p className="font-semibold text-[#1c2033]">{selectedOrder.shippingAddress?.fullName}</p>
                <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                {selectedOrder.shippingAddress?.addressLine2 && (
                  <p>{selectedOrder.shippingAddress?.addressLine2}</p>
                )}
                <p>
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                  {selectedOrder.shippingAddress?.postalCode}
                </p>
                <p>{selectedOrder.shippingAddress?.country || 'India'}</p>
              </div>

              {/* Items List */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-2">
                  Purchased Tableware ({selectedOrder.items?.length || 0})
                </span>
                <div className="divide-y divide-[#424a70]/10 border border-[#424a70]/10 rounded-2xl overflow-hidden">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <span className="font-semibold text-[#1c2033] block">{it.productName}</span>
                        <span className="text-[10px] text-[#424a70]/60">Qty: {it.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-[#424a70]">
                        ₹{(it.price * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-[#424a70]/10 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#1c2033]">Total Invoiced</span>
                <span className="font-serif font-bold text-lg text-[#424a70]">
                  ₹{selectedOrder.totalAmount?.toLocaleString()}
                </span>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => {
                    const ordNum = selectedOrder.orderNumber
                    setSelectedOrder(null)
                    navigateToView('orders')
                    setTrackingInput(ordNum)
                    handlePerformTrack(ordNum)
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track Live Consignment</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-2.5 rounded-xl bg-white border border-[#424a70]/20 text-xs font-medium text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RENAME DESIGN MODAL ================= */}
      {renamingDesign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={() => setRenamingDesign(null)}
        >
          <div
            className="w-full max-w-sm bg-white border border-[#424a70]/15 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-serif font-medium text-[#1c2033]">
              Rename Bespoke Formulation
            </h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRenamingDesign(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-1.5 rounded-xl bg-[#424a70] !text-white [&_*]:!text-white text-xs font-medium hover:bg-[#4f5987] transition-all shadow-xs"
              >
                Save Title
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
