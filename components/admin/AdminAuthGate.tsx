'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { useAdminAuth } from './admin-auth-context'
import { useAdminTheme } from './admin-theme-context'
import { AdminThemeToggle } from './AdminThemeToggle'

export function AdminAuthGate() {
  const { login } = useAdminAuth()
  const { resolvedTheme } = useAdminTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please provide your email address and password.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (!result.success) {
        setError(result.message || 'Authentication failed. Please verify your credentials.')
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected authentication error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`admin-dashboard-root min-h-screen w-full flex flex-col justify-center items-center adm-bg adm-text-primary px-4 py-12 relative overflow-hidden transition-colors ${
        resolvedTheme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <AdminThemeToggle />
      </div>

      {/* Subtle luxury background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#424a70]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#424a70]/10 dark:bg-white/10 border adm-border flex items-center justify-center mb-4 shadow-xl">
            <Shield className="w-7 h-7 text-[#424a70] dark:text-[#8b97d1]" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#424a70] dark:text-[#8b97d1] font-semibold mb-1">
            UNIFORT Tableware Atelier
          </span>
          <h1 className="text-2xl font-serif tracking-tight adm-text-primary font-medium">
            Atelier Executive Control
          </h1>
          <p className="text-xs adm-text-muted mt-1 max-w-xs">
            Restricted administrative portal for atelier staff and executives.
          </p>
        </div>

        {/* Login Box */}
        <div className="w-full adm-card border rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                Atelier Account Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@unifort.co"
                autoComplete="email"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 adm-input border rounded-xl text-sm focus:outline-none focus:border-[#424a70] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                Passphrase
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 adm-input border rounded-xl text-sm focus:outline-none focus:border-[#424a70] transition-colors pr-10"
                  required
                />
                <Lock className="w-4 h-4 adm-text-muted absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs leading-relaxed animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 adm-btn-primary rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Enter Atelier</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure RBAC Note */}
          <div className="mt-6 pt-5 border-t adm-border text-center">
            <p className="text-[11px] adm-text-muted leading-relaxed">
              Cryptographically verified role-based access control (RBAC). Only authorized Atelier Administrators and Workshop Staff accounts are granted entry.
            </p>
          </div>
        </div>

        {/* Footer return link */}
        <Link
          href="/"
          className="mt-6 text-xs adm-text-muted hover:adm-text-primary transition-colors flex items-center gap-1.5"
        >
          <span>← Return to Public Storefront</span>
        </Link>
      </div>
    </div>
  )
}
