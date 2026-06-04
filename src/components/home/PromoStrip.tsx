// src/components/home/PromoStrip.tsx
// Scrolling promo announcement banner at very top
import { motion } from 'framer-motion'
import { Truck, Tag, Phone } from 'lucide-react'

const PROMOS = [
  { icon: Truck, text: 'Free delivery on orders above ৳1,500' },
  { icon: Tag, text: 'Use code WELCOME10 for 10% off your first order' },
  { icon: Phone, text: 'Cash on Delivery available across Bangladesh' },
  { icon: Truck, text: 'Fast delivery to all 64 districts' },
  { icon: Tag, text: 'New arrivals every week — stay tuned!' },
]

export default function PromoStrip() {
  return (
    <div
      className="overflow-hidden py-2 z-40 relative"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="flex items-center whitespace-nowrap"
      >
        {/* Duplicate for seamless loop */}
        {[...PROMOS, ...PROMOS].map((promo, i) => {
          const Icon = promo.icon
          return (
            <span key={i} className="inline-flex items-center gap-1.5 mx-8 font-sans text-xs text-white/70">
              <Icon size={11} className="text-[var(--color-gold)] shrink-0" />
              {promo.text}
              <span className="ml-8 text-[var(--color-gold)]">•</span>
            </span>
          )
        })}
      </motion.div>
    </div>
  )
}
