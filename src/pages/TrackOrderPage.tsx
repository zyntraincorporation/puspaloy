// src/pages/TrackOrderPage.tsx
// PUSPALOY – Delivery Tracking System
// Supports: /track-order  and  /track-order/:orderId
// Real-time Firestore updates · Mobile-first luxury design
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Star,
  XCircle,
  RotateCcw,
  ArrowLeftRight,
  Clock,
  ShoppingBag,
  Phone,
  CreditCard,
  Calendar,
  MessageSquare,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import SEO from '@/components/shared/SEO'
import { subscribeToOrder, subscribeToLatestOrderByPhone } from '@/firebase/orders'
import { formatPrice, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { Order, OrderStatus } from '@/types'
import type { Unsubscribe } from 'firebase/firestore'

// ── Status configuration ────────────────────────────────────────────────────
type TrackingStatus = OrderStatus

interface StatusConfig {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  progress: number       // 0-100 for the progress bar; -1 = terminal/error state
  color: string          // tailwind text color
  ring: string           // border/ring color class
  bg: string             // icon background
  isTerminal?: boolean   // cancelled / returned / exchange
}

const STATUS_CONFIG: Record<TrackingStatus, StatusConfig> = {
  pending: {
    label: 'Order Placed',
    icon: ShoppingBag,
    progress: 10,
    color: 'text-amber-500',
    ring: 'border-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  confirmed: {
    label: 'Order Confirmed',
    icon: CheckCircle2,
    progress: 30,
    color: 'text-blue-500',
    ring: 'border-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  processing: {
    label: 'Packed',
    icon: Package,
    progress: 50,
    color: 'text-indigo-500',
    ring: 'border-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  packed: {
    label: 'Packed',
    icon: Package,
    progress: 50,
    color: 'text-indigo-500',
    ring: 'border-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    progress: 70,
    color: 'text-purple-500',
    ring: 'border-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: MapPin,
    progress: 87,
    color: 'text-orange-500',
    ring: 'border-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  delivered: {
    label: 'Delivered',
    icon: Star,
    progress: 100,
    color: 'text-emerald-500',
    ring: 'border-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    progress: -1,
    color: 'text-red-500',
    ring: 'border-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    isTerminal: true,
  },
  returned: {
    label: 'Returned',
    icon: RotateCcw,
    progress: -1,
    color: 'text-rose-500',
    ring: 'border-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    isTerminal: true,
  },
  exchange_requested: {
    label: 'Exchange Requested',
    icon: ArrowLeftRight,
    progress: -1,
    color: 'text-violet-500',
    ring: 'border-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    isTerminal: true,
  },
}

// The main forward journey shown in the timeline (excludes terminal statuses)
const JOURNEY_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
]

// For progress calculation, map processing → packed progress value
function getProgressForStatus(status: OrderStatus): number {
  const cfg = STATUS_CONFIG[status]
  return cfg?.progress ?? 0
}

// ── Payment method labels ───────────────────────────────────────────────────
const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
}

// ── Input type detection ─────────────────────────────────────────────────────
// Bangladeshi phone: starts with 01 + 9 digits OR +880 prefix
const PHONE_RE = /^(?:\+?880|0)1[3-9]\d{8}$/

function detectInputType(val: string): 'orderId' | 'phone' | 'unknown' {
  const cleaned = val.replace(/\s/g, '')
  if (PHONE_RE.test(cleaned)) return 'phone'
  // Order IDs look like PSL-YYYYMMDD-XXXXX (or any non-blank non-phone)
  if (cleaned.length > 5) return 'orderId'
  return 'unknown'
}

// Normalise phone: strip spaces/dashes, ensure leading 0 format used in DB
function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // if starts with 880, convert back to 0...
  if (digits.startsWith('880') && digits.length === 13) return '0' + digits.slice(3)
  return digits.startsWith('0') ? digits : '0' + digits
}

