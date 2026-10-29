'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Mail,
  Search,
  X,
  Eye,
  Clock,
  Filter,
  RefreshCw,
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { InquiryRecord, InquiryStatus } from '../admin-types'
import { api } from '../../../lib/api-client'
import { GlassDropdown, GlassDropdownOption } from '../../ui/GlassDropdown'
import { AdminPagination } from '../AdminPagination'

const inquiryStatusOptions: GlassDropdownOption[] = [
  { value: 'NEW', label: 'NEW', description: 'Fresh inquiry awaiting first response' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS (Engaging with client)', description: 'Correspondence underway' },
  { value: 'RESOLVED', label: 'RESOLVED (Quote & contract agreed)', description: 'Commission or terms finalized' },
  { value: 'CLOSED', label: 'CLOSED', description: 'Archived / completed' },
]

export function InquiriesView() {
  const { canManageInquiries } = useAdminAuth()

  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<string>('ALL')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Dynamic filter options from backend
  const [availableTypes, setAvailableTypes] = useState<string[]>([
    'HOSPITALITY_COMMISSION',
    'BESPOKE_ORDER',
    'GENERAL',
    'STOCKIST',
    'PRESS_MEDIA',
  ])

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })

  // Modal state
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null)
  const [statusInput, setStatusInput] = useState<InquiryStatus>('RESOLVED')
  const [notesInput, setNotesInput] = useState('')

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

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRangeParams()
      const queryParams = new URLSearchParams()

      queryParams.set('page', String(page))
      queryParams.set('limit', String(limit))
      if (typeFilter !== 'ALL') queryParams.set('type', typeFilter)
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter)
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim())
      if (startDate) queryParams.set('startDate', startDate)
      if (endDate) queryParams.set('endDate', endDate)
      queryParams.set('sortOrder', sortOrder)

      const res = await api.get(`/inquiries?${queryParams.toString()}`, {}, true)

      if (res.success && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data.inquiries || [])
        const mapped: InquiryRecord[] = rawList.map((inq: any) => ({
          id: inq.id,
          name: inq.name || (inq.user ? `${inq.user.firstName || ''} ${inq.user.lastName || ''}`.trim() : 'Patron'),
          email: inq.email || inq.user?.email || '',
          phone: inq.phone || inq.user?.phone || undefined,
          type: inq.type,
          subject: inq.metadata?.subject || inq.subject || 'Atelier Commission Inquiry',
          message: inq.message,
          status: inq.status,
          notes: inq.adminNotes || inq.notes,
          metadata: inq.metadata,
          userId: inq.userId,
          createdAt: inq.createdAt,
          updatedAt: inq.updatedAt,
        }))

        setInquiries(mapped)

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

        // Dynamically populate inquiry types from backend
        const extraTypes = (res.meta as any)?.filterOptions?.types
        if (Array.isArray(extraTypes) && extraTypes.length > 0) {
          setAvailableTypes(Array.from(new Set([...availableTypes, ...extraTypes])))
        }
      }
    } catch (e) {
      console.error('Failed to load inquiries', e)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    limit,
    typeFilter,
    statusFilter,
    searchQuery,
    getDateRangeParams,
    sortOrder,
    availableTypes,
  ])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const handleOpenDetail = (inq: InquiryRecord) => {
    setSelectedInquiry(inq)
    setStatusInput(inq.status)
    setNotesInput(inq.notes || '')
  }

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInquiry) return

    const updated: InquiryRecord = {
      ...selectedInquiry,
      status: statusInput,
      notes: notesInput,
      updatedAt: new Date().toISOString(),
    }

    setInquiries((prev) => prev.map((i) => (i.id === selectedInquiry.id ? updated : i)))
    setSelectedInquiry(null)

    await api.patch(
      `/inquiries/${selectedInquiry.id}`,
      {
        status: statusInput,
        adminNotes: notesInput,
      },
      {},
      true
    )
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (typeFilter !== 'ALL') count++
    if (statusFilter !== 'ALL') count++
    if (timeRange !== 'ALL') count++
    if (searchQuery.trim()) count++
    return count
  }, [typeFilter, statusFilter, timeRange, searchQuery])

  // Reset all filters
  const handleResetFilters = () => {
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setTimeRange('ALL')
    setCustomStartDate('')
    setCustomEndDate('')
    setSearchQuery('')
    setSortOrder('desc')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Inquiries & Hospitality Commissions
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Bespoke tableware quotes, restaurant partnerships, and patron correspondence.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInquiries}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-medium adm-card border adm-border adm-text-primary hover:bg-[#424a70]/10 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-2xs"
          title="Refresh inquiries"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="adm-card border adm-border rounded-2xl p-4 shadow-sm space-y-3.5">
        {/* Search Bar + Mobile Filters Toggle */}
        <div className="flex items-center gap-2">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search patron, email, phone, message..."
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

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`sm:hidden px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              showMobileFilters || activeFilterCount > 0
                ? 'tab-active !bg-[#424a70] !text-white border-[#424a70]'
                : 'adm-card border adm-border adm-text-secondary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="badge-count w-4 h-4 rounded-full !bg-white !text-[#424a70] text-[10px] font-bold flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Dropdowns: Collapsible on Mobile, Grid on Tablet/Desktop */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-2 gap-2.5`}>
          {/* Commission Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Commission Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW (Awaiting First Response)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Engaging)</option>
              <option value="RESOLVED">RESOLVED (Quote & Agreement)</option>
              <option value="CLOSED">CLOSED (Completed / Archived)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date & Time Filters + Sort Order + Reset Button (Collapsible on Mobile) */}
        <div className={`${showMobileFilters ? 'flex' : 'hidden sm:flex'} flex-wrap items-center justify-between gap-2.5 pt-2 border-t adm-border`}>
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
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="px-2.5 py-1.5 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70] cursor-pointer"
              >
                <option value="desc">Newest Received</option>
                <option value="asc">Oldest Received</option>
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
            {typeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#424a70]/10 text-[#424a70] dark:text-[#a0aadb] border border-[#424a70]/20">
                Type: {typeFilter.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('ALL')
                    setPage(1)
                  }}
                  className="hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Status: {statusFilter}
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
            {timeRange !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
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

      {/* Table or Empty State */}
      {inquiries.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Mail className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Inquiries Found</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            {activeFilterCount > 0
              ? 'No inquiries match your currently applied filters. Try adjusting your search query or reset filters.'
              : 'When patrons or restaurateurs submit hospitality commission inquiries or requests, they will appear here.'}
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
                  <th className="py-3 px-4">Patron Contact</th>
                  <th className="py-3 px-4">Commission Type</th>
                  <th className="py-3 px-4">Subject & Message</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y adm-border text-xs adm-text-secondary">
                {inquiries.map((inq) => {
                  const createdAtDate = inq.createdAt ? new Date(inq.createdAt) : null
                  return (
                    <tr key={inq.id} className="adm-table-hover transition-colors">
                      <td className="py-3.5 px-4 font-medium adm-text-primary">
                        <div className="flex flex-col">
                          <span className="font-semibold">{inq.name}</span>
                          <span className="text-[10px] adm-text-muted font-mono">{inq.email}</span>
                          {inq.phone && (
                            <span className="text-[10px] adm-text-muted flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" /> {inq.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 adm-text-secondary border adm-border">
                          {inq.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <span className="font-medium adm-text-primary block truncate">
                          {inq.subject || 'Commission Inquiry'}
                        </span>
                        <span className="adm-text-muted line-clamp-2 text-[11px] mt-0.5 not-italic">
                          {inq.message}
                        </span>
                        {inq.notes && (
                          <div className="mt-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate">
                            Note: {inq.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                            inq.status === 'RESOLVED'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : inq.status === 'NEW'
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
                              : inq.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                              : 'bg-black/5 dark:bg-white/5 adm-border adm-text-muted'
                          }`}
                        >
                          {inq.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 adm-text-muted text-[11px] font-mono whitespace-nowrap">
                        {createdAtDate ? (
                          <div>
                            <div>{createdAtDate.toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400">{createdAtDate.toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(inq)}
                          className="px-2.5 py-1.5 rounded-lg adm-card adm-border adm-text-secondary hover:adm-text-primary text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#424a70] dark:text-indigo-400" />
                          <span>Respond</span>
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
            itemName="inquiries"
          />
        </div>
      )}

      {/* Detail & Resolution Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-300 font-medium">
                  {selectedInquiry.type.replace(/_/g, ' ')}
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">
                  {selectedInquiry.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="p-5 space-y-4 overflow-y-auto">
              <div className="p-3.5 adm-card-subtle border adm-border rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase text-slate-400">
                  <span>Original Patron Message</span>
                  <span>{selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <p className="adm-text-secondary leading-relaxed not-italic whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
                <div className="pt-2 border-t adm-border flex flex-col gap-1 text-[11px] font-mono text-slate-500">
                  <div>Patron Email: <span className="adm-text-primary">{selectedInquiry.email}</span></div>
                  {selectedInquiry.phone && (
                    <div>Patron Phone: <span className="adm-text-primary">{selectedInquiry.phone}</span></div>
                  )}
                </div>
              </div>

              {/* Inquiry Metadata if present (specifications or custom order snapshot) */}
              {selectedInquiry.metadata && Object.keys(selectedInquiry.metadata).length > 0 && (
                <div className="p-3.5 adm-card-subtle border adm-border rounded-xl text-xs space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Commission Metadata & Specifications
                  </span>
                  <pre className="text-[10px] font-mono p-2 rounded bg-black/5 dark:bg-black/40 overflow-x-auto max-h-32 text-slate-600 dark:text-slate-300">
                    {JSON.stringify(selectedInquiry.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <GlassDropdown
                label="Update Resolution Status"
                options={inquiryStatusOptions}
                value={statusInput}
                onChange={(val) => setStatusInput(val as InquiryStatus)}
              />

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Atelier Internal Notes
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Sent hospitality catalog and quotation for 120 custom reduction-fired basalt bowls."
                  rows={3}
                  className="w-full px-3.5 py-2.5 adm-input border rounded-xl text-xs not-italic focus:outline-none focus:border-[#424a70] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
