// src/lib/courier/types.ts
// Courier abstraction layer.
// All courier providers must implement the CourierService interface.
// This keeps the Admin UI and Firestore layer provider-agnostic.

import type { Order, CourierInfo, CourierProvider } from '@/types'

// ── Input passed to any createParcel implementation ──────────────────────────
export interface CreateParcelInput {
  order: Order
}

// ── Successful result returned by any createParcel implementation ────────────
export interface CreateParcelResult {
  success: true
  courier: CourierInfo
}

// ── Error result ─────────────────────────────────────────────────────────────
export interface CreateParcelError {
  success: false
  message: string
  /** Raw error detail from the courier API if available */
  detail?: string
}

export type CreateParcelResponse = CreateParcelResult | CreateParcelError

// ── Generic courier service interface ────────────────────────────────────────
export interface CourierService {
  readonly provider: CourierProvider

  /**
   * Create a parcel with the courier.
   * Validates the order, calls the backend proxy, and returns the saved courier info.
   */
  createParcel(input: CreateParcelInput): Promise<CreateParcelResponse>

  /**
   * Cancel a parcel (not yet implemented for Steadfast — placeholder for future providers).
   */
  cancelParcel?(parcelId: string): Promise<{ success: boolean; message?: string }>

  /**
   * Get the public tracking URL for a given tracking code.
   */
  trackingUrl(trackingCode: string): string
}
