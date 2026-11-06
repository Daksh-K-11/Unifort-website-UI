export type CustomerRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export interface CustomerAddress {
  id: string
  label?: string | null
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface CustomerUser {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: CustomerRole
  emailVerified: boolean
  addresses: CustomerAddress[]
  createdAt?: string
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'RAZORPAY' | 'COD'

export interface ShippingAddress {
  fullName: string
  phone?: string
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
  productSlug?: string | null
  productName: string
  productType?: string
  productImage: string
  price: number
  totalPrice: number
  quantity: number
  bespokeDesignId?: string
  /** Instructions the customer sent with this custom piece. */
  customerInstructions?: string
}

export interface CustomerOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  subtotal: number
  discount: number
  shippingFee: number
  tax: number
  totalAmount: number
  refundedAmount: number
  couponCode?: string | null
  items: CustomerOrderItem[]
  shippingAddress: ShippingAddress
  customerNotes?: string
  trackingNumber?: string
  carrier?: string
  canCancel: boolean
  canConfirmDelivery: boolean
  canPay: boolean
  paymentExpiresAt?: string | null
  createdAt: string
  paidAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  updatedAt?: string
}

export type InquiryType =
  | 'HOSPITALITY_COMMISSION'
  | 'BESPOKE_ORDER'
  | 'GENERAL'
  | 'STOCKIST'
  | 'CARE_AND_REPAIR'
  | 'PRESS_MEDIA'

export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED'

export interface CustomerInquiry {
  id: string
  type: InquiryType
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: InquiryStatus
  createdAt: string
  updatedAt?: string
}

export interface ProductReview {
  id: string
  productId: string
  userName: string
  rating: number
  title?: string
  comment: string
  isVerifiedPurchase?: boolean
  createdAt: string
}

export type DesignProductionStatus =
  | 'DRAFT'
  | 'SAVED'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'REJECTED'

export interface CustomerSavedDesign {
  id: string
  title: string
  productId?: string
  /** Studio slug of the product (used to open the design in the 3D studio). */
  productSlug?: string
  productName: string
  modelType: string
  finish: string
  primaryGlazeColor: string
  accentGlazeColor?: string
  status: DesignProductionStatus
  editable: boolean
  estimatedPrice: number
  previewUrl?: string
  craftsmanNotes?: string
  customerInstructions?: string
  elementsCount: number
  state?: any
  createdAt: string
  updatedAt?: string
}
