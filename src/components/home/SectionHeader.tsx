// src/components/home/SectionHeader.tsx
// Reusable luxury section header used across all homepage sections
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { fadeInUp } from '@/lib/animations'

interface SectionHeaderProps {
  label?: string       // Small gold uppercase label
  title: string        // Main heading (serif font)
  subtitle?: string    // Optional description
  viewAllHref?: string // Link for "View All"
  viewAllLabel?: string
  align?: 'left' | 'center'
}

export default function SectionHeader({
  label,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View All',
  align = 'center',
}: SectionHeaderProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className={`mb-8 md:mb-10 ${align === 'center' ? 'text-center' : 'text-left'}`}
    >
      {label && (
        <p className="section-label justify-center">
          <span className="w-6 h-px bg-gradient-gold" />
          {label}
          <span className="w-6 h-px bg-gradient-gold" />
        </p>
      )}

      <div className={`flex items-end ${align === 'center' ? 'justify-center' : 'justify-between'} gap-4 flex-wrap`}>
        <h2 className="section-title">{title}</h2>
        {viewAllHref && align === 'left' && (
          <Link
            to={viewAllHref}
            className="flex items-center gap-1.5 font-sans text-sm font-medium text-[var(--color-rose)] hover:text-[var(--color-rose-dark)] transition-colors group mb-1"
          >
            {viewAllLabel}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        )}
      </div>

      <div className={`divider-gold ${align === 'left' ? '!mx-0' : ''}`} />

      {subtitle && (
        <p className="section-subtitle max-w-xl mx-auto mt-4">{subtitle}</p>
      )}

      {viewAllHref && align === 'center' && (
        <Link
          to={viewAllHref}
          className="inline-flex items-center gap-1.5 mt-4 font-sans text-sm font-medium text-[var(--color-rose)] hover:text-[var(--color-rose-dark)] transition-colors group"
        >
          {viewAllLabel}
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      )}
    </motion.div>
  )
}
