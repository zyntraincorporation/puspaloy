// src/pages/Offline.tsx
// Beautiful offline fallback page — shown by PWA service worker when user is offline
// No Firebase, no React Router — must be standalone for offline functionality

import { motion } from 'framer-motion'
import { WifiOff, RefreshCw, MessageCircle, ShoppingBag, Phone } from 'lucide-react'

export default function Offline() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0a0a 0%, #1a0f0f 40%, #0d0d12 100%)',
      }}
    >
      {/* Ambient glows */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #b5445a 0%, transparent 70%)' }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center max-w-md w-full relative z-10"
      >
        {/* Icon with pulse ring */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-28 h-28 rounded-full border border-rose-500/30"
          />
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute w-36 h-36 rounded-full border border-rose-500/20"
          />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-900/60 to-rose-950/80 border border-rose-800/40 flex items-center justify-center">
            <WifiOff size={36} className="text-rose-400" />
          </div>
        </div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <ShoppingBag size={16} className="text-amber-400" />
          <span
            className="font-semibold text-sm tracking-[0.2em] uppercase text-amber-400"
            style={{ fontFamily: 'serif' }}
          >
            PUSPALOY
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-3"
          style={{ fontFamily: 'serif' }}
        >
          You're Offline
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 text-sm leading-relaxed mb-2"
        >
          No internet connection. Some content may not be available.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-gray-500 text-xs mb-8"
        >
          Check your connection and try again, or reach us on WhatsApp.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #b5445a 0%, #C9A84C 100%)',
            }}
          >
            <RefreshCw size={15} />
            Try Again
          </button>

          <a
            href="https://wa.me/8801883172754?text=Hi%20PUSPALOY!%20I%27d%20like%20to%20place%20an%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-[#25D366] hover:bg-[#1ebe5c] transition-colors active:scale-95"
          >
            <MessageCircle size={15} />
            WhatsApp Order
          </a>
        </motion.div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] max-w-sm mx-auto">
          <p className="font-sans text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
            <Phone size={12} />
            +880 1883-172754 • puspaloygiftzone.shop
          </p>
        </div>
      </motion.div>
    </div>
  )
}
