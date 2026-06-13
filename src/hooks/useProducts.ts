import { useQuery } from '@tanstack/react-query'
import {
  getAllActiveProductsLite,
  getFeaturedProducts,
  getProductsByCategory,
  getFlashSaleProducts,
  getProductBySlug,
  incrementViewCount,
} from '@/firebase/products'
import { getHomepageContent } from '@/firebase/content'
import type { ProductCategory } from '@/types'

// Fetch homepage content + resolve product IDs
export function useHomepageProducts() {
  return useQuery({
    queryKey: ['homepage-content'],
    queryFn: async () => {
      // Run both fetches in PARALLEL — cuts load time in half
      const [content, allActive] = await Promise.all([
        getHomepageContent(),
        getAllActiveProductsLite(),
      ])

      // Helper: resolve IDs → products, fall back to top N from catalog
      const resolve = (ids: string[], fallbackSlice: number, fallbackOffset = 0) => {
        if (ids.length > 0) {
          const resolved = ids
            .map(id => allActive.find(p => p.id === id))
            .filter(Boolean)
          if (resolved.length > 0) return resolved
        }
        // No curated IDs (or none matched) → use catalog products as fallback
        return allActive.slice(fallbackOffset, fallbackOffset + fallbackSlice)
      }

      const ids = {
        featured:    (content?.featuredProductIds     ?? []),
        newArrivals: (content?.newArrivalProductIds   ?? []),
        bestSellers: (content?.bestSellerProductIds   ?? []),
        trending:    (content?.trendingProductIds     ?? []),
      }

      return {
        content,
        featured:    resolve(ids.featured,    8, 0),
        newArrivals: resolve(ids.newArrivals, 8, 4),
        bestSellers: resolve(ids.bestSellers, 8, 8),
        trending:    resolve(ids.trending,    4, 12),
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Lite index for search + recommendations (cached longer)
export function useProductIndex() {
  return useQuery({
    queryKey: ['product-index'],
    queryFn: getAllActiveProductsLite,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// Flash sale products
export function useFlashSaleProducts() {
  return useQuery({
    queryKey: ['flash-sale-products'],
    queryFn: async () => {
      const { getActiveFlashSale, getAllActiveProductsLite } = await import('@/firebase/products')
      const flashSale = await getActiveFlashSale()
      
      if (!flashSale || !flashSale.active) {
        return { flashSale: null, products: [] }
      }
      
      const now = new Date()
      const startAt = flashSale.startAt?.toDate?.() ?? null
      const endAt = flashSale.endAt?.toDate?.() ?? null

      // Check end time
      if (endAt && now > endAt) {
        return { flashSale: null, products: [] }
      }

      // Check start time — sale hasn't started yet
      if (startAt && now < startAt) {
        return { flashSale: null, products: [] }
      }

      const allProducts = await getAllActiveProductsLite()
      // Guard against missing/malformed products array in Firestore doc
      const saleItems: any[] = Array.isArray(flashSale.products) ? flashSale.products : []
      
      if (saleItems.length === 0) {
        return { flashSale, products: [] }
      }

      const products = saleItems
        .map((saleItem: any) => {
          if (!saleItem?.productId) return null
          const product = allProducts.find(p => p.id === saleItem.productId)
          if (!product) return null
          return {
            ...product,
            flashSaleId: flashSale.id,
            // Prefer flashPrice field; fall back to flashSalePrice for older records
            flashSalePrice: saleItem.flashPrice ?? saleItem.flashSalePrice ?? null,
          }
        })
        .filter(Boolean)

      return { flashSale, products }
    },
    staleTime: 2 * 60 * 1000,
  })
}

// Category products with pagination
export function useCategoryProducts(category: ProductCategory, pageSize = 24) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: () => getProductsByCategory(category, pageSize),
    staleTime: 5 * 60 * 1000,
    enabled: !!category,
  })
}

// ── Phase 3 hooks ─────────────────────────────────────────

// Single product by slug (with view count increment)
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const product = await getProductBySlug(slug)
      if (product) {
        // Fire-and-forget view count increment
        incrementViewCount(product.id).catch(() => {})
      }
      return product
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!slug,
  })
}

// Related products in same category (excluding current)
export function useRelatedProducts(category: ProductCategory, excludeId: string, count = 6) {
  return useQuery({
    queryKey: ['related', category, excludeId],
    queryFn: async () => {
      const result = await getProductsByCategory(category, count + 1)
      return result.products.filter((p) => p.id !== excludeId).slice(0, count)
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!category && !!excludeId,
  })
}
