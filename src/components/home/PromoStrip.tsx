// src/components/home/PromoStrip.tsx
// Scrolling announcement banner — fully database-driven (no hardcoded text).
// Falls back to default announcements on first run (auto-seeded).
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Truck, Tag, Phone, Star, Gift, Zap, Megaphone, Heart } from 'lucide-react'
import { useActiveAnnouncements } from '@/hooks/useAnnouncements'
import { seedDefaultAnnouncements } from '@/firebase/announcements'
import type { AnnouncementIcon } from '@/types'

const ICON_MAP: Record<AnnouncementIcon, React.ComponentType<{ size: number; className?: string }>> = {
  truck: Truck,
  tag: Tag,
  phone: Phone,
  star: Star,
  gift: Gift,
  zap: Zap,
  megaphone: Megaphone,
  heart: Heart,
}

export default function PromoStrip() {
  const { data: announcements = [] } = useActiveAnnouncements()

  // Seed default announcements if collection is empty (runs once silently)
  useEffect(() => {
    seedDefaultAnnouncements().catch(() => {
      // Silently ignore — user may not have write permissions or may be offline
    })
  }, [])

  if (announcements.length === 0) return null

  // Duplicate items for seamless infinite scroll
  const doubled = [...announcements, ...announcements]

  return (
    <div
      className="overflow-hidden py-2 z-40 relative"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: Math.max(20, announcements.length * 5), repeat: Infinity, ease: 'linear' }}
        className="flex items-center whitespace-nowrap"
      >
        {doubled.map((ann, i) => {
          const Icon = ICON_MAP[ann.icon] ?? Megaphone
          return (
            <span key={`${ann.id}-${i}`} className="inline-flex items-center gap-1.5 mx-8 font-sans text-xs text-white/70">
              <Icon size={11} className="text-[var(--color-gold)] shrink-0" />
              {ann.text}
              <span className="ml-8 text-[var(--color-gold)]">•</span>
            </span>
          )
        })}
      </motion.div>
    </div>
  )
}
