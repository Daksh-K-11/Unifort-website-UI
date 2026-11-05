'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Search,
  Trash2,
  Lock,
  UserPlus,
  X,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { AdminUser, UserRole } from '../admin-types'
import { api } from '@/lib/api-client'
import { notify, useDebounced, confirmAction } from '../admin-ui'
import { AdminPagination } from '../AdminPagination'
import { passwordProblem, PASSWORD_HINT } from '@/components/customer/AuthForms'
import { GlassDropdown, GlassDropdownOption } from '../../ui/GlassDropdown'

const provisionRoleOptions: GlassDropdownOption[] = [
  { value: 'STAFF', label: 'STAFF (Workshop, Inquiries & Fulfillment)', description: 'Can manage catalog, orders, and inquiries' },
  { value: 'ADMIN', label: 'ADMIN (Full Master Control & Auditing)', description: 'Full root access, RBAC management, and deletion' },
  { value: 'CUSTOMER', label: 'CUSTOMER (Patron Profile)', description: 'Standard storefront buyer access' },
]

export function UsersView() {
  const { canManageUsers, currentUser } = useAdminAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false)
  const debouncedSearch = useDebounced(searchQuery)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [provisionError, setProvisionError] = useState<string | null>(null)

  // User Deletion Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Provision form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('STAFF')

  const fetchUsers = useCallback(async () => {
    if (!canManageUsers) return
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (roleFilter !== 'ALL') q.set('role', roleFilter)
      if (debouncedSearch.trim()) q.set('search', debouncedSearch.trim())
      const res = await api.get(`/admin/users?${q}`)
      if (!res.success) notify(res)
      if (res.meta) setMeta({ total: res.meta.total ?? 0, totalPages: res.meta.totalPages ?? 1 })
      if (res.success && res.data) {
        const raw = Array.isArray(res.data) ? res.data : (res.data.users || [])
        const mapped: AdminUser[] = raw.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          role: u.role as UserRole,
          isActive: u.isActive !== false,
          phone: u.phone,
          orderCount: u._count?.orders ?? 0,
          lastLoginAt: u.lastLoginAt,
          emailVerified: !!u.emailVerifiedAt,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }))
        setUsers(mapped)
      }
    } catch (e) {
      console.error('Failed to load admin users', e)
    } finally {
      setLoading(false)
    }
  }, [canManageUsers, page, limit, roleFilter, debouncedSearch])

  useEffect(() => setPage(1), [roleFilter, debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (!canManageUsers) {
    return (
      <div className="p-12 rounded-2xl adm-card border border-red-500/25 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-base font-serif font-medium adm-text-primary">403 Forbidden — Access Denied</h3>
        <p className="text-xs adm-text-muted mt-1 max-w-sm">
          User & Staff credential provisioning is restricted exclusively to the Master <code className="text-purple-600 dark:text-purple-300 font-mono font-semibold">ADMIN</code> role.
        </p>
      </div>
    )
  }

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    const problem = passwordProblem(password)
    if (problem) {
      setProvisionError(problem)
      return
    }
    setProvisionError(null)

    const parts = name.trim().split(' ')
    const firstName = parts[0] || 'Atelier'
    const lastName = parts.slice(1).join(' ') || 'Staff'

    const payload = {
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      password,
      role,
    }

    const res = await api.post('/admin/users', payload)
    if (!res.success) {
      setProvisionError(res.errors?.[0]?.message || res.message || 'Could not create the account.')
      return
    }
    notify(res, `Account created for ${payload.email}`)
    if (res.data) {
      const u = res.data
      const newUser: AdminUser = {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: u.role as UserRole,
        isActive: u.isActive !== false,
        createdAt: u.createdAt || new Date().toISOString(),
      }
      setUsers((prev) => [newUser, ...prev])
      setIsProvisionModalOpen(false)
      setName('')
      setEmail('')
      setPassword('')
      setRole('STAFF')
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    if (current && !confirmAction('Deactivate this account? The user will be signed out everywhere.')) return
    const res = await api.patch(`/admin/users/${id}/status`, { isActive: !current })
    if (notify(res)) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !current } : u)))
  }

  const handleChangeRole = async (id: string, newRole: UserRole) => {
    if (!confirmAction(`Change this account's role to ${newRole}? They will need to sign in again.`)) return
    const res = await api.patch(`/admin/users/${id}/role`, { role: newRole })
    if (notify(res)) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
  }

  const handleSendReset = async (u: AdminUser) => {
    if (!confirmAction(`Email a password reset link to ${u.email}?`)) return
    notify(await api.post(`/admin/users/${u.id}/password-reset`))
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await api.delete(`/admin/users/${userToDelete.id}`)
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
        setUserToDelete(null)
      } else {
        setDeleteError(res.message || 'Failed to remove user account.')
      }
    } catch (e: any) {
      setDeleteError(e?.message || 'Network error encountered while removing user.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredUsers = users

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Users & staff
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Manage roles and access. Deleted accounts are anonymised; their orders are kept.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsProvisionModalOpen(true)}
          className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision User / Staff</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['ALL', 'ADMIN', 'STAFF', 'CUSTOMER'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === r
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                  : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operator name or email..."
            className="w-full pl-9 pr-3 py-1.5 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] transition-colors"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Users in this View</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            Provision atelier staff members, workshop ceramists, or inspect patron credentials.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setIsProvisionModalOpen(true)}
              className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision User Account</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border text-xs adm-text-secondary">
              {filteredUsers.map((user) => {
                const isSelf =
                  (currentUser?.id && currentUser.id === user.id) ||
                  (currentUser?.email && currentUser.email.toLowerCase() === user.email.toLowerCase())

                return (
                  <tr key={user.id} className="adm-table-hover transition-colors">
                    <td className="py-3.5 px-4 font-medium adm-text-primary">{user.name}</td>
                    <td className="py-3.5 px-4 font-mono adm-text-muted">
                      {user.email}
                      <div className="font-sans text-[10px]">{(user as any).orderCount ?? 0} orders · {(user as any).lastLoginAt ? `last sign-in ${new Date((user as any).lastLoginAt).toLocaleDateString('en-IN')}` : 'never signed in'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Role of ${user.email}`}
                        disabled={!!isSelf}
                        title={isSelf ? 'You cannot change your own role' : undefined}
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                        className={`adm-select adm-select-sm font-mono font-medium border focus:outline-none ${
                          user.role === 'ADMIN'
                            ? 'border-purple-500/30 text-purple-700 dark:text-purple-300'
                            : user.role === 'STAFF'
                            ? 'border-teal-500/30 text-teal-700 dark:text-teal-300'
                            : 'adm-border adm-text-muted'
                        }`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="STAFF">STAFF</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        disabled={!!isSelf}
                        title={isSelf ? 'You cannot deactivate your own account' : undefined}
                        className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border cursor-pointer ${
                          user.isActive
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-300'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button type="button" onClick={() => handleSendReset(user)} className="px-2 py-1 mr-1 rounded-lg border adm-border text-[11px]">
                        Reset password
                      </button>
                      {isSelf ? (
                        <span
                          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed inline-flex items-center"
                          title="Active admin session (cannot remove self)"
                        >
                          <Trash2 className="w-3.5 h-3.5 opacity-30" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUserToDelete(user)
                            setDeleteError(null)
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title={`Delete ${user.name}`}
                          aria-label={`Delete ${user.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} limit={limit} total={meta.total} totalPages={meta.totalPages} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} itemName="users" />
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md adm-modal-bg border adm-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold">
                    Revocation & Purge
                  </span>
                  <h3 className="text-base font-serif font-medium adm-text-primary">
                    Remove User Account
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) {
                    setUserToDelete(null)
                    setDeleteError(null)
                  }
                }}
                disabled={isDeleting}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs adm-text-secondary leading-relaxed">
                Are you sure you want to permanently revoke and delete access for this user account? This operation is immediate and irreversible.
              </p>

              <div className="p-3.5 rounded-xl adm-card-subtle border adm-border-subtle space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium adm-text-primary">{userToDelete.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    {userToDelete.role}
                  </span>
                </div>
                <div className="text-[11px] font-mono adm-text-muted">{userToDelete.email}</div>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(null)
                    setDeleteError(null)
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary border adm-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete User Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-300 font-semibold">
                  RBAC Provisioning
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">
                  Provision User / Staff Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionUser} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Joshi"
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@unifort.studio"
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Initial Passphrase *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={PASSWORD_HINT}
                  minLength={8}
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  required
                />
              </div>

              <GlassDropdown
                label="RBAC Role Tier *"
                options={provisionRoleOptions}
                value={role}
                onChange={(val) => setRole(val as UserRole)}
              />

              {provisionError && (
                <p role="alert" className="text-xs text-red-500">
                  {provisionError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

