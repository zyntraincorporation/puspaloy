// src/components/shared/PageLoader.tsx
// Full-page loading spinner shown during route transitions
import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated PUSPALOY logo mark */}
        <div className="relative w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[var(--color-gold)]"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-luxury"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
          />
          <div className="relative z-10 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-luxury overflow-hidden p-2">
            <img src="/favicon.ico" alt="Loading" className="w-full h-full object-contain animate-pulse" />
          </div>
        </div>
        <p className="font-serif text-sm tracking-widest text-[var(--text-muted)] uppercase">
          PUSPALOY
        </p>
      </div>
    </motion.div>
  )
}
