// src/components/shared/LazyImage.tsx
// Intersection Observer-based lazy image with blur-up placeholder
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  wrapperClassName?: string
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto'
  objectFit?: 'cover' | 'contain'
  priority?: boolean // Skip lazy loading for above-fold images
}

const ASPECT_CLASSES = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  auto: '',
}

export default function LazyImage({
  src,
  alt,
  className,
  wrapperClassName,
  aspectRatio = 'square',
  objectFit = 'cover',
  priority = false,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // Start loading 200px before it enters viewport
    )
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [priority])

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative overflow-hidden bg-[var(--bg-muted)]',
        ASPECT_CLASSES[aspectRatio],
        wrapperClassName
      )}
    >
      {/* Skeleton shimmer while loading */}
      {!loaded && (
        <div className="absolute inset-0 skeleton" />
      )}

      {inView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'w-full h-full transition-opacity duration-500',
            objectFit === 'cover' ? 'object-cover' : 'object-contain',
            loaded ? 'opacity-100' : 'opacity-0',
            className
          )}
        />
      )}
    </div>
  )
}
