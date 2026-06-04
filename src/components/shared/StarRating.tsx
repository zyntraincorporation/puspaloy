// src/components/shared/StarRating.tsx
// Reusable star rating display + interactive input
import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StarRatingDisplayProps {
  rating: number
  count?: number
  size?: number
  className?: string
}

export function StarRatingDisplay({ rating, count, size = 13, className }: StarRatingDisplayProps) {
  const rounded = Math.round(rating * 2) / 2 // Round to nearest 0.5

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rounded ? 'text-gold-500 fill-gold-500' : 'text-[var(--border-strong)]'}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="font-sans text-xs text-[var(--text-muted)]">({count.toLocaleString()})</span>
      )}
    </div>
  )
}

interface StarRatingInputProps {
  value: number
  onChange: (rating: number) => void
  size?: number
}

export function StarRatingInput({ value, onChange, size = 28 }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            className="transition-transform duration-100 hover:scale-110 active:scale-95"
          >
            <Star
              size={size}
              className={cn(
                'transition-colors duration-150',
                active ? 'text-gold-500 fill-gold-500' : 'text-[var(--border-strong)]'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
