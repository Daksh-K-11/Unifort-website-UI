'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Plus, Search, Pencil, Trash2, Upload, X, ArrowUp, ArrowDown, Eye, EyeOff, RefreshCw, Cuboid } from 'lucide-react'
import { api, formatINR, mediaUrl } from '@/lib/api-client'
import { useAdminAuth } from '../admin-auth-context'
import { AdminPagination } from '../AdminPagination'
import { AdminModal, Field, inputCls, notify, Spinner, useDebounced, confirmAction } from '../admin-ui'

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  type: string
  description: string | null
  price: number
  compareAtPrice: number | null
  image: string
  gallery: string[]
  categoryId: string | null
  categoryName: string
  category?: { id: string; name: string; slug: string } | null
  stock: number
  status: Status
  isFeatured: boolean
  isCustomizable: boolean
  modelType: string | null
  modelUrl: string | null
  dimensions: string | null
  material: string | null
  careInstructions: string | null
  rating: number | null
  reviewCount: number
}

interface Category {
  id: string
  name: string
  status: Status
}

const MODEL_TYPES = ['mug', 'plate', 'tumbler', 'bowl', 'carafe', 'tote', 'bottle', 'coaster']
const LOW_STOCK = 10

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  type: '',
  description: '',
  price: '',
  compareAtPrice: '',
  categoryId: '',
  stock: '0',
  status: 'DRAFT' as Status,
  isFeatured: false,
  isCustomizable: false,
  modelType: '',
  modelUrl: '',
  dimensions: '',
  material: '',
  careInstructions: '',
  images: [] as string[],
}

const slugify = (v: string) => v.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const statusBadge = (s: Status) =>
  s === 'PUBLISHED' ? 'bg-emerald-500/15 text-emerald-600' : s === 'DRAFT' ? 'bg-amber-500/15 text-amber-600' : 'bg-slate-500/15 adm-text-muted'

