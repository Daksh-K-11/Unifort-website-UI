'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
  placeOrder: (data: {
    items: CustomerOrder['items']
    shippingAddress: ShippingAddress
    paymentMethod: PaymentMethod
    customerNotes?: string
  }) => Promise<{ success: boolean; order?: CustomerOrder; message?: string }>
  cancelOrder: (orderId: string) => Promise<{ success: boolean; message?: string }>
  markOrderReceived: (orderId: string) => Promise<{ success: boolean; message?: string }>
  getOrderById: (orderId: string) => CustomerOrder | undefined

  // Saved 3D Bespoke Designs
  savedDesigns: CustomerSavedDesign[]
  saveBespokeDesign: (design: Omit<CustomerSavedDesign, 'id' | 'createdAt'>) => Promise<{ success: boolean; design?: CustomerSavedDesign }>
  deleteBespokeDesign: (designId: string) => Promise<{ success: boolean }>
  renameBespokeDesign: (designId: string, newTitle: string) => Promise<{ success: boolean }>
  duplicateBespokeDesign: (designId: string) => Promise<{ success: boolean; newDesign?: CustomerSavedDesign }>

  // Inquiries
  inquiries: CustomerInquiry[]
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
  submitReview: (productId: string, data: { rating: number; title?: string; comment: string }) => Promise<{ success: boolean; message?: string }>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

const INITIAL_DEMO_CUSTOMER: CustomerUser = {
  id: 'usr-patron-01',
  name: 'Elena Vance',
  email: 'elena@vance.design',
  phone: '+91 98401 23456',
  role: 'CUSTOMER',
  createdAt: '2025-11-14T10:30:00.000Z',
}

const INITIAL_DEMO_ORDERS: CustomerOrder[] = [
  {
    id: 'ord-8910',
    orderNumber: 'UNI-2026-8910',
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    totalAmount: 180,
    items: [
      {
        id: 'item-1',
        productId: 'prod-001',
        productName: 'No. 01 Obsidian Plate',
        productType: 'Dinner plate · 28 cm',
        productImage: '/unifort-plate-light.jpg',
        price: 84,
        quantity: 2,
      },
      {
        id: 'item-2',
        productId: 'prod-002',
        productName: 'No. 12 Basalt Bowl',
        productType: 'Stoneware · 22 cm',
        productImage: '/unifort-bowl-light.jpg',
        price: 96,
        quantity: 1,
      },
    ],
    shippingAddress: {
      fullName: 'Elena Vance',
      addressLine1: '42 Boat Club Road',
      addressLine2: 'Apt 4B, Coastal Pavilions',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600028',
      country: 'India',
    },
    customerNotes: 'Please pack in signature cedar gift casing with unbleached linen wrap.',
    trackingNumber: 'BLUEDART-EXP-992140',
    carrier: 'BlueDart Express Fine Cargo',
    estimatedDelivery: 'Oct 29, 2026',
    createdAt: '2026-10-24T16:20:00.000Z',
  },
  {
    id: 'ord-6742',
    orderNumber: 'UNI-2026-6742',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'CARD',
    totalAmount: 272,
    items: [
      {
        id: 'item-3',
        productId: 'prod-003',
        productName: 'No. 04 Violet Tumbler (Set of 2)',
        productType: 'Hand-blown glass · 320 ml',
        productImage: '/unifort-tumbler-light.jpg',
        price: 124,
        quantity: 1,
      },
      {
        id: 'item-4',
        productId: 'prod-004',
        productName: 'No. 07 Arc Carafe',
        productType: 'Smoked glass · 1.2 L',
        productImage: '/unifort-carafe-light.jpg',
        price: 148,
        quantity: 1,
      },
    ],
    shippingAddress: {
      fullName: 'Elena Vance',
      addressLine1: '42 Boat Club Road',
      addressLine2: 'Apt 4B, Coastal Pavilions',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600028',
      country: 'India',
    },
    trackingNumber: 'DTDC-PREM-881204',
    carrier: 'DTDC Atelier Direct',
    estimatedDelivery: 'Oct 18, 2026',
    createdAt: '2026-10-15T11:15:00.000Z',
  },
]

