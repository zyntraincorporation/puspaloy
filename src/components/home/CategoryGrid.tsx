// src/components/home/CategoryGrid.tsx
// Premium animated category cards — 2 cols mobile, 3 tablet, 5 desktop
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, Footprints, Gift, Gem, Package } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import SectionHeader from './SectionHeader'

import { useNonEmptyActiveCategories } from '@/hooks/useCategories'

const ICONS = [Sparkles, Footprints, Gift, Gem, Package]
const GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-gold-400 to-amber-500',
  'from-purple-400 to-violet-500',
  'from-teal-400 to-cyan-500',
  'from-rose-500 to-gold-500'
]
const BGS = [
  'from-rose-50 to-pink-50',
  'from-amber-50 to-yellow-50',
  'from-purple-50 to-violet-50',
  'from-teal-50 to-cyan-50',
  'from-rose-50 to-amber-50'
]

export default function CategoryGrid() {
  const { data: categories = [], isLoading } = useNonEmptyActiveCategories()

  // Key changes once categories load — prevents whileInView from firing on an
  // empty list and never re-triggering when async data arrives.
  const motionKey = isLoading || categories.length === 0 ? 'loading' : 'loaded'

  return (
    <section className="py-14 md:py-20" style={{ backgroundColor: 'var(--bg-muted)' }}>
      <div className="container-luxury">
        <motion.div
          key={motionKey}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05, margin: '-60px' }}
        >
          <SectionHeader
            label="Shop By Category"
            title="Find What You Love"
            subtitle="Discover our curated collection of premium products"
          />

          {/* Grid: 2 cols mobile → 3 tablet → 5 desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.slice(0, 10).map((cat, index) => {
              const Icon = ICONS[index % ICONS.length]
              const gradient = GRADIENTS[index % GRADIENTS.length]
              const bg = BGS[index % BGS.length]
              return (
                <motion.div key={cat.id} variants={fadeInUp} custom={index * 0.05}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="group block"
                    aria-label={`Shop ${cat.name}`}
                  >
                    <div className={`
                      relative overflow-hidden rounded-luxury-lg p-5 sm:p-6 text-center
                      border border-[var(--border)] transition-all duration-400
                      hover:shadow-luxury-md hover:-translate-y-1.5
                      bg-gradient-to-br ${bg}
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

                      {/* Icon or Image circle */}
                      <div className={`
                        w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4
                        bg-gradient-to-br ${gradient}
                        flex items-center justify-center overflow-hidden
                        shadow-gold group-hover:scale-110 group-hover:shadow-gold-md
                        transition-all duration-300
                      `}>
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon size={22} className="text-white" strokeWidth={1.5} />
                        )}
                      </div>

                      {/* Category name */}
                      <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--color-rose)] transition-colors duration-200">
                        {cat.name}
                      </h3>

                      {/* Sub-label */}
                      <p className="font-sans text-[10px] sm:text-xs text-[var(--text-muted)] mt-1">
                        Explore
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
