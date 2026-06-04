// src/pages/CatalogPage.tsx
import SEO from '@/components/shared/SEO'
import { motion } from 'framer-motion'
import { useProductIndex } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import type { Product } from '@/types'

export default function CatalogPage() {
  const { data: products = [], isLoading } = useProductIndex()

  return (
    <>
      <SEO 
        title="All Catalog – PUSPALOY"
        description="Explore the complete collection of premium cosmetics, women's shoes, luxury gifts, and accessories at PUSPALOY."
        url="https://puspaloygiftzone.shop/catalog"
      />

      <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Banner */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80"
            alt="All Catalog"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="px-4">
              <motion.h1 variants={fadeInUp} className="font-serif text-3xl sm:text-5xl font-bold text-white mb-3">
                All Catalog
              </motion.h1>
              <motion.p variants={fadeInUp} className="font-sans text-sm sm:text-base text-white/90 max-w-lg mx-auto">
                Explore our complete collection of premium luxury items.
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="container-luxury mt-8 sm:mt-12">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(12)].map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-[var(--bg-surface)] rounded-luxury border border-[var(--border)]">
              <p className="font-serif text-xl text-[var(--text-secondary)] mb-2">No products found</p>
              <p className="font-sans text-sm text-[var(--text-muted)]">Check back later for new arrivals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product, idx) => (
                <ProductCard 
                  key={product.id} 
                  product={product as unknown as Product} 
                  animationDelay={Math.min(idx * 0.05, 0.5)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
