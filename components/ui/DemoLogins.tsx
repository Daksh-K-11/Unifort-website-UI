'use client'

import React, { useEffect, useState } from 'react'
import { Check, ChevronDown, Copy, KeyRound, LogIn } from 'lucide-react'
import { api } from '@/lib/api-client'

export interface DemoLogin {
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  name: string
  email: string
  password: string
}

const ROLE_LABEL: Record<DemoLogin['role'], string> = { ADMIN: 'Admin', STAFF: 'Staff', CUSTOMER: 'Customer' }
const ROLE_STYLE: Record<DemoLogin['role'], string> = {
  ADMIN: 'bg-purple-500/15 text-purple-800 dark:text-purple-200',
  STAFF: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  CUSTOMER: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
}

let cached: Promise<DemoLogin[]> | null = null
/** The API only exposes this while demo logins are enabled (development); otherwise it 404s and nothing shows. */
function loadDemoLogins() {
  cached ??= api
    .get<DemoLogin[]>('/dev/demo-logins')
    .then((r) => (r.success && Array.isArray(r.data) ? r.data : []))
    .catch(() => [])
  return cached
}

/**
 * Development helper: a collapsible list of working demo accounts (all roles) with
 * copy buttons and a "Use" button that fills the sign-in form.
 */
export function DemoLogins({ onUse, tone = 'store', className = '' }: { onUse: (email: string, password: string) => void; tone?: 'store' | 'admin'; className?: string }) {
  const [logins, setLogins] = useState<DemoLogin[]>([])
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadDemoLogins().then((l) => alive && setLogins(l))
    return () => {
      alive = false
    }
  }, [])

  if (!logins.length) return null

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
    } catch {
      /* clipboard blocked: the value is visible to copy by hand */
    }
  }

  const admin = tone === 'admin'
  const box = admin ? 'border adm-border' : 'border border-dashed border-[#424a70]/30 bg-[#424a70]/[0.03] text-[#1c2033]'
  const muted = admin ? 'adm-text-muted' : 'text-[#687194]'
  const row = admin ? 'border-t adm-border' : 'border-t border-[#424a70]/12'

  return (
    <div className={`rounded-xl text-left ${box} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="demo-logins-list"
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold"
      >
        <KeyRound className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="flex-1 text-left">Demo accounts ({logins.length})</span>
        <span className={`text-[10px] font-medium uppercase tracking-wider ${muted}`}>Dev only</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul id="demo-logins-list" className="pb-1">
          {logins.map((l) => (
            <li key={l.email} className={`px-3 py-2.5 ${row}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ROLE_STYLE[l.role]}`}>{ROLE_LABEL[l.role]}</span>
                <span className={`text-[11px] truncate flex-1 ${muted}`}>{l.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    onUse(l.email, l.password)
                    setOpen(false)
                  }}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#424a70] hover:bg-[#4f5987] text-white px-2.5 py-1 text-[11px] font-medium"
                >
                  <LogIn className="w-3 h-3" aria-hidden /> Use
                </button>
              </div>
              <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 text-[11px]">
                {(
                  [
                    ['Email', l.email],
                    ['Password', l.password],
                  ] as const
                ).map(([label, value]) => {
                  const key = `${l.email}:${label}`
                  return (
                    <React.Fragment key={label}>
                      <dt className={muted}>{label}</dt>
                      <dd className="font-mono break-all select-all min-w-0">{value}</dd>
                      <dd>
                        <button
                          type="button"
                          onClick={() => copy(key, value)}
                          aria-label={`Copy ${label.toLowerCase()} for ${l.email}`}
                          title="Copy"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md opacity-70 hover:opacity-100"
                        >
                          {copied === key ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
                        </button>
                      </dd>
                    </React.Fragment>
                  )
                })}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
