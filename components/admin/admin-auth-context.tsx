'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AdminUser, UserRole } from './admin-types'
import { api, errorMessage, hasSessionHint, SESSION_EXPIRED_EVENT } from '@/lib/api-client'

interface AdminAuthContextType {
  currentUser: AdminUser | null
  /** @deprecated sessions are cookie based; kept for compatibility */
  token: string | null
  isAuthenticated: boolean
  /** Signed in, but with a customer account. */
  isForbidden: boolean
  role: UserRole
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  isAdmin: boolean
  isStaff: boolean
  canManageUsers: boolean
  canViewAuditLogs: boolean
  canDeleteProducts: boolean
  canDeleteMedia: boolean
  canManagePayments: boolean
  canManageCoupons: boolean
  canViewRevenue: boolean
  canManageOrders: boolean
  canManageWorkshop: boolean
  canManageInquiries: boolean
  canModerateReviews: boolean
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

const toAdminUser = (u: any): AdminUser => ({
  id: u.id,
  name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
  email: u.email,
  role: u.role as UserRole,
  phone: u.phone,
  token: '',
  isActive: true,
  createdAt: u.createdAt || new Date().toISOString(),
})

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [isForbidden, setIsForbidden] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const applyUser = useCallback((u: any | null) => {
    if (u && (u.role === 'ADMIN' || u.role === 'STAFF')) {
      setCurrentUser(toAdminUser(u))
      setIsForbidden(false)
    } else {
      setCurrentUser(null)
      setIsForbidden(!!u)
    }
  }, [])

  // The role always comes from the server; nothing is trusted from browser storage.
  useEffect(() => {
    ;(async () => {
      if (hasSessionHint()) {
        const res = await api.get('/auth/me')
        applyUser(res.success ? res.data : null)
      }
      setIsLoaded(true)
    })()
  }, [applyUser])

  useEffect(() => {
    const onExpired = () => setCurrentUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password })
    if (!res.success || !res.data?.user) return { success: false, message: errorMessage(res, 'Invalid email or password') }
    const u = res.data.user
    if (u.role !== 'ADMIN' && u.role !== 'STAFF') {
      await api.post('/auth/logout')
      return { success: false, message: 'This console is restricted to staff and administrator accounts.' }
    }
    applyUser(u)
    return { success: true }
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setCurrentUser(null)
    setIsForbidden(false)
  }

  const role: UserRole = currentUser?.role || 'CUSTOMER'
  const isAdmin = role === 'ADMIN'
  const isStaff = role === 'STAFF' || isAdmin

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true">
        <div className="w-8 h-8 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <AdminAuthContext.Provider
      value={{
        currentUser,
        token: null,
        isAuthenticated: !!currentUser,
        isForbidden,
        role,
        login,
        logout,
        isAdmin,
        isStaff,
        // Mirrors the backend RBAC rules
        canManageUsers: isAdmin,
        canViewAuditLogs: isAdmin,
        canDeleteProducts: isAdmin,
        canDeleteMedia: isAdmin,
        canManagePayments: isAdmin,
        canManageCoupons: isAdmin,
        canViewRevenue: isAdmin,
        canManageOrders: isStaff,
        canManageWorkshop: isStaff,
        canManageInquiries: isStaff,
        canModerateReviews: isStaff,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  return context
}
