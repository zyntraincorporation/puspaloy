// src/components/home/FlashSaleSection.tsx
// Dark luxury flash sale section with countdown timer
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import CountdownTimer from '@/components/shared/CountdownTimer'
import ProductCard from '@/components/product/ProductCard'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import type { Product, FlashSale } from '@/types'

interface FlashSaleSectionProps {
  flashSale?: FlashSale | null
  products: Product[]
  isLoading?: boolean
}

// Demo end date: 48 hours from now (replaced by real Firestore data)
const DEMO_END = new Date(Date.now() + 48 * 60 * 60 * 1000)

export default function FlashSaleSection({ flashSale, products, isLoading }: FlashSaleSectionProps) {
  const endDate = flashSale?.endAt?.toDate() ?? DEMO_END
  const isActive = flashSale ? flashSale.active && new Date() < endDate : false

  // Show section only if active flash sale OR loading
  if (!isLoading && !isActive && products.length === 0) return null

  return (
    <section className="py-14 md:py-20 relative overflow-hidden bg-luxury-black">
      {/* Gold particle decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold-400/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container-luxury relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Zap size={16} className="text-[var(--color-gold)] fill-current" />
              <span className="font-sans text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
                Limited Time Offer
              </span>
              <Zap size={16} className="text-[var(--color-gold)] fill-current" />
            </div>

            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-3">
              Flash Sale
            </h2>

            <div className="h-px w-16 bg-gradient-gold mx-auto mb-6" />

            {/* Countdown */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <p className="font-sans text-sm text-white/60">Ends in:</p>
              <CountdownTimer targetDate={endDate} variant="flash" />
            </div>

            {flashSale?.title && (
              <p className="font-sans text-sm text-white/50 mt-2">{flashSale.title}</p>
            )}
          </motion.div>

          {/* Products horizontal scroll on mobile, grid on desktop */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.slice(0, 8).map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
