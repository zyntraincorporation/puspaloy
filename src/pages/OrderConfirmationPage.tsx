// src/pages/OrderConfirmationPage.tsx
// Success page: order details, countdown redirect, invoice download
import { useEffect, useState } from 'react'
import SEO from '@/components/shared/SEO'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, Package, MapPin, Phone, Clock,
  Home, ShoppingBag, ArrowRight,
} from 'lucide-react'
import { subscribeToOrder } from '@/firebase/orders'
import InvoiceTemplate from '@/components/order/InvoiceTemplate'
import { formatPrice } from '@/utils/formatters'
import type { Order } from '@/types'
import { staggerContainer, fadeInUp } from '@/lib/animations'

const REDIRECT_SECONDS = 120

// ── Status color map ───────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending Confirmation', color: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
  shipped:    { label: 'Shipped 🚚', color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Delivered ✅', color: 'bg-emerald-100 text-emerald-700' },
  cancelled:  { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)
  const [showInvoice, setShowInvoice] = useState(false)

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return

    let isResolved = false
    setIsLoading(true)

    // onSnapshot fires immediately — even before the Firestore write has fully
    // propagated globally. We must IGNORE null callbacks while still loading so
    // we never flip to the "not found" screen prematurely.
    const unsubscribe = subscribeToOrder(orderId, (fetchedOrder) => {
      if (fetchedOrder) {
        // Order confirmed — show success UI
        isResolved = true
        setOrder(fetchedOrder)
        setIsLoading(false)
      }
      // null callback while loading → keep spinner running; the listener will
      // fire again the moment the document appears in Firestore.
    })

    // Secondary safety net: if onSnapshot somehow missed the write event
    // (e.g. offline → online transition), do a direct getDoc after 3 seconds.
    const retryId = setTimeout(async () => {
      if (isResolved) return
      try {
        const { getOrderById } = await import('@/firebase/orders')
        const fetched = await getOrderById(orderId)
        if (fetched && !isResolved) {
          isResolved = true
          setOrder(fetched)
          setIsLoading(false)
        }
      } catch {
        // Silently ignore — final timeout below will handle the failure state
      }
    }, 3000)

    // Final timeout guard: if order hasn't appeared after 20 seconds, give up.
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        setIsLoading(false)
        // Leave order as null so the "not found" UI renders
      }
    }, 20000)

    return () => {
      unsubscribe()
      clearTimeout(retryId)
      clearTimeout(timeoutId)
    }
  }, [orderId])

  // Auto-redirect countdown
  useEffect(() => {
    if (!order) return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [order, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center space-y-5 px-6 max-w-sm">
          {/* Pulsing ring + spinning ring layered */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-rose)] opacity-20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-rose)] border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle size={24} className="text-[var(--color-rose)]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="font-serif text-xl text-[var(--text-primary)] font-semibold">
              Confirming your order…
            </p>
            <p className="font-sans text-sm text-[var(--text-muted)] leading-relaxed">
              Your order was placed successfully. Just a moment while we load your confirmation details.
            </p>
          </div>
          <p className="font-sans text-xs text-[var(--text-muted)] opacity-60">
            Order ID: <span className="font-mono">{orderId}</span>
          </p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4">
          <Package size={48} className="text-[var(--text-muted)] mx-auto" />
          <h1 className="font-serif text-2xl text-[var(--text-primary)]">Order not found</h1>
          <p className="font-sans text-sm text-[var(--text-muted)]">Order ID: {orderId}</p>
          <Link to="/" className="btn-primary inline-flex gap-2">
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const statusBadge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending
  const countdownPct = (countdown / REDIRECT_SECONDS) * 100

  return (
    <>
      <SEO title={`Order Confirmed — ${order.id}`} noindex />

      {/* Order confirmation page */}
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="container-luxury py-8 lg:py-12">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto"
          >
            {/* ── Success Hero ──────────────────────────────── */}
            <motion.div variants={fadeInUp} className="text-center mb-10">
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5"
              >
                <CheckCircle size={44} className="text-emerald-500" />
              </motion.div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
                Order Placed Successfully!
              </h1>
              <p className="font-sans text-[var(--text-muted)] text-base">
                Thank you, <span className="font-semibold text-[var(--text-primary)]">{order.customerName}</span>!
                Your order has been received.
              </p>

              {/* Order ID badge */}
              <div className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full border-2 border-[var(--color-rose)] bg-rose-50 dark:bg-rose-950/20">
                <span className="font-sans text-xs text-[var(--text-muted)]">Order ID:</span>
                <span className="font-mono text-base font-bold text-[var(--color-rose)] tracking-wider">
                  {order.id}
                </span>
              </div>

              {/* Countdown redirect */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <div className="relative w-40 h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-luxury rounded-full"
                    animate={{ width: `${countdownPct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="font-sans text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <Clock size={11} />
                  Redirecting to home in <span className="font-semibold text-[var(--text-primary)]">{countdown}s</span>
                </p>
              </div>
            </motion.div>

            {/* ── Order Detail Card ─────────────────────────── */}
            <motion.div
              variants={fadeInUp}
              className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] overflow-hidden mb-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-muted)]">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-[var(--color-rose)]" />
                  <span className="font-sans text-sm font-semibold text-[var(--text-primary)]">Order Details</span>
                </div>
                <span className={`font-sans text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-[var(--border)]">
                {order.items.map((item, i) => {
                  const unitPrice = item.flashSalePrice ?? item.discountPrice ?? item.price
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-4">
                      <img
                        src={item.featuredImage}
                        alt={item.productName}
                        className="w-14 h-14 rounded-luxury object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
                          Qty: {item.quantity} × {formatPrice(unitPrice)}
                        </p>
                      </div>
                      <span className="font-display text-base font-bold text-[var(--text-primary)] shrink-0">
                        {formatPrice(unitPrice * item.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Pricing breakdown */}
              <div className="border-t border-[var(--border)] px-5 py-4 space-y-2 bg-[var(--bg-muted)]">
                <div className="flex justify-between font-sans text-sm text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between font-sans text-sm text-[var(--text-secondary)]">
                  <span>Delivery</span>
                  <span>{order.deliveryCharge === 0 ? <span className="text-emerald-600">FREE</span> : formatPrice(order.deliveryCharge)}</span>
                </div>
                {(order.couponDiscount ?? 0) > 0 && (
                  <div className="flex justify-between font-sans text-sm text-emerald-600">
                    <span>Coupon ({order.couponCode})</span>
                    <span>-{formatPrice(order.couponDiscount ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-sans pt-2 border-t border-[var(--border)]">
                  <span className="font-semibold text-[var(--text-primary)]">Total Payable</span>
                  <span className="font-display text-xl font-bold text-[var(--color-rose)]">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Delivery Info ─────────────────────────────── */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-4">
                <p className="font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Phone size={11} /> Contact
                </p>
                <p className="font-sans text-sm font-medium text-[var(--text-primary)]">{order.customerName}</p>
                <p className="font-sans text-sm text-[var(--text-secondary)] mt-0.5">{order.phone}</p>
                {order.email && <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">{order.email}</p>}
              </div>
              <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-4">
                <p className="font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin size={11} /> Delivery Address
                </p>
                <p className="font-sans text-sm font-medium text-[var(--text-primary)]">{order.district}</p>
                <p className="font-sans text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">{order.address}</p>
              </div>
            </motion.div>

            {/* ── What happens next ─────────────────────────── */}
            <motion.div variants={fadeInUp} className="bg-[var(--bg-muted)] rounded-luxury-xl p-5 mb-8">
              <h3 className="font-sans text-sm font-semibold text-[var(--text-primary)] mb-3">What happens next?</h3>
              <div className="space-y-2.5">
                {[
                  { icon: '📞', text: "We'll call you to confirm the order within 24 hours" },
                  { icon: '📦', text: 'Your order will be packaged with premium care' },
                  { icon: '🚚', text: 'Delivery within 3–7 business days (Dhaka: 1–3 days)' },
                  { icon: '💵', text: 'Pay the delivery person in cash upon receiving' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-base">{step.icon}</span>
                    <p className="font-sans text-sm text-[var(--text-secondary)]">{step.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Invoice Toggle ────────────────────────────── */}
            <motion.div variants={fadeInUp} className="mb-8">
              <button
                onClick={() => setShowInvoice(!showInvoice)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-luxury-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--color-rose)] transition-colors"
              >
                <span className="font-sans text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Package size={15} className="text-[var(--color-rose)]" />
                  {showInvoice ? 'Hide Invoice' : 'View & Download Invoice'}
                </span>
                <ArrowRight
                  size={15}
                  className={`text-[var(--text-muted)] transition-transform ${showInvoice ? 'rotate-90' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showInvoice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">
                      <InvoiceTemplate order={order} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Navigation CTAs ───────────────────────────── */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
              <Link to="/" className="btn-primary flex-1 justify-center gap-2 py-4">
                <Home size={16} />
                Back to Home
              </Link>
              <Link to="/category/cosmetics" className="btn-secondary flex-1 justify-center gap-2 py-4">
                <ShoppingBag size={16} />
                Continue Shopping
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
