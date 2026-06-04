// src/components/home/CategoryGrid.tsx
// Premium animated category cards — 2 cols mobile, 3 tablet, 5 desktop
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, Footprints, Gift, Gem, Package } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import SectionHeader from './SectionHeader'

const CATEGORIES = [
  {
    slug: 'cosmetics',
    name: 'Cosmetics',
    nameBn: 'কসমেটিক্স',
    description: 'Premium beauty',
    icon: Sparkles,
    gradient: 'from-rose-400 to-pink-500',
    bg: 'from-rose-50 to-pink-50',
    darkBg: 'from-rose-950/30 to-pink-950/30',
    count: 'Skincare & Makeup',
  },
  {
    slug: 'shoes',
    name: "Women's Shoes",
    nameBn: 'জুতা',
    description: 'Luxury footwear',
    icon: Footprints,
    gradient: 'from-gold-400 to-amber-500',
    bg: 'from-amber-50 to-yellow-50',
    darkBg: 'from-amber-950/30 to-yellow-950/30',
    count: 'Heels & Flats',
  },
  {
    slug: 'gifts',
    name: 'Premium Gifts',
    nameBn: 'গিফট',
    description: 'Luxury gifting',
    icon: Gift,
    gradient: 'from-purple-400 to-violet-500',
    bg: 'from-purple-50 to-violet-50',
    darkBg: 'from-purple-950/30 to-violet-950/30',
    count: 'For Every Occasion',
  },
  {
    slug: 'personalized-gifts',
    name: 'Personalized',
    nameBn: 'পার্সোনালাইজড',
    description: 'Custom creations',
    icon: Gem,
    gradient: 'from-teal-400 to-cyan-500',
    bg: 'from-teal-50 to-cyan-50',
    darkBg: 'from-teal-950/30 to-cyan-950/30',
    count: 'Made Just for You',
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    nameBn: 'এক্সেসরিজ',
    description: 'Fashion extras',
    icon: Package,
    gradient: 'from-rose-500 to-gold-500',
    bg: 'from-rose-50 to-amber-50',
    darkBg: 'from-rose-950/30 to-amber-950/30',
    count: 'Bags & Jewelry',
  },
]

export default function CategoryGrid() {
  return (
    <section className="py-14 md:py-20" style={{ backgroundColor: 'var(--bg-muted)' }}>
      <div className="container-luxury">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeader
            label="Shop By Category"
            title="Find What You Love"
            subtitle="Discover our curated collection of premium products"
          />

          {/* Grid: 2 cols mobile → 3 tablet → 5 desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {CATEGORIES.map((cat, index) => {
              const Icon = cat.icon
              return (
                <motion.div key={cat.slug} variants={fadeInUp} custom={index * 0.05}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="group block"
                    aria-label={`Shop ${cat.name}`}
                  >
                    <div className={`
                      relative overflow-hidden rounded-luxury-lg p-5 sm:p-6 text-center
                      border border-[var(--border)] transition-all duration-400
                      hover:shadow-luxury-md hover:-translate-y-1.5
                      bg-gradient-to-br ${cat.bg}
                      [data-theme=dark]:bg-gradient-to-br [data-theme=dark]:${cat.darkBg}
                    `}
                    style={{
                      background: `linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-muted) 100%)`
                    }}>
                      {/* Shimmer effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.06) 50%, transparent 80%)`,
                        }}
                      />

                      {/* Icon circle */}
                      <div className={`
                        w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4
                        bg-gradient-to-br ${cat.gradient}
                        flex items-center justify-center
                        shadow-gold group-hover:scale-110 group-hover:shadow-gold-md
                        transition-all duration-300
                      `}>
                        <Icon size={22} className="text-white" strokeWidth={1.5} />
                      </div>

                      {/* Category name */}
                      <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--color-rose)] transition-colors duration-200">
                        {cat.name}
                      </h3>

                      {/* Sub-label */}
                      <p className="font-sans text-[10px] sm:text-xs text-[var(--text-muted)] mt-1">
                        {cat.count}
                      </p>

                      {/* Arrow indicator */}
                      <div className="mt-3 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                        <div className="h-px w-6 bg-gradient-gold" />
                        <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-[var(--color-gold)]">
                          Shop
                        </span>
                        <div className="h-px w-6 bg-gradient-gold" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
