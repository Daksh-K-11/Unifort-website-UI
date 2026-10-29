'use client'

import React, { useState } from 'react'
import { AdminAuthProvider, useAdminAuth } from '@/components/admin/admin-auth-context'
import { AdminThemeProvider, useAdminTheme } from '@/components/admin/admin-theme-context'
import { AdminAuthGate } from '@/components/admin/AdminAuthGate'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { OverviewView } from '@/components/admin/views/OverviewView'
import { BespokeStudioView } from '@/components/admin/views/BespokeStudioView'
import { OrdersView } from '@/components/admin/views/OrdersView'
import { ProductsView } from '@/components/admin/views/ProductsView'
import { CategoriesView } from '@/components/admin/views/CategoriesView'
import { InquiriesView } from '@/components/admin/views/InquiriesView'
import { ReviewsView } from '@/components/admin/views/ReviewsView'
import { UsersView } from '@/components/admin/views/UsersView'
import { AuditLogsView } from '@/components/admin/views/AuditLogsView'
import { MediaLibraryView } from '@/components/admin/views/MediaLibraryView'
import { AdminSection } from '@/components/admin/admin-types'

function AdminDashboardContent() {
  const { isAuthenticated } = useAdminAuth()
  const { resolvedTheme } = useAdminTheme()
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // If session is unauthenticated, render the secure authentication gate
  if (!isAuthenticated) {
    return <AdminAuthGate />
  }

  const renderCurrentView = () => {
    switch (currentSection) {
      case 'overview':
        return <OverviewView onNavigate={(sec) => setCurrentSection(sec)} />
      case '3d-studio':
        return <BespokeStudioView />
      case 'orders':
        return <OrdersView />
      case 'products':
        return <ProductsView />
      case 'categories':
        return <CategoriesView />
      case 'media':
        return <MediaLibraryView />
      case 'inquiries':
        return <InquiriesView />
      case 'reviews':
        return <ReviewsView />
      case 'users':
        return <UsersView />
      case 'audit-logs':
        return <AuditLogsView />
      default:
        return <OverviewView onNavigate={(sec) => setCurrentSection(sec)} />
    }
  }

  return (
    <div
      className={`admin-dashboard-root min-h-screen adm-bg adm-text-primary flex flex-col md:flex-row antialiased selection:bg-[#424a70] selection:text-white transition-colors duration-200 ${
        resolvedTheme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Navigation Sidebar */}
      <AdminSidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen adm-bg transition-colors duration-200">
        <AdminHeader
          currentSection={currentSection}
          onOpenMobile={() => setIsMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AdminThemeProvider>
      <AdminAuthProvider>
        <AdminDashboardContent />
      </AdminAuthProvider>
    </AdminThemeProvider>
  )
}
