'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  CustomerUser,
  CustomerOrder,
  CustomerInquiry,
  ProductReview,
  CustomerSavedDesign,
  InquiryType,
} from './customer-types'
import { api, errorMessage, hasSessionHint, mediaUrl, SESSION_EXPIRED_EVENT } from './api-client'

type Result<T = undefined> = { success: boolean; message?: string; errors?: Record<string, string> } & (T extends undefined ? Record<never, never> : Partial<T>)

interface CustomerContextType {
  customer: CustomerUser | null
  isLoggedIn: boolean
  /** True until the initial session check has finished. */
  authLoading: boolean
  authModalOpen: 'login' | 'register' | null
  setAuthModalOpen: (type: 'login' | 'register' | null) => void
  /** Why the sign-in dialog was opened (e.g. "Sign in to add this to your bag"). */
  authReason: string | null
  /**
   * Gate an action behind an account. Signed in: returns true (run the action yourself).
   * Otherwise opens the sign-in dialog with the reason, returns false, and runs
   * `onSignedIn` once the person signs in or creates an account.
   */
  requireAuth: (reason: string, onSignedIn?: () => void) => boolean
  /** Close the sign-in dialog without signing in (drops any queued action). */
  closeAuthModal: () => void
  login: (email: string, password: string) => Promise<Result & { role?: CustomerUser['role'] }>
  register: (name: string, email: string, password: string, phone?: string) => Promise<Result>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: { name?: string; phone?: string }) => Promise<Result>
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<Result>
  resendVerification: () => Promise<Result>

  orders: CustomerOrder[]
  ordersLoading: boolean
  refreshOrders: () => Promise<void>
  cancelOrder: (orderId: string, reason?: string) => Promise<Result>
  markOrderReceived: (orderId: string) => Promise<Result>
  getOrderById: (orderId: string) => CustomerOrder | undefined

  savedDesigns: CustomerSavedDesign[]
  designsLoading: boolean
  refreshSavedDesigns: () => Promise<void>
  deleteBespokeDesign: (designId: string) => Promise<Result>
  renameBespokeDesign: (designId: string, newTitle: string) => Promise<Result>
  duplicateBespokeDesign: (designId: string) => Promise<Result<{ newDesign: CustomerSavedDesign }>>

  inquiries: CustomerInquiry[]
  refreshInquiries: () => Promise<void>
  submitInquiry: (data: { name: string; email: string; phone?: string; type: InquiryType; subject: string; message: string; website?: string }) => Promise<Result>

  reviews: Record<string, ProductReview[]>
  reviewStats: Record<string, { averageRating: number; count: number }>
  getProductReviews: (productId: string) => ProductReview[]
  fetchProductReviews: (productId: string) => Promise<void>
  checkReviewEligibility: (productId: string) => Promise<{
    canReview: boolean
    hasPurchased: boolean
    alreadyReviewed: boolean
    existingReview?: any
    message: string
  }>
  submitReview: (productId: string, data: { rating: number; title?: string; comment: string }) => Promise<Result>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

/** Local keys that belong to a signed-in person and must not survive sign-out. */
const PERSONAL_STORAGE_KEYS = ['unifort_bag_v3', 'unifort_custom_designs_v1', 'unifort_studio_draft_v1', 'unifort_last_order']

export const isStaffRole = (role?: string | null) => role === 'ADMIN' || role === 'STAFF'

/**
 * Where to send someone after signing in: an explicitly requested page wins;
 * otherwise staff and admins go to the dashboard and customers to their account.
 */
export function postLoginPath(role: string | undefined | null, requestedNext: string | null) {
  if (requestedNext) return requestedNext
  return isStaffRole(role) ? '/admin' : '/account'
}

export function mapUser(u: any): CustomerUser {
  return {
    id: u.id,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    email: u.email,
    phone: u.phone || undefined,
    role: u.role,
    emailVerified: !!u.emailVerifiedAt,
    addresses: Array.isArray(u.addresses) ? u.addresses : [],
    createdAt: u.createdAt,
  }
}

