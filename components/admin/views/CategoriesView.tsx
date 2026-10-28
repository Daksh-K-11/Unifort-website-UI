'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FolderTree, Plus, Search, Trash2, X, Lock } from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { CategoryItem } from '../admin-types'
import { api } from '../../../lib/api-client'

export function CategoriesView() {
  const { isAdmin } = useAdminAuth()

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories')
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data)
      }
    } catch (e) {
      console.error('Failed to load categories', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
    }

    const res = await api.post('/categories', payload, {}, true)
    if (res.success && res.data) {
      setCategories((prev) => [res.data, ...prev])
      setIsCreateModalOpen(false)
      setName('')
      setSlug('')
      setDescription('')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!isAdmin) return
    const confirmed = window.confirm('Are you sure you wish to delete this category?')
    if (!confirmed) return
    setCategories((prev) => prev.filter((c) => c.id !== id))
    await api.delete(`/categories/${id}`, {}, true)
  }

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Taxonomy & Collections
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Tableware categories, editorial groupings, and living collections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Collection Category</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search category or collection slug..."
            className="w-full pl-9 pr-3 py-1.5 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] transition-colors"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
            <FolderTree className="w-6 h-6 text-teal-500 dark:text-teal-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Categories Created</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            Categories organize the tableware catalog into Table, Glass, Objects, and lifestyle collections.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Category</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Assigned Pieces</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border text-xs adm-text-secondary">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="adm-table-hover transition-colors">
                  <td className="py-3.5 px-4 font-medium adm-text-primary">{cat.name}</td>
                  <td className="py-3.5 px-4 font-mono adm-text-muted">{cat.slug}</td>
                  <td className="py-3.5 px-4 adm-text-muted max-w-xs truncate">
                    {cat.description || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono adm-text-secondary">
                    {cat._count?.products || 0} products
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Category (Admin only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Lock className="w-3.5 h-3.5 adm-text-muted opacity-40 inline-block" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-300 font-semibold">
                  Taxonomy
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">Create Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Dinnerware"
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="dinnerware"
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Editorial Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reduction-fired stoneware plates, serving bowls, and banqueting platters."
                  rows={3}
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] resize-none"
                />
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
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
