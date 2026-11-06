'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { passwordProblem, PASSWORD_HINT } from './AuthForms'
import { X, Lock, Mail, User, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { isStaffRole, useCustomer } from '@/lib/customer-context'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { DemoLogins } from '@/components/ui/DemoLogins'

export function CustomerAuthModal() {
  const { authModalOpen, closeAuthModal, authReason, login, register } = useCustomer()
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>(authModalOpen || 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Open on the tab that was requested (login / register).
  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalOpen)
      setError('')
    }
  }, [authModalOpen])

  useEffect(() => {
    if (!authModalOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuthModal()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [authModalOpen, closeAuthModal])

  if (!authModalOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'register') {
        const problem = passwordProblem(password)
        if (problem) {
          setError(problem)
          return
        }
      }
      if (tab === 'login') {
        const res = await login(email, password)
        if (!res.success) {
          setError(res.message || 'Unable to sign in. Please check your credentials.')
        } else if (isStaffRole(res.role)) {
          // Staff and admins work in the dashboard, not the customer storefront.
          router.push('/admin')
        }
      } else {
        const res = await register(name, email, password, phone)
        if (!res.success) {
          setError(res.message || 'Unable to register. Please check your details.')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => closeAuthModal()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-md bg-[#faf9fc] text-[#1c2033] border border-[#424a70]/15 rounded-3xl shadow-2xl p-6 sm:p-8 relative max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => closeAuthModal()}
          className="absolute top-5 right-5 p-2 rounded-full text-[#424a70]/60 hover:text-[#424a70] hover:bg-[#424a70]/5 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#424a70] font-semibold block mb-1">
            UNIFORT Tableware Atelier
          </span>
          <h2 id="auth-modal-title" className="text-2xl font-serif font-medium text-[#1c2033]">
            {tab === 'login' ? 'Welcome to Your Atelier' : 'Create Patron Account'}
          </h2>
          {authReason && (
            <p role="status" className="mt-3 mx-auto max-w-xs rounded-xl bg-[#424a70] text-white px-3 py-2 text-xs font-medium">
              {authReason}
            </p>
          )}
          <p className="text-xs text-[#424a70]/70 mt-2">
            {tab === 'login'
              ? 'Access your orders, bespoke 3D creations, and studio inquiries.'
              : 'Join our patron collective for commissions, saved 3D glazes, and order tracking.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 p-1 bg-[#424a70]/5 border border-[#424a70]/10 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setError('')
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-[#424a70] text-white shadow-sm'
                : 'text-[#424a70]/70 hover:text-[#1c2033]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register')
              setError('')
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-[#424a70] text-white shadow-sm'
                : 'text-[#424a70]/70 hover:text-[#1c2033]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#424a70]/20 rounded-xl text-xs text-[#1c2033] focus:outline-none focus:border-[#424a70]"
                  />
                  <User className="w-3.5 h-3.5 text-[#424a70]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label htmlFor="auth-phone" className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
                  Mobile Contact
                </label>
                <div className="relative">
                  <input
                    id="auth-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 …"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#424a70]/20 rounded-xl text-xs text-[#1c2033] focus:outline-none focus:border-[#424a70]"
                  />
                  <Phone className="w-3.5 h-3.5 text-[#424a70]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
              Email Address *
            </label>
            <div className="relative">
              <input
                    id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#424a70]/20 rounded-xl text-xs text-[#1c2033] focus:outline-none focus:border-[#424a70]"
              />
              <Mail className="w-3.5 h-3.5 text-[#424a70]/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-[10px] uppercase tracking-wider text-[#424a70]/80 font-medium mb-1">
              Password *
            </label>
            <div className="relative">
              <PasswordInput
                    id="auth-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#424a70]/20 rounded-xl text-xs text-[#1c2033] focus:outline-none focus:border-[#424a70]"
              />
              <Lock className="w-3.5 h-3.5 text-[#424a70]/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#424a70] hover:bg-[#4f5987] text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Atelier Access...</span>
              </>
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In to Atelier' : 'Create Patron Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          {tab === 'register' && <p className="text-[10px] text-[#424a70]/70">{PASSWORD_HINT}</p>}
        </form>

        <DemoLogins
          className="mt-4"
          onUse={(e, p) => {
            setTab('login')
            setEmail(e)
            setPassword(p)
            setError('')
          }}
        />

        <div className="mt-5 pt-4 border-t border-[#424a70]/10 text-[11px] text-[#424a70]/70 text-center">
          <Link href="/forgot-password" onClick={() => closeAuthModal()} className="hover:underline">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  )
}
