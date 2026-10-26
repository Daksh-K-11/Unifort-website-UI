'use client'

import React, { useState } from 'react'
import {
  Box,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Lock,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { ProductItem, ItemStatus, ModelType } from '../admin-types'

export function ProductsView() {
  const { canDeleteProducts } = useAdminAuth()

  const [products, setProducts] = useState<ProductItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [customizableOnly, setCustomizableOnly] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // New product form state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formPrice, setFormPrice] = useState('78')
  const [formStock, setFormStock] = useState('25')
  const [formCategory, setFormCategory] = useState('cat-table')
  const [formStatus, setFormStatus] = useState<ItemStatus>('DRAFT')
  const [formIsCustomizable, setFormIsCustomizable] = useState(false)
  const [formModelType, setFormModelType] = useState<ModelType>('mug')

  const handleNameChange = (val: string) => {
    setFormName(val)
    if (!formSlug || formSlug === formName.toLowerCase().replace(/\s+/g, '-')) {
      setFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formSku) return

    const newProd: ProductItem = {
      id: `prod-${Date.now().toString().slice(-4)}`,
      name: formName,
      slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
      sku: formSku,
      price: parseFloat(formPrice) || 0,
      stock: parseInt(formStock, 10) || 0,
      status: formStatus,
      isCustomizable: formIsCustomizable,
      modelType: formIsCustomizable ? formModelType : undefined,
      categoryId: formCategory,
      category: {
        id: formCategory,
        name: formCategory === 'cat-table' ? 'Table' : 'Glass',
        slug: formCategory === 'cat-table' ? 'table' : 'glass',
      },
      createdAt: new Date().toISOString(),
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
  }

  const handleToggleStatus = (id: string, current: ItemStatus) => {
    const next: ItemStatus = current === 'DRAFT' ? 'PUBLISHED' : current === 'PUBLISHED' ? 'ARCHIVED' : 'DRAFT'
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)))
  }

  const handleDeleteProduct = (id: string) => {
    if (!canDeleteProducts) return
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const filteredProducts = products.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesCustom = !customizableOnly || p.isCustomizable
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
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
          onClick={() => setIsCreateModalOpen(true)}
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
              onClick={() => setIsCreateModalOpen(true)}
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
                      {canDeleteProducts ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
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
          <div className="w-full max-w-lg adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                  Catalog Manager
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">
                  Create New Product or Draft
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Initial Lifecycle State
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ItemStatus)}
                    className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  >
                    <option value="DRAFT">DRAFT (Admin Drafts Everything)</option>
                    <option value="PUBLISHED">PUBLISHED (Live in store)</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  >
                    <option value="cat-table">Table & Dinnerware</option>
                    <option value="cat-glass">Glass & Drinkware</option>
                    <option value="cat-objects">Objects & Decor</option>
                  </select>
                </div>
              </div>

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
                    className="w-4 h-4 rounded text-[#424a70] focus:ring-0 bg-transparent border-black/20 dark:border-white/20"
                  />
                </div>

                {formIsCustomizable && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider adm-text-muted font-medium mb-1">
                      3D Silhouette Model Type
                    </label>
                    <select
                      value={formModelType}
                      onChange={(e) => setFormModelType(e.target.value as ModelType)}
                      className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                    >
                      <option value="mug">Ceramic Mug (3 surfaces)</option>
                      <option value="plate">Dinner Plate (2 surfaces)</option>
                      <option value="tumbler">Glass Tumbler (2 surfaces)</option>
                      <option value="bowl">Serving Bowl (2 surfaces)</option>
                      <option value="carafe">Studio Carafe (2 surfaces)</option>
                      <option value="tote">Linen Tote (2 surfaces)</option>
                      <option value="bottle">Travel Tumbler (2 surfaces)</option>
                      <option value="coaster">Ceramic Coaster Set (1 surface)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
