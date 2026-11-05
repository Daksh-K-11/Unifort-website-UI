import { Check, CircleX, Clock, CreditCard, Package, Truck, Home, RotateCcw } from 'lucide-react'

export type OrderStatusValue = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

const STATUS_META: Record<OrderStatusValue, { label: string; tone: string; help: string }> = {
  PENDING: { label: 'Awaiting payment', tone: 'bg-amber-100 text-amber-900 ring-amber-300', help: 'Complete the payment to confirm your order.' },
  CONFIRMED: { label: 'Order confirmed', tone: 'bg-sky-100 text-sky-900 ring-sky-300', help: 'We have your order and will start preparing it soon.' },
  PROCESSING: { label: 'Being prepared', tone: 'bg-indigo-100 text-indigo-900 ring-indigo-300', help: 'Your pieces are being prepared and packed.' },
  SHIPPED: { label: 'On the way', tone: 'bg-violet-100 text-violet-900 ring-violet-300', help: 'Your order has left our studio.' },
  DELIVERED: { label: 'Delivered', tone: 'bg-emerald-100 text-emerald-900 ring-emerald-300', help: 'Your order has been delivered. Enjoy!' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-rose-100 text-rose-900 ring-rose-300', help: 'This order was cancelled.' },
  REFUNDED: { label: 'Refunded', tone: 'bg-slate-200 text-slate-900 ring-slate-300', help: 'This order was refunded to your original payment method.' },
}

export const statusLabel = (s: string) => STATUS_META[s as OrderStatusValue]?.label ?? s
export const statusHelp = (s: string) => STATUS_META[s as OrderStatusValue]?.help ?? ''

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const m = STATUS_META[status as OrderStatusValue]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        m?.tone ?? 'bg-slate-100 text-slate-800 ring-slate-300'
      } ${className}`}
    >
      {status === 'CANCELLED' || status === 'REFUNDED' ? (
        <CircleX className="h-3.5 w-3.5" aria-hidden />
      ) : status === 'PENDING' ? (
        <Clock className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Check className="h-3.5 w-3.5" aria-hidden />
      )}
      {m?.label ?? status}
    </span>
  )
}

const STEPS = [
  { key: 'PLACED', label: 'Placed', icon: Package },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CreditCard },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
] as const

/** Index of the last completed step for an order status. */
export function progressIndex(status: string): number {
  switch (status) {
    case 'PENDING':
      return 0
    case 'CONFIRMED':
    case 'PROCESSING':
      return 1
    case 'SHIPPED':
      return 2
    case 'DELIVERED':
      return 3
    default:
      return -1
  }
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null)

type StepKey = (typeof STEPS)[number]['key']

/** Four-step order tracker (horizontal at every width; labels shrink on phones). */
export function OrderProgress({ status, dates = {} }: { status: string; dates?: Partial<Record<StepKey, string | null | undefined>> }) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-900">
        {status === 'REFUNDED' ? <RotateCcw className="h-4 w-4 shrink-0" aria-hidden /> : <CircleX className="h-4 w-4 shrink-0" aria-hidden />}
        {statusHelp(status)}
      </div>
    )
  }

  const current = progressIndex(status)
  return (
    <ol className="flex" aria-label={`Order progress: ${statusLabel(status)}`}>
      {STEPS.map((step, i) => {
        const done = i <= current
        const isCurrent = i === current
        const Icon = step.icon
        const date = fmtDate(dates[step.key])
        return (
          <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span aria-hidden className={`absolute left-0 right-1/2 top-4 h-0.5 ${i <= current ? 'bg-[#424a70]' : 'bg-slate-200'}`} />}
            {i < STEPS.length - 1 && <span aria-hidden className={`absolute left-1/2 right-0 top-4 h-0.5 ${i < current ? 'bg-[#424a70]' : 'bg-slate-200'}`} />}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                done ? 'border-[#424a70] bg-[#424a70] text-white' : 'border-slate-300 bg-white text-slate-400'
              } ${isCurrent ? 'ring-4 ring-[#424a70]/20' : ''}`}
            >
              {done && !isCurrent ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
            </span>
            <span className={`mt-1.5 px-0.5 text-[11px] sm:text-xs ${done ? 'font-semibold text-[#1c2033]' : 'text-slate-500'}`}>
              {step.label}
              {date && done && <span className="block text-[10px] font-normal text-slate-500 sm:text-[11px]">{date}</span>}
              <span className="sr-only">{done ? (isCurrent ? ' (current step)' : ' (done)') : ' (not yet)'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
