// src/components/shared/CountdownTimer.tsx
import { useState, useEffect } from 'react'
import { getCountdown } from '@/utils/formatters'
import { motion, AnimatePresence } from 'framer-motion'

interface CountdownTimerProps {
  targetDate: Date
  onExpire?: () => void
  variant?: 'flash' | 'compact' | 'large'
}

function Segment({ value, label, variant }: { value: number; label: string; variant: string }) {
  const display = String(value).padStart(2, '0')

  if (variant === 'compact') {
    return (
      <span className="font-display font-bold text-[var(--color-rose)]">
        {display}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          flex items-center justify-center rounded-luxury font-display font-bold
          ${variant === 'large' ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg'}
          bg-[var(--luxury-dark,#0a0a0a)] text-[var(--color-gold)]
          shadow-gold relative overflow-hidden
        `}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className={`font-sans text-[var(--text-muted)] mt-1 uppercase tracking-wider
        ${variant === 'large' ? 'text-[10px]' : 'text-[9px]'}`}>
        {label}
      </span>
    </div>
  )
}

export default function CountdownTimer({ targetDate, onExpire, variant = 'flash' }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate))

  useEffect(() => {
    if (countdown.expired) {
      onExpire?.()
      return
    }
    const interval = setInterval(() => {
      const next = getCountdown(targetDate)
      setCountdown(next)
      if (next.expired) {
        clearInterval(interval)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate, onExpire, countdown.expired])

  if (countdown.expired) return null

  if (variant === 'compact') {
    return (
      <span className="font-display text-sm font-bold text-[var(--color-rose)]">
        {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {countdown.days > 0 && (
        <>
          <Segment value={countdown.days} label="Days" variant={variant} />
          <span className="font-display font-bold text-[var(--color-gold)] text-lg pb-4">:</span>
        </>
      )}
      <Segment value={countdown.hours} label="Hrs" variant={variant} />
      <span className="font-display font-bold text-[var(--color-gold)] text-lg pb-4">:</span>
      <Segment value={countdown.minutes} label="Min" variant={variant} />
      <span className="font-display font-bold text-[var(--color-gold)] text-lg pb-4">:</span>
      <Segment value={countdown.seconds} label="Sec" variant={variant} />
    </div>
  )
}
