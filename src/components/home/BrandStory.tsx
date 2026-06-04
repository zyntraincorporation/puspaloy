// src/components/home/BrandStory.tsx
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp, scaleIn } from '@/lib/animations'

interface BrandStoryProps {
  title?: string
  subtitle?: string
  content?: string
  image?: string
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80'

export default function BrandStory({
  title = 'The Story of PUSPALOY',
  subtitle = 'Born in Bangladesh, Made for the World',
  content = `<p>PUSPALOY was born from a deep passion for beauty, elegance, and the art of gifting. Founded with a vision to bring luxury within reach for every woman in Bangladesh, we carefully curate the finest cosmetics, shoes, gifts, and accessories.</p><p>Every product in our collection is chosen with love — for quality, for elegance, and for the joy it brings. We believe that every woman deserves to feel extraordinary, and every gift should tell a story.</p>`,
  image = DEFAULT_IMAGE,
}: BrandStoryProps) {
  return (
    <section
      id="brand-story"
      className="py-16 md:py-24 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="container-luxury">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Image side */}
          <motion.div variants={scaleIn} className="relative order-2 lg:order-1">
            <div className="relative">
              {/* Decorative gold border */}
              <div className="absolute -top-4 -left-4 w-full h-full border border-[var(--color-gold)]/30 rounded-luxury-xl pointer-events-none" />

              <div className="relative rounded-luxury-xl overflow-hidden aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]">
                <img
                  src={image}
                  alt="PUSPALOY Brand Story"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating gold badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-5 -right-4 sm:-right-6 bg-gradient-luxury text-white
                  rounded-luxury-lg px-5 py-3 shadow-luxury-md"
              >
                <p className="font-display text-2xl font-bold">৳</p>
                <p className="font-sans text-xs font-medium opacity-90">Bangladesh's Finest</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div variants={fadeInUp} className="order-1 lg:order-2">
            <span className="section-label">
              <span className="w-6 h-px bg-gradient-gold" />
              Our Story
              <span className="w-6 h-px bg-gradient-gold" />
            </span>

            <h2 className="section-title mb-2">{title}</h2>
            <p className="font-sans text-base font-medium text-[var(--color-gold)] mb-6">{subtitle}</p>

            <div className="h-px w-16 bg-gradient-gold mb-8" />

            {/* Story content */}
            <div
              className="font-sans text-base text-[var(--text-secondary)] leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-[var(--border)]">
              {[
                { number: '500+', label: 'Products' },
                { number: '10K+', label: 'Happy Customers' },
                { number: '5★', label: 'Average Rating' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-2xl sm:text-3xl font-bold text-gradient-gold">
                    {stat.number}
                  </p>
                  <p className="font-sans text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
