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
      const content = await getHomepageContent()
      if (!content) return null

      const allActive = await getAllActiveProductsLite()
      
      const featured = (content.featuredProductIds ?? [])
        .map(id => allActive.find(p => p.id === id))
        .filter(Boolean)
      
      const newArrivals = (content.newArrivalProductIds ?? [])
        .map(id => allActive.find(p => p.id === id))
        .filter(Boolean)
        
      const bestSellers = (content.bestSellerProductIds ?? [])
        .map(id => allActive.find(p => p.id === id))
        .filter(Boolean)
        
      const trending = (content.trendingProductIds ?? [])
        .map(id => allActive.find(p => p.id === id))
        .filter(Boolean)

      return { content, featured, newArrivals, bestSellers, trending }
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
      const { getActiveFlashSale } = await import('@/firebase/products')
      const flashSale = await getActiveFlashSale()
      const products = await getFlashSaleProducts()
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
