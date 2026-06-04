// src/components/home/ReviewsCarousel.tsx
// Customer reviews carousel using Embla Carousel
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import type { Review } from '@/types'

const DEMO_REVIEWS: Omit<Review, 'id' | 'productId' | 'productImage' | 'status' | 'createdAt' | 'approvedAt' | 'approvedBy'>[] = [
  {
    productName: 'Rose Glow Vitamin C Serum',
    reviewerName: 'Fatema Akter',
    rating: 5,
    comment: 'অসাধারণ পণ্য! আমার স্কিন এখন অনেক উজ্জ্বল দেখাচ্ছে। PUSPALOY থেকে কেনা সবসময়ই আনন্দের।',
  },
  {
    productName: 'Premium Gift Box',
    reviewerName: 'Nusrat Jahan',
    rating: 5,
    comment: 'The packaging was absolutely stunning! My friend loved the gift. Will definitely order again from PUSPALOY.',
  },
  {
    productName: 'Luxury Heel Collection',
    reviewerName: 'Rima Begum',
    rating: 5,
    comment: 'জুতাগুলো এত সুন্দর এবং আরামদায়ক। মানের দিক থেকে সত্যিই লাক্সারি ব্র্যান্ডের মতো।',
  },
  {
    productName: 'Floral Perfume Set',
    reviewerName: 'Sadia Islam',
    rating: 5,
    comment: 'The fragrance is divine and lasts all day. The bottle design is so elegant — truly premium quality!',
  },
  {
    productName: 'Personalized Photo Frame',
    reviewerName: 'Mitu Khanam',
    rating: 4,
    comment: 'পার্সোনালাইজড গিফটটা পেয়ে আমি মুগ্ধ হয়ে গেছি। ডেলিভারিও ছিল খুব দ্রুত।',
  },
  {
    productName: 'Luxury Lipstick Set',
    reviewerName: 'Priya Das',
    rating: 5,
    comment: 'Beautiful colors and long-lasting formula. The PUSPALOY experience from ordering to delivery was flawless!',
  },
]

interface ReviewsCarouselProps {
  reviews?: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          className={star <= rating ? 'text-gold-500 fill-gold-500' : 'text-[var(--border-strong)]'}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: typeof DEMO_REVIEWS[0] }) {
  return (
    <div className="flex-[0_0_min(85vw,340px)] mx-2 sm:mx-3">
      <div className="card-luxury p-6 h-full flex flex-col gap-4">
        {/* Quote icon */}
        <Quote
          size={28}
          className="text-[var(--color-rose)]/20 fill-[var(--color-rose)]/10 -mb-2"
        />

        {/* Stars */}
        <StarRating rating={review.rating} />

        {/* Review text */}
        <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-4">
          "{review.comment}"
        </p>

        {/* Reviewer */}
        <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
          <div className="w-9 h-9 rounded-full bg-gradient-luxury flex items-center justify-center shrink-0">
            <span className="font-sans text-sm font-semibold text-white">
              {review.reviewerName[0]}
            </span>
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">
              {review.reviewerName}
            </p>
            <p className="font-sans text-[11px] text-[var(--text-muted)]">
              {review.productName}
            </p>
          </div>
          <span className="ml-auto font-sans text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
            Verified
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )

  const displayReviews = reviews && reviews.length > 0 ? reviews : DEMO_REVIEWS

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="container-luxury">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <p className="section-label justify-center">
              <span className="w-6 h-px bg-gradient-gold" />
              Testimonials
              <span className="w-6 h-px bg-gradient-gold" />
            </p>
            <h2 className="section-title">What Our Customers Say</h2>
            <div className="divider-gold" />

            {/* Overall rating display */}
            <div className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[var(--bg-muted)] border border-[var(--border)]">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className="text-gold-500 fill-gold-500" />
                ))}
              </div>
              <span className="font-display font-semibold text-[var(--text-primary)]">4.9</span>
              <span className="font-sans text-sm text-[var(--text-muted)]">from 500+ reviews</span>
            </div>
          </motion.div>

          {/* Carousel — no overflow container clipping needed */}
          <div ref={emblaRef} className="overflow-hidden -mx-2 sm:-mx-3">
            <div className="flex py-2 touch-pan-y">
              {displayReviews.map((review, index) => (
                <ReviewCard key={index} review={review} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
