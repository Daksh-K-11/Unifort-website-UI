'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useAdminTheme, ThemeMode } from './admin-theme-context'

export function AdminThemeToggle() {
  const { themeMode, setThemeMode } = useAdminTheme()

  const options: Array<{ mode: ThemeMode; icon: React.ElementType; title: string }> = [
    { mode: 'light', icon: Sun, title: 'Light Mode' },
    { mode: 'dark', icon: Moon, title: 'Dark Mode' },
  ]

  return (
    <div
      className="inline-flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
      title={`Theme: ${themeMode}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon
        const isActive = themeMode === opt.mode
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setThemeMode(opt.mode)}
            title={opt.title}
            aria-label={opt.title}
            className={`flex items-center justify-center p-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        )
      })}
    </div>
  )
}
