'use client'

import React, { useState } from 'react'
import {
  Users,
  Search,
  Trash2,
  Lock,
  UserPlus,
  X,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { AdminUser, UserRole } from '../admin-types'

export function UsersView() {
  const { canManageUsers } = useAdminAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false)

  // Provision form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('STAFF')

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

  const handleProvisionUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return

    const newUser: AdminUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    setUsers((prev) => [newUser, ...prev])
    setIsProvisionModalOpen(false)
    setName('')
    setEmail('')
    setPassword('')
    setRole('STAFF')
  }

  const handleToggleActive = (id: string, current: boolean) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !current } : u)))
  }

  const handleChangeRole = (id: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
  }

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            User & Staff Access Control (RBAC)
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Cryptographic access tiers across ADMIN, STAFF, and CUSTOMER roles.
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
        <div className="adm-card border adm-border rounded-2xl overflow-hidden">
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="adm-table-hover transition-colors">
                  <td className="py-3.5 px-4 font-medium adm-text-primary">{user.name}</td>
                  <td className="py-3.5 px-4 font-mono adm-text-muted">{user.email}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium border adm-input focus:outline-none ${
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
                      className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border cursor-pointer ${
                        user.isActive
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-300'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Permanently Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  RBAC Role Tier *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                >
                  <option value="STAFF">STAFF (Workshop, Inquiries & Fulfillment)</option>
                  <option value="ADMIN">ADMIN (Full Master Control & Auditing)</option>
                  <option value="CUSTOMER">CUSTOMER (Patron Profile)</option>
                </select>
              </div>

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