const INITIAL_SAVED_DESIGNS: CustomerSavedDesign[] = [
  {
    id: 'des-custom-01',
    title: 'Terracotta & Slate Espresso Mug',
    productName: 'Ceramic Studio Mug',
    modelType: 'mug',
    finish: 'matte',
    primaryGlazeColor: '#8c4e36',
    accentGlazeColor: '#2b2f3a',
    status: 'IN_PRODUCTION',
    craftsmanNotes: 'Kiln reduction firing scheduled at 1280°C. Verified satin finish and 300 DPI metallic decal alignment.',
    elementsCount: 2,
    createdAt: '2026-10-22T09:40:00.000Z',
  },
  {
    id: 'des-custom-02',
    title: 'Obsidian & Gold Leaf Banquet Platter',
    productName: 'Dinner Plate',
    modelType: 'plate',
    finish: 'glossy',
    primaryGlazeColor: '#1a1c23',
    accentGlazeColor: '#d4af37',
    status: 'DRAFT',
    elementsCount: 3,
    createdAt: '2026-10-25T14:10:00.000Z',
  },
]

const INITIAL_INQUIRIES: CustomerInquiry[] = [
  {
    id: 'inq-9102',
    type: 'HOSPITALITY_COMMISSION',
    name: 'Elena Vance',
    email: 'elena@vance.design',
    phone: '+91 98401 23456',
    subject: 'Bespoke tableware collection for 24-seat boutique tasting room',
    message: 'We are curating a private dining salon in Chennai and require 48 stoneware reduction plates and matching basalt carafes with custom debossed monogram.',
    status: 'IN_PROGRESS',
    notes: 'Studio director contacted client with sample glaze swatches. Production quote sent for review.',
    createdAt: '2026-10-21T15:00:00.000Z',
  },
]

