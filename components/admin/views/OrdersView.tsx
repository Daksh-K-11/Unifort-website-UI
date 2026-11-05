'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShoppingBag,
  Search,
  Eye,
  Plus,
  X,
  Sparkles,
  FileText,
  Clock,
  Filter,
  RefreshCw,
  Truck,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { OrderRecord } from '../admin-types'
import { api } from '../../../lib/api-client'
import { OrderDetailModal, mapAdminOrder } from './OrderDetailModal'
import { useDebounced, Spinner } from '../admin-ui'
import { AdminPagination } from '../AdminPagination'


export function OrdersView() {
  const { canManageOrders } = useAdminAuth()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL')
  const [bespokeFilter, setBespokeFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<string>('ALL')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const debouncedSearch = useDebounced(searchQuery)

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Calculate ISO date strings based on timeRange preset
  const getDateRangeParams = useCallback(() => {
    const now = new Date()
    let startDate: string | undefined = undefined
    let endDate: string | undefined = undefined

    if (timeRange === 'TODAY') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      startDate = today.toISOString()
    } else if (timeRange === '24H') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    } else if (timeRange === '7D') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeRange === '30D') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeRange === 'CUSTOM') {
      if (customStartDate) startDate = new Date(customStartDate).toISOString()
      if (customEndDate) {
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        endDate = end.toISOString()
      }
    }

    return { startDate, endDate }
  }, [timeRange, customStartDate, customEndDate])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRangeParams()
      const queryParams = new URLSearchParams()

      queryParams.set('page', String(page))
      queryParams.set('limit', String(limit))
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter)
      if (paymentFilter !== 'ALL') queryParams.set('paymentStatus', paymentFilter)
      if (bespokeFilter === 'BESPOKE_ONLY') queryParams.set('hasBespoke', 'true')
      if (bespokeFilter === 'STANDARD_ONLY') queryParams.set('hasBespoke', 'false')
      if (debouncedSearch.trim()) queryParams.set('search', debouncedSearch.trim())
      if (startDate) queryParams.set('startDate', startDate)
      if (endDate) queryParams.set('endDate', endDate)
      queryParams.set('sortBy', sortBy)

      const res = await api.get(`/orders/admin/all?${queryParams.toString()}`)

      if (res.success && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data.orders || [])
        const mapped: OrderRecord[] = rawList.map(mapAdminOrder)

        setOrders(mapped)

        // Pagination metadata
        if (res.pagination) {
          setPagination({
            total: res.pagination.total,
            totalPages: res.pagination.totalPages || Math.ceil(res.pagination.total / limit) || 1,
          })
        } else if (res.meta) {
          setPagination({
            total: res.meta.total || mapped.length,
            totalPages: res.meta.totalPages || Math.ceil((res.meta.total || mapped.length) / limit) || 1,
          })
        } else {
          setPagination({
            total: mapped.length,
            totalPages: Math.ceil(mapped.length / limit) || 1,
          })
        }
      }
    } catch (e) {
      console.error('Failed to fetch admin orders', e)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    limit,
    statusFilter,
    paymentFilter,
    bespokeFilter,
    debouncedSearch,
    getDateRangeParams,
    sortBy,
  ])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleOrderUpdated = (updated: OrderRecord) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setSelectedOrder(updated)
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'ALL') count++
    if (paymentFilter !== 'ALL') count++
    if (bespokeFilter !== 'ALL') count++
    if (timeRange !== 'ALL') count++
    if (searchQuery.trim()) count++
    return count
  }, [statusFilter, paymentFilter, bespokeFilter, timeRange, searchQuery])

  // Reset all filters
  const handleResetFilters = () => {
    setStatusFilter('ALL')
    setPaymentFilter('ALL')
    setBespokeFilter('ALL')
    setTimeRange('ALL')
    setCustomStartDate('')
    setCustomEndDate('')
    setSortBy('newest')
    setSearchQuery('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Customer Orders & Fulfillment
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Real-time orders pipeline, bespoke production snapshots, and delivery dispatching.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-medium adm-card border adm-border adm-text-primary hover:bg-[#424a70]/10 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-2xs"
          title="Refresh orders pipeline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="adm-card border adm-border rounded-2xl p-4 shadow-sm space-y-3.5">
        {/* Row 1: Search + Mobile Filter Toggle */}
        <div className="flex items-center gap-2">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search order #, customer, city..."
              className="w-full pl-9 pr-8 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`sm:hidden px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              showMobileFilters || activeFilterCount > 0
                ? 'tab-active !bg-[#424a70] !text-white border-[#424a70]'
                : 'adm-card border adm-border adm-text-secondary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="badge-count w-4 h-4 rounded-full !bg-white !text-[#424a70] text-[10px] font-bold flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Dropdowns: Collapsible on Mobile, Grid on Tablet/Desktop */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-3 gap-2.5`}>
          {/* Fulfillment Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Fulfillment Statuses</option>
              <option value="PENDING">PENDING (Awaiting online payment)</option>
              <option value="CONFIRMED">CONFIRMED (Queued for Atelier)</option>
              <option value="PROCESSING">PROCESSING (Tactile Quality Check)</option>
              <option value="SHIPPED">SHIPPED (In Transit)</option>
              <option value="DELIVERED">DELIVERED (Fulfilled)</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">PAID (Settled)</option>
              <option value="PENDING">PENDING (Awaiting Settlement)</option>
              <option value="FAILED">FAILED (Declined)</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          {/* Bespoke / Standard Piece Filter */}
          <div className="relative">
            <select
              value={bespokeFilter}
              onChange={(e) => {
                setBespokeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Order Types</option>
              <option value="BESPOKE_ONLY">Contains 3D Bespoke Pieces</option>
              <option value="STANDARD_ONLY">Standard Catalog Orders</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date & Time Filters + Sort Order + Active Filter Badges (Collapsible on Mobile) */}
        <div className={`${showMobileFilters ? 'flex' : 'hidden sm:flex'} flex-wrap items-center justify-between gap-2.5 pt-2 border-t adm-border`}>
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] adm-text-muted font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time:
              </span>
              <select
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="24H">Past 24 Hours</option>
                <option value="7D">Past 7 Days</option>
                <option value="30D">Past 30 Days</option>
                <option value="CUSTOM">Custom Date Range...</option>
              </select>
            </div>

            {/* Custom Date Inputs if CUSTOM selected */}
            {timeRange === 'CUSTOM' && (
              <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-lg border adm-border">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value)
                    setPage(1)
                  }}
                  className="px-2 py-1 adm-input border rounded text-xs adm-text-primary"
                  title="Start Date"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value)
                    setPage(1)
                  }}
                  className="px-2 py-1 adm-input border rounded text-xs adm-text-primary"
                  title="End Date"
                />
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 border-l adm-border pl-2.5">
              <span className="text-[11px] adm-text-muted font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_desc">Highest Total</option>
                <option value="amount_asc">Lowest Total</option>
              </select>
            </div>
          </div>

          {/* Active Filter Counter & Reset */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#424a70] dark:text-indigo-400 font-medium">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs rounded-lg border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#424a70]/10 text-[#424a70] dark:text-[#a0aadb] border border-[#424a70]/20">
                Fulfillment: {statusFilter}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {paymentFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Payment: {paymentFilter}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentFilter('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {bespokeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                Type: {bespokeFilter === 'BESPOKE_ONLY' ? '3D Bespoke' : 'Standard'}
                <button
                  type="button"
                  onClick={() => {
                    setBespokeFilter('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {timeRange !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Time: {timeRange}
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                Search: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Orders List / Empty State */}
      {loading && orders.length === 0 ? (
        <div className="adm-card border adm-border rounded-2xl"><Spinner /></div>
      ) : orders.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <ShoppingBag className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Orders Found</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            {activeFilterCount > 0
              ? 'No patron orders match the selected filters. Try widening your criteria or reset filters.'
              : 'When patron orders are placed, they will appear here with bespoke design links, consignment tracking, and fulfillment tools.'}
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-3 py-1.5 rounded-lg border adm-border text-xs font-medium adm-text-primary hover:bg-[#424a70]/10 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Consignment Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y adm-border text-xs adm-text-secondary">
                {orders.map((order) => {
                  const hasCustomItem = order.items.some((it) => !!it.customDesignId)
                  const orderDate = order.createdAt ? new Date(order.createdAt) : null
                  return (
                    <tr key={order.id} className="adm-table-hover transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium adm-text-primary">
                        <div className="flex flex-col">
                          <span className="font-semibold">{order.orderNumber}</span>
                          {orderDate && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {orderDate.toLocaleDateString()} {orderDate.toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium adm-text-primary">
                            {order.shippingAddress.fullName}
                          </span>
                          <span className="text-[10px] adm-text-muted font-mono">{order.customerEmail}{order.userId ? '' : ' · guest'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="adm-text-secondary">
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium adm-text-primary">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </span>
                          {hasCustomItem && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              <Sparkles className="w-2.5 h-2.5" /> 3D Bespoke
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold adm-text-primary">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                        <span className="block text-[9px] adm-text-muted font-sans font-normal">{order.paymentMethod === 'COD' ? 'COD' : 'Online'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : order.paymentStatus === 'FAILED'
                              ? 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
                              : order.status === 'PROCESSING'
                              ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
                              : order.status === 'CONFIRMED'
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300'
                              : 'bg-black/5 dark:bg-white/5 adm-border adm-text-muted'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsDetailsModalOpen(true)
                          }}
                          className="px-2.5 py-1.5 rounded-lg adm-card adm-border adm-text-secondary hover:adm-text-primary text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#424a70] dark:text-indigo-400" />
                          <span>Manifest</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Reusable Pagination */}
          <AdminPagination
            page={page}
            limit={limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l)
              setPage(1)
            }}
            itemName="orders"
          />
        </div>
      )}

      {isDetailsModalOpen && selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setIsDetailsModalOpen(false)} onUpdated={handleOrderUpdated} />
      )}
    </div>
  )
}
