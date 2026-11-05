/**
 * UNIFORT API client.
 *
 * - Authentication uses httpOnly session cookies set by the API; no tokens are
 *   ever stored in JavaScript-accessible storage.
 * - In the browser requests go to the same origin (`/api/v1`), which Next.js
 *   rewrites to the backend (see next.config.mjs). Cookies are therefore
 *   first-party and CORS is not involved.
 * - On a 401 the client transparently refreshes the session once and retries.
 * - Never throws: callers always receive `{ success, data?, message, errors?, status }`.
 */

export interface ApiFieldError {
  field?: string
  message: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  meta?: any
  /** @deprecated use `meta` */
  pagination?: any
  errors?: ApiFieldError[]
  status: number
}

/** Server-side (RSC / route handlers) talk to the API directly; browsers use the same-origin proxy. */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const internal = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    return `${internal.replace(/\/$/, '').replace(/\/api\/v1$/, '')}/api/v1`
  }
  return '/api/v1'
}

export const SESSION_HINT_COOKIE = 'uf_session'
export const SESSION_EXPIRED_EVENT = 'unifort:session-expired'

/** Whether the browser probably has a session (non-sensitive hint cookie set by the API). */
export function hasSessionHint(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${SESSION_HINT_COOKIE}=`))
}

let refreshing: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => (refreshing = null), 0)
      })
  }
  return refreshing
}

const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password']

export async function apiClient<T = any>(endpoint: string, options: RequestInit = {}, _retry = true): Promise<ApiResponse<T>> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${path}`

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(url, { ...options, headers, credentials: 'include', cache: 'no-store' })
  } catch {
    return { success: false, status: 0, message: 'We could not reach the server. Please check your connection and try again.' }
  }

  if (res.status === 401 && _retry && typeof window !== 'undefined' && !NO_REFRESH.some((p) => path.startsWith(p)) && hasSessionHint()) {
    const ok = await refreshSession()
    if (ok) return apiClient<T>(endpoint, options, false)
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }

  let json: any = null
  try {
    json = await res.json()
  } catch {
    // non-JSON (e.g. proxy error page)
  }

  if (!res.ok) {
    return {
      success: false,
      status: res.status,
      message:
        json?.message ||
        (res.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : res.status >= 500
            ? 'Something went wrong on our side. Please try again.'
            : `Request failed (${res.status})`),
      errors: Array.isArray(json?.errors) ? json.errors : undefined,
    }
  }

  return {
    success: true,
    status: res.status,
    message: json?.message,
    data: json && 'data' in json ? json.data : json,
    meta: json?.meta,
    pagination: json?.meta,
  }
}

const withBody = (method: string) => <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
  apiClient<T>(endpoint, {
    ...options,
    method,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => apiClient<T>(endpoint, { ...options, method: 'GET' }),
  post: withBody('POST'),
  put: withBody('PUT'),
  patch: withBody('PATCH'),
  delete: <T = any>(endpoint: string, options?: RequestInit) => apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
  /** multipart upload: field name "file" */
  upload: <T = any>(endpoint: string, file: Blob, fields: Record<string, string> = {}, filename = 'upload') => {
    const fd = new FormData()
    fd.append('file', file, (file as File).name || filename)
    for (const [k, v] of Object.entries(fields)) fd.append(k, v)
    return apiClient<T>(endpoint, { method: 'POST', body: fd })
  },
}

/** First human-readable error from a response (field errors first). */
export function errorMessage(res: ApiResponse, fallback = 'Something went wrong. Please try again.') {
  return res.errors?.[0]?.message || res.message || fallback
}

/** Map API field errors to { field: message } for inline form errors. */
export function fieldErrors(res: ApiResponse): Record<string, string> {
  const out: Record<string, string> = {}
  for (const e of res.errors || []) if (e.field && !out[e.field]) out[e.field] = e.message
  return out
}

/**
 * Resolve media paths. Uploaded files ("/uploads/…") and catalogue images ("/products/…")
 * are served from the storefront origin; absolute https URLs are passed through.
 */
export function mediaUrl(src?: string | null, fallback = '/products/unifort-plate-light.jpg'): string {
  if (!src) return fallback
  if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('/')) return src
  return `/${src}`
}

export const formatINR = (n: number | null | undefined) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: Number(n || 0) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