const INITIAL_REVIEWS: Record<string, ProductReview[]> = {
  'No. 01 Obsidian Plate': [
    {
      id: 'rev-01',
      productId: 'No. 01 Obsidian Plate',
      userName: 'Kavitha R.',
      rating: 5,
      title: 'Incredible reduction-fired tactile weight',
      comment: 'The matte slate finish catches natural candle light beautifully. Exceeded all our banquet expectations.',
      status: 'APPROVED',
      createdAt: '2026-10-18T10:00:00.000Z',
    },
    {
      id: 'rev-02',
      productId: 'No. 01 Obsidian Plate',
      userName: 'Marcus Sterling',
      rating: 5,
      title: 'Remarkable architectural rim profile',
      comment: 'Dense, substantial stoneware with an organic lip that feels effortless to hold. Pairs impeccably with linen.',
      status: 'APPROVED',
      createdAt: '2026-10-12T14:30:00.000Z',
    },
  ],
  'No. 04 Violet Tumbler': [
    {
      id: 'rev-03',
      productId: 'No. 04 Violet Tumbler',
      userName: 'Ananya Deshmukh',
      rating: 5,
      title: 'Subtle atmospheric smoked violet tint',
      comment: 'The fluted texture refracts afternoon sun like liquid amber. Perfectly balanced in hand.',
      status: 'APPROVED',
      createdAt: '2026-10-14T16:45:00.000Z',
    },
  ],
  'No. 07 Arc Carafe': [
    {
      id: 'rev-04',
      productId: 'No. 07 Arc Carafe',
      userName: 'Rohit K.',
      rating: 5,
      title: 'Pours with crisp, zero-drip precision',
      comment: 'A showpiece on the long table. The glass is thin yet resilient, with deep smoked translucency.',
      status: 'APPROVED',
      createdAt: '2026-10-09T18:20:00.000Z',
    },
  ],
  'No. 12 Basalt Bowl': [
    {
      id: 'rev-05',
      productId: 'No. 12 Basalt Bowl',
      userName: 'Devika M.',
      rating: 5,
      title: 'Substantial volcanic mineral texture',
      comment: 'Deep, satisfying volume. Keeps broths and slow-braised dishes warm throughout unhurried dinners.',
      status: 'APPROVED',
      createdAt: '2026-10-16T12:10:00.000Z',
    },
  ],
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(INITIAL_DEMO_CUSTOMER)
  const [authModalOpen, setAuthModalOpen] = useState<'login' | 'register' | null>(null)
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_DEMO_ORDERS)
  const [savedDesigns, setSavedDesigns] = useState<CustomerSavedDesign[]>(INITIAL_SAVED_DESIGNS)
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(INITIAL_INQUIRIES)
  const [reviews, setReviews] = useState<Record<string, ProductReview[]>>(INITIAL_REVIEWS)

  // Load from localStorage if present
  useEffect(() => {
    try {
      const storedCustomer = localStorage.getItem('unifort_patron_profile')
      if (storedCustomer) {
        setCustomer(JSON.parse(storedCustomer))
      }
      const storedOrders = localStorage.getItem('unifort_patron_orders')
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders))
      }
      const storedDesigns = localStorage.getItem('unifort_patron_designs')
      if (storedDesigns) {
        setSavedDesigns(JSON.parse(storedDesigns))
      }
    } catch (e) {
      console.error('Failed to load customer state from localStorage', e)
    }
  }, [])

  // Persist customer profile changes
  useEffect(() => {
    try {
      if (customer) {
        localStorage.setItem('unifort_patron_profile', JSON.stringify(customer))
      } else {
        localStorage.removeItem('unifort_patron_profile')
      }
    } catch (e) {
      console.error('Failed to persist customer profile', e)
    }
  }, [customer])

  // Persist customer orders
  useEffect(() => {
    try {
      localStorage.setItem('unifort_patron_orders', JSON.stringify(orders))
    } catch (e) {
      console.error('Failed to persist customer orders', e)
    }
  }, [orders])

  // Persist customer designs
  useEffect(() => {
    try {
      localStorage.setItem('unifort_patron_designs', JSON.stringify(savedDesigns))
    } catch (e) {
      console.error('Failed to persist customer designs', e)
    }
  }, [savedDesigns])

  // Mock Login (Matches POST /api/v1/auth/login)
  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 450))
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid patron email address.' }
    }
    const loggedUser: CustomerUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: email.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      phone: '+91 98401 23456',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
    }
    setCustomer(loggedUser)
    setAuthModalOpen(null)
    return { success: true }
  }

  // Mock Register (Matches POST /api/v1/auth/register)
  const register = async (name: string, email: string, _password: string, phone?: string) => {
    await new Promise((r) => setTimeout(r, 550))
    if (!name.trim() || !email.trim()) {
      return { success: false, message: 'Please fill in all required fields.' }
    }
    const newUser: CustomerUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name,
      email,
      phone: phone || '+91 98401 23456',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
    }
    setCustomer(newUser)
    setAuthModalOpen(null)
    return { success: true }
  }

  const logout = () => {
    setCustomer(null)
    localStorage.removeItem('unifort_patron_profile')
  }

  // Mock Profile Update (Matches PUT /api/v1/auth/me)
  const updateProfile = async (data: { name?: string; phone?: string }) => {
    await new Promise((r) => setTimeout(r, 350))
    if (!customer) return { success: false, message: 'Not authenticated.' }
    setCustomer({
      ...customer,
      name: data.name || customer.name,
      phone: data.phone || customer.phone,
    })
    return { success: true, message: 'Patron profile updated successfully.' }
  }

  // Mock Change Password (Matches PUT /api/v1/auth/me/password)
  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await new Promise((r) => setTimeout(r, 400))
    if (data.newPassword.length < 6) {
      return { success: false, message: 'New passphrase must be at least 6 characters.' }
    }
    return { success: true, message: 'Atelier passphrase updated successfully.' }
  }

  // Mock Place Order (Matches POST /api/v1/orders)
  const placeOrder = async (data: {
    items: CustomerOrder['items']
    shippingAddress: ShippingAddress
    paymentMethod: PaymentMethod
    customerNotes?: string
  }) => {
    await new Promise((r) => setTimeout(r, 600))
    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const newOrder: CustomerOrder = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      orderNumber: `UNI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: data.paymentMethod,
      totalAmount,
      items: data.items,
      shippingAddress: data.shippingAddress,
      customerNotes: data.customerNotes,
      trackingNumber: `UNI-AIR-${Math.floor(100000 + Math.random() * 900000)}`,
      carrier: 'BlueDart Atelier Courier',
      estimatedDelivery: 'In 3–5 Business Days',
      createdAt: new Date().toISOString(),
    }
    setOrders((prev) => [newOrder, ...prev])
    return { success: true, order: newOrder }
  }

  // Mock Cancel Order (Matches POST /api/v1/orders/:id/cancel)
  const cancelOrder = async (orderId: string) => {
    await new Promise((r) => setTimeout(r, 350))
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o))
    )
    return { success: true, message: 'Order has been cancelled.' }
  }

  // Confirm Receipt of Consignment (Matches POST /api/v1/orders/:id/confirm-delivery)
  const markOrderReceived = async (orderId: string) => {
    await new Promise((r) => setTimeout(r, 450))
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? { ...o, status: 'DELIVERED' as const, updatedAt: new Date().toISOString() }
          : o
      )
    )
    return { success: true, message: 'Consignment marked as delivered and received!' }
  }

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId || o.orderNumber === orderId)
  }

  // Mock Save Bespoke Design (Matches POST /api/v1/customize/designs)
  const saveBespokeDesign = async (design: Omit<CustomerSavedDesign, 'id' | 'createdAt'>) => {
    const created: CustomerSavedDesign = {
      ...design,
      id: `des-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    }
    setSavedDesigns((prev) => [created, ...prev])
    return { success: true, design: created }
  }

  const deleteBespokeDesign = async (designId: string) => {
    setSavedDesigns((prev) => prev.filter((d) => d.id !== designId))
    return { success: true }
  }

  const renameBespokeDesign = async (designId: string, newTitle: string) => {
    setSavedDesigns((prev) =>
      prev.map((d) => (d.id === designId ? { ...d, title: newTitle } : d))
    )
    return { success: true }
  }

  const duplicateBespokeDesign = async (designId: string) => {
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

  // Mock Submit Inquiry (Matches POST /api/v1/inquiries)
  const submitInquiry = async (data: {
    name: string
    email: string
    phone?: string
    type: InquiryType
    subject: string
    message: string
  }) => {
    await new Promise((r) => setTimeout(r, 450))
    const newInq: CustomerInquiry = {
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
    setInquiries((prev) => [newInq, ...prev])
    return { success: true, message: 'Your commission inquiry has been received by the studio.' }
  }

  // Mock Reviews (Matches GET/POST /api/v1/reviews)
  const getProductReviews = (productId: string) => {
    return reviews[productId] || []
  }

  const submitReview = async (productId: string, data: { rating: number; title?: string; comment: string }) => {
    await new Promise((r) => setTimeout(r, 450))
    const newRev: ProductReview = {
      id: `rev-${Date.now().toString().slice(-4)}`,
      productId,
      userName: customer?.name || 'Verified Patron',
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    }
    setReviews((prev) => ({
      ...prev,
      [productId]: [newRev, ...(prev[productId] || [])],
    }))
    return { success: true, message: 'Thank you. Your tactile review has been published.' }
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
        placeOrder,
        cancelOrder,
        markOrderReceived,
        getOrderById,
        savedDesigns,
        saveBespokeDesign,
        deleteBespokeDesign,
        renameBespokeDesign,
        duplicateBespokeDesign,
        inquiries,
        submitInquiry,
        reviews,
        getProductReviews,
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
