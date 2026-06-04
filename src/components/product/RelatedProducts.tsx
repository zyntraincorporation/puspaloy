// src/components/product/RelatedProducts.tsx
// Related products carousel + "Customers Also Like" section
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useRelatedProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import SectionHeader from '@/components/home/SectionHeader'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import type { Product } from '@/types'

interface RelatedProductsProps {
  product: Product
}

export default function RelatedProducts({ product }: RelatedProductsProps) {
  const { data: related = [], isLoading } = useRelatedProducts(product.category, product.id, 8)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 2,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 3 },
      '(min-width: 1024px)': { slidesToScroll: 4 },
    },
  })

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  if (!isLoading && related.length === 0) return null

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: 'var(--bg-muted)' }}>
      <div className="container-luxury">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <div className="flex items-end justify-between mb-6">
            <SectionHeader
              label="You May Also Like"
              title="Related Products"
              align="left"
            />
            {/* Carousel controls */}
            <div className="hidden sm:flex items-center gap-2 mb-1">
              <button
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canPrev}
                className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] disabled:opacity-30 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canNext}
                className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] disabled:opacity-30 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : (
            /* Carousel on mobile, grid on desktop */
            <>
              {/* Mobile carousel */}
              <div className="sm:hidden overflow-hidden -mx-4" ref={emblaRef}>
                <div className="flex px-4 gap-3">
                  {related.map((p, i) => (
                    <div key={p.id} className="flex-[0_0_70vw]">
                      <ProductCard product={p} animationDelay={i * 0.05} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop grid */}
              <div className="hidden sm:grid grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {related.map((p, i) => (
                  <motion.div key={p.id} variants={fadeInUp} custom={i * 0.05}>
                    <ProductCard product={p} animationDelay={i * 0.05} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
