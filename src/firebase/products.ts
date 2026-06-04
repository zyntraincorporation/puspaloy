// src/firebase/products.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from './config'
import type { Product, ProductLite, ProductCategory } from '@/types'

const PRODUCTS_COL = 'products'

// ── Read ──────────────────────────────────────────────────
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(
    collection(db, PRODUCTS_COL),
    where('slug', '==', slug),
    where('status', '==', 'active'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Product
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, PRODUCTS_COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Product
}

export async function getProductsByCategory(
  category: ProductCategory,
  pageSize = 24,
  lastDoc?: DocumentSnapshot
) {
  // Use a single-field query to avoid requiring composite indexes
  const q = query(
    collection(db, PRODUCTS_COL),
    where('category', '==', category)
  )
  const snap = await getDocs(q)
  
  // Filter active and sort by createdAt client-side
  let products = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.status === 'active')
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())

  // Handle client-side pagination
  const startIndex = lastDoc ? products.findIndex((p) => p.id === lastDoc.id) + 1 : 0
  const paginatedProducts = products.slice(startIndex, startIndex + pageSize)
  
  return {
    products: paginatedProducts,
    lastDoc: snap.docs.find(d => d.id === paginatedProducts[paginatedProducts.length - 1]?.id) ?? null,
    hasMore: startIndex + pageSize < products.length,
  }
}

export async function getFeaturedProducts(ids: string[]): Promise<Product[]> {
  if (!ids.length) return []
  const promises = ids.map((id) => getProductById(id))
  const results = await Promise.all(promises)
  return results.filter(Boolean) as Product[]
}

export async function getAllActiveProductsLite(): Promise<ProductLite[]> {
  // Use a single-field query to avoid composite indexes
  const q = query(
    collection(db, PRODUCTS_COL),
    where('status', '==', 'active')
  )
  const snap = await getDocs(q)
  
  // Sort client-side
  const products = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name,
      slug: data.slug,
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags ?? [],
      price: data.price,
      discountPrice: data.discountPrice ?? null,
      flashSalePrice: data.flashSalePrice ?? null,
      featuredImage: data.featuredImage,
      avgRating: data.avgRating ?? 0,
      reviewCount: data.reviewCount ?? 0,
      salesCount: data.salesCount ?? 0,
      bestSeller: data.bestSeller ?? false,
      trending: data.trending ?? false,
      featured: data.featured ?? false,
      newArrival: data.newArrival ?? false,
      status: data.status,
      stock: data.stock ?? 0,
      createdAt: data.createdAt,
    } as ProductLite & { createdAt: any }
  })
  
  return products
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, 200)
}

export async function getFlashSaleProducts(): Promise<Product[]> {
  // Use a single-field query to avoid composite indexes
  const q = query(
    collection(db, PRODUCTS_COL),
    where('status', '==', 'active')
  )
  const snap = await getDocs(q)
  
  // Filter for flash sale items client-side
  const products = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.flashSaleId != null)
    
  return products.slice(0, 12)
}

export async function getActiveFlashSale(): Promise<any | null> {
  const q = query(
    collection(db, 'flashSales'),
    where('active', '==', true),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// Admin: get all products (including drafts)
export async function getAllProductsAdmin(pageSize = 50, lastDoc?: DocumentSnapshot) {
  const constraints = [orderBy('createdAt', 'desc'), limit(pageSize)]
  if (lastDoc) constraints.push(startAfter(lastDoc) as never)
  const q = query(collection(db, PRODUCTS_COL), ...constraints)
  const snap = await getDocs(q)
  return {
    products: snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === pageSize,
  }
}

// ── Write ──────────────────────────────────────────────────
export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, PRODUCTS_COL), {
    ...data,
    avgRating: 0,
    reviewCount: 0,
    salesCount: 0,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COL, id))
}

export async function incrementViewCount(productId: string): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COL, productId), {
    viewCount: increment(1),
  })
}

export async function incrementSalesCount(productId: string, qty: number): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COL, productId), {
    salesCount: increment(qty),
    stock: increment(-qty),
  })
}
