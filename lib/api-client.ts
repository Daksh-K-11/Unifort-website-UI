/**
 * UNIFORT Atelier Unified API Client
 * Connects frontend services to the backend with automatic JWT attachment,
 * comprehensive error parsing, credentials support, and type safety.
 */

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Array<{ field?: string; message: string }>
  status: number
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`
  }
  return 'http://localhost:5000/api/v1'
}

export const API_BASE_URL = getApiBaseUrl()

// Token storage keys
export const TOKEN_KEY = 'unifort_token'
export const ADMIN_TOKEN_KEY = 'unifort_admin_token'

export const getToken = (preferAdmin = false): string | null => {
  if (typeof window === 'undefined') return null
  if (preferAdmin) {
    const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY)
    if (adminToken) return adminToken
  }
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY) ||
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    null
  )
}

export const setCustomerToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearCustomerToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export const setAdminToken = (token: string): void => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export const clearAdminToken = (): void => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

/**
 * Robust Core Fetch Wrapper
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
  preferAdmin = false
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const token = getToken(preferAdmin)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Set Content-Type to JSON if body is an object and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit',
    })

    let json: any = null
    try {
      json = await res.json()
    } catch {
      // Non-JSON response
    }

    if (!res.ok) {
      const errorMessage =
        json?.message ||
        (json?.errors && Array.isArray(json.errors) ? json.errors.map((e: any) => e.message).join(', ') : null) ||
        `Request failed with status ${res.status}: ${res.statusText}`

      return {
        success: false,
        message: errorMessage,
        errors: json?.errors,
        status: res.status,
      }
    }

    return {
      success: true,
      message: json?.message,
      data: json?.data !== undefined ? json.data : json,
      status: res.status,
    }
  } catch (error: any) {
    console.error(`[API Network Error] ${endpoint}:`, error)
    return {
      success: false,
      message: error?.message || 'Unable to connect to the atelier server. Please verify your connection.',
      status: 0,
    }
  }
}

// Convenience REST methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit, preferAdmin = false) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }, preferAdmin),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit, preferAdmin = false) =>
    apiClient<T>(
      endpoint,
      {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      preferAdmin
    ),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit, preferAdmin = false) =>
    apiClient<T>(
      endpoint,
      {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      preferAdmin
    ),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit, preferAdmin = false) =>
    apiClient<T>(
      endpoint,
      {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      preferAdmin
    ),

  delete: <T = any>(endpoint: string, options?: RequestInit, preferAdmin = false) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }, preferAdmin),
}
