// src/types/index.ts
// Central type definitions for PUSPALOY

import { Timestamp } from 'firebase/firestore'

// ────────────────────────────────────────────────────────
// PRODUCT
// ────────────────────────────────────────────────────────
export type ProductStatus = 'active' | 'draft' | 'out_of_stock' | 'archived'
export type ProductCategory = string



export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  category: ProductCategory
  additionalCategories: string[]
  categorySlugs: string[]
  subcategory: string
  tags: string[]
  price: number
  discountPrice: number | null
  stock: number
  status: ProductStatus
  featured: boolean
  newArrival: boolean
  bestSeller: boolean
  trending: boolean
  featuredImage: string
  images: string[]
  youtubeVideoId: string | null
  description: string
  htmlDescription: string
  // ── SEO fields ─────────────────────────────────
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  seoTags: string[]
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  canonicalUrl: string | null
  // ── Product Badges ───────────────────────────────
  badges?: string[]
  // ───────────────────────────────────────────────
  flashSaleId: string | null
  flashSalePrice: number | null
  avgRating: number
  reviewCount: number
  salesCount: number
  viewCount: number
  messengerText: string
  whatsappText: string
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

// Lightweight version for search index & recommendations
export interface ProductLite {
  id: string
  name: string
  slug: string
  category: ProductCategory
  additionalCategories: string[]
  categorySlugs: string[]
  subcategory: string
  tags: string[]
  price: number
  discountPrice: number | null
  flashSalePrice: number | null
  featuredImage: string
  avgRating: number
  reviewCount: number
  salesCount: number
  bestSeller: boolean
  trending: boolean
  featured: boolean
  newArrival: boolean
  status: ProductStatus
  stock: number
  seoTitle: string | null
  seoDescription: string | null
}

// ────────────────────────────────────────────────────────
// CATEGORY
// ────────────────────────────────────────────────────────
export interface Subcategory {
  name: string
  slug: string
}

export interface Category {
  id: string
  name: string
  nameBn: string
  slug: string
  icon: string
  image: string
  banner: string
  description: string
  order: number
  active: boolean
  subcategories: Subcategory[]
  productCount: number
  createdAt: Timestamp
  archived?: boolean
}

// ────────────────────────────────────────────────────────
// ORDER
// ────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type OrderSource = 'website' | 'ai_assistant'
export type PaymentMethod = 'cod' | 'bkash' | 'nagad'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderItem {
  productId: string
  productName: string
  featuredImage: string
  quantity: number
  price: number
  discountPrice: number | null
  flashSalePrice: number | null
}

export interface StatusHistory {
  status: OrderStatus
  at: Timestamp
  by: string | null
}

