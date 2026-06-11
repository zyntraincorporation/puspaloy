// src/components/home/FlashSaleSection.tsx
// Dark luxury flash sale section with countdown timer + products
// Fixed: proper dark background so text is always visible; robust product rendering
import { motion } from 'framer-motion'
import { Zap, ShoppingBag } from 'lucide-react'
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

export default function FlashSaleSection({ flashSale, products, isLoading }: FlashSaleSectionProps) {
  // Determine whether the flash sale is currently active
  const now = new Date()
  const endDate = flashSale?.endAt?.toDate?.() ?? null
  const startDate = flashSale?.startAt?.toDate?.() ?? null

  const isWithinWindow =
    endDate !== null &&
    now < endDate &&
    (startDate === null || now >= startDate)

  const isActive = flashSale
    ? Boolean(flashSale.active) && isWithinWindow
    : false

  // Safely coerce products to an array (guards against undefined)
  const safeProducts: Product[] = Array.isArray(products) ? products : []

  // Show section only if:
  //   (a) still loading (show skeletons), OR
  //   (b) active flash sale exists with at least one product
  if (!isLoading && (!isActive || safeProducts.length === 0)) return null

  // The countdown target — fallback to 1 hour from now if endDate is somehow null
  const countdownTarget = endDate ?? new Date(Date.now() + 60 * 60 * 1000)

  return (
    // ── IMPORTANT: This section uses a forced dark background so that
    // "text-white" labels are ALWAYS visible regardless of the active theme.
    // Do NOT replace with CSS-variable backgrounds that depend on theme.
    <section
      className="py-14 md:py-20 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a0a0e 0%, #2d1018 40%, #1f1408 100%)',
      }}
    >
      {/* Subtle animated gold particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? '6px' : '3px',
              height: i % 3 === 0 ? '6px' : '3px',
              background: `hsla(42, 72%, 50%, ${0.15 + (i % 4) * 0.08})`,
              left: `${8 + i * 11}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -(12 + i * 4), 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2.5 + i * 0.35,
              repeat: Infinity,
              delay: i * 0.28,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Glowing rose vignette bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, hsla(340,55%,35%,0.18) 0%, transparent 70%)' }}
      />

      <div className="container-luxury relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {/* ── Section Header ─────────────────────────── */}
          <motion.div variants={fadeInUp} className="text-center mb-10">
            {/* "Limited Time Offer" label */}
            <div className="inline-flex items-center gap-2 mb-3">
              <Zap size={15} style={{ color: 'hsl(42,72%,58%)' }} fill="currentColor" />
              <span
                className="font-sans text-xs font-semibold tracking-[0.22em] uppercase"
                style={{ color: 'hsl(42,72%,58%)' }}
              >
                Limited Time Offer
              </span>
              <Zap size={15} style={{ color: 'hsl(42,72%,58%)' }} fill="currentColor" />
            </div>

            {/* Heading — always white since section is always dark */}
            <h2
              className="font-serif font-bold mb-3"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#ffffff', lineHeight: 1.15 }}
            >
              Flash Sale
            </h2>

            {/* Gold divider */}
            <div
              className="mx-auto mb-6"
              style={{
                height: '2px',
                width: '64px',
                background: 'linear-gradient(90deg, hsl(42,76%,60%), hsl(42,60%,40%))',
                borderRadius: '1px',
              }}
            />

            {/* Countdown */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <p className="font-sans text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Ends in:
              </p>
              <CountdownTimer targetDate={countdownTarget} variant="flash" />
            </div>

            {/* Sale title subtitle */}
            {flashSale?.title && (
              <p className="font-sans text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {flashSale.title}
              </p>
            )}
          </motion.div>

          {/* ── Products grid ──────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : safeProducts.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {safeProducts.slice(0, 8).map((product, index) => (
                <motion.div key={product.id} variants={fadeInUp} custom={index}>
                  <ProductCard
                    product={product}
                    animationDelay={index * 0.05}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Empty state — should rarely show since we return null above
            <div className="text-center py-12">
              <ShoppingBag size={40} style={{ color: 'rgba(255,255,255,0.25)', margin: '0 auto 12px' }} />
              <p className="font-sans text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No products in this flash sale yet.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
