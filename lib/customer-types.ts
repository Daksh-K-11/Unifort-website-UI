export type CustomerRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export interface CustomerUser {
  id: string
  name: string
  email: string
  phone?: string
  role: CustomerRole
  createdAt?: string
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type PaymentMethod =
  | 'UPI'
  | 'CARD'
  | 'NET_BANKING'
  | 'STUDIO_TRANSFER'
  | 'COD'

export interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface CustomerOrderItem {
  id: string
  productId: string
  productName: string
  productType?: string
  productImage: string
  price: number
  quantity: number
  bespokeDesignId?: string
  bespokeDetails?: {
    modelType?: string
    glaze?: string
    finish?: string
  }
}

export interface CustomerOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  totalAmount: number
  items: CustomerOrderItem[]
  shippingAddress: ShippingAddress
  customerNotes?: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt?: string
}

export type InquiryType =
  | 'HOSPITALITY_COMMISSION'
  | 'BESPOKE_ORDER'
  | 'GENERAL'
  | 'STOCKIST'

export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface CustomerInquiry {
  id: string
  type: InquiryType
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: InquiryStatus
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface ProductReview {
  id: string
  productId: string
  userId?: string
  userName: string
  rating: number // 1 to 5
  title?: string
  comment: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export type DesignProductionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PRODUCTION'
  | 'COMPLETED'

export interface CustomerSavedDesign {
  id: string
  title: string
  productId?: string
  productName: string
  modelType: string
  finish: string
  primaryGlazeColor: string
  accentGlazeColor?: string
  status: DesignProductionStatus
  previewUrl?: string
  craftsmanNotes?: string
  elementsCount: number
  createdAt: string
  updatedAt?: string
}
