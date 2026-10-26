'use client'

import React from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Box,
  ShoppingBag,
  Layers,
  FolderTree,
  Mail,
  MessageSquareQuote,
  Users,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Shield,
  Lock,
} from 'lucide-react'
import { useAdminAuth } from './admin-auth-context'
import { AdminSection } from './admin-types'

interface AdminSidebarProps {
  currentSection: AdminSection
  onSelectSection: (section: AdminSection) => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function AdminSidebar({
  currentSection,
  onSelectSection,
  isMobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const { currentUser, role, logout, isAdmin } = useAdminAuth()

  const navItems: Array<{
    id: AdminSection
    label: string
    icon: React.ElementType
    adminOnly?: boolean
    badge?: string
  }> = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: '3d-studio', label: '3D Studio & Production', icon: Sparkles, badge: 'Queue' },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { id: 'products', label: 'Products & Drafts', icon: Box },
    { id: 'categories', label: 'Taxonomy & Collections', icon: FolderTree },
    { id: 'inquiries', label: 'Inquiries & Commissions', icon: Mail },
    { id: 'reviews', label: 'Review Moderation', icon: MessageSquareQuote },
    { id: 'users', label: 'User & Staff RBAC', icon: Users, adminOnly: true },
    { id: 'audit-logs', label: 'Security Audit Logs', icon: ShieldAlert, adminOnly: true },
  ]

  const handleNavClick = (section: AdminSection) => {
    onSelectSection(section)
    onCloseMobile()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[295px] lg:w-[310px] adm-sidebar border-r adm-border z-50 flex flex-col transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 lg:p-6 border-b adm-border flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#424a70]/10 dark:bg-white/10 border adm-border flex items-center justify-center shadow-sm group-hover:border-[#424a70] transition-colors">
              <Shield className="w-5 h-5 text-[#424a70] dark:text-[#8b97d1]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#424a70] dark:text-[#8b97d1] font-semibold">
                UNIFORT Atelier
              </span>
              <span className="text-base font-serif tracking-tight font-medium adm-text-primary">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Current Operator Badge (Real Authenticated Session) */}
        <div className="px-5 py-3.5 adm-card-subtle border-b adm-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider adm-text-muted font-medium">
              Authenticated Session
            </span>
            <span
              className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border ${
                isAdmin
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
                  : 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-300'
              }`}
            >
              {role} Role
            </span>
          </div>

          <div className="flex flex-col text-xs">
            <span className="adm-text-primary font-medium truncate">
              {currentUser?.name || 'Authenticated Operator'}
            </span>
            <span className="text-[10px] adm-text-muted font-mono truncate mt-0.5">
              {currentUser?.email || ''}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider adm-text-muted font-medium">
            Management & Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentSection === item.id
            const isLocked = item.adminOnly && !isAdmin

            return (
              <button
                key={item.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                    : isLocked
                    ? 'opacity-40 cursor-not-allowed text-current'
                    : 'adm-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:adm-text-primary'
                }`}
              >
                {/* Single line guarantee: whitespace-nowrap and flex-nowrap */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? '!text-white' : 'opacity-70'}`} />
                  <span className={`whitespace-nowrap truncate text-left ${isActive ? '!text-white font-medium' : ''}`}>
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isLocked && <Lock className="w-3.5 h-3.5 opacity-50" />}
                  {item.badge && !isLocked && (
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? 'bg-white/20 !text-white'
                          : 'bg-black/5 dark:bg-white/10 adm-text-secondary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 !text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t adm-border space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs adm-text-secondary hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Storefront</span>
            </span>
            <span className="text-[10px] adm-text-muted font-mono">Live</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Secure Log Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
