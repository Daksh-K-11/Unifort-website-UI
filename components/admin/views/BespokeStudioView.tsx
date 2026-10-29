'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Sparkles,
  Search,
  CheckCircle2,
  Eye,
  X,
  Plus,
  Clock,
  Filter,
  RefreshCw,
  Layers,
  Box,
  Palette,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { CustomDesignItem, CustomDesignStatus } from '../admin-types'
import { api } from '../../../lib/api-client'
import { AdminPagination } from '../AdminPagination'

const modelTypeOptions = [
  { value: 'ALL', label: 'All Silhouettes' },
  { value: 'mug', label: 'Ceramic Mug (3 surfaces)' },
  { value: 'plate', label: 'Dinner Plate (2 surfaces)' },
  { value: 'tumbler', label: 'Glass Tumbler (2 surfaces)' },
  { value: 'bowl', label: 'Serving Bowl (2 surfaces)' },
  { value: 'carafe', label: 'Studio Carafe (2 surfaces)' },
  { value: 'tote', label: 'Linen Tote (2 surfaces)' },
  { value: 'bottle', label: 'Travel Tumbler (2 surfaces)' },
  { value: 'coaster', label: 'Ceramic Coaster Set (1 surface)' },
]

const finishOptions = [
  { value: 'ALL', label: 'All Glazes & Finishes' },
  { value: 'matte', label: 'Matte Mineral' },
  { value: 'satin', label: 'Satin Silk' },
  { value: 'gloss', label: 'High Gloss' },
  { value: 'raw', label: 'Raw Terracotta' },
  { value: 'metallic', label: 'Metallic Reduction' },
]

