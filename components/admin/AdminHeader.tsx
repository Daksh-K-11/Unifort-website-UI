'use client'

import React from 'react'
import { Menu, FileCode, User, LogOut } from 'lucide-react'
import { useAdminAuth } from './admin-auth-context'
import { AdminSection } from './admin-types'
import { AdminThemeToggle } from './AdminThemeToggle'

interface AdminHeaderProps {
  currentSection: AdminSection
  onOpenMobile: () => void
}

const sectionTitles: Record<AdminSection, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview',
    subtitle: 'What needs your attention today.',
  },
  '3d-studio': {
    title: 'Custom designs',
    subtitle: 'Review customer 3D designs and track their production.',
  },
  orders: {
    title: 'Orders',
    subtitle: 'Process, ship, cancel and refund orders.',
  },
  products: {
    title: 'Products',
    subtitle: 'Add, edit, publish and restock products.',
  },
  categories: {
    title: 'Categories',
    subtitle: 'Group products for the storefront.',
  },
  inquiries: {
    title: 'Inquiries',
    subtitle: 'Messages from customers and businesses.',
  },
  reviews: {
    title: 'Reviews',
    subtitle: 'Approve or reject customer reviews.',
  },
  users: {
    title: 'Users & staff',
    subtitle: 'Manage accounts and roles (admin only).',
  },
  media: {
    title: 'Media library',
    subtitle: 'Upload and manage images and 3D models.',
  },
  coupons: {
    title: 'Promo Codes',
    subtitle: 'Create and manage discount codes applied at checkout (Admin only).',
  },
  'audit-logs': {
    title: 'Audit log',
    subtitle: 'Record of every administrative change (Admin only).',
  },
}

export function AdminHeader({ currentSection, onOpenMobile }: AdminHeaderProps) {
  const { currentUser, logout } = useAdminAuth()
  const info = sectionTitles[currentSection] || {
    title: 'UNIFORT admin',
    subtitle: 'Management dashboard',
  }

  return (
    <header className="sticky top-0 z-30 adm-header backdrop-blur-md border-b adm-border px-4 sm:px-6 py-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg adm-card adm-border text-current"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg md:text-xl font-serif tracking-tight adm-text-primary font-medium">
            {info.title}
          </h1>
          <p className="text-xs adm-text-muted hidden sm:block">{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle (System / Light / Dark) */}
        <AdminThemeToggle />


        {/* Security badge */}
        {/* <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">RBAC Active</span>
        </div> */}

        {/* User Chip & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l adm-border">
          <div className="w-8 h-8 rounded-full bg-[#424a70]/10 dark:bg-white/10 border adm-border flex items-center justify-center text-current">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-medium adm-text-primary">{currentUser?.name}</span>
            <span className="text-[10px] adm-text-muted font-mono">{currentUser?.email}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out from session"
            className="p-1.5 rounded-lg adm-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
