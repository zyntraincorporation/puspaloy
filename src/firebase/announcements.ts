// src/firebase/announcements.ts
// Announcement/promo strip management — fully DB-driven, replaces hardcoded PromoStrip.
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import type { Announcement } from '@/types'

const COL = 'announcements'

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const q = query(collection(db, COL), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement))
}

export function subscribeToActiveAnnouncements(
  callback: (announcements: Announcement[]) => void
) {
  const q = query(
    collection(db, COL),
    where('active', '==', true),
    orderBy('order', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)))
  })
}

export function subscribeToAllAnnouncements(
  callback: (announcements: Announcement[]) => void
) {
  const q = query(collection(db, COL), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)))
  })
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Omit<Announcement, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

/**
 * Bulk-update the `order` field for a list of announcement IDs.
 * Pass the IDs in the desired display order.
 */
export async function reorderAnnouncements(orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, COL, id), {
      order: index,
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

// ── Seed defaults (called once if collection is empty) ───────────────────────

export const DEFAULT_ANNOUNCEMENTS: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { text: 'Free delivery on orders above ৳1,500', icon: 'truck', active: true, order: 0 },
  { text: 'Use code WELCOME10 for 10% off your first order', icon: 'tag', active: true, order: 1 },
  { text: 'Cash on Delivery available across Bangladesh', icon: 'phone', active: true, order: 2 },
  { text: 'Fast delivery to all 64 districts', icon: 'truck', active: true, order: 3 },
  { text: 'New arrivals every week — stay tuned!', icon: 'star', active: true, order: 4 },
]

export async function seedDefaultAnnouncements(): Promise<void> {
  const snap = await getDocs(collection(db, COL))
  if (!snap.empty) return // Already seeded
  const batch = writeBatch(db)
  DEFAULT_ANNOUNCEMENTS.forEach((ann) => {
    const ref = doc(collection(db, COL))
    batch.set(ref, {
      ...ann,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}
