// src/firebase/reviews.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from './config'
import type { Review, ReviewStatus } from '@/types'
import { getMillis } from './products'

const REVIEWS_COL = 'reviews'

export async function submitReview(
  data: Omit<Review, 'id' | 'status' | 'createdAt' | 'approvedAt' | 'approvedBy'>
): Promise<string> {
  const ref = await addDoc(collection(db, REVIEWS_COL), {
    ...data,
    status: 'pending',
    approvedAt: null,
    approvedBy: null,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const q = query(
    collection(db, REVIEWS_COL),
    where('productId', '==', productId)
  )
  const snap = await getDocs(q)
  let reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))
  
  reviews = reviews.filter(r => r.status === 'approved')
  reviews.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
  
  return reviews.slice(0, 20)
}

export async function getPendingReviews(): Promise<Review[]> {
  const q = query(
    collection(db, REVIEWS_COL),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)
  const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))
  
  return reviews.sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt))
}

export async function getAllReviewsAdmin(): Promise<Review[]> {
  const q = query(collection(db, REVIEWS_COL), orderBy('createdAt', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))
}

export async function approveReview(reviewId: string, adminUid: string, productId: string): Promise<void> {
  await updateDoc(doc(db, REVIEWS_COL, reviewId), {
    status: 'approved' as ReviewStatus,
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
  })
  // Update product avgRating (simple increment — recalculate on approval)
  await recalcProductRating(productId)
}

export async function rejectReview(reviewId: string, adminUid: string): Promise<void> {
  await updateDoc(doc(db, REVIEWS_COL, reviewId), {
    status: 'rejected' as ReviewStatus,
    approvedBy: adminUid,
  })
}

export async function deleteReview(reviewId: string): Promise<void> {
  await deleteDoc(doc(db, REVIEWS_COL, reviewId))
}

async function recalcProductRating(productId: string): Promise<void> {
  const q = query(
    collection(db, REVIEWS_COL),
    where('productId', '==', productId),
    where('status', '==', 'approved')
  )
  const snap = await getDocs(q)
  if (snap.empty) return
  const total = snap.docs.reduce((sum, d) => sum + (d.data().rating as number), 0)
  const avg = Math.round((total / snap.docs.length) * 10) / 10
  await updateDoc(doc(db, 'products', productId), {
    avgRating: avg,
    reviewCount: snap.docs.length,
  })
}
