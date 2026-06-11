// src/pages/CategoryPage.tsx
// UPDATED:
//  - If a category has 0 products, shows a "Coming Soon" state instead of an empty grid
//  - Redirects to /catalog only if the category slug doesn't exist at all
//  - Proper loading skeleton to avoid layout shift
import SEO from '@/components/shared/SEO'
import { useParams, Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCategoryProducts } from '@/hooks/useProducts'
import { useActiveCategories } from '@/hooks/useCategories'
import ProductCard from '@/components/product/ProductCard'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { Package, ArrowRight } from 'lucide-react'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: categories = [], isLoading: isLoadingCategories } = useActiveCategories()

  const currentCategory = categories.find(c => c.slug === slug)

  const { data, isLoading: isLoadingProducts } = useCategoryProducts(slug ?? '')
  const products = data?.products ?? []

  // Still loading categories — show spinner
  if (isLoadingCategories) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[var(--color-rose)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Category does not exist → redirect to catalog
  if (!currentCategory && !isLoadingCategories) {
    return <Navigate to="/catalog" replace />
  }

  const title = currentCategory?.name || 'Category'
  const description = currentCategory?.description || `Explore our ${title} collection`
  const banner = currentCategory?.banner || currentCategory?.image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80'
  const hasProducts = products.length > 0
  const isEmpty = !isLoadingProducts && products.length === 0

  return (
    <>
      <SEO
        title={title}
        description={description}
        image={banner}
        url={`https://puspaloygiftzone.shop/category/${slug}`}
      />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Category banner */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img
            src={banner}
            alt={title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
          <div className="absolute inset-0 flex items-center">
            <div className="container-luxury">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-bold drop-shadow-xl"
                >
                  {title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 sm:mt-4 text-white/90 font-sans text-sm sm:text-base md:text-lg max-w-2xl"
                >
                  {description}
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Products / States */}
        <div className="container-luxury py-10">

          {/* Loading skeleton */}
          {isLoadingProducts && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          )}

          {/* ── Coming Soon — category exists but no products yet ── */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mx-auto mb-6">
                <Package size={36} className="text-[var(--color-rose)]" />
              </div>
              <h2 className="font-serif text-3xl text-[var(--text-primary)] mb-3">
                Coming Soon
              </h2>
              <p className="font-sans text-base text-[var(--text-muted)] max-w-md mx-auto mb-8">
                We're curating amazing products for the <strong>{title}</strong> collection.
                Check back soon — new arrivals are added regularly!
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  to="/catalog"
                  className="btn-primary gap-2"
                >
                  Browse All Products <ArrowRight size={16} />
                </Link>
                <Link
                  to="/"
                  className="btn-secondary gap-2"
                >
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Product grid ── */}
          {hasProducts && (
            <>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-sans text-sm text-[var(--text-muted)] mb-6"
              >
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </motion.p>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
              >
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    animationDelay={index * 0.04}
                    priority={index < 4}
                  />
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
