// src/firebase/coupons.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from './config'
import type { Coupon } from '@/types'

const COUPONS_COL = 'coupons'

export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const q = query(
    collection(db, COUPONS_COL),
    where('code', '==', code.toUpperCase()),
    where('active', '==', true)
  )
  const snap = await getDocs(q)

  if (snap.empty) return { valid: false, error: 'Invalid coupon code' }

  const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon

  // Check expiry
  if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
    return { valid: false, error: 'This coupon has expired' }
  }

  // Check usage limit
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'This coupon has reached its usage limit' }
  }

  // Check minimum order amount
  if (orderTotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount ৳${coupon.minOrderAmount.toLocaleString()} required`,
    }
  }

  return { valid: true, coupon }
}

export function calcCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === 'percentage') {
    return Math.round((subtotal * coupon.value) / 100)
  }
  return Math.min(coupon.value, subtotal)
}

export async function incrementCouponUsage(couponId: string): Promise<void> {
  await updateDoc(doc(db, COUPONS_COL, couponId), {
    usedCount: increment(1),
  })
}

// Admin operations
export async function getAllCoupons(): Promise<Coupon[]> {
  const snap = await getDocs(collection(db, COUPONS_COL))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon))
}

export async function createCoupon(data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COUPONS_COL), {
    ...data,
    code: data.code.toUpperCase(),
    usedCount: 0,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<void> {
  await updateDoc(doc(db, COUPONS_COL, id), data)
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COUPONS_COL, id))
}
