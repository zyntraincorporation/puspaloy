// src/components/home/HeroSlider.tsx
// Mobile-first hero banner slider using Embla Carousel with autoplay & touch swipe
import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HeroBanner } from '@/types'

// ── Fallback banners (used when Firebase content isn't loaded yet) ──────────
const FALLBACK_BANNERS: HeroBanner[] = [
  {
    id: 'b1',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80',
    imageMobile: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
    title: 'Luxury Begins Here',
    subtitle: 'Premium cosmetics curated for the modern woman',
    ctaText: 'Explore Collection',
    ctaLink: '/category/cosmetics',
    order: 0,
    active: true,
  },
  {
    id: 'b2',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&q=80',
    imageMobile: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    title: 'Gift the Extraordinary',
    subtitle: 'Personalized luxury gifts that leave lasting impressions',
    ctaText: 'Shop Gifts',
    ctaLink: '/category/gifts',
    order: 1,
    active: true,
  },
  {
    id: 'b3',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80',
    imageMobile: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    title: 'Step Into Elegance',
    subtitle: "Discover women's shoes that define your style",
    ctaText: 'Shop Shoes',
    ctaLink: '/category/shoes',
    order: 2,
    active: true,
  },
]

interface HeroSliderProps {
  banners?: HeroBanner[]
}

export default function HeroSlider({ banners }: HeroSliderProps) {
  const slides = (banners ?? FALLBACK_BANNERS).filter((b) => b.active)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      skipSnaps: false,
      dragFree: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  return (
    <section className="relative w-full overflow-hidden bg-luxury-black" style={{ height: 'min(100svh, 700px)' }}>
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden h-full touch-pan-y no-select">
        <div className="flex h-full" style={{ backfaceVisibility: 'hidden' }}>
          {slides.map((banner, index) => (
            <div key={banner.id} className="flex-[0_0_100%] relative h-full">
              {/* Background image */}
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet={banner.imageMobile || banner.image}
                />
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding={index === 0 ? 'sync' : 'async'}
                />
              </picture>

              {/* Gradient overlay — stronger on mobile for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10
                sm:bg-gradient-to-r sm:from-black/75 sm:via-black/40 sm:to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex items-end sm:items-center pb-20 sm:pb-0">
                <div className="container-luxury">
                  <AnimatePresence>
                    {selectedIndex === index && (
                      <motion.div
                        key={`content-${banner.id}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="max-w-lg"
                      >
                        {/* Gold accent line */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: 48 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          className="h-0.5 bg-gradient-gold mb-4"
                        />

                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3">
                          {banner.title}
                        </h1>

                        <p className="font-sans text-base sm:text-lg text-white/80 leading-relaxed mb-6 sm:mb-8">
                          {banner.subtitle}
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <Link
                            to={banner.ctaLink}
                            className="btn-gold px-7 py-3.5 text-sm font-semibold"
                          >
                            {banner.ctaText}
                          </Link>
                          <Link
                            to="/category/cosmetics"
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-luxury text-sm font-sans font-semibold text-white border border-white/30 hover:bg-white/10 transition-all duration-300"
                          >
                            View All
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow Controls — hidden on small mobile, shown md+ */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full items-center justify-center
              bg-white/15 backdrop-blur-sm border border-white/20 text-white
              hover:bg-white/25 transition-all duration-200"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full items-center justify-center
              bg-white/15 backdrop-blur-sm border border-white/20 text-white
              hover:bg-white/25 transition-all duration-200"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex
                  ? 'w-6 h-2 bg-[var(--color-gold)]'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 right-6 sm:right-8 z-20 hidden sm:flex flex-col items-center gap-1"
      >
        <div className="w-px h-10 bg-white/30 relative overflow-hidden">
          <motion.div
            className="absolute inset-x-0 h-4 bg-[var(--color-gold)]"
            animate={{ y: ['-100%', '300%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <span className="font-sans text-[9px] tracking-widest text-white/40 uppercase">Scroll</span>
      </motion.div>
    </section>
  )
}