export interface Order {
  id: string
  customerName: string
  phone: string
  email: string | null
  district: string
  address: string
  items: OrderItem[]
  subtotal: number
  couponCode: string | null
  couponDiscount: number
  deliveryCharge: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  source: OrderSource
  notes: string | null
  notificationSent: boolean
  notificationError: string | null
  statusHistory: StatusHistory[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ────────────────────────────────────────────────────────
// REVIEW
// ────────────────────────────────────────────────────────
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Review {
  id: string
  productId: string
  productName: string
  productImage: string
  reviewerName: string
  rating: number
  comment: string
  status: ReviewStatus
  createdAt: Timestamp
  approvedAt: Timestamp | null
  approvedBy: string | null
}

// ────────────────────────────────────────────────────────
// COUPON
// ────────────────────────────────────────────────────────
export type CouponType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrderAmount: number
  maxUses: number | null
  usedCount: number
  expiresAt: Timestamp | null
  active: boolean
  createdAt: Timestamp
  createdBy: string
}

// ────────────────────────────────────────────────────────
// FLASH SALE
// ────────────────────────────────────────────────────────
export interface FlashSaleProduct {
  productId: string
  flashPrice: number
  originalPrice: number
}

export interface FlashSale {
  id: string
  title: string
  startAt: Timestamp
  endAt: Timestamp
  active: boolean
  products: FlashSaleProduct[]
  createdAt: Timestamp
  createdBy: string
}

// ────────────────────────────────────────────────────────
// ANNOUNCEMENT / PROMO STRIP
// ────────────────────────────────────────────────────────
export type AnnouncementIcon = 'truck' | 'tag' | 'phone' | 'star' | 'gift' | 'zap' | 'megaphone' | 'heart'

export interface Announcement {
  id: string
  text: string
  icon: AnnouncementIcon
  active: boolean
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ────────────────────────────────────────────────────────
// ADMIN / RBAC
// ────────────────────────────────────────────────────────
export type AdminRole = 'super_admin' | 'moderator'

export interface AdminPermissions {
  viewOrders: boolean
  updateOrderStatus: boolean
  addProducts: boolean
  editProducts: boolean
  deleteProducts: boolean
  manageReviews: boolean
  manageInventory: boolean
  viewAnalytics: boolean
  manageCoupons: boolean
  manageFlashSales: boolean
  manageCategories: boolean
  manageHomepageContent: boolean
  manageBanners: boolean
  manageSettings: boolean
  manageAI: boolean
  managePayments: boolean
  manageModerators: boolean
}

export interface AdminUser {
  uid: string
  email: string
  name: string
  role: AdminRole
  avatar: string | null
  permissions: AdminPermissions
  createdBy: string
  createdAt: Timestamp
  active: boolean
  isSynthesized?: boolean
}

// ────────────────────────────────────────────────────────
// CONTENT / CMS
// ────────────────────────────────────────────────────────
export interface HeroBanner {
  id: string
  image: string
  imageMobile: string
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  order: number
  active: boolean
}

export interface WhyChooseItem {
  icon: string
  title: string
  description: string
}

export interface HomepageContent {
  heroBanners: HeroBanner[]
  featuredProductIds: string[]
  newArrivalProductIds: string[]
  bestSellerProductIds: string[]
  trendingProductIds: string[]
  flashSaleId: string | null
  whyChooseUs: WhyChooseItem[]
  updatedAt: Timestamp
}

export interface BrandStory {
  title: string
  subtitle: string
  content: string
  image: string
  updatedAt: Timestamp
}

// ────────────────────────────────────────────────────────
// SETTINGS
// ────────────────────────────────────────────────────────
export interface SocialLinks {
  facebook: string
  instagram: string
  tiktok: string
}

export interface GeneralSettings {
  siteName: string
  tagline: string
  logo: string
  favicon: string
  phone: string
  whatsappNumber: string
  messengerPageId: string
  email: string
  address: string
  socialLinks: SocialLinks
  deliveryCharge: number
  freeDeliveryThreshold: number
  updatedAt: Timestamp
}

export interface PaymentMethodConfig {
  enabled: boolean
  label: string
  description?: string
  merchantNumber?: string | null
  merchantId?: string | null
  apiKey?: string | null
  apiSecret?: string | null
  mode?: 'sandbox' | 'production'
}

export interface PaymentSettings {
  methods: {
    cod: PaymentMethodConfig
    bkash: PaymentMethodConfig
    nagad: PaymentMethodConfig
  }
  updatedAt: Timestamp
  updatedBy: string
}

export interface AISettings {
  model: string
  maxMessagesPerSession: number
  maxMessagesPerDayPerIP: number
  systemPromptAddition: string
  enabled: boolean
  updatedAt: Timestamp
}

// ────────────────────────────────────────────────────────
// CART (client-side)
// ────────────────────────────────────────────────────────
export interface CartItem {
  productId: string
  productName: string
  featuredImage: string
  price: number
  discountPrice: number | null
  flashSalePrice: number | null
  quantity: number
  maxStock: number
}

// ────────────────────────────────────────────────────────
// ZYNTRA AI STATE
// ────────────────────────────────────────────────────────
export type ZyntraOrderStep =
  | 'idle'
  | 'product_selected'
  | 'collecting_name'
  | 'collecting_phone'
  | 'collecting_district'
  | 'collecting_address'
  | 'order_summary'
  | 'order_confirmed'

export interface ZyntraMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  products?: ProductLite[]
  isOrder?: boolean
}

export interface ZyntraOrderDraft {
  productId: string | null
  productName: string | null
  quantity: number
  customerName: string | null
  phone: string | null
  district: string | null
  address: string | null
}