// ── Partial-mask customer name for Order ID searches ─────────────────────────
function maskName(name: string): string {
  if (!name) return 'Customer'
  const parts = name.trim().split(' ')
  return parts
    .map((p) => (p.length <= 2 ? p[0] + '*' : p[0] + '*'.repeat(p.length - 2) + p[p.length - 1]))
    .join(' ')
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Skeleton loader ─────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Progress bar skeleton */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="h-3 w-1/3 bg-[var(--bg-muted)] rounded-full mb-4" />
        <div className="h-2 w-full bg-[var(--bg-muted)] rounded-full mb-6" />
        <div className="flex justify-between gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[var(--bg-muted)]" />
              <div className="h-2 w-12 bg-[var(--bg-muted)] rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Order card skeleton */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-[var(--bg-muted)] rounded-full" />
          <div className="h-6 w-24 bg-[var(--bg-muted)] rounded-full" />
        </div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-muted)] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-[var(--bg-muted)] rounded-full" />
                <div className="h-3 w-1/2 bg-[var(--bg-muted)] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Empty / No Result state ─────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-5 py-16 text-center"
    >
      {/* Elegant illustration */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-gold)]/10 to-[var(--color-rose)]/10 flex items-center justify-center border border-[var(--border)]">
          <Package size={36} className="text-[var(--text-muted)]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center">
          <Search size={14} className="text-[var(--text-muted)]" />
        </div>
      </div>
      <div>
        <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">No order found</h3>
        <p className="font-sans text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
          We couldn't find any order matching{' '}
          <span className="font-mono font-semibold text-[var(--color-rose)]">"{query}"</span>.
          <br />Please double-check your Order ID or phone number.
        </p>
      </div>
      <div className="flex flex-col gap-1 text-xs text-[var(--text-muted)] font-sans">
        <p className="font-medium text-[var(--text-secondary)]">Tips:</p>
        <p>• Order ID format: <span className="font-mono">PSL-YYYYMMDD-XXXXX</span></p>
        <p>• Phone must be the number used during checkout</p>
      </div>
    </motion.div>
  )
}

// ── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-6 flex flex-col items-center gap-4 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle size={22} className="text-red-500" />
      </div>
      <div>
        <p className="font-sans font-semibold text-red-700 dark:text-red-400 mb-1">Something went wrong</p>
        <p className="font-sans text-sm text-red-600/80 dark:text-red-400/70">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-xl border border-red-300 text-red-600 font-sans text-sm font-medium hover:bg-red-100 transition-colors"
      >
        Try Again
      </button>
    </motion.div>
  )
}

// ── Luxury Progress Timeline ─────────────────────────────────────────────────
interface TimelineProps {
  currentStatus: OrderStatus
}

