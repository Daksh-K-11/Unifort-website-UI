'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { postLoginPath, useCustomer } from '@/lib/customer-context'
import { api, errorMessage } from '@/lib/api-client'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { DemoLogins } from '@/components/ui/DemoLogins'

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: string | null, fallback = '/account') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

export const PASSWORD_HINT = 'At least 8 characters, with an upper-case letter, a lower-case letter and a number.'

export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw)) return 'Password needs an upper-case letter.'
  if (!/[a-z]/.test(pw)) return 'Password needs a lower-case letter.'
  if (!/[0-9]/.test(pw)) return 'Password needs a number.'
  return null
}

function AuthCard({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="page">
      <section className="section-pad" style={{ display: 'flex', justifyContent: 'center', paddingTop: 48, paddingBottom: 72 }}>
        <div className="contact-form glass-panel" style={{ width: '100%', maxWidth: 440 }}>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display display-small" style={{ marginBottom: 16 }}>
            {title}
          </h1>
          {children}
        </div>
      </section>
    </main>
  )
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" style={{ color: '#b42318', fontSize: 13, margin: '4px 0' }}>
      {message}
    </p>
  )
}

function FormNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="form-success" role="status">
      {message}
    </p>
  )
}

export function LoginForm() {
  const { login, isLoggedIn, authLoading, customer } = useCustomer()
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  // Only an explicitly requested page overrides the role-based default (admin/staff → dashboard).
  const requestedNext = params.get('next') ? next : null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authLoading && isLoggedIn && !busy) router.replace(postLoginPath(customer?.role, requestedNext))
  }, [authLoading, isLoggedIn, busy, customer?.role, requestedNext, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await login(email, password)
    if (res.success) {
      router.replace(postLoginPath(res.role, requestedNext))
      return // keep the button busy while navigating
    }
    setBusy(false)
    setError(res.message || 'Sign in failed.')
  }

  return (
    <AuthCard eyebrow="Welcome back" title={<>Sign <em>in</em></>}>
      <form onSubmit={submit} noValidate>
        <label htmlFor="login-email">
          Email
          <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label htmlFor="login-password">
          Password
          <PasswordInput id="login-password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <FormError message={error} />
        <button className="button" type="submit" disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight />
        </button>
      </form>
      <DemoLogins
        className="mt-4"
        onUse={(e, p) => {
          setEmail(e)
          setPassword(p)
          setError('')
        }}
      />
      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
        <Link href="/forgot-password">Forgot your password?</Link>
        <br />
        New here? <Link href={`/register${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link>
      </p>
    </AuthCard>
  )
}

export function RegisterForm() {
  const { register, isLoggedIn, authLoading } = useCustomer()
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', accept: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authLoading && isLoggedIn && !busy) router.replace(next)
  }, [authLoading, isLoggedIn, next, router, busy])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Please enter a valid email.'
    const pw = passwordProblem(form.password)
    if (pw) errs.password = pw
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    if (!form.accept) errs.accept = 'Please accept the terms to continue.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setError(null)
    setBusy(true)
    const res = await register(form.name, form.email, form.password, form.phone)
    setBusy(false)
    if (res.success) router.replace(next)
    else {
      setErrors(res.errors || {})
      setError(res.message || 'Could not create your account.')
    }
  }

  const fieldErr = (k: string) =>
    errors[k] ? (
      <span id={`reg-${k}-err`} style={{ color: '#b42318', fontSize: 12 }}>
        {errors[k]}
      </span>
    ) : null

  return (
    <AuthCard eyebrow="Join UNIFORT" title={<>Create an <em>account</em></>}>
      <form onSubmit={submit} noValidate>
        <label htmlFor="reg-name">
          Full name
          <input id="reg-name" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby="reg-name-err" />
          {fieldErr('name')}
        </label>
        <label htmlFor="reg-email">
          Email
          <input id="reg-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="reg-email-err" />
          {fieldErr('email')}
        </label>
        <label htmlFor="reg-phone">
          Mobile (optional)
          <input id="reg-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} aria-describedby="reg-phone-err" />
          {fieldErr('phone')}
        </label>
        <label htmlFor="reg-password">
          Password
          <PasswordInput id="reg-password" autoComplete="new-password" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} aria-describedby="reg-password-err reg-pw-hint" />
          <span id="reg-pw-hint" className="muted" style={{ fontSize: 11 }}>
            {PASSWORD_HINT}
          </span>
          {fieldErr('password')}
        </label>
        <label htmlFor="reg-confirm">
          Confirm password
          <PasswordInput id="reg-confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} aria-invalid={!!errors.confirm} aria-describedby="reg-confirm-err" />
          {fieldErr('confirm')}
        </label>
        <label htmlFor="reg-accept" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, textTransform: 'none', letterSpacing: 0 }}>
          <input id="reg-accept" type="checkbox" checked={form.accept} onChange={set('accept')} style={{ width: 'auto', marginTop: 2 }} />
          <span>
            I agree to the <Link href="/terms">terms of sale</Link> and <Link href="/privacy">privacy policy</Link>.
          </span>
        </label>
        {fieldErr('accept')}
        <FormError message={error} />
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'} <ArrowUpRight />
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </AuthCard>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await api.post('/auth/forgot-password', { email })
    setBusy(false)
    if (res.success) setDone(res.message || 'If an account exists for that email, a reset link has been sent.')
    else setError(errorMessage(res))
  }

  return (
    <AuthCard eyebrow="Account help" title={<>Reset your <em>password</em></>}>
      {done ? (
        <>
          <FormNote message={done} />
          <p className="muted" style={{ fontSize: 13 }}>
            The link is valid for 1 hour. Check your spam folder if it does not arrive. <Link href="/login">Back to sign in</Link>
          </p>
        </>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="forgot-email">
            Email
            <input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <FormError message={error} />
          <button className="button" type="submit" disabled={busy || !email}>
            {busy ? 'Sending…' : 'Send reset link'} <ArrowUpRight />
          </button>
        </form>
      )}
    </AuthCard>
  )
}

export function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = passwordProblem(pw) || (pw !== confirm ? 'Passwords do not match.' : null)
    if (problem) return setError(problem)
    setBusy(true)
    setError(null)
    const res = await api.post('/auth/reset-password', { token, password: pw })
    setBusy(false)
    if (res.success) setDone(true)
    else setError(errorMessage(res))
  }

  if (!token) {
    return (
      <AuthCard eyebrow="Account help" title="Invalid link">
        <p className="muted">This reset link is incomplete. Please request a new one.</p>
        <Link className="button" href="/forgot-password">
          Request a new link
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard eyebrow="Account help" title={<>Choose a new <em>password</em></>}>
      {done ? (
        <>
          <FormNote message="Your password has been updated. For security, you have been signed out on all devices." />
          <Link className="button" href="/login">
            Sign in <ArrowUpRight />
          </Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="reset-pw">
            New password
            <PasswordInput id="reset-pw" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <span className="muted" style={{ fontSize: 11 }}>
              {PASSWORD_HINT}
            </span>
          </label>
          <label htmlFor="reset-confirm">
            Confirm new password
            <PasswordInput id="reset-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          <FormError message={error} />
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Update password'} <ArrowUpRight />
          </button>
        </form>
      )}
    </AuthCard>
  )
}

export function VerifyEmail() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const { refreshProfile } = useCustomer()
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!token) {
      setState('error')
      setMessage('This verification link is incomplete.')
      return
    }
    api.post('/auth/verify-email', { token }).then((res) => {
      setState(res.success ? 'ok' : 'error')
      setMessage(res.success ? 'Your email address is confirmed. Thank you!' : errorMessage(res))
      if (res.success) refreshProfile()
    })
  }, [token, refreshProfile])

  return (
    <AuthCard eyebrow="Email confirmation" title={state === 'ok' ? <>Email <em>confirmed</em></> : state === 'error' ? 'Link problem' : 'Confirming…'}>
      {state === 'pending' ? <p className="muted">Please wait a moment.</p> : state === 'ok' ? <FormNote message={message} /> : <FormError message={message} />}
      {state !== 'pending' && (
        <Link className="button" href={state === 'ok' ? '/collection' : '/account'}>
          {state === 'ok' ? 'Continue shopping' : 'Go to my account'} <ArrowUpRight />
        </Link>
      )}
    </AuthCard>
  )
}
