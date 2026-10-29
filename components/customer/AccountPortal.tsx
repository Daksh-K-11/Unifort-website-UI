'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  LogOut,
  MapPin,
  Lock,
  Phone,
  Copy,
  Plus,
  AlertCircle,
  X,
} from 'lucide-react'
import { useCustomer } from '@/lib/customer-context'
import { useBag } from '@/lib/bag-context'
import { CustomerOrder, CustomerSavedDesign, CustomerInquiry } from '@/lib/customer-types'
import { UnifortButton } from '@/components/ui/UnifortButton'

export function AccountPortal() {
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
  } = useCustomer()

  const { addToBag, setIsBagOpen, setToastMessage } = useBag()

  const [activeTab, setActiveTab] = useState<'orders' | 'designs' | 'inquiries' | 'profile'>('orders')
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null)
  const [selectedDesign, setSelectedDesign] = useState<CustomerSavedDesign | null>(null)

  // Profile Form State
  const [profileName, setProfileName] = useState(customer?.name || '')
  const [profilePhone, setProfilePhone] = useState(customer?.phone || '')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Password Form State
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [passError, setPassError] = useState('')

  // Rename design modal state
  const [renamingDesign, setRenamingDesign] = useState<CustomerSavedDesign | null>(null)
  const [newTitle, setNewTitle] = useState('')

  if (!isLoggedIn || !customer) {
    return (
      <main className="page min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-6 sm:p-8 bg-[#faf9fc] border border-[#424a70]/15 rounded-3xl shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#424a70]/10 flex items-center justify-center text-[#424a70]">
            <User className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#424a70] font-semibold block mb-1">
            Atelier Portal
          </span>
          <h1 className="text-2xl font-serif font-medium text-[#1c2033] mb-2">
            Patron Identification Required
          </h1>
          <p className="text-xs text-[#424a70]/70 mb-6 leading-relaxed">
            Please sign in to inspect your tableware acquisitions, track courier consignments, manage custom glazes, and review hospitality commissions.
          </p>
          <UnifortButton
            variant="primary"
            size="md"
            fullWidth
            onClick={() => setAuthModalOpen('login')}
          >
            Sign In to Atelier Account
          </UnifortButton>
        </div>
      </main>
    )
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
      type: `${design.modelType.toUpperCase()} · Handcrafted Glaze · ${design.finish}`,
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

  return (
    <main className="page min-h-screen bg-[#faf9fc] text-[#1c2033] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ================= PATRON WELCOME BANNER ================= */}
        <section className="bg-white border border-[#424a70]/12 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#424a70]/10 border border-[#424a70]/20 flex items-center justify-center text-[#424a70] text-xl font-serif font-medium shrink-0">
              {customer.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#424a70]">
                  Patron Registry · UNIFORT
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-mono font-medium">
                  Active Member
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#1c2033] mt-0.5">
                {customer.name}
              </h1>
              <p className="text-xs text-[#424a70]/70 mt-0.5">
                {customer.email} · {customer.phone || 'No phone recorded'}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Logout */}
          <div className="flex items-center gap-3 sm:gap-4 self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-[#424a70]/5 border border-[#424a70]/10 text-center">
              <span className="block text-base font-serif font-semibold text-[#424a70]">
                {orders.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#424a70]/70">
                Orders
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#424a70]/5 border border-[#424a70]/10 text-center">
              <span className="block text-base font-serif font-semibold text-[#424a70]">
                {savedDesigns.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#424a70]/70">
                Bespoke
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#424a70]/5 border border-[#424a70]/10 text-center">
              <span className="block text-base font-serif font-semibold text-[#424a70]">
                {inquiries.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#424a70]/70">
                Quotes
              </span>
            </div>

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
          </div>
        </section>

        {/* ================= NAVIGATION TABS ================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#424a70]/12 -mx-2 px-2 sm:mx-0 sm:px-0">
          <UnifortButton
            variant="tab"
            active={activeTab === 'orders'}
            size="sm"
            icon={<Package className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab('orders')}
          >
            Orders & Consignments ({orders.length})
          </UnifortButton>

          <UnifortButton
            variant="tab"
            active={activeTab === 'designs'}
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab('designs')}
          >
            Bespoke 3D Designs ({savedDesigns.length})
          </UnifortButton>

          <UnifortButton
            variant="tab"
            active={activeTab === 'inquiries'}
            size="sm"
            icon={<Mail className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab('inquiries')}
          >
            Hospitality Quotes ({inquiries.length})
          </UnifortButton>

          <UnifortButton
            variant="tab"
            active={activeTab === 'profile'}
            size="sm"
            icon={<User className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab('profile')}
          >
            Profile & Security
          </UnifortButton>
        </div>

        {/* ================= TAB 1: ORDERS & TRACKING ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 bg-white border border-[#424a70]/12 rounded-3xl text-center">
                <Package className="w-8 h-8 text-[#424a70]/40 mx-auto mb-3" />
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  No Acquisitions Recorded Yet
                </h3>
                <p className="text-xs text-[#424a70]/70 max-w-sm mx-auto mt-1 mb-4">
                  When you acquire pieces from our permanent collection or order bespoke reduction-fired tableware, your consignment history and live shipment tracking will stream here.
                </p>
                <UnifortButton
                  variant="primary"
                  size="sm"
                  href="/collection"
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                  iconPosition="end"
                >
                  Explore the Collection
                </UnifortButton>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
                    CONFIRMED: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
                    PROCESSING: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
                    SHIPPED: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
                    DELIVERED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
                    CANCELLED: 'bg-red-500/10 text-red-700 border-red-500/20',
                  }

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

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-[#424a70]/12 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-all hover:border-[#424a70]/25"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#424a70]/10 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#424a70]">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                                statusColors[order.status] || ''
                              }`}
                            >
                              {order.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700">
                              Payment: {order.paymentStatus} ({order.paymentMethod})
                            </span>
                          </div>
                          <span className="text-[11px] text-[#424a70]/60 mt-0.5 block">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-serif font-semibold text-[#1c2033] mr-2">
                            ₹{order.totalAmount.toLocaleString()}
                          </span>
                          <UnifortButton
                            variant="outline"
                            size="xs"
                            href={`/track?order=${order.orderNumber}`}
                            icon={<Truck className="w-3 h-3" />}
                          >
                            Track Delivery
                          </UnifortButton>
                          <UnifortButton
                            variant="outline"
                            size="xs"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Receipt
                          </UnifortButton>
                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <UnifortButton
                              variant="primary"
                              size="xs"
                              onClick={() => markOrderReceived(order.id)}
                            >
                              Mark Received
                            </UnifortButton>
                          )}
                          {order.status === 'PENDING' && (
                            <UnifortButton
                              variant="danger-outline"
                              size="xs"
                              onClick={() => cancelOrder(order.id)}
                            >
                              Cancel
                            </UnifortButton>
                          )}
                        </div>
                      </div>

                      {/* Shipment Tracking Progress Bar */}
                      {order.status !== 'CANCELLED' && (
                        <div className="py-2.5 px-3 bg-[#424a70]/3 rounded-2xl border border-[#424a70]/8 my-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                            <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold">
                              Consignment Tracking · {order.carrier || 'Atelier Direct'}
                            </span>
                            {order.trackingNumber && (
                              <span className="text-[10px] font-mono font-medium text-[#1c2033]">
                                Waybill: {order.trackingNumber}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative">
                            {steps.map((step, idx) => {
                              const isComplete = idx <= currentStepIdx
                              const isCurrent = idx === currentStepIdx
                              return (
                                <div key={step.key} className="flex items-center sm:flex-col sm:text-center gap-2 sm:gap-1 p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border border-[#424a70]/10 sm:border-0">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors ${
                                      isComplete
                                        ? 'bg-[#424a70] text-white shadow-xs font-semibold'
                                        : 'bg-[#424a70]/10 text-[#424a70]/60'
                                    }`}
                                  >
                                    {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[11px] font-medium leading-tight ${
                                      isCurrent
                                        ? 'text-[#424a70] font-semibold'
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
                                <h4 className="text-xs font-medium text-[#1c2033] truncate">
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

        {/* ================= TAB 2: BESPOKE 3D DESIGNS ================= */}
        {activeTab === 'designs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-medium text-[#1c2033]">
                  Your Saved 3D Tableware Creations
                </h2>
                <p className="text-xs text-[#424a70]/70">
                  Custom reduction-fired stoneware formulations, custom glazes, and decals.
                </p>
              </div>
              <Link
                href="/customize"
                className="px-3.5 py-2 bg-[#424a70] text-white text-xs font-medium rounded-xl shadow-sm hover:bg-[#4f5987] transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New 3D Formulation</span>
              </Link>
            </div>

            {savedDesigns.length === 0 ? (
              <div className="p-12 bg-white border border-[#424a70]/12 rounded-3xl text-center">
                <Sparkles className="w-8 h-8 text-[#424a70]/40 mx-auto mb-3" />
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  No Bespoke Formulations in Queue
                </h3>
                <p className="text-xs text-[#424a70]/70 max-w-sm mx-auto mt-1 mb-4">
                  Open the UNIFORT 3D Studio to apply mineral glazes, ceramic stamps, and gold decals to our core silhouettes.
                </p>
                <UnifortButton
                  variant="primary"
                  size="sm"
                  href="/customize"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Launch 3D Studio
                </UnifortButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedDesigns.map((design) => {
                  const statusColors: Record<string, string> = {
                    DRAFT: 'bg-slate-500/10 text-slate-700',
                    SUBMITTED: 'bg-blue-500/10 text-blue-700',
                    IN_PRODUCTION: 'bg-purple-500/10 text-purple-700',
                    COMPLETED: 'bg-emerald-500/10 text-emerald-700',
                  }

                  return (
                    <div
                      key={design.id}
                      className="bg-white border border-[#424a70]/12 rounded-3xl p-5 shadow-sm space-y-4 hover:border-[#424a70]/25 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                              statusColors[design.status]
                            }`}
                          >
                            {design.status.replace(/_/g, ' ')}
                          </span>
                          <h3 className="text-base font-serif font-medium text-[#1c2033] mt-1.5">
                            {design.title}
                          </h3>
                          <span className="text-[11px] text-[#424a70]/60 block font-mono">
                            Silhouette: {design.modelType.toUpperCase()} · Finish: {design.finish}
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
                          <UnifortButton
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setRenamingDesign(design)
                              setNewTitle(design.title)
                            }}
                          >
                            Rename
                          </UnifortButton>
                          <UnifortButton
                            variant="outline"
                            size="xs"
                            icon={<Copy className="w-3 h-3" />}
                            onClick={() => duplicateBespokeDesign(design.id)}
                            title="Duplicate Formulation"
                          />
                          <UnifortButton
                            variant="danger-outline"
                            size="xs"
                            onClick={() => deleteBespokeDesign(design.id)}
                            title="Remove Formulation"
                          >
                            Delete
                          </UnifortButton>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <UnifortButton
                            variant="outline"
                            size="xs"
                            href={`/customize?piece=${encodeURIComponent(design.productName)}`}
                          >
                            Edit in 3D
                          </UnifortButton>
                          <UnifortButton
                            variant="primary"
                            size="xs"
                            onClick={() => handleOrderCustomPiece(design)}
                          >
                            Order Piece (₹148)
                          </UnifortButton>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: HOSPITALITY INQUIRIES ================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-medium text-[#1c2033]">
                  Hospitality & Bespoke Quotes
                </h2>
                <p className="text-xs text-[#424a70]/70">
                  Track bespoke dinnerware commission quotes, restaurant suites, and custom stamping requests.
                </p>
              </div>
              <UnifortButton
                variant="primary"
                size="sm"
                href="/contact"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Commission Inquiry
              </UnifortButton>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-12 bg-white border border-[#424a70]/12 rounded-3xl text-center">
                <Mail className="w-8 h-8 text-[#424a70]/40 mx-auto mb-3" />
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  No Inquiries on File
                </h3>
                <p className="text-xs text-[#424a70]/70 max-w-sm mx-auto mt-1 mb-4">
                  Planning a restaurant opening or private estate banquet suite? Our ceramists prepare custom proposals and mineral glaze samples.
                </p>
                <UnifortButton
                  variant="primary"
                  size="sm"
                  href="/contact"
                  icon={<Mail className="w-3.5 h-3.5" />}
                >
                  Send Studio Inquiry
                </UnifortButton>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => {
                  const statusColors: Record<string, string> = {
                    NEW: 'bg-amber-500/10 text-amber-700',
                    IN_PROGRESS: 'bg-blue-500/10 text-blue-700',
                    RESOLVED: 'bg-emerald-500/10 text-emerald-700',
                    CLOSED: 'bg-slate-500/10 text-slate-700',
                  }

                  return (
                    <div
                      key={inq.id}
                      className="bg-white border border-[#424a70]/12 rounded-3xl p-5 shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-mono font-semibold px-2 py-0.5 rounded-full bg-[#424a70]/10 text-[#424a70]">
                            {inq.type.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                              statusColors[inq.status]
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

                      <h3 className="text-sm font-medium text-[#1c2033]">{inq.subject}</h3>
                      <p className="text-xs text-[#424a70]/80 leading-relaxed bg-[#faf9fc] p-3 rounded-xl border border-[#424a70]/5">
                        {inq.message}
                      </p>

                      {inq.notes && (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-800">
                          <span className="text-[10px] uppercase tracking-wider font-semibold block mb-0.5">
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

        {/* ================= TAB 4: PROFILE & SECURITY ================= */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="bg-white border border-[#424a70]/12 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  Patron Identity & Coordinates
                </h3>
                <p className="text-xs text-[#424a70]/70">
                  Manage your personal details for provenance certificates and consignments.
                </p>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs rounded-xl">
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
                    value={customer.email}
                    className="w-full px-3.5 py-2.5 bg-black/5 border border-[#424a70]/10 rounded-xl text-xs text-[#424a70]/60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full px-3.5 py-2.5 bg-[#faf9fc] border border-[#424a70]/20 rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  />
                </div>

                <UnifortButton
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  Save Profile Details
                </UnifortButton>
              </form>
            </div>

            {/* Passphrase / Security */}
            <div className="bg-white border border-[#424a70]/12 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-serif font-medium text-[#1c2033]">
                  Atelier Passphrase Security
                </h3>
                <p className="text-xs text-[#424a70]/70">
                  Update your authentication key for secure patron account access.
                </p>
              </div>

              {passSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs rounded-xl">
                  {passSuccess}
                </div>
              )}
              {passError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl">
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

                <UnifortButton
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  Update Passphrase
                </UnifortButton>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white border border-[#424a70]/15 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <UnifortButton
              variant="icon"
              size="xs"
              rounded="full"
              icon={<X className="w-4 h-4" />}
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5"
              ariaLabel="Close Manifest"
            />

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
                <p className="font-medium text-[#1c2033]">{selectedOrder.shippingAddress.fullName}</p>
                <p>{selectedOrder.shippingAddress.addressLine1}</p>
                {selectedOrder.shippingAddress.addressLine2 && (
                  <p>{selectedOrder.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                  {selectedOrder.shippingAddress.postalCode}
                </p>
                <p>{selectedOrder.shippingAddress.country}</p>
              </div>

              {/* Items List */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-2">
                  Purchased Tableware ({selectedOrder.items.length})
                </span>
                <div className="divide-y divide-[#424a70]/10 border border-[#424a70]/10 rounded-2xl overflow-hidden">
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <span className="font-medium text-[#1c2033] block">{it.productName}</span>
                        <span className="text-[10px] text-[#424a70]/60">Qty: {it.quantity}</span>
                      </div>
                      <span className="font-mono font-medium text-[#424a70]">
                        ₹{(it.price * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Care Notes */}
              {selectedOrder.customerNotes && (
                <div className="p-3 bg-[#faf9fc] rounded-2xl border border-[#424a70]/10">
                  <span className="text-[10px] uppercase tracking-wider text-[#424a70] font-semibold block mb-0.5">
                    Patron Special Instructions:
                  </span>
                  <p className="italic text-[#424a70]/80">{selectedOrder.customerNotes}</p>
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-3 border-t border-[#424a70]/10 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#1c2033]">Total Invoiced</span>
                <span className="font-serif font-bold text-lg text-[#424a70]">
                  ₹{selectedOrder.totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
                <UnifortButton
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => alert(`Official UNIFORT invoice manifest generated for order ${selectedOrder.orderNumber}`)}
                >
                  Download Manifest
                </UnifortButton>
                <UnifortButton
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </UnifortButton>
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
              <UnifortButton
                variant="ghost"
                size="sm"
                onClick={() => setRenamingDesign(null)}
              >
                Cancel
              </UnifortButton>
              <UnifortButton
                variant="primary"
                size="sm"
                onClick={handleSaveRename}
              >
                Save Title
              </UnifortButton>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
