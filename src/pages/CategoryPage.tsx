// src/pages/CategoryPage.tsx
import SEO from '@/components/shared/SEO'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCategoryProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import type { ProductCategory } from '@/types'

const CATEGORY_META: Record<string, { title: string; description: string; banner: string }> = {
  cosmetics: {
    title: 'Premium Cosmetics',
    description: 'Skincare, makeup, and beauty essentials curated for the modern woman',
    banner: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80',
  },
  shoes: {
    title: "Women's Shoes",
    description: 'Elegant heels, flats, and sandals crafted for style and comfort',
    banner: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1400&q=80',
  },
  gifts: {
    title: 'Premium Gift Items',
    description: 'Luxury gift sets and hampers for every special occasion',
    banner: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1400&q=80',
  },
  'personalized-gifts': {
    title: 'Personalized Gifts',
    description: 'Custom gifts made with love — uniquely crafted for your loved ones',
    banner: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=1400&q=80',
  },
  accessories: {
    title: 'Fashion Accessories',
    description: 'Handbags, jewelry, and fashion extras to complete your look',
    banner: 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=1400&q=80',
  },
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const category = (slug as ProductCategory) ?? 'cosmetics'
  const meta = CATEGORY_META[slug ?? 'cosmetics'] ?? CATEGORY_META.cosmetics
  const { data, isLoading } = useCategoryProducts(category)
  const products = data?.products ?? []

  return (
    <>
      <SEO 
        title={meta.title}
        description={meta.description}
        image={meta.banner}
        url={`https://puspaloy.com/category/${slug ?? 'cosmetics'}`}
      />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Category banner */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img
            src={meta.banner}
            alt={meta.title}
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
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
                  {meta.title}
                </h1>
                <p className="font-sans text-sm text-white/70 max-w-md">{meta.description}</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="container-luxury py-10">
          {/* Result count */}
          {!isLoading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-sans text-sm text-[var(--text-muted)] mb-6"
            >
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </motion.p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-[var(--text-primary)] mb-3">No products yet</p>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Check back soon — new arrivals are added regularly!
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </>
  )
}
