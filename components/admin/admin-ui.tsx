'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse, errorMessage, fieldErrors } from '@/lib/api-client'

/** Debounce a fast-changing value (search boxes). */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Show a toast for an API result; returns true on success. Optionally collects field errors. */
export function notify(res: ApiResponse, successMsg?: string, setErrors?: (e: Record<string, string>) => void): boolean {
  if (res.success) {
    if (successMsg ?? res.message) toast.success(successMsg ?? res.message)
    setErrors?.({})
    return true
  }
  setErrors?.(fieldErrors(res))
  toast.error(errorMessage(res))
  return false
}

export function AdminModal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean | 'xl'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      // Only the top-most dialog reacts when modals are stacked.
      const dialogs = document.querySelectorAll('[role="dialog"]')
      if (dialogs.length && dialogs[dialogs.length - 1] !== ref.current) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus(), 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-modal-title"
        className={`w-full ${wide === 'xl' ? 'max-w-6xl' : wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto adm-card border adm-border rounded-2xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b adm-border">
          <h3 id="adm-modal-title" className="text-sm font-semibold adm-text-primary">
            {title}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t adm-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] uppercase tracking-wider adm-text-muted font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-[11px] adm-text-muted">{hint}</span>}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  )
}

export const inputCls = 'w-full px-3 py-2 rounded-xl border adm-border adm-input text-sm adm-text-primary bg-transparent focus:outline-none focus:border-[#424a70]'

export function Spinner() {
  return (
    <div className="flex justify-center py-12" aria-busy="true">
      <div className="w-7 h-7 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin" />
    </div>
  )
}

export function confirmAction(message: string) {
  return typeof window !== 'undefined' && window.confirm(message)
}
