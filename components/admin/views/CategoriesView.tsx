'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FolderTree, Plus, Search, Trash2, Pencil } from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { api, mediaUrl } from '@/lib/api-client'
import { AdminModal, Field, inputCls, notify, Spinner, confirmAction } from '../admin-ui'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  _count?: { products: number }
}

const slugify = (v: string) => v.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const blank = { name: '', slug: '', description: '', imageUrl: '', status: 'PUBLISHED' as Category['status'], sortOrder: '0' }

export function CategoriesView() {
  const { isAdmin } = useAdminAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN' | 'EMPTY'>('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(blank)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.get<Category[]>('/categories?all=true')
    if (res.success && Array.isArray(res.data)) setCategories(res.data)
    else notify(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const shown = useMemo(
    () =>
      categories.filter((c) => {
        const q = search.toLowerCase()
        const matches = !q || c.name.toLowerCase().includes(q) || c.slug.includes(q)
        const count = c._count?.products || 0
        return (
          matches &&
          (tab === 'ALL' || (tab === 'PUBLISHED' && c.status === 'PUBLISHED') || (tab === 'HIDDEN' && c.status !== 'PUBLISHED') || (tab === 'EMPTY' && count === 0))
        )
      }),
    [categories, search, tab]
  )

  const openCreate = () => {
    setEditing(null)
    setForm(blank)
    setSlugTouched(false)
    setErrors({})
    setOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, description: c.description || '', imageUrl: c.imageUrl || '', status: c.status, sortOrder: String(c.sortOrder ?? 0) })
    setSlugTouched(true)
    setErrors({})
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      status: form.status,
      sortOrder: Number(form.sortOrder) || 0,
    }
    const res = editing ? await api.put(`/categories/${editing.id}`, payload) : await api.post('/categories', payload)
    setSaving(false)
    if (notify(res, editing ? 'Category updated' : 'Category created', setErrors)) {
      setOpen(false)
      load()
    }
  }

  const remove = async (c: Category) => {
    if (!confirmAction(`Delete category "${c.name}"? This cannot be undone.`)) return
    const res = await api.delete(`/categories/${c.id}`)
    if (notify(res, 'Category deleted')) load()
  }

  const tabs: [typeof tab, string][] = [
    ['ALL', `All (${categories.length})`],
    ['PUBLISHED', 'Published'],
    ['HIDDEN', 'Draft / archived'],
    ['EMPTY', 'Empty'],
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">Categories</h2>
          <p className="text-xs adm-text-muted mt-0.5">Only published categories appear on the storefront.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 self-start">
          <Plus className="w-3.5 h-3.5" /> New category
        </button>
      </div>

      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter categories">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab === k ? 'bg-[#424a70] !text-white' : 'adm-text-muted hover:bg-black/5'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative md:w-64">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <label htmlFor="cat-search" className="sr-only">
            Search categories
          </label>
          <input id="cat-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`${inputCls} pl-8`} />
        </div>
      </div>

      <div className="adm-card border adm-border rounded-2xl overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <div className="p-10 text-center text-sm adm-text-muted">
            <FolderTree className="w-6 h-6 mx-auto mb-2" /> No categories found.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="adm-text-muted text-left">
              <tr className="border-b adm-border">
                <th className="p-3">Category</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Products</th>
                <th className="p-3">Order</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-b adm-border last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(c.imageUrl)} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-black/5" />
                      )}
                      <div>
                        <div className="font-medium adm-text-primary">{c.name}</div>
                        {c.description && <div className="adm-text-muted line-clamp-1 max-w-xs">{c.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono adm-text-muted">{c.slug}</td>
                  <td className="p-3">{c._count?.products ?? 0}</td>
                  <td className="p-3">{c.sortOrder}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] ${c.status === 'PUBLISHED' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 adm-text-muted'}`}>
                      {c.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(c)} className="p-1.5 adm-text-muted hover:adm-text-primary" aria-label={`Edit ${c.name}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => remove(c)}
                        disabled={(c._count?.products || 0) > 0}
                        title={(c._count?.products || 0) > 0 ? 'Move or archive its products first' : 'Delete'}
                        className="p-1.5 text-red-500 disabled:opacity-30"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminModal
        open={open}
        title={editing ? `Edit ${editing.name}` : 'New category'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border adm-border text-xs">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving || !form.name.trim()} className="px-4 py-2 rounded-xl adm-btn-primary text-xs disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <Field id="cat-name" label="Name" error={errors.name}>
          <input
            id="cat-name"
            className={inputCls}
            value={form.name}
            maxLength={80}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, ...(!slugTouched && { slug: slugify(e.target.value) }) }))}
          />
        </Field>
        <Field id="cat-slug" label="URL slug" error={errors.slug} hint="Lowercase letters, numbers and dashes">
          <input
            id="cat-slug"
            className={`${inputCls} font-mono`}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true)
              setForm((f) => ({ ...f, slug: e.target.value }))
            }}
          />
        </Field>
        <Field id="cat-desc" label="Description" error={errors.description}>
          <textarea id="cat-desc" rows={3} className={inputCls} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field id="cat-img" label="Image URL" error={errors.imageUrl} hint="Copy a path from the Media library, e.g. /uploads/…">
          <input id="cat-img" className={inputCls} value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="cat-status" label="Status" error={errors.status}>
            <select id="cat-status" className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Category['status'] }))}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <Field id="cat-order" label="Display order" error={errors.sortOrder}>
            <input id="cat-order" type="number" min={0} className={inputCls} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
          </Field>
        </div>
      </AdminModal>
    </div>
  )
}
