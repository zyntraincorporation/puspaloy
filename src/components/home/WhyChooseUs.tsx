// src/components/home/WhyChooseUs.tsx
import { motion } from 'framer-motion'
import { ShieldCheck, Truck, RefreshCw, HeadphonesIcon, Award, Sparkles } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'

const DEFAULT_REASONS = [
  {
    icon: ShieldCheck,
    title: '100% Authentic',
    description: 'All our products are genuine, quality-tested, and sourced from trusted suppliers.',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Quick delivery across all 64 districts of Bangladesh with careful packaging.',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: 'Not satisfied? We offer hassle-free returns and exchanges within 7 days.',
    gradient: 'from-orange-400 to-rose-500',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'Our friendly team is always ready to assist you via WhatsApp or Messenger.',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Every product meets our strict quality standards before reaching your hands.',
    gradient: 'from-gold-400 to-amber-500',
  },
  {
    icon: Sparkles,
    title: 'Luxury Experience',
    description: 'From browsing to unboxing — every step is designed to feel truly premium.',
    gradient: 'from-rose-400 to-pink-500',
  },
]

export default function WhyChooseUs() {
  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--bg-muted)' }}
    >
      <div className="container-luxury">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <p className="section-label justify-center">
              <span className="w-6 h-px bg-gradient-gold" />
              Why PUSPALOY
              <span className="w-6 h-px bg-gradient-gold" />
            </p>
            <h2 className="section-title">The PUSPALOY Promise</h2>
            <div className="divider-gold" />
            <p className="section-subtitle max-w-lg mx-auto mt-4">
              We don't just sell products — we deliver an experience that redefines luxury shopping in Bangladesh.
            </p>
          </motion.div>

          {/* Grid: 2 cols mobile, 3 desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {DEFAULT_REASONS.map((reason, index) => {
              const Icon = reason.icon
              return (
                <motion.div
                  key={reason.title}
                  variants={fadeInUp}
                  custom={index * 0.06}
                  className="group relative p-5 sm:p-6 rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)]
                    hover:shadow-luxury-md hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${reason.gradient} transition-opacity duration-300`} />

                  {/* Icon */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-luxury mb-4 flex items-center justify-center bg-gradient-to-br ${reason.gradient} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} className="text-white" strokeWidth={1.5} />
                  </div>

                  <h3 className="font-sans font-semibold text-sm sm:text-base text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-rose)] transition-colors duration-200">
                    {reason.title}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {reason.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
