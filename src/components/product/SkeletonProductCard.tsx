// src/components/product/SkeletonProductCard.tsx
import { cn } from '@/utils/cn'

interface SkeletonProductCardProps {
  className?: string
}

export default function SkeletonProductCard({ className }: SkeletonProductCardProps) {
  return (
    <div className={cn('card-product overflow-hidden', className)}>
      {/* Image skeleton */}
      <div className="aspect-[3/4] skeleton" />

      {/* Content skeleton */}
      <div className="p-3 space-y-2.5">
        {/* Category */}
        <div className="h-2.5 w-16 skeleton rounded-full" />
        {/* Name */}
        <div className="h-3.5 w-full skeleton rounded" />
        <div className="h-3.5 w-3/4 skeleton rounded" />
        {/* Rating */}
        <div className="h-3 w-20 skeleton rounded-full" />
        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-5 w-20 skeleton rounded" />
          <div className="h-3.5 w-14 skeleton rounded" />
        </div>
        {/* Button */}
        <div className="h-9 w-full skeleton rounded-luxury mt-2" />
      </div>
    </div>
  )
}