export function ProductsView() {
  const { canDeleteProducts } = useAdminAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [kindFilter, setKindFilter] = useState<'ALL' | 'STANDARD' | 'CUSTOM'>('ALL')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const [editing, setEditing] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const modelInput = useRef<HTMLInputElement>(null)

  const loadCategories = useCallback(async () => {
    const res = await api.get<Category[]>('/categories?all=true')
    if (res.success && Array.isArray(res.data)) setCategories(res.data)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams({ page: String(page), limit: String(limit), sortBy })
    if (debounced.trim()) q.set('search', debounced.trim())
    if (statusFilter !== 'ALL') q.set('status', statusFilter)
    if (categoryFilter !== 'ALL') q.set('category', categoryFilter)
    if (kindFilter !== 'ALL') q.set('isCustomizable', String(kindFilter === 'CUSTOM'))
    if (lowStockOnly) q.set('lowStock', 'true')
    const res = await api.get<Product[]>(`/products?${q}`)
    if (res.success && Array.isArray(res.data)) {
      setProducts(res.data)
      setMeta({ total: res.meta?.total ?? res.data.length, totalPages: res.meta?.totalPages ?? 1 })
    } else notify(res)
    setLoading(false)
  }, [page, limit, sortBy, debounced, statusFilter, categoryFilter, kindFilter, lowStockOnly])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])
  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setPage(1), [debounced, statusFilter, categoryFilter, kindFilter, lowStockOnly, sortBy])

  const set = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, categoryId: categories[0]?.id || '' })
    setSlugTouched(false)
    setErrors({})
    setOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      slug: p.slug,
      sku: p.sku || '',
      type: p.type || '',
      description: p.description || '',
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      categoryId: p.categoryId || '',
      stock: String(p.stock),
      status: p.status,
      isFeatured: p.isFeatured,
      isCustomizable: p.isCustomizable,
      modelType: p.modelType || '',
      modelUrl: p.modelUrl || '',
      dimensions: p.dimensions || '',
      material: p.material || '',
      careInstructions: p.careInstructions || '',
      images: [p.image, ...(p.gallery || []).filter((g) => g !== p.image)].filter(Boolean),
    })
    setSlugTouched(true)
    setErrors({})
    setOpen(true)
  }

  const upload = async (file: File, kind: 'image' | 'model') => {
    setUploading(true)
    const res = await api.upload('/media/upload', file, { category: kind === 'model' ? 'model' : 'product' })
    setUploading(false)
    if (!notify(res, kind === 'model' ? '3D model uploaded' : 'Image uploaded')) return
    if (kind === 'model') set('modelUrl', res.data.url)
    else setForm((f) => ({ ...f, images: [...f.images, res.data.url] }))
  }

  const moveImage = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const imgs = [...f.images]
      const j = i + dir
      if (j < 0 || j >= imgs.length) return f
      ;[imgs[i], imgs[j]] = [imgs[j], imgs[i]]
      return { ...f, images: imgs }
    })

  const save = async () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!(Number(form.price) > 0)) errs.price = 'Enter a price greater than 0'
    if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) errs.compareAtPrice = 'Must be higher than the price'
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) errs.stock = 'Stock must be a whole number ≥ 0'
    if (form.isCustomizable && !form.modelType) errs.modelType = 'Choose the 3D model type'
    if (form.status === 'PUBLISHED' && form.images.length === 0) errs.images = 'Add at least one image before publishing'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      sku: form.sku.trim() || null,
      type: form.type.trim() || 'Handcrafted tableware',
      description: form.description.trim() || null,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      categoryId: form.categoryId || null,
      stock: Number(form.stock),
      status: form.status,
      isFeatured: form.isFeatured,
      isCustomizable: form.isCustomizable,
      modelType: form.isCustomizable ? form.modelType || null : form.modelType || null,
      modelUrl: form.modelUrl || null,
      dimensions: form.dimensions.trim() || null,
      material: form.material.trim() || null,
      careInstructions: form.careInstructions.trim() || null,
      image: form.images[0] || '/products/unifort-plate-light.jpg',
      gallery: form.images.slice(1),
    }
    setSaving(true)
    const res = editing ? await api.put(`/products/${editing.id}`, payload) : await api.post('/products', payload)
    setSaving(false)
    if (notify(res, editing ? 'Product saved' : 'Product created', setErrors)) {
      setOpen(false)
      load()
    }
  }

  const setStatus = async (p: Product, status: Status) => {
    const res = await api.patch(`/products/${p.id}/status`, { status })
    if (notify(res)) setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)))
  }

  const remove = async (p: Product) => {
    if (!confirmAction(`Delete "${p.name}"? Products that have been ordered are archived instead.`)) return
    const res = await api.delete(`/products/${p.id}`)
    if (notify(res)) load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">Products</h2>
          <p className="text-xs adm-text-muted mt-0.5">Drafts are hidden from the storefront until published.</p>
        </div>
        <div className="flex gap-2 self-start">
          <button type="button" onClick={load} className="px-3 py-2 rounded-xl border adm-border text-xs inline-flex items-center gap-1.5" aria-label="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={openCreate} className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New product
          </button>
        </div>
      </div>

      <div className="adm-card border adm-border rounded-2xl p-4 grid gap-3 md:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <label htmlFor="prd-search" className="sr-only">
            Search products
          </label>
          <input id="prd-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, type or SKU…" className={`${inputCls} pl-8`} />
        </div>
        <select aria-label="Status" className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="ALL">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select aria-label="Category" className={inputCls} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Type" className={inputCls} value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)}>
          <option value="ALL">Standard &amp; 3D</option>
          <option value="STANDARD">Standard only</option>
          <option value="CUSTOM">3D customisable only</option>
        </select>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs adm-text-primary">
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} /> Low stock
          </label>
          <select aria-label="Sort" className={inputCls} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="stock_asc">Stock ↑</option>
          </select>
        </div>
      </div>

      <div className="adm-card border adm-border rounded-2xl overflow-hidden">
        {loading && products.length === 0 ? (
          <Spinner />
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-sm adm-text-muted">
            <Box className="w-6 h-6 mx-auto mb-2" /> No products match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="adm-text-muted text-left">
                <tr className="border-b adm-border">
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b adm-border last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaUrl(p.image)} alt="" className="w-10 h-10 rounded-lg object-cover bg-black/5" loading="lazy" />
                        <div className="min-w-0">
                          <div className="font-medium adm-text-primary truncate max-w-[16rem]">{p.name}</div>
                          <div className="adm-text-muted font-mono">
                            {p.sku || '—'} {p.isCustomizable && <span className="ml-1 text-purple-500 font-sans">· 3D {p.modelType}</span>}
                            {p.isFeatured && <span className="ml-1 text-amber-500 font-sans">· featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{p.category?.name || p.categoryName}</td>
                    <td className="p-3 font-mono">
                      {formatINR(p.price)}
                      {p.compareAtPrice ? <s className="ml-1 adm-text-muted">{formatINR(p.compareAtPrice)}</s> : null}
                    </td>
                    <td className={`p-3 font-mono ${p.stock === 0 ? 'text-red-500' : p.stock <= LOW_STOCK ? 'text-amber-500' : ''}`}>{p.stock}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] ${statusBadge(p.status)}`}>{p.status.toLowerCase()}</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {p.status !== 'PUBLISHED' ? (
                        <button type="button" onClick={() => setStatus(p, 'PUBLISHED')} className="p-1.5 text-emerald-600" title="Publish" aria-label={`Publish ${p.name}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => setStatus(p, 'DRAFT')} className="p-1.5 adm-text-muted" title="Unpublish (move to drafts)" aria-label={`Unpublish ${p.name}`}>
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => openEdit(p)} className="p-1.5 adm-text-muted hover:adm-text-primary" aria-label={`Edit ${p.name}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {canDeleteProducts && (
                        <button type="button" onClick={() => remove(p)} className="p-1.5 text-red-500" aria-label={`Delete ${p.name}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination
          page={page}
          limit={limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l)
            setPage(1)
          }}
          itemName="products"
        />
      </div>

      <AdminModal
        open={open}
        wide
        title={editing ? `Edit ${editing.name}` : 'New product'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border adm-border text-xs">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving || uploading} className="px-4 py-2 rounded-xl adm-btn-primary text-xs disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
            </button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="pf-name" label="Name" error={errors.name}>
            <input
              id="pf-name"
              className={inputCls}
              value={form.name}
              maxLength={150}
              onChange={(e) => {
                set('name', e.target.value)
                if (!slugTouched) set('slug', slugify(e.target.value))
              }}
            />
          </Field>
          <Field id="pf-slug" label="URL slug" error={errors.slug} hint={`/collection/${form.slug || '…'}`}>
            <input
              id="pf-slug"
              className={`${inputCls} font-mono`}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', e.target.value)
              }}
            />
          </Field>
          <Field id="pf-type" label="Type / short descriptor" error={errors.type} hint="e.g. Dinner plate · 28 cm">
            <input id="pf-type" className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)} />
          </Field>
          <Field id="pf-cat" label="Category" error={errors.categoryId}>
            <select id="pf-cat" className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status !== 'PUBLISHED' ? ` (${c.status.toLowerCase()})` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="pf-desc" label="Description" error={errors.description}>
          <textarea id="pf-desc" rows={4} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={5000} />
        </Field>

        <div className="grid sm:grid-cols-4 gap-3">
          <Field id="pf-price" label="Price (₹)" error={errors.price}>
            <input id="pf-price" type="number" min={0} step="0.01" className={inputCls} value={form.price} onChange={(e) => set('price', e.target.value)} />
          </Field>
          <Field id="pf-compare" label="Compare-at (₹)" error={errors.compareAtPrice}>
            <input id="pf-compare" type="number" min={0} step="0.01" className={inputCls} value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} />
          </Field>
          <Field id="pf-stock" label="Stock" error={errors.stock}>
            <input id="pf-stock" type="number" min={0} step={1} className={inputCls} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          </Field>
          <Field id="pf-sku" label="SKU" error={errors.sku} hint="Auto-generated if empty">
            <input id="pf-sku" className={`${inputCls} font-mono`} value={form.sku} onChange={(e) => set('sku', e.target.value)} />
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field id="pf-material" label="Material" error={errors.material}>
            <input id="pf-material" className={inputCls} value={form.material} onChange={(e) => set('material', e.target.value)} />
          </Field>
          <Field id="pf-dims" label="Dimensions" error={errors.dimensions}>
            <input id="pf-dims" className={inputCls} value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} />
          </Field>
          <Field id="pf-care" label="Care instructions" error={errors.careInstructions}>
            <input id="pf-care" className={inputCls} value={form.careInstructions} onChange={(e) => set('careInstructions', e.target.value)} />
          </Field>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider adm-text-muted font-medium">Images (first is the main image)</span>
          {errors.images && <p className="text-[11px] text-red-500">{errors.images}</p>}
          <div className="flex flex-wrap gap-3 mt-2">
            {form.images.map((src, i) => (
              <div key={src + i} className="relative w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(src)} alt="" className={`w-24 h-24 rounded-lg object-cover ${i === 0 ? 'ring-2 ring-[#424a70]' : ''}`} />
                <div className="flex justify-between mt-1">
                  <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30" aria-label="Move image left">
                    <ArrowUp className="w-3 h-3 -rotate-90" />
                  </button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="p-1 text-red-500" aria-label="Remove image">
                    <X className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} className="p-1 disabled:opacity-30" aria-label="Move image right">
                    <ArrowDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => imageInput.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-lg border border-dashed adm-border flex flex-col items-center justify-center text-[11px] adm-text-muted disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mb-1" /> {uploading ? 'Uploading…' : 'Add image'}
            </button>
            <input
              ref={imageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload(f, 'image')
                e.target.value = ''
              }}
            />
          </div>
          <p className="text-[11px] adm-text-muted mt-1">JPEG, PNG, WebP or AVIF up to 10 MB. Images are optimised automatically.</p>
        </div>

        <div className="p-3 rounded-xl border adm-border space-y-3">
          <label className="flex items-center gap-2 text-xs adm-text-primary">
            <input type="checkbox" checked={form.isCustomizable} onChange={(e) => set('isCustomizable', e.target.checked)} />
            Customisable in the 3D studio
          </label>
          {form.isCustomizable && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="pf-model" label="3D model type" error={errors.modelType} hint="Determines the 3D shape, printable surfaces and studio pricing">
                <select id="pf-model" className={inputCls} value={form.modelType} onChange={(e) => set('modelType', e.target.value)}>
                  <option value="">Choose…</option>
                  {MODEL_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="pf-glb" label="Custom .glb model (optional)" error={errors.modelUrl}>
                <div className="flex gap-2 items-center">
                  <input id="pf-glb" className={`${inputCls} font-mono`} value={form.modelUrl} onChange={(e) => set('modelUrl', e.target.value)} placeholder="/uploads/…glb" />
                  <button type="button" onClick={() => modelInput.current?.click()} className="px-2 py-2 rounded-xl border adm-border" aria-label="Upload .glb model">
                    <Cuboid className="w-4 h-4" />
                  </button>
                  <input
                    ref={modelInput}
                    type="file"
                    accept=".glb,model/gltf-binary"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) upload(f, 'model')
                      e.target.value = ''
                    }}
                  />
                </div>
              </Field>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Field id="pf-status" label="Status" error={errors.status}>
            <select id="pf-status" className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as Status)}>
              <option value="DRAFT">Draft (hidden)</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-xs adm-text-primary mt-4">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Featured on home page
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