export function mapBackendOrder(o: any): CustomerOrder {
  const a = o.shippingAddress || {}
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    subtotal: Number(o.subtotal || 0),
    discount: Number(o.discount || 0),
    shippingFee: Number(o.shippingFee || 0),
    tax: Number(o.tax || 0),
    totalAmount: Number(o.totalAmount || 0),
    refundedAmount: Number(o.refundedAmount || 0),
    couponCode: o.couponCode,
    items: (o.items || []).map((it: any) => ({
      id: it.id,
      productId: it.productId || '',
      productSlug: it.productSlug || it.product?.slug || null,
      productName: it.productName,
      productType: it.productType || undefined,
      productImage: mediaUrl(it.customSnapshotUrl || it.productImage),
      price: Number(it.price || 0),
      totalPrice: Number(it.totalPrice || 0),
      quantity: it.quantity || 1,
      bespokeDesignId: it.customDesignId || undefined,
      customerInstructions: it.metadata?.customerInstructions || undefined,
    })),
    shippingAddress: {
      fullName: a.recipientName || o.customerName || '',
      phone: a.phone,
      addressLine1: a.addressLine1 || '',
      addressLine2: a.addressLine2 || '',
      city: a.city || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || 'India',
    },
    customerNotes: o.notes || undefined,
    trackingNumber: o.trackingNumber || undefined,
    carrier: o.carrier || undefined,
    canCancel: !!o.canCancel,
    canConfirmDelivery: !!o.canConfirmDelivery,
    canPay: !!o.canPay,
    paymentExpiresAt: o.paymentExpiresAt,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    cancelledAt: o.cancelledAt,
    updatedAt: o.updatedAt,
  }
}

