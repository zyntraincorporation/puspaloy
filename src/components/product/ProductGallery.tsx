// src/components/product/ProductGallery.tsx
// Full image gallery: thumbnail strip, swipe, fullscreen lightbox, YouTube embed
import { useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import LazyImage from '@/components/shared/LazyImage'
import { cn } from '@/utils/cn'

interface ProductGalleryProps {
  images: string[]
  productName: string
  youtubeVideoId?: string | null
  badge?: React.ReactNode
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false)
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  if (playing) {
    return (
      <div className="aspect-video w-full rounded-luxury overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="Product video"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative aspect-video w-full rounded-luxury overflow-hidden group"
      aria-label="Play product video"
    >
      <img src={thumbUrl} alt="Product video thumbnail" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-luxury-md group-hover:scale-105 transition-transform">
          <Play size={24} className="text-rose-500 fill-rose-500 ml-1" />
        </div>
      </div>
      <span className="absolute bottom-3 left-3 font-sans text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded-full">
        Watch Video
      </span>
    </button>
  )
}

// ── Lightbox ───────────────────────────────────────────────
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[]
  startIndex: number
  onClose: () => void
}) {
  const [current, setCurrent] = useState(startIndex)

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length)
  const next = () => setCurrent((i) => (i + 1) % images.length)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Close lightbox"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <p className="absolute top-4 left-1/2 -translate-x-1/2 font-sans text-xs text-white/50">
        {current + 1} / {images.length}
      </p>

      {/* Main image */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-w-3xl max-h-[75vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[current]}
          alt={`Product image ${current + 1}`}
          className="max-h-[75vh] max-w-full rounded-luxury object-contain"
        />
      </motion.div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Thumbnails */}
      <div className="absolute bottom-4 flex gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'w-14 h-14 rounded-luxury overflow-hidden border-2 shrink-0 transition-all duration-200',
              i === current ? 'border-[var(--color-gold)] opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
            )}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Main Gallery ───────────────────────────────────────────
export default function ProductGallery({ images, productName, youtubeVideoId, badge }: ProductGalleryProps) {
  const allImages = images.length > 0 ? images : ['/placeholder-product.jpg']
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' })

  const onThumbClick = useCallback((index: number) => {
    setSelected(index)
    emblaApi?.scrollTo(index)
  }, [emblaApi])

  return (
    <div className="flex flex-col gap-3">
      {/* Main image — desktop: static, mobile: embla swipe */}

      {/* Desktop: static main + thumbnail strip */}
      <div className="hidden sm:block">
        <div
          className="relative rounded-luxury-lg overflow-hidden aspect-square bg-[var(--bg-muted)] cursor-zoom-in group"
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <LazyImage
                src={allImages[selected]}
                alt={`${productName} - Image ${selected + 1}`}
                aspectRatio="square"
                wrapperClassName="w-full h-full"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={14} className="text-[var(--text-primary)]" />
          </div>

          {/* Badge slot */}
          {badge && <div className="absolute top-3 left-3">{badge}</div>}
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => onThumbClick(i)}
                className={cn(
                  'shrink-0 w-16 h-16 rounded-luxury overflow-hidden border-2 transition-all duration-200',
                  i === selected
                    ? 'border-[var(--color-rose)] shadow-gold'
                    : 'border-[var(--border)] opacity-60 hover:opacity-100 hover:border-[var(--color-rose-light)]'
                )}
                aria-label={`View image ${i + 1}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Embla swipe carousel */}
      <div className="sm:hidden">
        <div ref={emblaRef} className="overflow-hidden rounded-luxury-lg">
          <div className="flex touch-pan-y">
            {allImages.map((img, i) => (
              <div key={i} className="flex-[0_0_100%] relative aspect-square bg-[var(--bg-muted)]"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={img}
                  alt={`${productName} ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Dots */}
        {allImages.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {allImages.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full transition-all duration-200',
                  i === selected ? 'w-4 h-1.5 bg-[var(--color-rose)]' : 'w-1.5 h-1.5 bg-[var(--border-strong)]'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* YouTube embed (if provided) */}
      {youtubeVideoId && (
        <div className="mt-1">
          <YouTubeEmbed videoId={youtubeVideoId} />
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox images={allImages} startIndex={selected} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
