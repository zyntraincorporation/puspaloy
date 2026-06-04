// src/components/product/ProductReviews.tsx
// Reviews list + submit form with star input
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, CheckCircle, Loader2 } from 'lucide-react'
import { useProductReviews, useSubmitReview } from '@/hooks/useReviews'
import { StarRatingDisplay, StarRatingInput } from '@/components/shared/StarRating'
import { formatDate } from '@/utils/formatters'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import type { Product } from '@/types'

interface ProductReviewsProps {
  product: Product
}

function ReviewCard({ review }: { review: { id: string; reviewerName: string; rating: number; comment: string; createdAt: { toDate: () => Date } | null } }) {
  return (
    <motion.div variants={fadeInUp} className="p-4 sm:p-5 rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-luxury flex items-center justify-center shrink-0">
            <span className="font-sans text-sm font-semibold text-white">
              {review.reviewerName[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">{review.reviewerName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRatingDisplay rating={review.rating} size={11} />
              <span className="font-sans text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium dark:bg-emerald-950/20">
                Verified Purchase
              </span>
            </div>
          </div>
        </div>
        {review.createdAt && (
          <span className="font-sans text-xs text-[var(--text-muted)] shrink-0">
            {formatDate(review.createdAt)}
          </span>
        )}
      </div>
      <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed mt-3">
        {review.comment}
      </p>
    </motion.div>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs font-sans">
      <span className="text-[var(--text-muted)] w-4 text-right">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full rounded-full bg-gradient-gold"
        />
      </div>
      <span className="text-[var(--text-muted)] w-5">{count}</span>
    </div>
  )
}

export default function ProductReviews({ product }: ProductReviewsProps) {
  const { data: reviews = [], isLoading } = useProductReviews(product.id)
  const { mutate: submit, isPending, isSuccess, reset } = useSubmitReview(product.id)

  const [form, setForm] = useState({ name: '', rating: 5, comment: '' })
  const [submitted, setSubmitted] = useState(false)

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.comment.trim() || form.rating === 0) return
    submit({
      productId: product.id,
      productName: product.name,
      productImage: product.featuredImage,
      reviewerName: form.name.trim(),
      rating: form.rating,
      comment: form.comment.trim(),
    }, {
      onSuccess: () => {
        setSubmitted(true)
        setForm({ name: '', rating: 5, comment: '' })
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Rating summary + distribution */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 p-5 rounded-luxury-lg bg-[var(--bg-muted)]">
          <div className="text-center sm:text-left">
            <p className="font-display text-5xl font-bold text-[var(--color-gold)]">
              {product.avgRating.toFixed(1)}
            </p>
            <StarRatingDisplay rating={product.avgRating} size={16} className="justify-center sm:justify-start mt-1" />
            <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
              {product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map((d) => (
              <RatingBar key={d.star} label={String(d.star)} count={d.count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-luxury-lg" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <User size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-sans text-sm text-[var(--text-muted)]">No reviews yet — be the first!</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review as never} />
          ))}
        </motion.div>
      )}

      {/* Submit review form */}
      <div className="border-t border-[var(--border)] pt-8">
        <h3 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-5">
          Write a Review
        </h3>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-8 text-center"
            >
              <CheckCircle size={40} className="text-emerald-500" />
              <p className="font-serif text-lg text-[var(--text-primary)]">Thank you for your review!</p>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Your review will appear after moderation.
              </p>
              <button
                onClick={() => { setSubmitted(false); reset() }}
                className="btn-ghost text-sm mt-2"
              >
                Write another review
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label htmlFor="reviewer-name" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                  Your Name *
                </label>
                <input
                  id="reviewer-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Fatema Akter"
                  className="input-luxury"
                  required
                  maxLength={60}
                />
              </div>

              {/* Star rating input */}
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-2">
                  Your Rating *
                </label>
                <StarRatingInput
                  value={form.rating}
                  onChange={(r) => setForm((f) => ({ ...f, rating: r }))}
                  size={30}
                />
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="review-comment" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                  Your Review *
                </label>
                <textarea
                  id="review-comment"
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="input-luxury resize-none"
                  required
                  minLength={15}
                  maxLength={1000}
                />
                <p className="font-sans text-xs text-[var(--text-muted)] mt-1 text-right">
                  {form.comment.length}/1000
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isPending || !form.name || !form.comment || form.rating === 0}
                className="btn-primary w-full sm:w-auto px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                ) : (
                  'Submit Review'
                )}
              </motion.button>

              <p className="font-sans text-xs text-[var(--text-muted)]">
                Reviews are moderated before publishing. Your privacy is protected.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