export function BespokeStudioView() {
  const { canManageWorkshop } = useAdminAuth()

  const [designs, setDesigns] = useState<CustomDesignItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [modelTypeFilter, setModelTypeFilter] = useState<string>('ALL')
  const [finishFilter, setFinishFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<string>('ALL')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'price_desc' | 'price_asc'>('newest')

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })

  // Modal state
  const [selectedDesign, setSelectedDesign] = useState<CustomDesignItem | null>(null)
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false)
  const [craftsmanNoteInput, setCraftsmanNoteInput] = useState('')
  const [statusUpdateInput, setStatusUpdateInput] = useState<CustomDesignStatus>('IN_PRODUCTION')

  // Calculate ISO date strings based on timeRange preset
  const getDateRangeParams = useCallback(() => {
    const now = new Date()
    let startDate: string | undefined = undefined
    let endDate: string | undefined = undefined

    if (timeRange === 'TODAY') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      startDate = today.toISOString()
    } else if (timeRange === '24H') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    } else if (timeRange === '7D') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeRange === '30D') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeRange === 'CUSTOM') {
      if (customStartDate) startDate = new Date(customStartDate).toISOString()
      if (customEndDate) {
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        endDate = end.toISOString()
      }
    }

    return { startDate, endDate }
  }, [timeRange, customStartDate, customEndDate])

  const fetchDesigns = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRangeParams()
      const queryParams = new URLSearchParams()

      queryParams.set('page', String(page))
      queryParams.set('limit', String(limit))
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter)
      if (modelTypeFilter !== 'ALL') queryParams.set('modelType', modelTypeFilter)
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim())
      if (startDate) queryParams.set('startDate', startDate)
      if (endDate) queryParams.set('endDate', endDate)
      queryParams.set('sortBy', sortBy)

      const res = await api.get(`/customize/admin/designs?${queryParams.toString()}`, {}, true)

      if (res.success && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.designs || [])
        let mapped: CustomDesignItem[] = rawList.map((d: any) => ({
          id: d.id,
          userId: d.userId,
          user: d.user
            ? {
                name: `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim() || d.user.email,
                email: d.user.email,
              }
            : undefined,
          productId: d.productId,
          modelType: d.modelType || d.product?.modelType,
          product: d.product
            ? {
                name: d.product.name,
                slug: d.product.slug,
                modelType: d.product.modelType,
                price: Number(d.product.price || 0),
              }
            : undefined,
          title: d.title,
          status: d.status as CustomDesignStatus,
          finish: d.finish || d.state?.finish || 'matte',
          designState: d.state || d.designState,
          snapshotUrl: d.thumbnailUrl,
          productionNotes: d.productionNotes,
          craftsmanNotes: d.craftsmanNotes,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }))

        // Optional client filter for finish if specified
        if (finishFilter !== 'ALL') {
          mapped = mapped.filter((m) => m.finish?.toLowerCase() === finishFilter.toLowerCase())
        }

        setDesigns(mapped)

        // Pagination metadata
        if (res.pagination) {
          setPagination({
            total: res.pagination.total,
            totalPages: res.pagination.totalPages || Math.ceil(res.pagination.total / limit) || 1,
          })
        } else if (res.meta) {
          setPagination({
            total: res.meta.total || mapped.length,
            totalPages: res.meta.totalPages || Math.ceil((res.meta.total || mapped.length) / limit) || 1,
          })
        } else {
          setPagination({
            total: mapped.length,
            totalPages: Math.ceil(mapped.length / limit) || 1,
          })
        }
      }
    } catch (e) {
      console.error('Failed to load workshop designs', e)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    limit,
    statusFilter,
    modelTypeFilter,
    finishFilter,
    searchQuery,
    getDateRangeParams,
    sortBy,
  ])

  useEffect(() => {
    fetchDesigns()
  }, [fetchDesigns])

  const handleOpenInspect = (design: CustomDesignItem) => {
    setSelectedDesign(design)
    setStatusUpdateInput(design.status)
    setCraftsmanNoteInput(design.craftsmanNotes || '')
    setIsInspectModalOpen(true)
  }

  const handleSaveWorkshopUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDesign) return

    const updated: CustomDesignItem = {
      ...selectedDesign,
      status: statusUpdateInput,
      craftsmanNotes: craftsmanNoteInput,
      updatedAt: new Date().toISOString(),
    }

    setDesigns((prev) => prev.map((d) => (d.id === selectedDesign.id ? updated : d)))
    setSelectedDesign(updated)
    setIsInspectModalOpen(false)

    await api.patch(
      `/customize/admin/designs/${selectedDesign.id}/status`,
      {
        status: statusUpdateInput,
        craftsmanNotes: craftsmanNoteInput,
      },
      {},
      true
    )
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'ALL') count++
    if (modelTypeFilter !== 'ALL') count++
    if (finishFilter !== 'ALL') count++
    if (timeRange !== 'ALL') count++
    if (searchQuery.trim()) count++
    return count
  }, [statusFilter, modelTypeFilter, finishFilter, timeRange, searchQuery])

  // Reset all filters
  const handleResetFilters = () => {
    setStatusFilter('ALL')
    setModelTypeFilter('ALL')
    setFinishFilter('ALL')
    setTimeRange('ALL')
    setCustomStartDate('')
    setCustomEndDate('')
    setSortBy('newest')
    setSearchQuery('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Atelier 3D Custom Production Queue
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Craftsman inspection, 300 DPI pre-flight verification, and kiln status advancement.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDesigns}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-medium adm-card border adm-border adm-text-primary hover:bg-[#424a70]/10 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-2xs"
          title="Refresh 3D production queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="adm-card border adm-border rounded-2xl p-4 shadow-sm space-y-3.5">
        {/* Row 1: Search + Status + Model Silhouette + Glaze Finish */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search piece title, patron, notes..."
              className="w-full pl-9 pr-8 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Workshop Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors appearance-none cursor-pointer"
            >
              <option value="ALL">All Production Stages</option>
              <option value="SAVED">SAVED (Drafting by Patron)</option>
              <option value="ORDERED">ORDERED (Commission Placed)</option>
              <option value="SUBMITTED">SUBMITTED (Awaiting Review)</option>
              <option value="IN_REVIEW">IN_REVIEW (Verifying 300 DPI Specs)</option>
              <option value="APPROVED">APPROVED (Glaze Prep & Wheel)</option>
              <option value="IN_PRODUCTION">IN_PRODUCTION (In Kiln Firing)</option>
              <option value="COMPLETED">COMPLETED (Inspected & Packed)</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="REJECTED">REJECTED (Specs Not Viable)</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs adm-text-muted">
              ▼
            </div>
          </div>

          {/* 3D Model Silhouette Dropdown */}
          <div className="relative">
            <select
              value={modelTypeFilter}
              onChange={(e) => {
                setModelTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors appearance-none cursor-pointer"
            >
              {modelTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs adm-text-muted">
              ▼
            </div>
          </div>

          {/* Finish / Glaze Dropdown */}
          <div className="relative">
            <select
              value={finishFilter}
              onChange={(e) => {
                setFinishFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors appearance-none cursor-pointer"
            >
              {finishOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs adm-text-muted">
              ▼
            </div>
          </div>
        </div>

        {/* Row 2: Date & Time Filters + Sort Order + Reset Button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t adm-border">
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] adm-text-muted font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time:
              </span>
              <select
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="24H">Past 24 Hours</option>
                <option value="7D">Past 7 Days</option>
                <option value="30D">Past 30 Days</option>
                <option value="CUSTOM">Custom Date Range...</option>
              </select>
            </div>

            {/* Custom Date Inputs if CUSTOM selected */}
            {timeRange === 'CUSTOM' && (
              <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-lg border adm-border">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value)
                    setPage(1)
                  }}
                  className="px-2 py-1 adm-input border rounded text-xs adm-text-primary"
                  title="Start Date"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value)
                    setPage(1)
                  }}
                  className="px-2 py-1 adm-input border rounded text-xs adm-text-primary"
                  title="End Date"
                />
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 border-l adm-border pl-2.5">
              <span className="text-[11px] adm-text-muted font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title: A to Z</option>
                <option value="price_desc">Estimated Price: High to Low</option>
                <option value="price_asc">Estimated Price: Low to High</option>
              </select>
            </div>
          </div>

          {/* Active Filter Counter & Reset */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#424a70] dark:text-indigo-400 font-medium">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs rounded-lg border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#424a70]/10 text-[#424a70] dark:text-[#a0aadb] border border-[#424a70]/20">
                Stage: {statusFilter.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {modelTypeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                Model: {modelTypeFilter}
                <button
                  type="button"
                  onClick={() => {
                    setModelTypeFilter('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {finishFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Finish: {finishFilter}
                <button
                  type="button"
                  onClick={() => {
                    setFinishFilter('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {timeRange !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Time: {timeRange}
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                Search: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Production Queue List / Empty State */}
      {designs.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Bespoke Pieces Found</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            {activeFilterCount > 0
              ? 'No custom pieces match your currently applied filters. Try adjusting criteria or reset filters.'
              : 'Once patrons customize tableware in the 3D studio, their pieces will stream here for pre-flight and kiln firing.'}
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-3 py-1.5 rounded-lg border adm-border text-xs font-medium adm-text-primary hover:bg-[#424a70]/10 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                  <th className="py-3 px-4 w-14">Preview</th>
                  <th className="py-3 px-4">Design Title</th>
                  <th className="py-3 px-4">Silhouette & Glaze</th>
                  <th className="py-3 px-4">Patron</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Craftsman Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y adm-border text-xs adm-text-secondary">
                {designs.map((design) => {
                  return (
                    <tr key={design.id} className="adm-table-hover transition-colors">
                      <td className="py-2.5 px-4 w-14">
                        <div
                          onClick={() => handleOpenInspect(design)}
                          className="relative w-11 h-11 rounded-xl overflow-hidden border adm-border bg-black/5 dark:bg-white/5 shrink-0 group cursor-pointer shadow-2xs hover:border-[#424a70] hover:scale-105 transition-all flex items-center justify-center"
                          title="Inspect piece details"
                        >
                          {design.snapshotUrl ? (
                            <img
                              src={design.snapshotUrl}
                              alt={design.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium adm-text-primary">
                        <div className="flex flex-col">
                          <span className="font-semibold">{design.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {design.product?.name || 'Artisan Tableware'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="capitalize font-medium adm-text-primary">
                            {design.product?.modelType || design.modelType || 'Model'}
                          </span>
                          <span className="text-[10px] adm-text-muted uppercase tracking-wider">
                            Glaze: {design.finish}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium adm-text-primary">
                            {design.user?.name || 'Guest Patron'}
                          </span>
                          <span className="text-[10px] adm-text-muted font-mono">{design.user?.email || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                            design.status === 'IN_PRODUCTION'
                              ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
                              : design.status === 'APPROVED'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : design.status === 'COMPLETED'
                              ? 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-300'
                              : design.status === 'SUBMITTED'
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
                              : design.status === 'REJECTED'
                              ? 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300'
                              : 'bg-black/5 dark:bg-white/5 adm-border adm-text-muted'
                          }`}
                        >
                          {design.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px] truncate adm-text-muted text-[11px] not-italic">
                        {design.craftsmanNotes || 'No notes added'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenInspect(design)}
                          className="px-2.5 py-1.5 rounded-lg adm-card adm-border adm-text-secondary hover:adm-text-primary text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#424a70] dark:text-indigo-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Reusable Pagination */}
          <AdminPagination
            page={page}
            limit={limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l)
              setPage(1)
            }}
            itemName="bespoke pieces"
          />
        </div>
      )}

      {/* Inspector & Status Advancement Modal */}
      {isInspectModalOpen && selectedDesign && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-300 font-semibold">
                  Atelier Inspector
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">
                  {selectedDesign.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectModalOpen(false)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkshopUpdate} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Piece Specification Summary */}
              <div className="grid grid-cols-2 gap-3 p-3.5 adm-card-subtle border adm-border rounded-xl text-xs">
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Silhouette</span>
                  <span className="adm-text-primary font-medium capitalize">
                    {selectedDesign.product?.modelType || selectedDesign.modelType || 'Model'}
                  </span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Selected Finish</span>
                  <span className="adm-text-primary font-medium capitalize">{selectedDesign.finish}</span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Print Standards</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">300 DPI Verified</span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Patron Account</span>
                  <span className="adm-text-primary font-medium truncate block">
                    {selectedDesign.user?.name || 'Guest User'}
                  </span>
                </div>
              </div>

              {/* Status Advancement Selector */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Update Workshop Status
                </label>
                <select
                  value={statusUpdateInput}
                  onChange={(e) => setStatusUpdateInput(e.target.value as CustomDesignStatus)}
                  className="adm-select w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                >
                  <option value="SUBMITTED">SUBMITTED (Awaiting initial review)</option>
                  <option value="IN_REVIEW">IN_REVIEW (Verifying resolution & alignment)</option>
                  <option value="APPROVED">APPROVED (Ready for wheel / glaze prep)</option>
                  <option value="IN_PRODUCTION">IN_PRODUCTION (In Kiln Reduction Firing)</option>
                  <option value="COMPLETED">COMPLETED (Packaged & Ready for Dispatch)</option>
                  <option value="REJECTED">REJECTED (Specs not viable)</option>
                </select>
              </div>

              {/* Craftsman Kiln Notes (Strictly non-italic) */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Craftsman Kiln & Glaze Notes
                </label>
                <textarea
                  value={craftsmanNoteInput}
                  onChange={(e) => setCraftsmanNoteInput(e.target.value)}
                  placeholder="e.g. Stoneware reduction fired at 1280°C. Verified satin finish and 300 DPI metallic decal alignment."
                  rows={3}
                  className="w-full px-3.5 py-2.5 adm-input border rounded-xl text-xs not-italic focus:outline-none focus:border-[#424a70] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInspectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Piece State</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
