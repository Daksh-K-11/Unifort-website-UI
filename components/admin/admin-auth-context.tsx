'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AdminUser, UserRole } from './admin-types'

interface AdminAuthContextType {
  currentUser: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  role: UserRole
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  // Granular RBAC capabilities
  isAdmin: boolean
  isStaff: boolean
  canManageUsers: boolean
  canViewAuditLogs: boolean
  canDeleteProducts: boolean
  canManageOrders: boolean
  canManageWorkshop: boolean
  canManageInquiries: boolean
  canModerateReviews: boolean
}

const STORAGE_TOKEN_KEY = 'unifort_admin_token'
const STORAGE_USER_KEY = 'unifort_admin_user'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize from sessionStorage on client load (no mock default)
  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem(STORAGE_TOKEN_KEY)
      const savedUser = sessionStorage.getItem(STORAGE_USER_KEY)
      if (savedToken && savedUser) {
        const parsedUser: AdminUser = JSON.parse(savedUser)
        // Verify role eligibility
        if (parsedUser.role === 'ADMIN' || parsedUser.role === 'STAFF') {
          setCurrentUser(parsedUser)
          setToken(savedToken)
        } else {
          sessionStorage.removeItem(STORAGE_TOKEN_KEY)
          sessionStorage.removeItem(STORAGE_USER_KEY)
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_TOKEN_KEY)
      sessionStorage.removeItem(STORAGE_USER_KEY)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        const errMsg = data?.message || 'Invalid email or password credentials'
        return { success: false, message: errMsg }
      }

      const user = data.data?.user
      const authToken = data.data?.token

      if (!user || !authToken) {
        return { success: false, message: 'Authentication response was missing user or token.' }
      }

      // Check role clearance for admin portal
      if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
        return {
          success: false,
          message:
            'Access Denied: The UNIFORT Atelier Admin Console is restricted to Administrator and Staff accounts only.',
        }
      }

      const adminUser: AdminUser = {
        id: user.id,
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.email ||
          'Atelier Operator',
        email: user.email,
        role: user.role as UserRole,
        phone: user.phone,
        token: authToken,
        isActive: true,
        createdAt: user.createdAt || new Date().toISOString(),
      }

      setCurrentUser(adminUser)
      setToken(authToken)

      sessionStorage.setItem(STORAGE_TOKEN_KEY, authToken)
      sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(adminUser))

      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.message && err.message.includes('Failed to fetch')
            ? 'Unable to connect to UNIFORT API at http://localhost:5000. Please verify the backend service is running.'
            : err?.message || 'Authentication error encountered.',
      }
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setToken(null)
    try {
      sessionStorage.removeItem(STORAGE_TOKEN_KEY)
      sessionStorage.removeItem(STORAGE_USER_KEY)
    } catch {
      // Ignore sessionStorage errors
    }
  }

  const role = currentUser?.role || 'CUSTOMER'
  const isAdmin = role === 'ADMIN'
  const isStaff = role === 'STAFF' || role === 'ADMIN'

  const value: AdminAuthContextType = {
    currentUser,
    token,
    isAuthenticated: !!currentUser && !!token,
    role,
    login,
    logout,
    isAdmin,
    isStaff,
    canManageUsers: isAdmin,
    canViewAuditLogs: isAdmin,
    canDeleteProducts: isAdmin,
    canManageOrders: isStaff,
    canManageWorkshop: isStaff,
    canManageInquiries: isStaff,
    canModerateReviews: isStaff,
  }

  if (!isLoaded) {
    return null
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
