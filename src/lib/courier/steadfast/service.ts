// src/lib/courier/steadfast/service.ts
// Frontend-side Steadfast service.
// NEVER calls Steadfast directly — all traffic proxied through Netlify Function.
// Implements the CourierService interface for the Steadfast provider.

import { serverTimestamp } from 'firebase/firestore'
import type { Order, CourierInfo } from '@/types'
import type {
  CourierService,
  CreateParcelInput,
  CreateParcelResponse,
} from '@/lib/courier/types'
import { normalizeDistrict, normalizeThana } from './locationMapper'

// ── Steadfast API response shape (from Netlify Function) ─────────────────────
interface SteadfastApiResponse {
  status: number
  message: string
  consignment?: {
    consignment_id: number
    invoice: string
    tracking_code: string
    recipient_name: string
    recipient_phone: string
    recipient_address: string
    cod_amount: number
    status: string
    note?: string | null
  }
}

// ── Field validation ──────────────────────────────────────────────────────────
function validateOrder(order: Order): string | null {
  if (!order.customerName?.trim()) return 'Customer name is missing.'
  if (!order.phone?.trim()) return 'Customer phone number is missing.'
  if (order.phone.replace(/\D/g, '').length < 10) return 'Phone number appears invalid (must be at least 10 digits).'
  if (!order.address?.trim()) return 'Delivery address is missing.'
  if (!order.district?.trim()) return 'Delivery district is missing.'
  if (!order.total || order.total <= 0) return 'Order total is invalid.'
  return null
}

// ── Steadfast service implementation ─────────────────────────────────────────
class SteadfastService implements CourierService {
  readonly provider = 'Steadfast' as const

  async createParcel(input: CreateParcelInput): Promise<CreateParcelResponse> {
    const { order } = input

    // 1. Validate locally before any network call
    const validationError = validateOrder(order)
    if (validationError) {
      return { success: false, message: validationError }
    }

    // 2. Build Steadfast payload
    const payload = {
      invoice: order.id,
      recipient_name: order.customerName.trim(),
      recipient_phone: order.phone.replace(/\s/g, ''),
      recipient_address: order.address.trim(),
      recipient_city: normalizeDistrict(order.district),
      recipient_zone: normalizeThana(null), // thana not collected — sent empty
      cod_amount: order.total,
      note: order.notes?.trim() ?? undefined,
      item_description: order.items
        .map((i) => `${i.productName} x${i.quantity}`)
        .join(', '),
    }

    // 3. Call our Netlify Function proxy
    let raw: Response
    try {
      raw = await fetch('/.netlify/functions/steadfast-create-parcel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, payload }),
      })
    } catch (networkError) {
      return {
        success: false,
        message: 'Network error — could not reach the server. Please check your connection.',
      }
    }

    // 4. Parse response
    let body: SteadfastApiResponse
    try {
      body = await raw.json()
    } catch {
      return {
        success: false,
        message: 'Unexpected response from courier server. Please try again.',
      }
    }

    // 5. Handle Netlify Function-level errors (missing env vars, etc.)
    if (!raw.ok) {
      return {
        success: false,
        message: body?.message ?? `Server error (${raw.status}). Please contact support.`,
        detail: JSON.stringify(body),
      }
    }

    // 6. Handle Steadfast API errors
    if (body.status !== 200 || !body.consignment) {
      return {
        success: false,
        message: body.message ?? 'Steadfast rejected the parcel. Please verify the order details.',
        detail: JSON.stringify(body),
      }
    }

    // 7. Build CourierInfo from Steadfast response
    const c = body.consignment
    const courierInfo: CourierInfo = {
      provider: 'Steadfast',
      parcelId: String(c.consignment_id),
      trackingCode: c.tracking_code,
      consignmentId: String(c.consignment_id),
      status: c.status ?? 'created',
      createdAt: serverTimestamp() as unknown as import('firebase/firestore').Timestamp,
    }

    return { success: true, courier: courierInfo }
  }

  trackingUrl(trackingCode: string): string {
    return `https://steadfast.com.bd/home/parcelSearch/trackingNumber/${encodeURIComponent(trackingCode)}`
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const steadfastService = new SteadfastService()
