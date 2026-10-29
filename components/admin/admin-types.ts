/**
 * UNIFORT Tableware Atelier — Admin Dashboard TypeScript Definitions
 * Directly aligned with the backend Prisma schema and REST API specifications.
 */

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

export type ItemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type CustomDesignStatus =
  | 'DRAFT'
  | 'SAVED'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'REJECTED'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type InquiryType =
  | 'GENERAL'
  | 'BESPOKE_ORDER'
  | 'HOSPITALITY_COMMISSION'
  | 'STOCKIST'
  | 'CARE_AND_REPAIR'

export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ModelType =
  | 'mug'
  | 'plate'
  | 'tumbler'
  | 'bowl'
  | 'carafe'
  | 'tote'
  | 'bottle'
  | 'coaster'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  token?: string
  phone?: string
  createdAt: string
  updatedAt?: string
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalBespokeDesigns: number
  activeBespokeInProduction: number
  lowStockAlerts: number
}

export interface CustomDesignItem {
  id: string
  userId?: string
  user?: {
    name: string
    email: string
  }
  productId: string
  product?: {
    name: string
    slug: string
    modelType?: string
    price: number
  }
  title: string
  status: CustomDesignStatus
  finish: string
  designState?: Record<string, any>
  snapshotUrl?: string
  productionNotes?: string
  craftsmanNotes?: string
  createdAt: string
  updatedAt?: string
}

export interface ProductItem {
  id: string
  name: string
  slug: string
  sku: string
  description?: string
  price: number
  stock: number
  status: ItemStatus
  isCustomizable: boolean
  modelType?: ModelType | string
  categoryId: string
  category?: {
    id: string
    name: string
    slug: string
  }
  images?: string[]
  createdAt: string
  updatedAt?: string
}

export interface CategoryItem {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  _count?: {
    products: number
  }
  createdAt?: string
}

export interface OrderItemRecord {
  id: string
  productId: string
  product?: {
    name: string
    sku: string
    price: number
  }
  quantity: number
  unitPrice: number
  customDesignId?: string
  customDesign?: CustomDesignItem
  productionSpec?: {
    resolutionWidthPx?: number
    resolutionHeightPx?: number
    targetDpi?: number
    dpiVerified?: boolean
    surfaces?: string[]
  }
  customSnapshotUrl?: string
}

export interface OrderRecord {
  id: string
  orderNumber: string
  userId: string
  user?: {
    name: string
    email: string
  }
  status: OrderStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  currency: string
  items: OrderItemRecord[]
  shippingAddress: {
    fullName: string
    addressLine1: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  customerNotes?: string
  createdAt: string
  updatedAt?: string
}

export interface InquiryRecord {
  id: string
  name: string
  email: string
  phone?: string
  type: InquiryType
  subject?: string
  message: string
  status: InquiryStatus
  notes?: string
  metadata?: Record<string, any>
  userId?: string
  createdAt: string
  updatedAt?: string
}

export interface ReviewRecord {
  id: string
  productId: string
  product?: {
    name: string
    slug: string
  }
  userId: string
  user?: {
    name: string
    email: string
  }
  rating: number
  title?: string
  comment: string
  status: ReviewStatus
  createdAt: string
}

export interface AuditLogRecord {
  id: string
  action: string
  resource?: string
  details?: string | Record<string, any>
  ipAddress?: string
  userId?: string
  userEmail?: string
  userRole?: string
  user?: {
    name: string
    email: string
    role: UserRole
  }
  createdAt: string
}

export type AdminSection =
  | 'overview'
  | '3d-studio'
  | 'orders'
  | 'products'
  | 'categories'
  | 'media'
  | 'inquiries'
  | 'reviews'
  | 'users'
  | 'audit-logs'
