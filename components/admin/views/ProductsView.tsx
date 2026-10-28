'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Pencil,
  X,
  Lock,
  Layers,
  Save,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { ProductItem, ItemStatus, ModelType, CategoryItem } from '../admin-types'
import { api } from '../../../lib/api-client'
import { GlassDropdown, GlassDropdownOption } from '../../ui/GlassDropdown'

export function ProductsView() {
  const { canDeleteProducts } = useAdminAuth()

  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [customizableOnly, setCustomizableOnly] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // New product form state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formPrice, setFormPrice] = useState('78')
  const [formStock, setFormStock] = useState('25')
  const [formCategory, setFormCategory] = useState('')
  const [formStatus, setFormStatus] = useState<ItemStatus>('DRAFT')
  const [formIsCustomizable, setFormIsCustomizable] = useState(false)
  const [formModelType, setFormModelType] = useState<ModelType>('mug')

  // Edit product form state
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editSku, setEditSku] = useState('')
  const [editPrice, setEditPrice] = useState('78')
  const [editStock, setEditStock] = useState('25')
  const [editCategory, setEditCategory] = useState('')
  const [editStatus, setEditStatus] = useState<ItemStatus>('DRAFT')
  const [editIsCustomizable, setEditIsCustomizable] = useState(false)
  const [editModelType, setEditModelType] = useState<ModelType>('mug')
  const [editDescription, setEditDescription] = useState('')
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null)

  const fetchCatalogData = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?limit=100', {}, true),
        api.get('/categories', {}, true),
      ])

      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(
          prodRes.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            description: p.description,
            price: Number(p.price || 0),
            stock: Number(p.stock || 0),
            status: p.status as ItemStatus,
            isCustomizable: !!p.isCustomizable,
            modelType: p.modelType,
            categoryId: p.categoryId,
            category: p.category
              ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
              : undefined,
            images: p.images || [p.image || '/unifort-plate-light.jpg'],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }))
        )
      }

      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data)
        if (catRes.data.length > 0 && !formCategory) {
          setFormCategory(catRes.data[0].id)
        }
      }
    } catch (e: any) {
      console.error('Failed to load products/categories', e)
    } finally {
      setLoading(false)
    }
  }, [formCategory])

  useEffect(() => {
    fetchCatalogData()
  }, [fetchCatalogData])

  const handleNameChange = (val: string) => {
    setFormName(val)
    if (!formSlug || formSlug === formName.toLowerCase().replace(/\s+/g, '-')) {
      setFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formSku) return

    setIsSubmitting(true)
    setErrorMessage(null)

    const chosenCatObj = categories.find((c) => c.id === formCategory) || (categories.length > 0 ? categories[0] : undefined)

    const payload = {
      name: formName.trim(),
      slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: formSku.trim(),
      price: Math.max(1, parseFloat(formPrice) || 1),
      stock: Math.max(0, parseInt(formStock, 10) || 0),
      status: formStatus,
      isCustomizable: formIsCustomizable,
      modelType: formIsCustomizable ? formModelType : undefined,
      categoryId: chosenCatObj?.id,
      categoryName: chosenCatObj?.name || 'Tableware',
      type: 'Ceramic Stoneware',
      image: '/unifort-plate-light.jpg',
      description: `${formName} handcrafted by UNIFORT artisans with mineral glazes and tactile surfaces.`,
    }

    const res = await api.post('/products', payload, {}, true)

    if (res.success && res.data) {
      const p = res.data
      const newProd: ProductItem = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price: Number(p.price || 0),
        stock: Number(p.stock || 0),
        status: p.status,
        isCustomizable: p.isCustomizable,
        modelType: p.modelType,
        categoryId: p.categoryId,
        category: p.category
          ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
          : undefined,
        createdAt: p.createdAt || new Date().toISOString(),
      }
      setProducts((prev) => [newProd, ...prev])
      setIsCreateModalOpen(false)

      // Reset form
      setFormName('')
      setFormSlug('')
      setFormSku('')
      setFormPrice('78')
      setFormStock('25')
      setFormStatus('DRAFT')
      setFormIsCustomizable(false)
    } else {
      const errMsg =
        res.message ||
        (Array.isArray((res as any).validationErrors)
          ? (res as any).validationErrors.map((v: any) => `${v.field}: ${v.message}`).join(', ')
          : 'Failed to create product')
      setErrorMessage(errMsg)
    }
    setIsSubmitting(false)
  }

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p)
    setEditName(p.name)
    setEditSlug(p.slug)
    setEditSku(p.sku)
    setEditPrice(String(p.price))
    setEditStock(String(p.stock))
    setEditStatus(p.status)
    setEditCategory(p.categoryId || (categories.length > 0 ? categories[0].id : ''))
    setEditIsCustomizable(p.isCustomizable)
    setEditModelType((p.modelType as ModelType) || 'mug')
    setEditDescription(p.description || '')
    setEditErrorMessage(null)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct || !editName || !editSku) return

    setIsSubmitting(true)
    setEditErrorMessage(null)

    const chosenCatObj = categories.find((c) => c.id === editCategory)

    const payload = {
      name: editName.trim(),
      slug: editSlug || editName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: editSku.trim(),
      price: Math.max(1, parseFloat(editPrice) || 1),
      stock: Math.max(0, parseInt(editStock, 10) || 0),
      status: editStatus,
      isCustomizable: editIsCustomizable,
      modelType: editIsCustomizable ? editModelType : undefined,
      categoryId: chosenCatObj?.id,
      categoryName: chosenCatObj?.name,
      description: editDescription,
    }

    const res = await api.put(`/products/${editingProduct.id}`, payload, {}, true)

    if (res.success && res.data) {
      const updated = res.data
      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                name: updated.name,
                slug: updated.slug,
                sku: updated.sku,
                price: Number(updated.price),
                stock: Number(updated.stock),
                status: updated.status,
                isCustomizable: updated.isCustomizable,
                modelType: updated.modelType,
                categoryId: updated.categoryId,
                category: updated.category
                  ? { id: updated.category.id, name: updated.category.name, slug: updated.category.slug }
                  : undefined,
                description: updated.description,
              }
            : item
        )
      )
      setEditingProduct(null)
    } else {
      const errMsg =
        res.message ||
        (Array.isArray((res as any).validationErrors)
          ? (res as any).validationErrors.map((v: any) => `${v.field}: ${v.message}`).join(', ')
          : 'Failed to update product details')
      setEditErrorMessage(errMsg)
    }
    setIsSubmitting(false)
  }

  const handleToggleStatus = async (id: string, current: ItemStatus) => {
    const next: ItemStatus = current === 'DRAFT' ? 'PUBLISHED' : current === 'PUBLISHED' ? 'ARCHIVED' : 'DRAFT'
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)))
    await api.patch(`/products/${id}/status`, { status: next }, {}, true)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!canDeleteProducts) return
    const confirmed = window.confirm('Are you sure you wish to permanently delete this product?')
    if (!confirmed) return
    setProducts((prev) => prev.filter((p) => p.id !== id))
    await api.delete(`/products/${id}`, {}, true)
  }

  // Dropdown options
  const categoryOptions: GlassDropdownOption[] = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      }))
    }
    return [
      { value: 'cat-table', label: 'Table & Dinnerware' },
      { value: 'cat-glass', label: 'Glass & Drinkware' },
      { value: 'cat-objects', label: 'Objects & Decor' },
    ]
  }, [categories])

  const statusOptions: GlassDropdownOption[] = [
    { value: 'DRAFT', label: 'DRAFT (Admin Drafts Everything)', description: 'Hidden from public storefront' },
    { value: 'PUBLISHED', label: 'PUBLISHED (Live in store)', description: 'Visible to patrons' },
    { value: 'ARCHIVED', label: 'ARCHIVED', description: 'Decommissioned piece' },
  ]

  const modelTypeOptions: GlassDropdownOption[] = [
    { value: 'mug', label: 'Ceramic Mug (3 surfaces)' },
    { value: 'plate', label: 'Dinner Plate (2 surfaces)' },
    { value: 'tumbler', label: 'Glass Tumbler (2 surfaces)' },
    { value: 'bowl', label: 'Serving Bowl (2 surfaces)' },
    { value: 'carafe', label: 'Studio Carafe (2 surfaces)' },
    { value: 'tote', label: 'Linen Tote (2 surfaces)' },
    { value: 'bottle', label: 'Travel Tumbler (2 surfaces)' },
    { value: 'coaster', label: 'Ceramic Coaster Set (1 surface)' },
  ]

  const filteredProducts = products.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesCustom = !customizableOnly || p.isCustomizable
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesCustom && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Products & Drafts Catalog
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Manage permanent stoneware collections, 3D studio customizable pieces, and draft states.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMessage(null)
            setIsCreateModalOpen(true)
          }}
          className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Product / Draft</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((tab) => {
            const isActive = statusFilter === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                    : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab === 'ALL' ? 'All Pieces' : tab}
              </button>
            )
          })}

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1 hidden sm:block" />

          {/* Customizable Toggle */}
          <button
            type="button"
            onClick={() => setCustomizableOnly(!customizableOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              customizableOnly
                ? 'tab-active bg-[#424a70] border-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                : 'adm-border adm-text-muted hover:adm-text-primary'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>3D Customizable Only</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search piece name, SKU, slug..."
            className="w-full pl-9 pr-3 py-1.5 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] transition-colors"
          />
        </div>
      </div>

      {/* Products Table or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <Box className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Products Found</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            {statusFilter === 'ALL'
              ? 'No products have been created in this catalog view yet. Use the button below to draft a new piece.'
              : `No products matching status "${statusFilter}".`}
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null)
                setIsCreateModalOpen(true)
              }}
              className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Product Draft</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU & Slug</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status (Click to toggle)</th>
                <th className="py-3 px-4">3D Studio</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border text-xs adm-text-secondary">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="adm-table-hover transition-colors">
                  <td className="py-3.5 px-4 font-medium adm-text-primary">
                    {prod.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-mono adm-text-primary">{prod.sku}</span>
                      <span className="text-[10px] adm-text-muted">{prod.slug}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium adm-text-primary">
                    ₹{prod.price}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={prod.stock < 5 ? 'text-amber-500 dark:text-amber-400 font-medium' : 'adm-text-secondary'}>
                      {prod.stock} units
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(prod.id, prod.status)}
                      title="Click to toggle status (DRAFT -> PUBLISHED -> ARCHIVED)"
                      className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border cursor-pointer hover:scale-105 transition-all ${
                        prod.status === 'PUBLISHED'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : prod.status === 'DRAFT'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                          : 'bg-black/5 dark:bg-white/5 adm-border adm-text-muted'
                      }`}
                    >
                      {prod.status}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    {prod.isCustomizable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-300 font-medium">
                        <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                        <span className="capitalize">{prod.modelType}</span>
                      </span>
                    ) : (
                      <span className="adm-text-muted text-[10px]">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 rounded-lg text-[#424a70] dark:text-indigo-400 hover:bg-[#424a70]/10 dark:hover:bg-indigo-400/10 transition-colors cursor-pointer"
                        title="Edit / Update Product Details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {canDeleteProducts ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Product (Admin Only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="p-1.5 adm-text-muted opacity-40" title="Delete restricted to Admin role">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Product / Draft Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                    Catalog Manager
                  </span>
                  <h3 className="text-base font-serif font-medium adm-text-primary">
                    Create New Product or Draft
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. No. 22 Basalt Espresso Cup"
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="UNI-ESP-022"
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="basalt-espresso-cup"
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                    required
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                    min="0"
                  />
                </div>
              </div>

              {/* Glassmorphic Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <GlassDropdown
                  label="Initial Lifecycle State"
                  options={statusOptions}
                  value={formStatus}
                  onChange={(val) => setFormStatus(val as ItemStatus)}
                />

                <GlassDropdown
                  label="Category"
                  options={categoryOptions}
                  value={formCategory}
                  onChange={(val) => setFormCategory(val)}
                  placeholder="Select Category..."
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 3D Studio Customization Configuration */}
              <div className="p-4 adm-card-subtle border adm-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium adm-text-primary block">
                      Enable 3D Atelier Customization
                    </span>
                    <span className="text-[10px] adm-text-muted">
                      Allows patrons to place custom glazes, decals, and patterns in the 3D studio.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsCustomizable}
                    onChange={(e) => setFormIsCustomizable(e.target.checked)}
                    className="w-4 h-4 rounded text-[#424a70] focus:ring-0 bg-transparent border-black/20 dark:border-white/20 cursor-pointer"
                  />
                </div>

                {formIsCustomizable && (
                  <GlassDropdown
                    label="3D Silhouette Model Type"
                    options={modelTypeOptions}
                    value={formModelType}
                    onChange={(val) => setFormModelType(val as ModelType)}
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Catalog...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save to Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[#424a70] dark:text-indigo-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#424a70] dark:text-indigo-400 font-semibold">
                    Catalog Editor
                  </span>
                  <h3 className="text-base font-serif font-medium adm-text-primary">
                    Update Product & Specs
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. No. 22 Basalt Espresso Cup"
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    placeholder="UNI-ESP-022"
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    placeholder="basalt-espresso-cup"
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                    required
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Stock Count
                  </label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                    min="0"
                  />
                </div>
              </div>

              {/* Glassmorphic Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <GlassDropdown
                  label="Lifecycle State"
                  options={statusOptions}
                  value={editStatus}
                  onChange={(val) => setEditStatus(val as ItemStatus)}
                />

                <GlassDropdown
                  label="Category"
                  options={categoryOptions}
                  value={editCategory}
                  onChange={(val) => setEditCategory(val)}
                  placeholder="Select Category..."
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Artisanal Piece Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description of the clay body, mineral glaze, and tactile profile..."
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] resize-none"
                />
              </div>

              {editErrorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{editErrorMessage}</span>
                </div>
              )}

              {/* 3D Studio Customization Configuration */}
              <div className="p-4 adm-card-subtle border adm-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium adm-text-primary block">
                      Enable 3D Atelier Customization
                    </span>
                    <span className="text-[10px] adm-text-muted">
                      Allows patrons to place custom glazes, decals, and patterns in the 3D studio.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsCustomizable}
                    onChange={(e) => setEditIsCustomizable(e.target.checked)}
                    className="w-4 h-4 rounded text-[#424a70] focus:ring-0 bg-transparent border-black/20 dark:border-white/20 cursor-pointer"
                  />
                </div>

                {editIsCustomizable && (
                  <GlassDropdown
                    label="3D Silhouette Model Type"
                    options={modelTypeOptions}
                    value={editModelType}
                    onChange={(val) => setEditModelType(val as ModelType)}
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Update Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
