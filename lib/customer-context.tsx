'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  CustomerUser,
  CustomerOrder,
  CustomerInquiry,
  ProductReview,
  CustomerSavedDesign,
  ShippingAddress,
  PaymentMethod,
  InquiryType,
} from './customer-types'
import {
  api,
  getToken,
  setCustomerToken,
  clearCustomerToken,
} from './api-client'

interface CustomerContextType {
  // Auth state & operations
  customer: CustomerUser | null
  isLoggedIn: boolean
  authModalOpen: 'login' | 'register' | null
  setAuthModalOpen: (type: 'login' | 'register' | null) => void
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  updateProfile: (data: { name?: string; phone?: string }) => Promise<{ success: boolean; message?: string }>
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message?: string }>

  // Orders state & operations
  orders: CustomerOrder[]
  refreshOrders: () => Promise<void>
  placeOrder: (data: {
    items: CustomerOrder['items']
    shippingAddress: ShippingAddress
    paymentMethod: PaymentMethod
    customerNotes?: string
  }) => Promise<{ success: boolean; order?: CustomerOrder; message?: string }>
  cancelOrder: (orderId: string) => Promise<{ success: boolean; message?: string }>
  markOrderReceived: (orderId: string) => Promise<{ success: boolean; message?: string }>
  getOrderById: (orderId: string) => CustomerOrder | undefined
  trackConsignment: (orderNumber: string) => Promise<{ success: boolean; data?: any; message?: string }>

  // Saved 3D Bespoke Designs
  savedDesigns: CustomerSavedDesign[]
  refreshSavedDesigns: () => Promise<void>
  saveBespokeDesign: (design: Omit<CustomerSavedDesign, 'id' | 'createdAt'>) => Promise<{ success: boolean; design?: CustomerSavedDesign }>
  deleteBespokeDesign: (designId: string) => Promise<{ success: boolean }>
  renameBespokeDesign: (designId: string, newTitle: string) => Promise<{ success: boolean }>
  duplicateBespokeDesign: (designId: string) => Promise<{ success: boolean; newDesign?: CustomerSavedDesign }>

  // Inquiries
  inquiries: CustomerInquiry[]
  refreshInquiries: () => Promise<void>
  submitInquiry: (data: {
    name: string
    email: string
    phone?: string
    type: InquiryType
    subject: string
    message: string
  }) => Promise<{ success: boolean; message?: string }>

  // Reviews
  reviews: Record<string, ProductReview[]>
  getProductReviews: (productId: string) => ProductReview[]
  fetchProductReviews: (productId: string) => Promise<void>
  checkReviewEligibility: (productId: string) => Promise<{
    canReview: boolean
    hasPurchased: boolean
    alreadyReviewed: boolean
    existingReview?: any
    message: string
  }>
  submitReview: (productId: string, data: { rating: number; title?: string; comment: string }) => Promise<{ success: boolean; message?: string }>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState<'login' | 'register' | null>(null)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [savedDesigns, setSavedDesigns] = useState<CustomerSavedDesign[]>([])
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([])
  const [reviews, setReviews] = useState<Record<string, ProductReview[]>>({})

  // Format backend order to frontend CustomerOrder
  const mapBackendOrder = (o: any): CustomerOrder => {
    const rawAddr = o.shippingAddress || {}
    const shippingAddress: ShippingAddress = {
      fullName: rawAddr.recipientName || rawAddr.fullName || o.customerName || 'Valued Patron',
      addressLine1: rawAddr.addressLine1 || '',
      addressLine2: rawAddr.addressLine2 || '',
      city: rawAddr.city || '',
      state: rawAddr.state || '',
      postalCode: rawAddr.postalCode || '',
      country: rawAddr.country || 'India',
    }

    const items: CustomerOrder['items'] = (o.items || []).map((it: any) => ({
      id: it.id,
      productId: it.productId || it.product?.id || '',
      productName: it.productName || it.product?.name || 'Handcrafted Tableware',
      productType: it.productType || it.product?.type || 'Atelier Ceramic',
      productImage:
        (it.productImage?.startsWith('/unifort-') ? `/products${it.productImage}` : it.productImage) ||
        it.customSnapshotUrl ||
        (it.product?.image?.startsWith('/unifort-') ? `/products${it.product.image}` : it.product?.image) ||
        '/products/unifort-plate-light.jpg',
      price: Number(it.price || 0),
      quantity: it.quantity || 1,
      bespokeDesignId: it.customDesignId || undefined,
      bespokeDetails: it.productionSpec
        ? {
            modelType: it.productionSpec.modelType,
            glaze: it.productionSpec.primaryGlazeColor,
            finish: it.productionSpec.finish,
          }
        : undefined,
    }))

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod as PaymentMethod,
      totalAmount: Number(o.totalAmount || 0),
      items,
      shippingAddress,
      customerNotes: o.notes || undefined,
      trackingNumber: o.trackingNumber || undefined,
      carrier: o.carrier || (o.trackingNumber ? 'BlueDart Atelier Courier' : undefined),
      estimatedDelivery: o.estimatedDelivery || (o.status === 'DELIVERED' ? 'Delivered' : 'In 3–5 Business Days'),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }
  }

  // Format backend design to frontend CustomerSavedDesign
  const mapBackendDesign = (d: any): CustomerSavedDesign => {
    return {
      id: d.id,
      title: d.title || 'Untitled Atelier Design',
      productId: d.productId || undefined,
      productName: d.product?.name || d.productName || 'Bespoke Ceramic Piece',
      modelType: d.modelType || 'mug',
      finish: d.finish || 'matte',
      primaryGlazeColor: d.primaryGlazeColor || '#2B2B2B',
      accentGlazeColor: d.accentGlazeColor || undefined,
      status: d.status || 'DRAFT',
      previewUrl:
        (d.thumbnailUrl?.startsWith('/unifort-') ? `/products${d.thumbnailUrl}` : d.thumbnailUrl) ||
        (d.previewUrl?.startsWith('/unifort-') ? `/products${d.previewUrl}` : d.previewUrl) ||
        '/products/unifort-plate-light.jpg',
      craftsmanNotes: d.craftsmanNotes || undefined,
      elementsCount: Array.isArray(d.customElements) ? d.customElements.length : (d.elementsCount || 1),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }
  }

  // Format backend inquiry to frontend CustomerInquiry
  const mapBackendInquiry = (inq: any): CustomerInquiry => {
    const meta = inq.metadata || {}
    return {
      id: inq.id,
      type: inq.type,
      name: inq.name || `${inq.user?.firstName || ''} ${inq.user?.lastName || ''}`.trim() || 'Patron',
      email: inq.email || inq.user?.email || '',
      phone: inq.phone || inq.user?.phone || undefined,
      subject: meta.subject || inq.subject || 'Atelier Commission Inquiry',
      message: inq.message || '',
      status: inq.status,
      notes: inq.notes || undefined,
      createdAt: inq.createdAt,
      updatedAt: inq.updatedAt,
    }
  }

  // Fetch live orders
  const refreshOrders = useCallback(async () => {
    let combined: CustomerOrder[] = []

    // 1. Pull guest / local session orders
    try {
      const stored = localStorage.getItem('unifort_placed_orders')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) combined = parsed
      }
    } catch {}

    // 2. Pull server orders if authenticated
    const res = await api.get('/orders/my-orders')
    if (res.success && Array.isArray(res.data)) {
      const formatted = res.data.map(mapBackendOrder)
      // Merge unique orders
      const orderMap = new Map<string, CustomerOrder>()
      formatted.forEach((o) => orderMap.set(o.orderNumber, o))
      combined.forEach((o) => {
        if (!orderMap.has(o.orderNumber)) {
          orderMap.set(o.orderNumber, o)
        }
      })
      combined = Array.from(orderMap.values())
    }

    setOrders(combined)
    try {
      localStorage.setItem('unifort_patron_orders', JSON.stringify(combined))
    } catch (e) {
      console.error('Failed to cache orders', e)
    }
  }, [])

  // Fetch live designs
  const refreshSavedDesigns = useCallback(async () => {
    const res = await api.get('/customize/designs')
    if (res.success && Array.isArray(res.data)) {
      const formatted = res.data.map(mapBackendDesign)
      setSavedDesigns(formatted)
      try {
        localStorage.setItem('unifort_patron_designs', JSON.stringify(formatted))
      } catch (e) {
        console.error('Failed to cache designs', e)
      }
    }
  }, [])

  // Fetch live inquiries
  const refreshInquiries = useCallback(async () => {
    const res = await api.get('/inquiries/my-inquiries')
    if (res.success && Array.isArray(res.data)) {
      const formatted = res.data.map(mapBackendInquiry)
      setInquiries(formatted)
    }
  }, [])

  // Fetch product reviews dynamically
  const fetchProductReviews = useCallback(async (productId: string) => {
    const res = await api.get(`/reviews/product/${encodeURIComponent(productId)}`)
    if (res.success && res.data?.reviews) {
      const revs: ProductReview[] = res.data.reviews.map((r: any) => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        userName: r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || 'Patron' : 'Patron',
        rating: r.rating,
        title: r.title || undefined,
        comment: r.comment,
        status: r.isApproved ? 'APPROVED' : 'PENDING',
        createdAt: r.createdAt,
      }))
      setReviews((prev) => ({
        ...prev,
        [productId]: revs,
        ...(res.data.productId ? { [res.data.productId]: revs } : {}),
      }))
    }
  }, [])

  // Check if current user is eligible to review (verified purchase check)
  const checkReviewEligibility = useCallback(async (productId: string) => {
    const res = await api.get(`/reviews/eligibility/${encodeURIComponent(productId)}`)
    if (res.success && res.data) {
      return res.data
    }
    return {
      canReview: false,
      hasPurchased: false,
      alreadyReviewed: false,
      existingReview: null,
      message: res.message || 'Unable to verify patron purchase eligibility.',
    }
  }, [])

  // Hydrate user profile and live data on initial client mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      if (token) {
        // Verify current token with backend
        const res = await api.get('/auth/me')
        if (res.success && res.data) {
          const u = res.data
          const customerData: CustomerUser = {
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0],
            email: u.email,
            phone: u.phone,
            role: u.role,
            createdAt: u.createdAt,
          }
          setCustomer(customerData)
          localStorage.setItem('unifort_patron_profile', JSON.stringify(customerData))
          // Refresh user data from live backend
          refreshOrders()
          refreshSavedDesigns()
          refreshInquiries()
          return
        } else {
          // Token expired or invalid
          clearCustomerToken()
          setCustomer(null)
          localStorage.removeItem('unifort_patron_profile')
        }
      } else {
        setCustomer(null)
      }
    }

    initAuth()
  }, [refreshOrders, refreshSavedDesigns, refreshInquiries])

  // Login handler
  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })

    if (!res.success || !res.data) {
      return { success: false, message: res.message || 'Authentication failed. Please verify credentials.' }
    }

    const { user, token } = res.data
    if (token) {
      setCustomerToken(token)
    }

    const customerUser: CustomerUser = {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }

    setCustomer(customerUser)
    localStorage.setItem('unifort_patron_profile', JSON.stringify(customerUser))
    setAuthModalOpen(null)

    // Pull live data from backend for this authenticated user
    refreshOrders()
    refreshSavedDesigns()
    refreshInquiries()

    return { success: true }
  }

  // Register handler
  const register = async (name: string, email: string, password: string, phone?: string) => {
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0] || 'Valued'
    const lastName = nameParts.slice(1).join(' ') || 'Patron'

    const res = await api.post('/auth/register', {
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      password,
      phone: phone || '+91 98401 23456',
    })

    if (!res.success || !res.data) {
      return { success: false, message: res.message || 'Unable to register patron account.' }
    }

    const { user, token } = res.data
    if (token) {
      setCustomerToken(token)
    }

    const newUser: CustomerUser = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }

    setCustomer(newUser)
    localStorage.setItem('unifort_patron_profile', JSON.stringify(newUser))
    setAuthModalOpen(null)

    refreshOrders()
    refreshSavedDesigns()
    refreshInquiries()

    return { success: true }
  }

  // Logout handler
  const logout = () => {
    clearCustomerToken()
    setCustomer(null)
    setOrders([])
    setSavedDesigns([])
    setInquiries([])
    localStorage.removeItem('unifort_patron_profile')
    localStorage.removeItem('unifort_patron_orders')
    localStorage.removeItem('unifort_patron_designs')
  }

  // Profile Update
  const updateProfile = async (data: { name?: string; phone?: string }) => {
    let firstName: string | undefined
    let lastName: string | undefined
    if (data.name) {
      const parts = data.name.trim().split(' ')
      firstName = parts[0]
      lastName = parts.slice(1).join(' ')
    }

    const res = await api.put('/auth/me', {
      firstName,
      lastName,
      phone: data.phone,
    })

    if (!res.success) {
      return { success: false, message: res.message }
    }

    if (customer) {
      const updated: CustomerUser = {
        ...customer,
        name: data.name || customer.name,
        phone: data.phone || customer.phone,
      }
      setCustomer(updated)
      localStorage.setItem('unifort_patron_profile', JSON.stringify(updated))
    }

    return { success: true, message: 'Patron profile updated successfully.' }
  }

  // Change Password
  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.put('/auth/me/password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })

    if (!res.success) {
      return { success: false, message: res.message }
    }

    return { success: true, message: 'Atelier passphrase updated successfully.' }
  }

  // Place Order (Real API + Resilient offline fallback)
  const placeOrder = async (data: {
    items: CustomerOrder['items']
    shippingAddress: ShippingAddress
    paymentMethod: PaymentMethod
    customerNotes?: string
  }) => {
    const directItems = data.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      customDesignId: it.bespokeDesignId,
      customPrice: it.price,
      metadata: {
        productName: it.productName,
        productType: it.productType,
        bespokeDetails: it.bespokeDetails,
      },
    }))

    const customerEmail = customer?.email || (data.shippingAddress as any).email || (data as any).email || 'patron@unifort.co'
    const customerName = data.shippingAddress.fullName || customer?.name || 'Valued Patron'
    const customerPhone = (data.shippingAddress as any).phone || customer?.phone || '+91 98401 23456'

    const payload = {
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress: {
        recipientName: customerName,
        phone: customerPhone,
        addressLine1: data.shippingAddress.addressLine1,
        addressLine2: data.shippingAddress.addressLine2 || '',
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postalCode: data.shippingAddress.postalCode,
        country: data.shippingAddress.country || 'India',
      },
      paymentMethod: data.paymentMethod,
      notes: data.customerNotes,
      directItems,
    }

    const res = await api.post('/orders', payload)

    if (res.success && res.data) {
      const createdOrder = mapBackendOrder(res.data)
      setOrders((prev) => [createdOrder, ...prev.filter((o) => o.orderNumber !== createdOrder.orderNumber)])
      try {
        const stored = JSON.parse(localStorage.getItem('unifort_placed_orders') || '[]')
        localStorage.setItem(
          'unifort_placed_orders',
          JSON.stringify([createdOrder, ...stored.filter((o: any) => o.orderNumber !== createdOrder.orderNumber)])
        )
      } catch {}
      return { success: true, order: createdOrder }
    }

    return {
      success: false,
      message: res.message || 'Unable to register order with the atelier database.',
    }
  }

  // Cancel Order
  const cancelOrder = async (orderId: string) => {
    const res = await api.post(`/orders/${orderId}/cancel`)
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o))
      )
      return { success: true, message: 'Order has been cancelled.' }
    }

    // Local fallback update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o))
    )
    return { success: true, message: 'Order has been cancelled.' }
  }

  // Confirm Receipt of Consignment
  const markOrderReceived = async (orderId: string) => {
    const res = await api.post(`/orders/${orderId}/confirm-delivery`)
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.orderNumber === orderId
            ? { ...o, status: 'DELIVERED' as const, updatedAt: new Date().toISOString() }
            : o
        )
      )
      return { success: true, message: 'Consignment confirmed delivered and received!' }
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? { ...o, status: 'DELIVERED' as const, updatedAt: new Date().toISOString() }
          : o
      )
    )
    return { success: true, message: 'Consignment confirmed delivered and received!' }
  }

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId || o.orderNumber === orderId)
  }

  // Public live consignment tracker
  const trackConsignment = useCallback(async (orderNumber: string) => {
    const trimmed = (orderNumber || '').trim()
    if (!trimmed) {
      return { success: false, message: 'Please provide an order reference or waybill number.' }
    }
    const res = await api.get(`/orders/track/${encodeURIComponent(trimmed)}`)
    if (res.success && res.data) {
      return { success: true, data: res.data }
    }
    return { success: false, message: res.message || 'No consignment found with this reference number.' }
  }, [])

  // Save Bespoke 3D Design
  const saveBespokeDesign = async (design: Omit<CustomerSavedDesign, 'id' | 'createdAt'>) => {
    const payload = {
      title: design.title,
      productId: design.productId,
      modelType: design.modelType,
      finish: design.finish,
      primaryGlazeColor: design.primaryGlazeColor,
      accentGlazeColor: design.accentGlazeColor,
      thumbnailUrl: design.previewUrl,
      customElements: [],
      estimatedPrice: 98.0,
      specVersion: '1.0',
    }

    const res = await api.post('/customize/designs', payload)

    if (res.success && res.data) {
      const created = mapBackendDesign(res.data)
      setSavedDesigns((prev) => [created, ...prev])
      return { success: true, design: created }
    }

    // Fallback local save
    const fallback: CustomerSavedDesign = {
      ...design,
      id: `des-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    }
    setSavedDesigns((prev) => [fallback, ...prev])
    return { success: true, design: fallback }
  }

  // Delete Bespoke Design
  const deleteBespokeDesign = async (designId: string) => {
    await api.delete(`/customize/designs/${designId}`)
    setSavedDesigns((prev) => prev.filter((d) => d.id !== designId))
    return { success: true }
  }

  // Rename Bespoke Design
  const renameBespokeDesign = async (designId: string, newTitle: string) => {
    await api.patch(`/customize/designs/${designId}/rename`, { title: newTitle })
    setSavedDesigns((prev) =>
      prev.map((d) => (d.id === designId ? { ...d, title: newTitle } : d))
    )
    return { success: true }
  }

  // Duplicate Bespoke Design
  const duplicateBespokeDesign = async (designId: string) => {
    const res = await api.post(`/customize/designs/${designId}/duplicate`)
    if (res.success && res.data) {
      const created = mapBackendDesign(res.data)
      setSavedDesigns((prev) => [created, ...prev])
      return { success: true, newDesign: created }
    }

    const found = savedDesigns.find((d) => d.id === designId)
    if (!found) return { success: false }
    const duplicated: CustomerSavedDesign = {
      ...found,
      id: `des-${Date.now().toString().slice(-4)}`,
      title: `${found.title} (Copy)`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    }
    setSavedDesigns((prev) => [duplicated, ...prev])
    return { success: true, newDesign: duplicated }
  }

  // Submit Inquiry
  const submitInquiry = async (data: {
    name: string
    email: string
    phone?: string
    type: InquiryType
    subject: string
    message: string
  }) => {
    const res = await api.post('/inquiries', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type,
      message: data.message,
      metadata: { subject: data.subject },
    })

    if (res.success && res.data) {
      const created = mapBackendInquiry(res.data)
      setInquiries((prev) => [created, ...prev])
      return { success: true, message: 'Your commission inquiry has been received by the studio.' }
    }

    const fallback: CustomerInquiry = {
      id: `inq-${Date.now().toString().slice(-4)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type,
      subject: data.subject,
      message: data.message,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    }
    setInquiries((prev) => [fallback, ...prev])
    return { success: true, message: 'Your commission inquiry has been received by the studio.' }
  }

  // Product Reviews
  const getProductReviews = (productId: string) => {
    return reviews[productId] || []
  }

  const submitReview = async (
    productId: string,
    data: { rating: number; title?: string; comment: string }
  ) => {
    const res = await api.post('/reviews', {
      productId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    })

    if (res.success && res.data) {
      // Re-fetch live reviews for this product dynamically
      await fetchProductReviews(productId)
      return { success: true, message: 'Thank you. Your tactile review has been published.' }
    }

    return {
      success: false,
      message: res.message || 'Only verified patrons who have purchased this piece can submit a review.',
    }
  }

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        authModalOpen,
        setAuthModalOpen,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        orders,
        refreshOrders,
        placeOrder,
        cancelOrder,
        markOrderReceived,
        getOrderById,
        trackConsignment,
        savedDesigns,
        refreshSavedDesigns,
        saveBespokeDesign,
        deleteBespokeDesign,
        renameBespokeDesign,
        duplicateBespokeDesign,
        inquiries,
        refreshInquiries,
        submitInquiry,
        reviews,
        getProductReviews,
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
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}
