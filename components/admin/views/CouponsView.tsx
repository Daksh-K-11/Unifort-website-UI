'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Tag, Pencil, Trash2, Lock } from 'lucide-react'
import { api, formatINR } from '@/lib/api-client'
import { useAdminAuth } from '../admin-auth-context'
import { AdminModal, Field, inputCls, notify, Spinner, confirmAction } from '../admin-ui'

interface Coupon {
  id: string
  code: string
  description: string | null
  type: 'PERCENT' | 'FLAT' | 'FREE_SHIPPING'
  value: number
  maxDiscount: number | null
  minSubtotal: number
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  perUserLimit: number | null
  usedCount: number
  isActive: boolean
}

const blank = {
  code: '',
  description: '',
  type: 'PERCENT' as Coupon['type'],
  value: '10',
  maxDiscount: '',
  minSubtotal: '0',
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  perUserLimit: '',
  isActive: true,
}

const dateOnly = (d: string | null) => (d ? d.slice(0, 10) : '')
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

export function CouponsView() {
  const { canManageCoupons } = useAdminAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.get<Coupon[]>('/admin/coupons')
    if (res.success && Array.isArray(res.data)) setCoupons(res.data)
    else notify(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (canManageCoupons) load()
  }, [canManageCoupons, load])

  if (!canManageCoupons) {
    return (
      <div className="adm-card border adm-border rounded-2xl p-10 text-center">
        <Lock className="w-6 h-6 mx-auto mb-2 adm-text-muted" />
        <p className="text-sm adm-text-muted">Promo codes can only be managed by administrators.</p>
      </div>
    )
  }

  const openCreate = () => {
    setEditing(null)
    setForm(blank)
    setErrors({})
    setOpen(true)
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code,
      description: c.description || '',
      type: c.type,
      value: String(c.value),
      maxDiscount: c.maxDiscount === null ? '' : String(c.maxDiscount),
      minSubtotal: String(c.minSubtotal),
      startsAt: dateOnly(c.startsAt),
      endsAt: dateOnly(c.endsAt),
      usageLimit: c.usageLimit === null ? '' : String(c.usageLimit),
      perUserLimit: c.perUserLimit === null ? '' : String(c.perUserLimit),
      isActive: c.isActive,
    })
    setErrors({})
    setOpen(true)
  }

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSaving(true)
    const payload = {
      code: form.code,
      description: form.description || null,
      type: form.type,
      value: form.type === 'FREE_SHIPPING' ? 0 : Number(form.value),
      maxDiscount: form.type === 'PERCENT' ? numOrNull(form.maxDiscount) : null,
      minSubtotal: Number(form.minSubtotal || 0),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      usageLimit: numOrNull(form.usageLimit),
      perUserLimit: numOrNull(form.perUserLimit),
      isActive: form.isActive,
    }
    const res = editing ? await api.put(`/admin/coupons/${editing.id}`, payload) : await api.post('/admin/coupons', payload)
    setSaving(false)
    if (notify(res, editing ? 'Promo code updated' : 'Promo code created', setErrors)) {
      setOpen(false)
      load()
    }
  }

  const toggle = async (c: Coupon) => {
    const res = await api.put(`/admin/coupons/${c.id}`, { isActive: !c.isActive })
    if (notify(res, c.isActive ? 'Code deactivated' : 'Code activated')) load()
  }

  const remove = async (c: Coupon) => {
    if (!confirmAction(`Delete promo code ${c.code}?`)) return
    const res = await api.delete(`/admin/coupons/${c.id}`)
    if (notify(res)) load()
  }

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const describe = (c: Coupon) =>
    c.type === 'PERCENT' ? `${c.value}% off${c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ''}` : c.type === 'FLAT' ? `${formatINR(c.value)} off` : 'Free shipping'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">Promo codes</h2>
          <p className="text-xs adm-text-muted mt-0.5">Codes are validated and applied by the server at checkout.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 self-start">
          <Plus className="w-3.5 h-3.5" /> New promo code
        </button>
      </div>

      <div className="adm-card border adm-border rounded-2xl overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : coupons.length === 0 ? (
          <div className="p-10 text-center text-sm adm-text-muted">
            <Tag className="w-6 h-6 mx-auto mb-2" /> No promo codes yet.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="adm-text-muted text-left">
              <tr className="border-b adm-border">
                <th className="p-3">Code</th>
                <th className="p-3">Benefit</th>
                <th className="p-3">Minimum</th>
                <th className="p-3">Validity</th>
                <th className="p-3">Used</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b adm-border last:border-0">
                  <td className="p-3 font-mono font-semibold adm-text-primary">
                    {c.code}
                    {c.description && <div className="font-sans font-normal adm-text-muted">{c.description}</div>}
                  </td>
                  <td className="p-3">{describe(c)}</td>
                  <td className="p-3">{c.minSubtotal ? formatINR(c.minSubtotal) : '—'}</td>
                  <td className="p-3">
                    {c.startsAt ? new Date(c.startsAt).toLocaleDateString('en-IN') : 'Now'} – {c.endsAt ? new Date(c.endsAt).toLocaleDateString('en-IN') : 'No end'}
                  </td>
                  <td className="p-3">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    {c.perUserLimit ? <div className="adm-text-muted">{c.perUserLimit} per customer</div> : null}
                  </td>
                  <td className="p-3">
                    <button type="button" onClick={() => toggle(c)} className={`px-2 py-1 rounded-full text-[11px] ${c.isActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 adm-text-muted'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(c)} className="p-1.5 adm-text-muted hover:adm-text-primary" aria-label={`Edit ${c.code}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => remove(c)} className="p-1.5 text-red-500" aria-label={`Delete ${c.code}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminModal
        open={open}
        title={editing ? `Edit ${editing.code}` : 'New promo code'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border adm-border text-xs">
              Cancel
            </button>
            <button type="button" onClick={() => save()} disabled={saving} className="px-4 py-2 rounded-xl adm-btn-primary text-xs disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="cp-code" label="Code" error={errors.code}>
              <input id="cp-code" className={`${inputCls} uppercase`} value={form.code} onChange={set('code')} required maxLength={40} />
            </Field>
            <Field id="cp-type" label="Type" error={errors.type}>
              <select id="cp-type" className={inputCls} value={form.type} onChange={set('type')}>
                <option value="PERCENT">Percent off</option>
                <option value="FLAT">Fixed amount off</option>
                <option value="FREE_SHIPPING">Free shipping</option>
              </select>
            </Field>
          </div>
          <Field id="cp-desc" label="Description (shown to customers)" error={errors.description}>
            <input id="cp-desc" className={inputCls} value={form.description} onChange={set('description')} maxLength={200} />
          </Field>
          {form.type !== 'FREE_SHIPPING' && (
            <div className="grid grid-cols-2 gap-3">
              <Field id="cp-value" label={form.type === 'PERCENT' ? 'Percent (1–100)' : 'Amount (₹)'} error={errors.value}>
                <input id="cp-value" type="number" min={0} step="0.01" className={inputCls} value={form.value} onChange={set('value')} />
              </Field>
              {form.type === 'PERCENT' && (
                <Field id="cp-max" label="Maximum discount (₹, optional)" error={errors.maxDiscount}>
                  <input id="cp-max" type="number" min={0} className={inputCls} value={form.maxDiscount} onChange={set('maxDiscount')} />
                </Field>
              )}
            </div>
          )}
          <Field id="cp-min" label="Minimum order subtotal (₹)" error={errors.minSubtotal}>
            <input id="cp-min" type="number" min={0} className={inputCls} value={form.minSubtotal} onChange={set('minSubtotal')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="cp-start" label="Starts (optional)" error={errors.startsAt}>
              <input id="cp-start" type="date" className={inputCls} value={form.startsAt} onChange={set('startsAt')} />
            </Field>
            <Field id="cp-end" label="Ends (optional)" error={errors.endsAt}>
              <input id="cp-end" type="date" className={inputCls} value={form.endsAt} onChange={set('endsAt')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="cp-limit" label="Total uses (optional)" error={errors.usageLimit}>
              <input id="cp-limit" type="number" min={1} className={inputCls} value={form.usageLimit} onChange={set('usageLimit')} />
            </Field>
            <Field id="cp-peruser" label="Uses per customer (optional)" error={errors.perUserLimit}>
              <input id="cp-peruser" type="number" min={1} className={inputCls} value={form.perUserLimit} onChange={set('perUserLimit')} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs adm-text-primary">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active
          </label>
          <button type="submit" className="hidden" />
        </form>
      </AdminModal>
    </div>
  )
}
