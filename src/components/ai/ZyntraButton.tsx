// src/components/ai/ZyntraButton.tsx
import { motion } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'
import { useZyntraStore } from '@/store/zyntraStore'
import { useLocation } from 'react-router-dom'

export default function ZyntraButton() {
  const { isOpen, toggleChat } = useZyntraStore()
  const location = useLocation()

  // Hide on admin and checkout pages
  if (location.pathname.startsWith('/admin') || location.pathname === '/checkout') return null

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
      onClick={toggleChat}
      aria-label="Open Zyntra AI Assistant"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full bg-gradient-luxury shadow-gold-md flex items-center justify-center group"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      style={{ animation: isOpen ? 'none' : 'pulseGold 2.5s ease-in-out infinite' }}
    >
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {isOpen ? (
          <MessageCircle size={22} className="text-white" />
        ) : (
          <>
            <Sparkles size={22} className="text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold-300 rounded-full animate-ping" />
          </>
        )}
      </motion.div>

      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 rounded-luxury bg-[var(--bg-surface)] shadow-luxury text-xs font-sans font-medium text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-[var(--border)]">
        Ask Zyntra ✨
      </span>
    </motion.button>
  )
}
