'use client'

import React, { useState } from 'react'
import {
  ShoppingBag,
  Search,
  Eye,
  Plus,
  X,
  Sparkles,
  FileText,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { OrderRecord, OrderStatus, PaymentStatus } from '../admin-types'

export function OrdersView() {
  const { canManageOrders } = useAdminAuth()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const statusOptions: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'SHIPPED', label: 'Shipped' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ]

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    const matchesPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.user && o.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.shippingAddress.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shippingAddress.city.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesPayment && matchesSearch
  })


  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!selectedOrder) return
    const updated: OrderRecord = {
      ...selectedOrder,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }
    setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)))
    setSelectedOrder(updated)
  }

  const handleUpdatePayment = (newPayment: PaymentStatus) => {
    if (!selectedOrder) return
    const updated: OrderRecord = {
      ...selectedOrder,
      paymentStatus: newPayment,
      updatedAt: new Date().toISOString(),
    }
    setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)))
    setSelectedOrder(updated)
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
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statusOptions.map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                    : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, city..."
            className="w-full pl-9 pr-3 py-1.5 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] transition-colors"
          />
        </div>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <ShoppingBag className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Orders Received</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            {statusFilter === 'ALL'
              ? 'No patron orders currently exist in the database. When customer orders are submitted, they will appear here with bespoke design links and fulfillment tools.'
              : `No orders found matching status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border text-xs adm-text-secondary">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="adm-table-hover transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium adm-text-primary">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium adm-text-primary">
                        {order.shippingAddress.fullName}
                      </span>
                      <span className="text-[10px] adm-text-muted font-mono">{order.user?.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="adm-text-secondary">{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold adm-text-primary">
                    ₹{order.totalAmount}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
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
                          : order.status === 'PROCESSING'
                          ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
                          : order.status === 'CONFIRMED'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
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
                      className="px-2.5 py-1.5 rounded-lg adm-card adm-border adm-text-secondary hover:adm-text-primary text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details & Management Drawer / Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-300 font-medium font-mono">
                  {selectedOrder.orderNumber}
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">
                  Order Fulfillment & Production Manifest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Order Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 adm-card-subtle border adm-border rounded-xl">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Fulfillment Status
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => handleUpdatePayment(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>

              {/* Items in this order */}
              <div>
                <h4 className="text-xs uppercase tracking-wider adm-text-muted font-medium mb-2.5">
                  Purchased Items ({selectedOrder.items.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 adm-card-subtle border adm-border rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border adm-border flex items-center justify-center">
                          {item.customDesignId ? (
                            <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                          ) : (
                            <FileText className="w-4 h-4 adm-text-muted" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium adm-text-primary block">
                            {item.product?.name || 'Tableware Piece'}
                          </span>
                          <span className="text-[10px] adm-text-muted font-mono">
                            Qty: {item.quantity} · SKU: {item.product?.sku}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono adm-text-primary font-semibold">₹{item.unitPrice}</span>
                        {item.customDesignId && (
                          <span className="block text-[9px] uppercase tracking-wider text-purple-600 dark:text-purple-300 font-medium">
                            300 DPI Custom Piece
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address & Customer Care Notes (Strictly non-italic) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 adm-card-subtle border adm-border rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider adm-text-muted block mb-1">
                    Shipping Destination
                  </span>
                  <div className="adm-text-secondary leading-relaxed">
                    <p className="font-medium adm-text-primary">{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.addressLine1}</p>
                    <p>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>

                <div className="p-3.5 adm-card-subtle border adm-border rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider adm-text-muted block mb-1">
                    Customer Care Notes
                  </span>
                  <p className="adm-text-secondary not-italic text-xs leading-relaxed">
                    {selectedOrder.customerNotes || 'No special instructions provided by customer.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t adm-border flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs cursor-pointer"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
