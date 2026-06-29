// src/firebase/orders.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { Order, OrderStatus } from '@/types'

const ORDERS_COL = 'orders'

export async function createOrder(data: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(db, ORDERS_COL, data.id)
  await updateDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(async () => {
    // Document doesn't exist yet — create it
    await addDoc(collection(db, ORDERS_COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  return data.id
}

export async function setOrder(data: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<void> {
  const { setDoc } = await import('firebase/firestore')
  await setDoc(doc(db, ORDERS_COL, data.id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getOrderById(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, ORDERS_COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Order
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  updatedBy: string
): Promise<void> {
  const { arrayUnion } = await import('firebase/firestore')
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    status,
    updatedAt: serverTimestamp(),
    statusHistory: arrayUnion({
      status,
      at: new Date(),
      by: updatedBy,
    }),
  })
}

/**
 * Update order status with an optional customer-visible tracking note.
 * Used by Admin / Moderator from the Order Management panel.
 */
export async function updateOrderStatusWithNote(
  orderId: string,
  status: OrderStatus,
  updatedBy: string,
  trackingNote?: string | null
): Promise<void> {
  const { arrayUnion } = await import('firebase/firestore')
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    status,
    trackingNote: trackingNote ?? null,
    updatedAt: serverTimestamp(),
    statusHistory: arrayUnion({
      status,
      at: new Date(),
      by: updatedBy,
    }),
  })
}

export async function getOrdersAdmin(
  filters: {
    status?: OrderStatus
    phone?: string
  } = {},
  pageSize = 30,
  lastDoc?: DocumentSnapshot
) {
  const constraints: Parameters<typeof query>[1][] = [
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  ]

  if (filters.status) {
    constraints.unshift(where('status', '==', filters.status))
  }
  if (filters.phone) {
    constraints.unshift(where('phone', '==', filters.phone))
  }
  if (lastDoc) constraints.push(startAfter(lastDoc))

  const q = query(collection(db, ORDERS_COL), ...constraints)
  const snap = await getDocs(q)
  return {
    orders: snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === pageSize,
  }
}

// Real-time listener for admin dashboard
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  pageSize = 20
): Unsubscribe {
  const q = query(
    collection(db, ORDERS_COL),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  )
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
    onUpdate(orders)
  })
}

/**
 * Real-time listener for the MOST RECENT order matching a phone number.
 * Used by the public tracking page (phone-based search).
 * Returns at most 1 order (newest by createdAt).
 */
export function subscribeToLatestOrderByPhone(
  phone: string,
  onUpdate: (order: Order | null) => void
): Unsubscribe {
  try {
    const q = query(
      collection(db, ORDERS_COL),
      where('phone', '==', phone),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    return onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const d = snap.docs[0]
          onUpdate({ id: d.id, ...d.data() } as Order)
        } else {
          onUpdate(null)
        }
      },
      (err) => {
        console.error('subscribeToLatestOrderByPhone error:', err)
        onUpdate(null)
      }
    )
  } catch (err) {
    console.error('subscribeToLatestOrderByPhone setup error:', err)
    return () => {}
  }
}

export function subscribeToOrder(
  orderId: string,
  onUpdate: (order: Order | null) => void
): Unsubscribe {
  try {
    const docRef = doc(db, ORDERS_COL, orderId)
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          onUpdate({ id: snapshot.id, ...snapshot.data() } as Order)
        } else {
          onUpdate(null)
        }
      },
      (error) => {
        console.error('Error listening to order:', error)
        onUpdate(null)
      }
    )
    return unsubscribe
  } catch (err) {
    console.error('Error in subscribeToOrder setup:', err)
    return () => {}
  }
}

export async function markNotificationSent(orderId: string): Promise<void> {
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    notificationSent: true,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Save courier info onto an existing order document.
 * Called after a successful parcel creation with any courier provider.
 * Does NOT create a new collection — extends the same orders/{id} document.
 */
export async function saveCourierInfo(
  orderId: string,
  courier: import('@/types').CourierInfo
): Promise<void> {
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    courier,
    updatedAt: serverTimestamp(),
  })
}