function TrackingTimeline({ currentStatus }: TimelineProps) {
  const currentProgress = getProgressForStatus(currentStatus)
  const isTerminal = STATUS_CONFIG[currentStatus]?.isTerminal

  // Determine completed / current / upcoming for each journey step
  const getStepState = (stepStatus: OrderStatus): 'completed' | 'current' | 'upcoming' => {
    if (isTerminal) return 'upcoming'
    // For processing, treat it same as packed
    const normalised = (currentStatus === 'processing' ? 'packed' : currentStatus) as OrderStatus
    const currentIdx = JOURNEY_STATUSES.indexOf(normalised)
    const stepIdx = JOURNEY_STATUSES.indexOf(stepStatus)
    if (stepIdx < currentIdx) return 'completed'
    if (stepIdx === currentIdx) return 'current'
    return 'upcoming'
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-1">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Delivery Status
          </p>
          {!isTerminal && (
            <span className="font-sans text-xs font-bold text-[var(--color-gold)]">
              {currentProgress}% Complete
            </span>
          )}
        </div>

        {/* Current status badge */}
        {(() => {
          const cfg = STATUS_CONFIG[currentStatus]
          const Icon = cfg.icon
          return (
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border mt-2', cfg.ring, cfg.bg)}>
              <Icon size={14} className={cfg.color} />
              <span className={cn('font-sans text-sm font-semibold', cfg.color)}>{cfg.label}</span>
            </div>
          )
        })()}

        {/* Progress bar — only for non-terminal */}
        {!isTerminal && (
          <div className="mt-4 relative">
            <div className="h-2 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #D4AF37 0%, #F7E98E 50%, #C9912A 100%)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline steps */}
      <div className="p-5">
        {isTerminal ? (
          /* Terminal status display */
          (() => {
            const cfg = STATUS_CONFIG[currentStatus]
            const Icon = cfg.icon
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border',
                  cfg.ring, cfg.bg
                )}
              >
                <div className={cn('w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0', cfg.ring, cfg.bg)}>
                  <Icon size={22} className={cfg.color} />
                </div>
                <div>
                  <p className={cn('font-sans font-semibold text-sm', cfg.color)}>{cfg.label}</p>
                  <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
                    Your order status has been updated.
                  </p>
                </div>
              </motion.div>
            )
          })()
        ) : (
          /* Normal journey steps — horizontal on desktop, vertical on mobile */
          <>
            {/* Desktop horizontal layout */}
            <div className="hidden sm:flex items-start justify-between gap-2 relative">
              {/* Connecting line behind all steps */}
              <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-[var(--bg-muted)] z-0" />

              {JOURNEY_STATUSES.map((stepStatus, idx) => {
                const state = getStepState(stepStatus)
                const cfg = STATUS_CONFIG[stepStatus]
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={stepStatus}
                    className="flex flex-col items-center gap-2 flex-1 relative z-10"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                  >
                    {/* Step circle */}
                    <motion.div
                      className={cn(
                        'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                        state === 'completed'
                          ? 'border-[var(--color-gold)] bg-gradient-to-br from-[#D4AF37] to-[#C9912A] shadow-md'
                          : state === 'current'
                          ? cn('border-2', cfg.ring, cfg.bg, 'shadow-lg ring-4 ring-offset-2')
                          : 'border-[var(--border)] bg-[var(--bg-muted)]'
                      )}
                      style={state === 'current' ? { '--tw-ring-color': 'color-mix(in srgb, currentColor 15%, transparent)' } as React.CSSProperties : {}}
                      animate={state === 'current' ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    >
                      {state === 'completed' ? (
                        <CheckCircle2 size={16} className="text-white" />
                      ) : (
                        <Icon
                          size={15}
                          className={cn(
                            state === 'current' ? cfg.color : 'text-[var(--text-muted)]'
                          )}
                        />
                      )}
                    </motion.div>

                    {/* Label */}
                    <span
                      className={cn(
                        'font-sans text-[10px] font-semibold text-center leading-tight max-w-[60px]',
                        state === 'completed'
                          ? 'text-[var(--color-gold)]'
                          : state === 'current'
                          ? cfg.color
                          : 'text-[var(--text-muted)]'
                      )}
                    >
                      {cfg.label}
                    </span>

                    {/* Current indicator dot */}
                    {state === 'current' && (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Mobile vertical layout */}
            <div className="sm:hidden space-y-0">
              {JOURNEY_STATUSES.map((stepStatus, idx) => {
                const state = getStepState(stepStatus)
                const cfg = STATUS_CONFIG[stepStatus]
                const Icon = cfg.icon
                const isLast = idx === JOURNEY_STATUSES.length - 1
                return (
                  <motion.div
                    key={stepStatus}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07, duration: 0.35 }}
                  >
                    {/* Left: circle + line */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        className={cn(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10',
                          state === 'completed'
                            ? 'border-[var(--color-gold)] bg-gradient-to-br from-[#D4AF37] to-[#C9912A]'
                            : state === 'current'
                            ? cn('border-2', cfg.ring, cfg.bg)
                            : 'border-[var(--border)] bg-[var(--bg-muted)]'
                        )}
                        animate={state === 'current' ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                      >
                        {state === 'completed' ? (
                          <CheckCircle2 size={14} className="text-white" />
                        ) : (
                          <Icon
                            size={13}
                            className={cn(
                              state === 'current' ? cfg.color : 'text-[var(--text-muted)]'
                            )}
                          />
                        )}
                      </motion.div>
                      {!isLast && (
                        <div className={cn(
                          'w-0.5 flex-1 my-1 min-h-[24px]',
                          state === 'completed' ? 'bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/40' : 'bg-[var(--border)]'
                        )} />
                      )}
                    </div>

                    {/* Right: label */}
                    <div className="pb-4 pt-1.5 flex-1">
                      <span
                        className={cn(
                          'font-sans text-sm font-semibold block',
                          state === 'completed'
                            ? 'text-[var(--color-gold)]'
                            : state === 'current'
                            ? cfg.color
                            : 'text-[var(--text-muted)]'
                        )}
                      >
                        {cfg.label}
                      </span>
                      {state === 'current' && (
                        <motion.span
                          className="font-sans text-xs text-[var(--text-muted)] mt-0.5 block"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          Current status
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Order Result Card ────────────────────────────────────────────────────────
interface OrderCardProps {
  order: Order
  searchedByPhone: boolean
}

function OrderCard({ order, searchedByPhone }: OrderCardProps) {
  const effectiveItemPrice = (item: Order['items'][0]) =>
    item.flashSalePrice ?? item.discountPrice ?? item.price

  const displayName = searchedByPhone ? order.customerName : maskName(order.customerName)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-4"
    >
      {/* Timeline */}
      <TrackingTimeline currentStatus={order.status} />

      {/* Tracking note from admin */}
      <AnimatePresence>
        {order.trackingNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-[var(--color-gold)]/30 bg-gradient-to-r from-[var(--color-gold)]/5 to-transparent p-4 flex gap-3"
          >
            <MessageSquare size={15} className="text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-gold)] mb-0.5">
                Delivery Update
              </p>
              <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed">
                {order.trackingNote}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order info card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-sans text-xs text-[var(--text-muted)] font-semibold uppercase tracking-widest mb-0.5">
              Order ID
            </p>
            <p className="font-mono text-sm font-bold text-[var(--color-rose)] tracking-tight">
              {order.id}
            </p>
          </div>
          <div className="flex flex-col items-end">
            {order.createdAt && (
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Calendar size={12} />
                <span className="font-sans text-xs">{formatDate(order.createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[#C9912A] flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="font-sans text-sm font-bold text-white">
                {order.customerName?.[0]?.toUpperCase() ?? 'C'}
              </span>
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                {displayName}
              </p>
              {/* Show phone only if searched by phone (same customer) */}
              {searchedByPhone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone size={10} className="text-[var(--text-muted)]" />
                  <span className="font-sans text-xs text-[var(--text-muted)]">{order.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery address */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
            <MapPin size={14} className="text-[var(--color-rose)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-xs text-[var(--text-muted)] mb-0.5 font-medium">Delivery Address</p>
              <p className="font-sans text-sm text-[var(--text-secondary)] leading-snug">
                {order.address}{order.district ? `, ${order.district}` : ''}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Items Ordered ({order.items?.length ?? 0})
            </p>
            <div className="space-y-2.5">
              {order.items?.map((item, i) => (
                <div
                  key={`${item.productId}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] group hover:border-[var(--color-rose)]/30 transition-colors"
                >
                  {/* Product image */}
                  {item.featuredImage ? (
                    <img
                      src={item.featuredImage}
                      alt={item.productName}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-[var(--border)]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-snug">
                      {item.productName}
                    </p>
                    <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
                      Qty: {item.quantity} × {formatPrice(effectiveItemPrice(item))}
                    </p>
                  </div>
                  <p className="font-sans text-sm font-bold text-[var(--text-primary)] flex-shrink-0">
                    {formatPrice(effectiveItemPrice(item) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 space-y-2 bg-[var(--bg-muted)]">
              {order.couponDiscount > 0 && (
                <div className="flex justify-between font-sans text-sm text-[var(--text-secondary)]">
                  <span>
                    Discount
                    {order.couponCode && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono">
                        {order.couponCode}
                      </span>
                    )}
                  </span>
                  <span className="text-emerald-600 font-semibold">−{formatPrice(order.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-sans text-sm text-[var(--text-secondary)]">
                <span>Delivery</span>
                <span>
                  {order.deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ) : (
                    formatPrice(order.deliveryCharge)
                  )}
                </span>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border)] flex justify-between items-center">
              <span className="font-sans text-sm font-bold text-[var(--text-primary)]">Total</span>
              <span className="font-sans text-lg font-bold text-[var(--color-rose)]">
                {formatPrice(order.total)}
              </span>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <CreditCard size={13} />
                <span className="font-sans text-xs">Payment</span>
              </div>
              <span className="font-sans text-xs font-semibold text-[var(--text-secondary)]">
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Real-time note */}
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <span className="font-sans text-xs">Live tracking · Updates automatically</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function TrackOrderPage() {
  const { orderId: urlOrderId } = useParams<{ orderId?: string }>()
  const navigate = useNavigate()

  const [inputValue, setInputValue] = useState(urlOrderId ?? '')
  const [submittedQuery, setSubmittedQuery] = useState(urlOrderId ?? '')
  const [searchedByPhone, setSearchedByPhone] = useState(false)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unsubRef = useRef<Unsubscribe | null>(null)

  // Clean up previous listener
  const clearListener = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
  }, [])

  // Core search executor
  const runSearch = useCallback((rawQuery: string) => {
    const q = rawQuery.trim()
    if (!q) return

    clearListener()
    setLoading(true)
    setNotFound(false)
    setError(null)
    setOrder(null)

    const inputType = detectInputType(q)

    if (inputType === 'phone') {
      const phone = normalisePhone(q)
      setSearchedByPhone(true)
      unsubRef.current = subscribeToLatestOrderByPhone(phone, (fetchedOrder) => {
        setLoading(false)
        if (fetchedOrder) {
          setOrder(fetchedOrder)
          setNotFound(false)
        } else {
          setOrder(null)
          setNotFound(true)
        }
      })
    } else {
      // Treat as Order ID
      setSearchedByPhone(false)
      unsubRef.current = subscribeToOrder(q, (fetchedOrder) => {
        setLoading(false)
        if (fetchedOrder) {
          setOrder(fetchedOrder)
          setNotFound(false)
        } else {
          setOrder(null)
          setNotFound(true)
        }
      })
    }
  }, [clearListener])

  // Auto-search when orderId is in URL
  useEffect(() => {
    if (urlOrderId) {
      setInputValue(urlOrderId)
      setSubmittedQuery(urlOrderId)
      runSearch(urlOrderId)
    }
    return clearListener
  }, [urlOrderId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return clearListener
  }, [clearListener])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (!q) return
    setSubmittedQuery(q)

    // Update URL if it looks like an Order ID (non-phone)
    const inputType = detectInputType(q)
    if (inputType === 'orderId') {
      navigate(`/track-order/${encodeURIComponent(q)}`, { replace: true })
    } else {
      navigate('/track-order', { replace: true })
    }

    runSearch(q)
  }

  const handleClear = () => {
    setInputValue('')
    setSubmittedQuery('')
    setOrder(null)
    setNotFound(false)
    setError(null)
    setLoading(false)
    clearListener()
    navigate('/track-order', { replace: true })
  }

  const hasResult = order !== null
  const showEmpty = !loading && notFound && submittedQuery
  const showResult = !loading && hasResult

  return (
    <>
      <SEO
        title="Track Your Order – PUSPALOY"
        description="Track the real-time delivery status of your PUSPALOY order. Enter your Order ID or phone number to see live updates."
      />

      <main className="container-luxury pt-28 pb-24 md:pb-16 min-h-screen">
        {/* ── Page Header ── */}
        <motion.div
          className="text-center mb-10 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Icon */}
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#F7E98E] to-[#C9912A] items-center justify-center mb-5 shadow-lg">
            <Package size={28} className="text-white" />
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Track Your Order
          </h1>
          <p className="font-sans text-sm md:text-base text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            Enter your Order ID or phone number to get real-time updates on your delivery.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* ── Search Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm p-4 md:p-5"
            >
              <label
                htmlFor="track-search-input"
                className="block font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3"
              >
                Order ID or Phone Number
              </label>

              <div className="flex gap-2.5">
                {/* Input */}
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                  <input
                    id="track-search-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="PSL-20260627-12345 or 017XXXXXXXX"
                    autoComplete="off"
                    className="input-luxury pl-10 pr-10 py-3 text-sm w-full font-mono tracking-wide"
                    aria-label="Search by order ID or phone number"
                  />
                  {inputValue && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--color-rose)] transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="btn-primary px-5 py-3 text-sm flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Search order"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ChevronRight size={15} />
                  )}
                  <span className="hidden sm:inline">Track</span>
                </button>
              </div>

              {/* Helper hints */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <span className="font-sans text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <Clock size={10} />
                  Order ID: <span className="font-mono">PSL-YYYYMMDD-XXXXX</span>
                </span>
                <span className="font-sans text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <Phone size={10} />
                  Phone: <span className="font-mono">017XXXXXXXX</span>
                </span>
              </div>
            </form>
          </motion.div>

          {/* ── Results area ── */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <SkeletonLoader />
              </motion.div>
            )}

            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ErrorState
                  message={error}
                  onRetry={() => runSearch(submittedQuery)}
                />
              </motion.div>
            )}

            {showEmpty && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState query={submittedQuery} />
              </motion.div>
            )}

            {showResult && (
              <motion.div key={order!.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <OrderCard order={order!} searchedByPhone={searchedByPhone} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initial empty prompt (before any search) */}
          {!submittedQuery && !loading && (
            <motion.div
              className="flex flex-col items-center gap-3 py-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-16 h-16 rounded-2xl border border-dashed border-[var(--border)] flex items-center justify-center">
                <Truck size={24} className="text-[var(--text-muted)]" />
              </div>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Enter your details above to track your package
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </>
  )
}
