// src/firebase/settings.ts
// Delivery charge settings — fetched dynamically so Admin can change anytime
import { doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

// ── Delivery Settings ─────────────────────────────────────
export interface DeliverySettings {
  insideDhaka: number           // ৳ inside Dhaka city
  outsideDhaka: number          // ৳ rest of Bangladesh
  freeShippingThreshold: number // orders above this get free shipping (0 = disabled)
  updatedAt?: object
}

const DELIVERY_DEFAULTS: DeliverySettings = {
  insideDhaka: 60,
  outsideDhaka: 120,
  freeShippingThreshold: 2000,
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'delivery'))
    if (!snap.exists()) return DELIVERY_DEFAULTS
    return { ...DELIVERY_DEFAULTS, ...snap.data() } as DeliverySettings
  } catch {
    return DELIVERY_DEFAULTS
  }
}

export async function updateDeliverySettings(data: Partial<DeliverySettings>): Promise<void> {
  await setDoc(
    doc(db, 'settings', 'delivery'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

// ── Daily Order Counter → PA-DDMMYY-XXXX ─────────────────
// Uses a Firestore transaction to atomically increment per-day counters.
// Counter document: counters/orders-DDMMYY  →  { count: N }
//
// Returns a formatted order ID like: PA-260602-0042

export async function generateOrderId(): Promise<string> {
  const now = new Date()
  // Convert to Bangladesh time (UTC+6) for the date key
  const bdOffset = 6 * 60 * 60 * 1000
  const bdNow = new Date(now.getTime() + bdOffset)

  const dd = String(bdNow.getUTCDate()).padStart(2, '0')
  const mm = String(bdNow.getUTCMonth() + 1).padStart(2, '0')
  const yy = String(bdNow.getUTCFullYear()).slice(-2)
  const dateKey = `${dd}${mm}${yy}`

  const counterRef = doc(db, 'counters', `orders-${dateKey}`)

  const newCount = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const current = snap.exists() ? (snap.data().count as number) : 0
    const next = current + 1
    tx.set(counterRef, { count: next, date: dateKey }, { merge: true })
    return next
  })

  const seq = String(newCount).padStart(4, '0')
  return `PA-${dateKey}-${seq}`
}

// Calculate delivery charge for a given district + subtotal
export function calcDeliveryCharge(
  district: string,
  subtotal: number,
  settings: DeliverySettings
): number {
  // Free shipping threshold
  if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
    return 0
  }
  // Dhaka city districts
  const dhakaDistricts = ['Dhaka', 'ঢাকা']
  return dhakaDistricts.some((d) => district.toLowerCase().includes(d.toLowerCase()))
    ? settings.insideDhaka
    : settings.outsideDhaka
}
