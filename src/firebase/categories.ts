import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  where,
  onSnapshot
} from 'firebase/firestore'
import { db } from './config'
import type { Category } from '@/types'

const CATEGORIES_COL = 'categories'
const PRODUCTS_COL = 'products'

export async function getAllCategories(): Promise<Category[]> {
  const q = query(collection(db, CATEGORIES_COL), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category))
}

export function subscribeToAllCategories(callback: (categories: Category[]) => void) {
  const q = query(collection(db, CATEGORIES_COL), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)))
  })
}

export async function getActiveCategories(): Promise<Category[]> {
  const q = query(
    collection(db, CATEGORIES_COL),
    where('active', '==', true),
    orderBy('order', 'asc')
  )
  const snap = await getDocs(q)
  // Filter out archived just in case
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)).filter(c => !c.archived)
}

export function subscribeToActiveCategories(callback: (categories: Category[]) => void) {
  const q = query(
    collection(db, CATEGORIES_COL),
    where('active', '==', true),
    orderBy('order', 'asc')
  )
  return onSnapshot(q, (snap) => {
    const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)).filter(c => !c.archived)
    callback(cats)
  })
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>): Promise<string> {
  const ref = await addDoc(collection(db, CATEGORIES_COL), {
    ...data,
    productCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const ref = doc(db, CATEGORIES_COL, id)
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCategory(id: string, categorySlug: string): Promise<void> {
  const batch = writeBatch(db)
  
  // 1. Archive the category document (do not delete)
  batch.update(doc(db, CATEGORIES_COL, id), {
    active: false,
    archived: true,
    updatedAt: serverTimestamp()
  })

  // 2. Archive all products in this category
  // This prevents breaking existing products and allows recovery
  const productsQ = query(collection(db, PRODUCTS_COL), where('category', '==', categorySlug))
  const productsSnap = await getDocs(productsQ)
  
  productsSnap.docs.forEach(d => {
    batch.update(d.ref, {
      status: 'archived',
      updatedAt: serverTimestamp()
    })
  })

  await batch.commit()
}
