'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeMode = 'light' | 'dark'

interface AdminThemeContextType {
  themeMode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setThemeMode: (mode: ThemeMode) => void
}

const THEME_STORAGE_KEY = 'unifort_admin_theme'

export const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined)

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light')

  useEffect(() => {
    // Load stored preference, defaulting to 'light' if not set
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
      if (saved === 'light' || saved === 'dark') {
        setThemeModeState(saved)
      } else {
        setThemeModeState('light')
        localStorage.setItem(THEME_STORAGE_KEY, 'light')
      }
    } catch {
      setThemeModeState('light')
    }
  }, [])

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      // Ignore storage errors
    }
  }

  // Resolved theme is directly the active themeMode (light by default)
  const resolvedTheme: 'light' | 'dark' = themeMode

  return (
    <AdminThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext)
  if (!context) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider')
  }
  return context
}
