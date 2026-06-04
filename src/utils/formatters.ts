// src/utils/formatters.ts
// Price, date, and string formatting utilities

/**
 * Format a number as Bangladeshi Taka
 * e.g. 1500 → "৳1,500"
 */
export function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`
}

/**
 * Calculate discount percentage
 */
export function calcDiscountPercent(original: number, discounted: number): number {
  return Math.round(((original - discounted) / original) * 100)
}

/**
 * Get effective price (flash sale > discount > regular)
 */
export function getEffectivePrice(
  price: number,
  discountPrice: number | null,
  flashSalePrice: number | null
): number {
  if (flashSalePrice !== null && flashSalePrice < price) return flashSalePrice
  if (discountPrice !== null && discountPrice < price) return discountPrice
  return price
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | { toDate: () => Date }): string {
  const d = 'toDate' in date ? date.toDate() : date
  return d.toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | { toDate: () => Date }): string {
  const d = 'toDate' in date ? date.toDate() : date
  return d.toLocaleString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Truncate text to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Generate order ID
 * Format: PSL-YYYYMMDD-XXXXX
 */
export function generateOrderId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 90000 + 10000)
  return `PSL-${date}-${random}`
}

/**
 * Format phone number for WhatsApp URL
 * Strips non-digits and ensures country code
 */
export function formatPhoneForWhatsApp(phone: string, countryCode = '880'): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return countryCode + digits.slice(1)
  if (digits.startsWith(countryCode)) return digits
  return countryCode + digits
}

/**
 * Countdown timer values from a target date
 */
export function getCountdown(target: Date): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds, expired: false }
}
