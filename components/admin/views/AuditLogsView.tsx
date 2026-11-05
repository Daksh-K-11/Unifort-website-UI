'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShieldAlert,
  Search,
  Lock,
  Clock,
  Terminal,
  Activity,
  Code,
  X,
  RefreshCw,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  Shield,
  Layers,
  Copy,
  Check,
  SlidersHorizontal,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { AuditLogRecord, UserRole } from '../admin-types'
import { api } from '../../../lib/api-client'
import { AdminPagination } from '../AdminPagination'

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface FilterOptionsState {
  actions: string[]
  operators: Array<{ email: string; role: string }>
  roles: string[]
}

export function AuditLogsView() {
  const { canViewAuditLogs } = useAdminAuth()

  // Data state
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [inspectingLog, setInspectingLog] = useState<AuditLogRecord | null>(null)
  const [copiedPayload, setCopiedPayload] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('ALL')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL')
  const [timeRange, setTimeRange] = useState<string>('ALL')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })

  // Dynamic filter options state
  const [dynamicFilterOptions, setDynamicFilterOptions] = useState<FilterOptionsState>({
    actions: [],
    operators: [],
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  })

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

  // Fetch logs with server-side query params
  const fetchLogs = useCallback(async () => {
    if (!canViewAuditLogs) return
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRangeParams()

      const queryParams = new URLSearchParams()
      queryParams.set('page', String(page))
      queryParams.set('limit', String(limit))
      if (selectedAction !== 'ALL') queryParams.set('action', selectedAction)
      if (selectedRole !== 'ALL') queryParams.set('role', selectedRole)
      if (selectedOperator !== 'ALL') queryParams.set('userEmail', selectedOperator)
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim())
      if (startDate) queryParams.set('startDate', startDate)
      if (endDate) queryParams.set('endDate', endDate)
      queryParams.set('sortOrder', sortOrder)

      const res = await api.get(`/admin/audit-logs?${queryParams.toString()}`)

      if (res.success && res.data) {
        const rawLogs = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.logs)
          ? res.data.logs
          : []

        const mapped: AuditLogRecord[] = rawLogs.map((l: any) => ({
          id: l.id,
          action: l.action,
          resource: l.resource || undefined,
          details: l.details,
          ipAddress: l.ipAddress || '—',
          userId: l.userId,
          userEmail: l.userEmail,
          userRole: l.userRole,
          user: l.user
            ? {
                name: `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() || l.user.email,
                email: l.user.email,
                role: l.user.role,
              }
            : undefined,
          createdAt: l.createdAt,
        }))

        setLogs(mapped)

        // Set pagination from response or fallback
        if (res.data.pagination) {
          setPagination(res.data.pagination)
        } else {
          setPagination({
            page,
            limit,
            total: mapped.length,
            totalPages: Math.ceil(mapped.length / limit) || 1,
          })
        }

        // Set dynamic filter options from backend if returned
        if (res.data.filterOptions) {
          setDynamicFilterOptions((prev) => ({
            actions: res.data.filterOptions.actions?.length
              ? res.data.filterOptions.actions
              : prev.actions,
            operators: res.data.filterOptions.operators?.length
              ? res.data.filterOptions.operators
              : prev.operators,
            roles: res.data.filterOptions.roles?.length
              ? res.data.filterOptions.roles
              : prev.roles,
          }))
        }
      }
    } catch (e) {
      console.error('Failed to load audit logs', e)
    } finally {
      setLoading(false)
    }
  }, [
    canViewAuditLogs,
    page,
    limit,
    selectedAction,
    selectedRole,
    selectedOperator,
    searchQuery,
    getDateRangeParams,
    sortOrder,
  ])

  // Trigger fetch on filter or pagination change
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Fallback: extract distinct actions and operators from loaded logs if not populated
  useEffect(() => {
    if (logs.length > 0 && dynamicFilterOptions.actions.length === 0) {
      const actSet = new Set<string>()
      const opMap = new Map<string, string>()

      logs.forEach((l) => {
        if (l.action) actSet.add(l.action)
        if (l.userEmail) {
          opMap.set(l.userEmail, l.user?.role || l.userRole || 'STAFF')
        }
      })

      setDynamicFilterOptions({
        actions: Array.from(actSet).sort(),
        operators: Array.from(opMap.entries()).map(([email, role]) => ({ email, role })),
        roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
      })
    }
  }, [logs, dynamicFilterOptions.actions.length])

  // Format action name to human-friendly text
  const humanizeAction = (actionStr: string): string => {
    return actionStr
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  // Action badge color scheme
  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes('APPROVE') || act.includes('CREATE') || act.includes('VERIFIED')) {
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
    }
    if (act.includes('REJECT') || act.includes('DELETE') || act.includes('FAILED')) {
      return 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300'
    }
    if (act.includes('STATUS') || act.includes('UPDATE') || act.includes('PENDING')) {
      return 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
    }
    if (act.includes('USER') || act.includes('ROLE')) {
      return 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
    }
    return 'bg-[#424a70]/10 border-[#424a70]/25 text-[#424a70] dark:text-[#a0aadb]'
  }

  const formatLogSummary = (log: AuditLogRecord): string => {
    if (log.resource) return log.resource
    if (typeof log.details === 'string') return log.details
    if (log.details && typeof log.details === 'object') {
      if (log.details.url) {
        return `${log.details.method || 'ACTION'} ${log.details.url}`
      }
      return JSON.stringify(log.details)
    }
    return '—'
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedAction !== 'ALL') count++
    if (selectedRole !== 'ALL') count++
    if (selectedOperator !== 'ALL') count++
    if (timeRange !== 'ALL') count++
    if (searchQuery.trim()) count++
    return count
  }, [selectedAction, selectedRole, selectedOperator, timeRange, searchQuery])

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedAction('ALL')
    setSelectedRole('ALL')
    setSelectedOperator('ALL')
    setTimeRange('ALL')
    setCustomStartDate('')
    setCustomEndDate('')
    setSearchQuery('')
    setPage(1)
  }

  // Copy JSON payload
  const handleCopyPayload = (details: any) => {
    navigator.clipboard.writeText(JSON.stringify(details || {}, null, 2))
    setCopiedPayload(true)
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  if (!canViewAuditLogs) {
    return (
      <div className="p-12 rounded-2xl adm-card border border-red-500/20 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-base font-serif font-medium adm-text-primary">403 Forbidden — Access Denied</h3>
        <p className="text-xs adm-text-muted mt-1 max-w-sm">
          Cryptographic security audit trails and forensic logs are restricted strictly to the Master{' '}
          <code className="text-purple-600 dark:text-purple-300 font-mono">ADMIN</code> role.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
              Security & Operations Audit Logs
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
              {pagination.total} Logged Events
            </span>
          </div>
          <p className="text-xs adm-text-muted mt-0.5">
            Immutable log trail captured on state modifications by staff and administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-medium adm-card border adm-border adm-text-primary hover:bg-[#424a70]/10 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-2xs"
          title="Refresh audit trail"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Bar with Sleek Compact Controls */}
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
              placeholder="Search action, resource, staff..."
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
        <div className={`${showMobileFilters ? 'grid' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-3 gap-2.5`}>
          {/* Dynamic Action Dropdown */}
          <div className="relative">
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Action Hooks</option>
              {dynamicFilterOptions.actions.map((act) => (
                <option key={act} value={act}>
                  {humanizeAction(act)}
                </option>
              ))}
            </select>
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN (Master)</option>
              <option value="STAFF">STAFF (Atelier)</option>
              <option value="CUSTOMER">CUSTOMER (Patron)</option>
            </select>
          </div>

          {/* Dynamic Staff / Operator Dropdown */}
          <div className="relative">
            <select
              value={selectedOperator}
              onChange={(e) => {
                setSelectedOperator(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 adm-input border rounded-xl text-xs adm-text-primary focus:outline-none focus:border-[#424a70] transition-colors cursor-pointer"
            >
              <option value="ALL">All Operators</option>
              {dynamicFilterOptions.operators.map((op) => (
                <option key={op.email} value={op.email}>
                  {op.email} ({op.role})
                </option>
              ))}
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
                <option value="24H">Last 24 Hours</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
                <option value="CUSTOM">Custom Date Range...</option>
              </select>
            </div>

            {/* Custom Date Pickers (visible when Custom is selected) */}
            {timeRange === 'CUSTOM' && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value)
                    setPage(1)
                  }}
                  className="px-2 py-1 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70]"
                  title="From Date"
                />
                <span className="text-xs adm-text-muted">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value)
                    setPage(1)
                  }}
                  className="px-2 py-1 adm-input border rounded-lg text-xs adm-text-primary focus:outline-none focus:border-[#424a70]"
                  title="To Date"
                />
              </div>
            )}

            {/* Sort Order Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] adm-text-muted font-medium">Sort:</span>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-2.5 py-1.5 rounded-lg border adm-border text-xs adm-text-secondary hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                {sortOrder === 'desc' ? 'Newest First ↓' : 'Oldest First ↑'}
              </button>
            </div>
          </div>

          {/* Active Filter Clear Button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear filters ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Table & Content State */}
      {loading ? (
        <div className="p-16 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin mb-3" />
          <p className="text-xs adm-text-muted">Loading cryptographic audit events...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-16 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Audit Events Found</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            {activeFilterCount > 0
              ? 'No logged events match the selected criteria or search keyword.'
              : 'Audit events are automatically recorded when administrators or staff perform modifications.'}
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs adm-btn-primary cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                  <th className="py-3 px-4">Action Hook</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Staff / Operator</th>
                  <th className="py-3 px-4">Origin IP</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y adm-border text-xs adm-text-secondary font-mono">
                {logs.map((log) => {
                  const logDate = new Date(log.createdAt)
                  return (
                    <tr key={log.id} className="adm-table-hover transition-colors">
                      {/* Action Hook Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-[10px] px-2.5 py-1 rounded-full border font-medium ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {humanizeAction(log.action)}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="py-3.5 px-4 max-w-xs truncate adm-text-primary font-sans text-xs not-italic">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {formatLogSummary(log)}
                        </span>
                      </td>

                      {/* Operator & Role */}
                      <td className="py-3.5 px-4 adm-text-secondary font-sans not-italic whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="flex flex-col">
                            <span className="font-medium adm-text-primary text-xs">
                              {log.user?.name || log.userEmail || 'System'}
                            </span>
                            <span className="text-[10px] adm-text-muted font-mono">
                              {log.userEmail || 'service@internal'}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-mono border ${
                              (log.user?.role || log.userRole) === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20'
                                : 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20'
                            }`}
                          >
                            {log.user?.role || log.userRole || 'STAFF'}
                          </span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4 adm-text-muted text-[11px] font-mono whitespace-nowrap">
                        {log.ipAddress || '—'}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-right adm-text-muted text-[11px] font-mono whitespace-nowrap">
                        <div>{logDate.toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{logDate.toLocaleTimeString()}</div>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectingLog(log)}
                          className="p-1.5 rounded-lg border adm-border hover:bg-[#424a70]/10 text-[#424a70] dark:text-[#8b97d1] transition-colors cursor-pointer"
                          title="Inspect cryptographic event payload"
                        >
                          <Code className="w-3.5 h-3.5" />
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
            itemName="audit logs"
          />
        </div>
      )}

      {/* JSON Payload Inspection Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl adm-modal-bg border adm-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-300 font-semibold font-mono">
                  {inspectingLog.action}
                </span>
                <h3 className="text-sm font-medium adm-text-primary mt-0.5">
                  Audit Entry Forensics: {inspectingLog.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-xl bg-black/5 dark:bg-white/5 border adm-border font-sans">
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase font-mono">Staff Operator</span>
                  <span className="adm-text-primary font-medium">
                    {inspectingLog.user?.name || inspectingLog.userEmail} ({inspectingLog.user?.role || inspectingLog.userRole})
                  </span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase font-mono">Client Origin IP</span>
                  <span className="adm-text-primary font-mono">{inspectingLog.ipAddress || '—'}</span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase font-mono">Resource Hook</span>
                  <span className="adm-text-primary font-mono">{inspectingLog.resource || '—'}</span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase font-mono">Timestamp</span>
                  <span className="adm-text-primary font-mono">
                    {new Date(inspectingLog.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider adm-text-muted font-semibold">
                    Full Captured Forensic Payload
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPayload(inspectingLog.details)}
                    className="text-[11px] text-[#424a70] dark:text-[#a0aadb] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black/90 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed max-h-72 border border-black/40">
                  {JSON.stringify(inspectingLog.details || { note: 'No supplementary payload captured' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t adm-border flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-1.5 rounded-xl text-xs adm-btn-primary cursor-pointer"
              >
                Close Forensics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