export function mapBackendDesign(d: any): CustomerSavedDesign {
  const state = d.state || {}
  return {
    id: d.id,
    title: d.title,
    productId: d.productId || undefined,
    productSlug: d.product?.slug || state.productId,
    productName: d.product?.name || d.productName,
    modelType: d.modelType,
    finish: state.finish || 'satin',
    primaryGlazeColor: state.colors?.body || '#2B2B2B',
    accentGlazeColor: state.colors?.accent,
    status: d.status,
    editable: d.editable ?? ['DRAFT', 'SAVED', 'REJECTED'].includes(d.status),
    estimatedPrice: Number(d.estimatedPrice || 0),
    previewUrl: mediaUrl(d.thumbnailUrl || d.product?.image),
    craftsmanNotes: d.craftsmanNotes || undefined,
    elementsCount: Array.isArray(state.elements) ? state.elements.length : 0,
    customerInstructions: d.customerInstructions || undefined,
    state,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

function mapBackendInquiry(inq: any): CustomerInquiry {
  return {
    id: inq.id,
    type: inq.type,
    name: inq.name,
    email: inq.email,
    phone: inq.phone || undefined,
    subject: inq.type?.replace(/_/g, ' ').toLowerCase() || 'Inquiry',
    message: inq.message,
    status: inq.status,
    createdAt: inq.createdAt,
    updatedAt: inq.updatedAt,
  }
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authModalOpen, setAuthModalOpenState] = useState<'login' | 'register' | null>(null)
  const [authReason, setAuthReason] = useState<string | null>(null)
  const pendingAction = useRef<(() => void) | null>(null)
  const setAuthModalOpen = useCallback((type: 'login' | 'register' | null) => {
    setAuthModalOpenState(type)
    if (!type) setAuthReason(null)
  }, [])
  /** Dialog dismissed without signing in: forget the queued action. */
  const closeAuthModal = useCallback(() => {
    pendingAction.current = null
    setAuthModalOpen(null)
  }, [setAuthModalOpen])
  const runPendingAction = useCallback((role?: string | null) => {
    const action = pendingAction.current
    pendingAction.current = null
    // Staff are sent to the dashboard instead of continuing a shopping action.
    if (action && !(role === 'ADMIN' || role === 'STAFF')) setTimeout(action, 0)
  }, [])
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [savedDesigns, setSavedDesigns] = useState<CustomerSavedDesign[]>([])
  const [designsLoading, setDesignsLoading] = useState(false)
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([])
  const [reviews, setReviews] = useState<Record<string, ProductReview[]>>({})
  const [reviewStats, setReviewStats] = useState<Record<string, { averageRating: number; count: number }>>({})

  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true)
    const res = await api.get('/orders/my-orders?limit=50')
    if (res.success && Array.isArray(res.data)) setOrders(res.data.map(mapBackendOrder))
    setOrdersLoading(false)
  }, [])

  const refreshSavedDesigns = useCallback(async () => {
    setDesignsLoading(true)
    const res = await api.get('/customize/designs?limit=100')
    if (res.success && Array.isArray(res.data)) setSavedDesigns(res.data.map(mapBackendDesign))
    setDesignsLoading(false)
  }, [])

  const refreshInquiries = useCallback(async () => {
    const res = await api.get('/inquiries/my-inquiries')
    if (res.success && Array.isArray(res.data)) setInquiries(res.data.map(mapBackendInquiry))
  }, [])

  const loadAccountData = useCallback(() => {
    refreshOrders()
    refreshSavedDesigns()
    refreshInquiries()
  }, [refreshOrders, refreshSavedDesigns, refreshInquiries])

  const clearPersonalState = useCallback(() => {
    setCustomer(null)
    setOrders([])
    setSavedDesigns([])
    setInquiries([])
    try {
      PERSONAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k))
      sessionStorage.clear()
    } catch {}
  }, [])

  const refreshProfile = useCallback(async () => {
    const res = await api.get('/auth/me')
    if (res.success && res.data) setCustomer(mapUser(res.data))
  }, [])

  // Initial session check (cookie based)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!hasSessionHint()) {
        // Guests may still have designs saved on this browser.
        refreshSavedDesigns()
        setAuthLoading(false)
        return
      }
      const res = await api.get('/auth/me')
      if (cancelled) return
      if (res.success && res.data) {
        setCustomer(mapUser(res.data))
        loadAccountData()
      } else if (res.status === 401) {
        setCustomer(null)
      }
      setAuthLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadAccountData, refreshSavedDesigns])

  // The API client fires this when a refresh fails: the session is gone.
  useEffect(() => {
    const onExpired = () => setCustomer((c) => (c ? null : c))
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const login = async (email: string, password: string): Promise<Result & { role?: CustomerUser['role'] }> => {
    const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password })
    if (!res.success || !res.data?.user) return { success: false, message: errorMessage(res, 'Sign in failed.') }
    const user = mapUser(res.data.user)
    setCustomer(user)
    setAuthModalOpen(null)
    loadAccountData()
    runPendingAction(user.role)
    return { success: true, role: user.role }
  }

  const register = async (name: string, email: string, password: string, phone?: string): Promise<Result> => {
    const parts = name.trim().split(/\s+/)
    const res = await api.post('/auth/register', {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '-',
      email: email.trim().toLowerCase(),
      password,
      ...(phone?.trim() && { phone: phone.trim() }),
    })
    if (!res.success || !res.data?.user) {
      const errs: Record<string, string> = {}
      res.errors?.forEach((e) => e.field && (errs[e.field] = e.message))
      return { success: false, message: errorMessage(res, 'Could not create your account.'), errors: errs }
    }
    const user = mapUser(res.data.user)
    setCustomer(user)
    setAuthModalOpen(null)
    loadAccountData()
    runPendingAction(user.role)
    return { success: true, message: res.message }
  }

  const requireAuth = useCallback(
    (reason: string, onSignedIn?: () => void) => {
      if (customer) return true
      pendingAction.current = onSignedIn || null
      setAuthReason(reason)
      setAuthModalOpenState('login')
      return false
    },
    [customer]
  )

  const logout = async () => {
    await api.post('/auth/logout')
    clearPersonalState()
    window.dispatchEvent(new Event('unifort:logged-out'))
  }

  const updateProfile = async (data: { name?: string; phone?: string }): Promise<Result> => {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) {
      const parts = data.name.trim().split(/\s+/)
      payload.firstName = parts[0]
      payload.lastName = parts.slice(1).join(' ') || '-'
    }
    if (data.phone !== undefined) payload.phone = data.phone.trim()
    const res = await api.put('/auth/me', payload)
    if (!res.success) return { success: false, message: errorMessage(res) }
    setCustomer(mapUser(res.data))
    return { success: true, message: 'Profile updated.' }
  }

  const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<Result> => {
    const res = await api.put('/auth/me/password', data)
    return res.success ? { success: true, message: res.message } : { success: false, message: errorMessage(res) }
  }

  const resendVerification = async (): Promise<Result> => {
    const res = await api.post('/auth/resend-verification')
    return { success: res.success, message: res.success ? 'Verification email sent.' : errorMessage(res) }
  }

  const replaceOrder = (o: any) => {
    const mapped = mapBackendOrder(o)
    setOrders((prev) => prev.map((x) => (x.id === mapped.id ? mapped : x)))
  }

  const cancelOrder = async (orderId: string, reason?: string): Promise<Result> => {
    const res = await api.post(`/orders/${orderId}/cancel`, { reason })
    if (!res.success) return { success: false, message: errorMessage(res) }
    replaceOrder(res.data)
    return { success: true, message: 'Your order has been cancelled.' }
  }

  const markOrderReceived = async (orderId: string): Promise<Result> => {
    const res = await api.post(`/orders/${orderId}/confirm-delivery`)
    if (!res.success) return { success: false, message: errorMessage(res) }
    replaceOrder(res.data)
    return { success: true, message: 'Thanks for confirming delivery.' }
  }

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId || o.orderNumber === orderId)

  const deleteBespokeDesign = async (designId: string): Promise<Result> => {
    const res = await api.delete(`/customize/designs/${designId}`)
    if (!res.success) return { success: false, message: errorMessage(res) }
    setSavedDesigns((prev) => prev.filter((d) => d.id !== designId))
    return { success: true }
  }

  const renameBespokeDesign = async (designId: string, title: string): Promise<Result> => {
    const res = await api.patch(`/customize/designs/${designId}/rename`, { title })
    if (!res.success) return { success: false, message: errorMessage(res) }
    setSavedDesigns((prev) => prev.map((d) => (d.id === designId ? { ...d, title } : d)))
    return { success: true }
  }

  const duplicateBespokeDesign = async (designId: string) => {
    const res = await api.post(`/customize/designs/${designId}/duplicate`)
    if (!res.success) return { success: false, message: errorMessage(res) }
    const created = mapBackendDesign(res.data)
    setSavedDesigns((prev) => [created, ...prev])
    return { success: true, newDesign: created }
  }

  const submitInquiry: CustomerContextType['submitInquiry'] = async (data) => {
    const subject = data.subject?.trim()
    const res = await api.post('/inquiries', {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      type: data.type,
      website: data.website || '',
      message: subject ? `${subject}\n\n${data.message}` : data.message,
    })
    if (!res.success) {
      const errs: Record<string, string> = {}
      res.errors?.forEach((e) => e.field && (errs[e.field] = e.message))
      return { success: false, message: errorMessage(res, 'Your message could not be sent. Please try again or email us.'), errors: errs }
    }
    if (customer && res.data) setInquiries((prev) => [mapBackendInquiry(res.data), ...prev])
    return { success: true, message: res.message }
  }

  const fetchProductReviews = useCallback(async (productId: string) => {
    const res = await api.get(`/reviews/product/${encodeURIComponent(productId)}?limit=50`)
    if (res.success && res.data?.reviews) {
      const revs: ProductReview[] = res.data.reviews.map((r: any) => ({
        id: r.id,
        productId,
        userName: r.authorName,
        rating: r.rating,
        title: r.title || undefined,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
      }))
      setReviews((prev) => ({ ...prev, [productId]: revs }))
      setReviewStats((prev) => ({ ...prev, [productId]: { averageRating: res.data.averageRating, count: res.data.count } }))
    }
  }, [])

  const checkReviewEligibility = useCallback(async (productId: string) => {
    const res = await api.get(`/reviews/eligibility/${encodeURIComponent(productId)}`)
    if (res.success && res.data) return res.data
    return { canReview: false, hasPurchased: false, alreadyReviewed: false, existingReview: null, message: errorMessage(res, 'Please sign in to review.') }
  }, [])

  const submitReview = async (productId: string, data: { rating: number; title?: string; comment: string }): Promise<Result> => {
    const res = await api.post('/reviews', { productId, ...data })
    if (!res.success) return { success: false, message: errorMessage(res) }
    await fetchProductReviews(productId)
    return { success: true, message: res.message || 'Thank you! Your review will appear once approved.' }
  }

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        authLoading,
        authModalOpen,
        setAuthModalOpen,
        authReason,
        requireAuth,
        closeAuthModal,
        login,
        register,
        logout,
        refreshProfile,
        updateProfile,
        changePassword,
        resendVerification,
        orders,
        ordersLoading,
        refreshOrders,
        cancelOrder,
        markOrderReceived,
        getOrderById,
        savedDesigns,
        designsLoading,
        refreshSavedDesigns,
        deleteBespokeDesign,
        renameBespokeDesign,
        duplicateBespokeDesign,
        inquiries,
        refreshInquiries,
        submitInquiry,
        reviews,
        reviewStats,
        getProductReviews: (id: string) => reviews[id] || [],
        fetchProductReviews,
        checkReviewEligibility,
        submitReview,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomer must be used within a CustomerProvider')
  return context
}
