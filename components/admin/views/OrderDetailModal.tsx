'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Printer, Sparkles, Download } from 'lucide-react'
import { api, formatINR, mediaUrl } from '@/lib/api-client'
import { useAdminAuth } from '../admin-auth-context'
import { OrderRecord, OrderStatus } from '../admin-types'
import { AdminModal, Field, inputCls, notify, confirmAction } from '../admin-ui'

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export function mapAdminOrder(o: any): OrderRecord {
  const a = o.shippingAddress || {}
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    userId: o.userId,
    user: o.user ? { name: `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim(), email: o.user.email } : undefined,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    subtotal: Number(o.subtotal || 0),
    discount: Number(o.discount || 0),
    shippingFee: Number(o.shippingFee || 0),
    tax: Number(o.tax || 0),
    totalAmount: Number(o.totalAmount || 0),
    refundedAmount: Number(o.refundedAmount || 0),
    couponCode: o.couponCode,
    currency: o.currency || 'INR',
    shippingAddress: {
      fullName: a.recipientName || o.customerName,
      phone: a.phone,
      addressLine1: a.addressLine1 || '',
      addressLine2: a.addressLine2 || '',
      city: a.city || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || 'India',
    },
    customerNotes: o.notes || undefined,
    staffNotes: o.staffNotes,
    carrier: o.carrier,
    trackingNumber: o.trackingNumber,
    razorpayPaymentId: o.razorpayPaymentId,
    allowedNextStatuses: o.allowedNextStatuses || [],
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    cancelledAt: o.cancelledAt,
    cancelReason: o.cancelReason,
    updatedAt: o.updatedAt,
    items: (o.items || []).map((it: any) => ({
      id: it.id,
      productId: it.productId,
      product: { name: it.productName, sku: it.productSku || it.product?.sku || '—', price: Number(it.price || 0) },
      quantity: it.quantity,
      unitPrice: Number(it.price || 0),
      customDesignId: it.customDesignId || undefined,
      customSnapshotUrl: it.customSnapshotUrl || it.customDesign?.thumbnailUrl || undefined,
      productionSpec: it.productionSpec,
    })),
  }
}

function printDocument(order: OrderRecord, kind: 'invoice' | 'packing') {
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
  const a = order.shippingAddress
  const rows = order.items
    .map(
      (i) =>
        `<tr><td>${esc(i.product?.name)}</td><td>${esc(i.product?.sku)}</td><td style="text-align:center">${i.quantity}</td>${
          kind === 'invoice' ? `<td style="text-align:right">${formatINR(i.unitPrice)}</td><td style="text-align:right">${formatINR(i.unitPrice * i.quantity)}</td>` : '<td>☐</td>'
        }</tr>`
    )
    .join('')
  w.document.write(`<!doctype html><html><head><title>${kind === 'invoice' ? 'Invoice' : 'Packing slip'} ${esc(order.orderNumber)}</title>
  <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:8px;font-size:13px;text-align:left}.tot td{border:0}</style></head><body>
  <h1>UNIFORT Tableware — ${kind === 'invoice' ? 'Tax invoice' : 'Packing slip'}</h1>
  <p>Order <b>${esc(order.orderNumber)}</b> · ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
  <p><b>Ship to:</b><br>${esc(a.fullName)}<br>${esc(a.addressLine1)}${a.addressLine2 ? `, ${esc(a.addressLine2)}` : ''}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.postalCode)}<br>${esc(a.phone || order.customerPhone || '')}</p>
  <table><thead><tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th>${kind === 'invoice' ? '<th style="text-align:right">Unit</th><th style="text-align:right">Total</th>' : '<th>Packed</th>'}</tr></thead><tbody>${rows}</tbody></table>
  ${
    kind === 'invoice'
      ? `<table class="tot" style="width:280px;margin-left:auto"><tr><td>Subtotal</td><td style="text-align:right">${formatINR(order.subtotal)}</td></tr>${
          order.discount ? `<tr><td>Discount</td><td style="text-align:right">-${formatINR(order.discount)}</td></tr>` : ''
        }<tr><td>Shipping</td><td style="text-align:right">${formatINR(order.shippingFee)}</td></tr><tr><td>GST</td><td style="text-align:right">${formatINR(order.tax)}</td></tr><tr><td><b>Total</b></td><td style="text-align:right"><b>${formatINR(order.totalAmount)}</b></td></tr></table>
         <p style="font-size:11px;color:#666">Payment: ${order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'} · ${esc(order.paymentStatus)}. Add your GSTIN and registered address here before using as a tax invoice.</p>`
      : ''
  }
  ${order.customerNotes ? `<p><b>Customer notes:</b> ${esc(order.customerNotes)}</p>` : ''}
  <script>window.onload=()=>window.print()</script></body></html>`)
  w.document.close()
}

export function OrderDetailModal({ order, onClose, onUpdated }: { order: OrderRecord | null; onClose: () => void; onUpdated: (o: OrderRecord) => void }) {
  const { canManagePayments } = useAdminAuth()
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  const [reason, setReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!order) return
    setCarrier(order.carrier || '')
    setTracking(order.trackingNumber || '')
    setStaffNotes(order.staffNotes || '')
    setReason('')
    setRefundAmount('')
  }, [order])

  if (!order) return null

  const run = async (fn: () => Promise<any>, msg: string) => {
    setBusy(true)
    const res = await fn()
    setBusy(false)
    if (notify(res, msg) && res.data) onUpdated(mapAdminOrder(res.data))
  }

  const changeStatus = (status: OrderStatus) => {
    if (status === 'SHIPPED' && !tracking.trim() && !confirmAction('Mark as shipped without a tracking number?')) return
    if (status === 'CANCELLED' && !confirmAction(`Cancel order ${order.orderNumber}? Stock will be returned${order.paymentStatus === 'PAID' && order.paymentMethod === 'RAZORPAY' ? ' and the payment refunded in full' : ''}.`)) return
    run(
      () =>
        api.patch(`/orders/${order.id}/status`, {
          status,
          carrier: carrier.trim() || null,
          trackingNumber: tracking.trim() || null,
          staffNotes: staffNotes.trim() || null,
          ...(status === 'CANCELLED' && { reason: reason.trim() || null }),
        }),
      `Order marked ${STATUS_LABEL[status].toLowerCase()}`
    )
  }

  const saveDetails = () =>
    run(() => api.patch(`/orders/${order.id}/details`, { carrier: carrier.trim() || null, trackingNumber: tracking.trim() || null, staffNotes: staffNotes.trim() || null }), 'Order details saved')

  const markCodPaid = () => {
    if (!confirmAction('Confirm the cash for this order has been collected?')) return
    run(() => api.patch(`/orders/${order.id}/payment`, { paymentStatus: 'PAID' }), 'Payment recorded')
  }

  const refundable = Math.max(0, order.totalAmount - order.refundedAmount)
  const refund = () => {
    const amount = refundAmount.trim() ? Number(refundAmount) : refundable
    if (!(amount > 0) || amount > refundable) return notify({ success: false, status: 400, message: `Enter an amount up to ${formatINR(refundable)}` })
    if (!confirmAction(`Refund ${formatINR(amount)}${order.paymentMethod === 'RAZORPAY' ? ' to the customer’s original payment method' : ' (record a manual cash refund)'}?`)) return
    run(() => api.post(`/orders/${order.id}/refund`, { amount, reason: reason.trim() || undefined }), 'Refund issued')
  }

  const a = order.shippingAddress

  return (
    <AdminModal open title={`Order ${order.orderNumber}`} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-[#424a70]/15 adm-text-primary font-medium">{STATUS_LABEL[order.status]}</span>
        <span className={`px-2 py-1 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
          {order.paymentMethod === 'COD' ? 'COD' : 'Online'} · {order.paymentStatus.toLowerCase()}
        </span>
        <span className="adm-text-muted">Placed {new Date(order.createdAt).toLocaleString('en-IN')}</span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => printDocument(order, 'invoice')} className="px-2.5 py-1.5 rounded-lg border adm-border inline-flex items-center gap-1">
            <Printer className="w-3.5 h-3.5" /> Invoice
          </button>
          <button type="button" onClick={() => printDocument(order, 'packing')} className="px-2.5 py-1.5 rounded-lg border adm-border inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Packing slip
          </button>
        </div>
      </div>

      {/* Fulfilment */}
      <div className="p-4 rounded-xl border adm-border space-y-3">
        <h4 className="text-xs uppercase tracking-wider adm-text-muted font-medium">Fulfilment</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="od-carrier" label="Carrier">
            <input id="od-carrier" className={inputCls} value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. Delhivery, Blue Dart" />
          </Field>
          <Field id="od-tracking" label="Tracking number">
            <input id="od-tracking" className={inputCls} value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </Field>
        </div>
        <Field id="od-notes" label="Internal staff notes (not visible to the customer)">
          <textarea id="od-notes" rows={2} className={inputCls} value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={saveDetails} className="px-3 py-2 rounded-xl border adm-border text-xs disabled:opacity-50">
            Save details
          </button>
          {order.allowedNextStatuses
            .filter((s) => s !== 'CANCELLED')
            .map((s) => (
              <button key={s} type="button" disabled={busy} onClick={() => changeStatus(s)} className="px-3 py-2 rounded-xl adm-btn-primary text-xs disabled:opacity-50">
                Mark {STATUS_LABEL[s].toLowerCase()}
              </button>
            ))}
        </div>
        {order.status === 'PENDING' && <p className="text-[11px] adm-text-muted">Awaiting online payment — it will confirm automatically, or expire and release stock.</p>}
      </div>

      {/* Payment / cancellation */}
      <div className="p-4 rounded-xl border adm-border space-y-3">
        <h4 className="text-xs uppercase tracking-wider adm-text-muted font-medium">Payment</h4>
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div><dt className="adm-text-muted">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
          <div><dt className="adm-text-muted">Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd>{formatINR(order.discount)}</dd></div>
          <div><dt className="adm-text-muted">Shipping</dt><dd>{formatINR(order.shippingFee)}</dd></div>
          <div><dt className="adm-text-muted">GST</dt><dd>{formatINR(order.tax)}</dd></div>
          <div><dt className="adm-text-muted">Total</dt><dd className="font-semibold">{formatINR(order.totalAmount)}</dd></div>
        </dl>
        {order.refundedAmount > 0 && <p className="text-xs text-amber-600">Refunded so far: {formatINR(order.refundedAmount)}</p>}
        {order.razorpayPaymentId && <p className="text-[11px] adm-text-muted font-mono">Razorpay payment {order.razorpayPaymentId}</p>}
        {order.cancelReason && <p className="text-xs adm-text-muted">Cancellation reason: {order.cancelReason}</p>}

        {(order.allowedNextStatuses.includes('CANCELLED') || (canManagePayments && order.paymentStatus === 'PAID' && refundable > 0)) && (
          <Field id="od-reason" label="Reason (for cancellation / refund)">
            <input id="od-reason" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </Field>
        )}
        <div className="flex flex-wrap gap-2 items-end">
          {canManagePayments && order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
            <button type="button" disabled={busy} onClick={markCodPaid} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs disabled:opacity-50">
              Mark cash collected
            </button>
          )}
          {canManagePayments && order.paymentStatus === 'PAID' && refundable > 0 && (
            <>
              <Field id="od-refund" label={`Refund amount (max ${formatINR(refundable)})`}>
                <input id="od-refund" type="number" min={0} step="0.01" className={`${inputCls} w-40`} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder={String(refundable)} />
              </Field>
              <button type="button" disabled={busy} onClick={refund} className="px-3 py-2 rounded-xl border border-amber-500 text-amber-600 text-xs disabled:opacity-50">
                Issue refund
              </button>
            </>
          )}
          {order.allowedNextStatuses.includes('CANCELLED') && (
            <button type="button" disabled={busy} onClick={() => changeStatus('CANCELLED')} className="px-3 py-2 rounded-xl border border-red-500 text-red-500 text-xs disabled:opacity-50">
              Cancel order
            </button>
          )}
        </div>
        {!canManagePayments && <p className="text-[11px] adm-text-muted">Payment changes and refunds require an administrator.</p>}
      </div>

      {/* Items */}
      <div>
        <h4 className="text-xs uppercase tracking-wider adm-text-muted font-medium mb-2">Items ({order.items.length})</h4>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="p-3 border adm-border rounded-xl flex items-center gap-3 text-xs">
              <div className="w-12 h-12 rounded-lg bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                {item.customSnapshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(item.customSnapshotUrl)} alt="" className="w-full h-full object-cover" />
                ) : item.customDesignId ? (
                  <Sparkles className="w-5 h-5 text-purple-500" />
                ) : (
                  <FileText className="w-5 h-5 adm-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium adm-text-primary truncate">{item.product?.name}</p>
                <p className="adm-text-muted font-mono">
                  SKU {item.product?.sku} · Qty {item.quantity} · {formatINR(item.unitPrice)} each
                </p>
              </div>
              {item.productionSpec && (
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(item.productionSpec, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `${order.orderNumber}-${item.id}-spec.json`
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-2 py-1 rounded-lg border adm-border inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Spec
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 border adm-border rounded-xl">
          <span className="text-[10px] uppercase tracking-wider adm-text-muted block mb-1">Customer</span>
          <p className="font-medium adm-text-primary">{order.customerName}</p>
          <p className="adm-text-muted">{order.customerEmail}</p>
          <p className="adm-text-muted">{order.customerPhone}</p>
          <p className="adm-text-muted mt-1">{order.userId ? 'Registered customer' : 'Guest checkout'}</p>
        </div>
        <div className="p-3.5 border adm-border rounded-xl">
          <span className="text-[10px] uppercase tracking-wider adm-text-muted block mb-1">Ship to</span>
          <p className="font-medium adm-text-primary">{a.fullName}</p>
          <p>
            {a.addressLine1}
            {a.addressLine2 ? `, ${a.addressLine2}` : ''}
          </p>
          <p>
            {a.city}, {a.state} {a.postalCode}
          </p>
          <p className="adm-text-muted">{a.phone}</p>
        </div>
      </div>
      {order.customerNotes && (
        <div className="p-3.5 border adm-border rounded-xl text-xs">
          <span className="text-[10px] uppercase tracking-wider adm-text-muted block mb-1">Customer notes</span>
          {order.customerNotes}
        </div>
      )}
    </AdminModal>
  )
}
