// src/components/home/ProductSection.tsx
// Reusable product grid section — used for Featured, New Arrivals, Best Sellers, Trending
import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/animations'
import ProductCard from '@/components/product/ProductCard'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import SectionHeader from './SectionHeader'
import type { Product } from '@/types'

interface ProductSectionProps {
  label?: string
  title: string
  subtitle?: string
  products: Product[]
  isLoading?: boolean
  viewAllHref?: string
  bgColor?: 'primary' | 'muted'
  columns?: 2 | 4
  maxItems?: number
}

const SKELETON_COUNT = 4

export default function ProductSection({
  label,
  title,
  subtitle,
  products,
  isLoading = false,
  viewAllHref,
  bgColor = 'primary',
  columns = 4,
  maxItems = 8,
}: ProductSectionProps) {
  const displayProducts = products.slice(0, maxItems)

  const gridClass =
    columns === 2
      ? 'grid grid-cols-2 gap-3 sm:gap-4'
      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'

  // Key changes when loading finishes so the motion container remounts and
  // re-evaluates whileInView — prevents the race where once:true fires while
  // the section is visible but products haven't loaded yet.
  const motionKey = isLoading ? 'loading' : 'loaded'

  return (
    <section
      className="py-14 md:py-20"
      style={{ backgroundColor: bgColor === 'muted' ? 'var(--bg-muted)' : 'var(--bg-primary)' }}
    >
      <div className="container-luxury">
        <motion.div
          key={motionKey}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05, margin: '-60px' }}
        >
          <SectionHeader
            label={label}
            title={title}
            subtitle={subtitle}
            viewAllHref={viewAllHref}
          />

          {/* Skeleton loading */}
          {isLoading && (
            <div className={gridClass}>
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          )}

          {/* Products grid */}
          {!isLoading && displayProducts.length > 0 && (
            <div className={gridClass}>
              {displayProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  animationDelay={index * 0.05}
                  priority={index < 4}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && displayProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="font-sans text-[var(--text-muted)] text-sm">No products available</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
