// src/firebase/categories.ts
// Canonical category service — all category reads/writes go through here.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  where,
  onSnapshot,
  getCountFromServer,
} from 'firebase/firestore'
import { db } from './config'
import type { Category } from '@/types'

const CATEGORIES_COL = 'categories'
const PRODUCTS_COL = 'products'

// ── Read ──────────────────────────────────────────────────────────────────────

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
  // Filter out archived just in case (belt-and-suspenders)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Category))
    .filter(c => !c.archived)
}

export function subscribeToActiveCategories(callback: (categories: Category[]) => void) {
  const q = query(
    collection(db, CATEGORIES_COL),
    where('active', '==', true),
    orderBy('order', 'asc')
  )
  return onSnapshot(q, (snap) => {
    const cats = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Category))
      .filter(c => !c.archived)
    callback(cats)
  })
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createCategory(
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>
): Promise<string> {
  const ref = await addDoc(collection(db, CATEGORIES_COL), {
    ...data,
    archived: false,
    productCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const ref = doc(db, CATEGORIES_COL, id)
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Soft-delete a category:
 * 1. Mark it as archived + inactive (never deletes the document)
 * 2. Move all products that had this category as primary → 'uncategorized'
 * 3. Remove the category from any product's additionalCategories / categorySlugs
 */
export async function deleteCategory(id: string, categorySlug: string): Promise<void> {
  const batch = writeBatch(db)

  // 1. Archive the category
  batch.update(doc(db, CATEGORIES_COL, id), {
    active: false,
    archived: true,
    updatedAt: serverTimestamp(),
  })

  // 2. Reassign products that had this category slug anywhere in categorySlugs
  const productsQ = query(
    collection(db, PRODUCTS_COL),
    where('categorySlugs', 'array-contains', categorySlug)
  )
  const productsSnap = await getDocs(productsQ)

  productsSnap.docs.forEach(d => {
    const data = d.data()
    const isPrimary = data.category === categorySlug
    const newPrimary = isPrimary ? 'uncategorized' : data.category

    const additionalCategories = (data.additionalCategories || []).filter(
      (c: string) => c !== categorySlug
    )

    const categorySlugs = [newPrimary, ...additionalCategories].filter(Boolean)

    batch.update(d.ref, {
      category: newPrimary,
      additionalCategories,
      categorySlugs,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

// ── Product count ─────────────────────────────────────────────────────────────

/**
 * Returns the actual live product count for a category slug
 * (counts any product that has this slug in categorySlugs).
 */
export async function getLiveProductCount(categorySlug: string): Promise<number> {
  const q = query(
    collection(db, PRODUCTS_COL),
    where('categorySlugs', 'array-contains', categorySlug)
  )
  const snap = await getCountFromServer(q)
  return snap.data().count
}

/**
 * Recalculates and writes the productCount field for every category.
 * Call this after bulk operations or from the admin panel.
 */
export async function recalculateAllProductCounts(): Promise<void> {
  const cats = await getAllCategories()
  const batch = writeBatch(db)

  for (const cat of cats) {
    const q = query(
      collection(db, PRODUCTS_COL),
      where('categorySlugs', 'array-contains', cat.slug)
    )
    const snap = await getCountFromServer(q)
    batch.update(doc(db, CATEGORIES_COL, cat.id), {
      productCount: snap.data().count,
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}

// ── Default categories ────────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  { name: 'Fashion', slug: 'fashion', icon: '👗', order: 0 },
  { name: 'Shoes', slug: 'shoes', icon: '👠', order: 1 },
  { name: 'Cosmetics', slug: 'cosmetics', icon: '💄', order: 2 },
  { name: 'Jewelry', slug: 'jewelry', icon: '💍', order: 3 },
  { name: 'Gifts', slug: 'gifts', icon: '🎁', order: 4 },
  { name: 'Accessories', slug: 'accessories', icon: '🎀', order: 5 },
  { name: 'Bags', slug: 'bags', icon: '👜', order: 6 },
  { name: 'Watches', slug: 'watches', icon: '⌚', order: 7 },
  { name: "Women's Collection", slug: 'womens-collection', icon: '👩', order: 8 },
  { name: "Men's Collection", slug: 'mens-collection', icon: '👨', order: 9 },
  { name: 'Beauty & Care', slug: 'beauty-care', icon: '✨', order: 10 },
  { name: 'Home Decor', slug: 'home-decor', icon: '🏡', order: 11 },
  { name: 'Premium Collection', slug: 'premium-collection', icon: '💎', order: 12 },
  { name: 'New Arrivals', slug: 'new-arrivals', icon: '🌟', order: 13 },
  { name: 'Best Sellers', slug: 'best-sellers', icon: '🔥', order: 14 },
]

/**
 * Restore missing default categories.
 * - If a default category doesn't exist → creates it (active, not archived).
 * - If it exists but is archived → un-archives and re-activates it.
 * - Never deletes existing categories.
 */
export async function restoreDefaultCategories(): Promise<void> {
  const batch = writeBatch(db)
  const categoriesRef = collection(db, CATEGORIES_COL)

  for (const cat of DEFAULT_CATEGORIES) {
    const q = query(categoriesRef, where('slug', '==', cat.slug))
    const snap = await getDocs(q)

    if (snap.empty) {
      // Create fresh
      const newRef = doc(categoriesRef)
      batch.set(newRef, {
        name: cat.name,
        nameBn: '',
        slug: cat.slug,
        icon: cat.icon,
        image: '',
        banner: '',
        description: '',
        order: cat.order,
        active: true,
        archived: false,
        subcategories: [],
        productCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } else {
      // Un-archive if needed (fix hidden defaults)
      snap.docs.forEach(d => {
        const data = d.data()
        if (data.archived || !data.active) {
          batch.update(d.ref, {
            active: true,
            archived: false,
            updatedAt: serverTimestamp(),
          })
        }
      })
    }
  }

  await batch.commit()
}

// ── Uncategorized / Archive placeholder ──────────────────────────────────────

/**
 * Ensures the 'uncategorized' category exists as a system category.
 * Products whose primary category is deleted land here.
 */
export async function ensureUncategorizedExists(): Promise<void> {
  const q = query(collection(db, CATEGORIES_COL), where('slug', '==', 'uncategorized'))
  const snap = await getDocs(q)
  if (!snap.empty) return

  await addDoc(collection(db, CATEGORIES_COL), {
    name: 'Uncategorized / Archive',
    nameBn: '',
    slug: 'uncategorized',
    icon: '📦',
    image: '',
    banner: '',
    description: 'Products moved here when their category is deleted.',
    order: 999,
    active: false, // Hidden from website by default
    archived: false,
    subcategories: [],
    productCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
