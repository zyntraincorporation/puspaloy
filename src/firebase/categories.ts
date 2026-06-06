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

  // 2. Move all products in this category to "uncategorized"
  // This prevents breaking existing products and allows recovery
  const productsQ = query(collection(db, PRODUCTS_COL), where('categorySlugs', 'array-contains', categorySlug))
  const productsSnap = await getDocs(productsQ)
  
  productsSnap.docs.forEach(d => {
    const data = d.data()
    // If the deleted category was the primary category, switch to uncategorized.
    const isPrimary = data.category === categorySlug;
    const newCategory = isPrimary ? 'uncategorized' : data.category;
    
    // Remove the deleted category from additionalCategories
    const additionalCategories = (data.additionalCategories || []).filter((c: string) => c !== categorySlug);
    
    // Rebuild categorySlugs
    const categorySlugs = [newCategory, ...additionalCategories];

    batch.update(d.ref, {
      category: newCategory,
      additionalCategories,
      categorySlugs,
      updatedAt: serverTimestamp()
    })
  })

  await batch.commit()
}

export const DEFAULT_CATEGORIES = [
  { name: 'Fashion', slug: 'fashion', icon: '👗' },
  { name: 'Shoes', slug: 'shoes', icon: '👠' },
  { name: 'Cosmetics', slug: 'cosmetics', icon: '💄' },
  { name: 'Jewelry', slug: 'jewelry', icon: '💍' },
  { name: 'Gifts', slug: 'gifts', icon: '🎁' },
  { name: 'Accessories', slug: 'accessories', icon: '🎀' },
  { name: 'Bags', slug: 'bags', icon: '👜' },
  { name: 'Watches', slug: 'watches', icon: '⌚' },
  { name: 'Women\'s Collection', slug: 'womens-collection', icon: '👩' },
  { name: 'Men\'s Collection', slug: 'mens-collection', icon: '👨' },
  { name: 'Beauty & Care', slug: 'beauty-care', icon: '✨' },
  { name: 'Home Decor', slug: 'home-decor', icon: '🏡' },
  { name: 'Premium Collection', slug: 'premium-collection', icon: '💎' },
  { name: 'New Arrivals', slug: 'new-arrivals', icon: '🌟' },
  { name: 'Best Sellers', slug: 'best-sellers', icon: '🔥' },
];

export async function restoreDefaultCategories(): Promise<void> {
  const batch = writeBatch(db);
  const categoriesRef = collection(db, CATEGORIES_COL);
  
  let order = 0;
  for (const cat of DEFAULT_CATEGORIES) {
    const q = query(categoriesRef, where('slug', '==', cat.slug));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      const newRef = doc(categoriesRef);
      batch.set(newRef, {
        name: cat.name,
        nameBn: '',
        slug: cat.slug,
        icon: cat.icon,
        image: '',
        banner: '',
        description: '',
        order: order++,
        active: true,
        subcategories: [],
        productCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
  
  await batch.commit();
}
