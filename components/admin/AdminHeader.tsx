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
    title: 'Executive Atelier Overview',
    subtitle: 'System health, KPIs, revenue analytics, and draft pipeline.',
  },
  '3d-studio': {
    title: '3D Studio & Production',
    subtitle: 'Atelier custom queue, surface configurations, and kiln firing notes.',
  },
  orders: {
    title: 'Orders & Fulfillment Pipeline',
    subtitle: 'Customer acquisitions, bespoke snapshots, and shipment status.',
  },
  products: {
    title: 'Products & Drafts Catalog',
    subtitle: 'Permanent tableware collection, 3D meshes, and draft lifecycle.',
  },
  categories: {
    title: 'Taxonomy & Collections',
    subtitle: 'Material, tableware, and lifestyle categorization.',
  },
  inquiries: {
    title: 'Inquiries & Hospitality Commissions',
    subtitle: 'Bespoke estimates, restaurant dining ware, and trade requests.',
  },
  reviews: {
    title: 'Product Reviews & Moderation',
    subtitle: 'Customer ratings, tactile feedback, and verification moderation.',
  },
  users: {
    title: 'User & Staff RBAC Management',
    subtitle: 'Access rights, staff credentials, and role assignments (Admin only).',
  },
  'audit-logs': {
    title: 'Security Audit Trail',
    subtitle: 'Tamper-resistant cryptographic activity logs (Admin only).',
  },
}

export function AdminHeader({ currentSection, onOpenMobile }: AdminHeaderProps) {
  const { currentUser, logout } = useAdminAuth()
  const info = sectionTitles[currentSection] || {
    title: 'Atelier Admin',
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

        {/* Live Swagger link */}
        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noreferrer"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg adm-card adm-border text-xs adm-text-secondary hover:adm-text-primary transition-colors"
          title="Open interactive Swagger UI in backend"
        >
          <FileCode className="w-3.5 h-3.5 text-[#8b97d1]" />
          <span>Swagger Docs</span>
        </a>

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
