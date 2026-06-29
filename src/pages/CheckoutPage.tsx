// src/pages/CheckoutPage.tsx
// Full checkout: customer info, district, dynamic delivery charge, coupon, COD, order creation
import { useRef, useState, useEffect } from 'react'
import SEO from '@/components/shared/SEO'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Phone, MapPin, Home, Tag, CheckCircle,
  Truck, Package, Loader2, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useDeliverySettings } from '@/hooks/useSettings'
import { calcDeliveryCharge } from '@/firebase/settings'
import { validateCoupon, calcCouponDiscount, incrementCouponUsage } from '@/firebase/coupons'
import { setOrder } from '@/firebase/orders'
import { generateOrderId } from '@/firebase/settings'
import { useToast } from '@/components/shared/Toast'
import { formatPrice, getEffectivePrice } from '@/utils/formatters'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { trackPurchase, trackBeginCheckout } from '@/lib/analytics'
import type { Coupon } from '@/types'
import { DISTRICTS } from '@/utils/districts'

// ── Send Telegram notification via Netlify Function ───────
async function sendOrderNotification(order: object): Promise<void> {
  try {
    await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
  } catch (err) {
    // Notification failure must NEVER block the checkout flow
    console.warn('[Notification] Failed to send:', err)
  }
}

// ── Form State ─────────────────────────────────────────────
interface FormData {
  customerName: string
  phone: string
  email: string
  district: string
  address: string
  notes: string
}

const INITIAL_FORM: FormData = {
  customerName: '',
  phone: '',
  email: '',
  district: '',
  address: '',
  notes: '',
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="font-sans text-xs text-red-500 mt-1">{msg}</p>
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getSubtotal, clearCart } = useCartStore()
  const hasPlacedOrder = useRef(false)
  const { data: deliverySettings } = useDeliverySettings()
  const { toast } = useToast()

  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderExpanded, setOrderExpanded] = useState(true)

  const subtotal = getSubtotal()
  const deliveryCharge = deliverySettings && form.district
    ? calcDeliveryCharge(form.district, subtotal, deliverySettings)
    : null
  const couponDiscount = appliedCoupon ? calcCouponDiscount(appliedCoupon, subtotal) : 0
  const total = subtotal + (deliveryCharge ?? 0) - couponDiscount

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !hasPlacedOrder.current) navigate('/cart')
  }, [items.length, navigate])

  const setField = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  // ── Coupon ────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const result = await validateCoupon(couponCode.trim(), subtotal)
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon)
        toast(`Coupon applied! You saved ${formatPrice(calcCouponDiscount(result.coupon, subtotal))}`, 'success')
      } else {
        setCouponError(result.error ?? 'Invalid coupon')
        setAppliedCoupon(null)
      }
    } catch {
      setCouponError('Failed to validate coupon. Try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  // ── Validation ────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {}
    if (!form.customerName.trim()) newErrors.customerName = 'Name is required'
    if (!form.phone.trim() || !/^(?:\+?880|0)?1[3-9]\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid Bangladeshi phone number'
    }
    if (!form.district) newErrors.district = 'Please select your district'
    if (!form.address.trim() || form.address.length < 10) {
      newErrors.address = 'Please enter your full address (min 10 characters)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast('Please fix the errors before submitting', 'error')
      return
    }
    setSubmitting(true)
    try {
      const orderId = await generateOrderId()
      const finalDelivery = deliveryCharge ?? (deliverySettings?.outsideDhaka ?? 120)

      const orderPayload = {
        id: orderId,
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        district: form.district,
        address: form.address.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          featuredImage: item.featuredImage,
          quantity: item.quantity,
          price: item.price,
          discountPrice: item.discountPrice,
          flashSalePrice: item.flashSalePrice,
        })),
        subtotal,
        couponCode: appliedCoupon?.code ?? null,
        couponDiscount,
        deliveryCharge: finalDelivery,
        total: subtotal + finalDelivery - couponDiscount,
        paymentMethod: 'cod' as const,
        paymentStatus: 'pending' as const,
        status: 'pending' as const,
        source: 'website' as const,
        notes: form.notes.trim() || null,
        trackingNote: null,
        notificationSent: false,
        notificationError: null,
        statusHistory: [{
          status: 'pending' as const,
          at: null as never,
          by: null,
        }],
      }

      await setOrder(orderPayload)

      // ── Fire notifications + analytics (non-blocking) ────────
      // Telegram notification via Netlify Function
      sendOrderNotification(orderPayload)

      // GA4 purchase event
      trackPurchase(
        orderId,
        orderPayload.total,
        finalDelivery,
        appliedCoupon?.code ?? null,
        couponDiscount,
        items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          price: getEffectivePrice(item.price, item.discountPrice, item.flashSalePrice),
          quantity: item.quantity,
        }))
      )

      // Increment coupon usage
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id).catch(() => {})
      }

      hasPlacedOrder.current = true
      clearCart()
      navigate(`/order-confirmation/${orderId}`)
    } catch (err) {
      console.error(err)
      toast('Failed to place order. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <>
      <SEO title="Checkout" noindex />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container-luxury py-8 lg:py-12">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {/* Header */}
            <motion.div variants={fadeInUp} className="mb-8">
              <nav className="flex items-center gap-1.5 font-sans text-xs text-[var(--text-muted)] mb-4">
                <Link to="/cart" className="hover:text-[var(--color-rose)] transition-colors">Cart</Link>
                <ChevronRight size={11} />
                <span className="text-[var(--text-primary)] font-medium">Checkout</span>
              </nav>
              <h1 className="font-serif text-3xl font-semibold text-[var(--text-primary)]">Checkout</h1>
            </motion.div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                {/* ── Left: Form ─────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Customer Information */}
                  <motion.div variants={fadeInUp} className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 sm:p-6">
                    <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
                      <User size={18} className="text-[var(--color-rose)]" />
                      Customer Information
                    </h2>

                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label htmlFor="name" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                          Full Name *
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={form.customerName}
                          onChange={(e) => setField('customerName', e.target.value)}
                          placeholder="Your full name"
                          className={`input-luxury ${errors.customerName ? 'border-red-400' : ''}`}
                          autoComplete="name"
                        />
                        <FieldError msg={errors.customerName} />
                      </div>

                      {/* Phone */}
                      <div>
                        <label htmlFor="phone" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                          Phone Number * <span className="text-xs text-[var(--text-muted)]">(for order updates)</span>
                        </label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                          <input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setField('phone', e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className={`input-luxury pl-10 ${errors.phone ? 'border-red-400' : ''}`}
                            autoComplete="tel"
                          />
                        </div>
                        <FieldError msg={errors.phone} />
                      </div>

                      {/* Email (optional) */}
                      <div>
                        <label htmlFor="email" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                          Email <span className="text-xs text-[var(--text-muted)]">(optional, for invoice)</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder="your@email.com"
                          className="input-luxury"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Delivery Address */}
                  <motion.div variants={fadeInUp} className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 sm:p-6">
                    <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
                      <MapPin size={18} className="text-[var(--color-rose)]" />
                      Delivery Address
                    </h2>

                    <div className="space-y-4">
                      {/* District select */}
                      <div>
                        <label htmlFor="district" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                          District *
                        </label>
                        <div className="relative">
                          <select
                            id="district"
                            value={form.district}
                            onChange={(e) => setField('district', e.target.value)}
                            className={`input-luxury appearance-none pr-10 ${errors.district ? 'border-red-400' : ''}`}
                          >
                            <option value="">Select your district</option>
                            {DISTRICTS.map((d: string) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                        <FieldError msg={errors.district} />
                        {/* Live delivery charge preview */}
                        {form.district && deliverySettings && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-sans text-xs mt-1.5 flex items-center gap-1.5"
                          >
                            <Truck size={11} />
                            <span className="text-[var(--text-muted)]">Delivery charge:</span>
                            {deliveryCharge === 0 ? (
                              <span className="text-emerald-600 font-semibold">FREE (threshold reached!)</span>
                            ) : (
                              <span className="text-[var(--color-rose)] font-semibold">{formatPrice(deliveryCharge ?? 0)}</span>
                            )}
                          </motion.p>
                        )}
                      </div>

                      {/* Full address */}
                      <div>
                        <label htmlFor="address" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                          Full Address *
                        </label>
                        <div className="relative">
                          <Home size={15} className="absolute left-3.5 top-3.5 text-[var(--text-muted)]" />
                          <textarea
                            id="address"
                            value={form.address}
                            onChange={(e) => setField('address', e.target.value)}
                            placeholder="House no, road no, area, thana, city..."
                            rows={3}
                            className={`input-luxury pl-10 resize-none ${errors.address ? 'border-red-400' : ''}`}
                          />
                        </div>
                        <FieldError msg={errors.address} />
                      </div>

                      {/* Notes */}
                      <div>
                        <label htmlFor="notes" className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                          Order Notes <span className="text-xs text-[var(--text-muted)]">(optional)</span>
                        </label>
                        <textarea
                          id="notes"
                          value={form.notes}
                          onChange={(e) => setField('notes', e.target.value)}
                          placeholder="Special instructions, gift message, etc."
                          rows={2}
                          className="input-luxury resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Payment Method */}
                  <motion.div variants={fadeInUp} className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 sm:p-6">
                    <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <Package size={18} className="text-[var(--color-rose)]" />
                      Payment Method
                    </h2>
                    <div className="flex items-center gap-3 p-4 rounded-luxury-lg border-2 border-[var(--color-rose)] bg-rose-50 dark:bg-rose-950/10">
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--color-rose)] bg-[var(--color-rose)] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <div>
                        <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">Cash on Delivery (COD)</p>
                        <p className="font-sans text-xs text-[var(--text-muted)]">Pay when you receive your order</p>
                      </div>
                      <span className="ml-auto font-sans text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-950/30">
                        Available
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* ── Right: Order Summary ────────────────────── */}
                <motion.div variants={fadeInUp} className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    {/* Order summary card */}
                    <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] overflow-hidden">
                      {/* Header toggle */}
                      <button
                        type="button"
                        onClick={() => setOrderExpanded(!orderExpanded)}
                        className="w-full flex items-center justify-between p-5 text-left"
                      >
                        <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                          Order Summary ({items.length})
                        </h2>
                        <ChevronDown
                          size={16}
                          className={`text-[var(--text-muted)] transition-transform ${orderExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      <AnimatePresence>
                        {orderExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            {/* Item list */}
                            <div className="border-t border-[var(--border)] max-h-52 overflow-y-auto">
                              {items.map((item) => {
                                const price = getEffectivePrice(item.price, item.discountPrice, item.flashSalePrice)
                                return (
                                  <div key={item.productId} className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] last:border-0">
                                    <img src={item.featuredImage} alt={item.productName} className="w-12 h-12 rounded-luxury object-cover shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-sans text-xs font-medium text-[var(--text-primary)] line-clamp-1">{item.productName}</p>
                                      <p className="font-sans text-xs text-[var(--text-muted)]">Qty: {item.quantity}</p>
                                    </div>
                                    <span className="font-sans text-sm font-semibold text-[var(--text-primary)] shrink-0">
                                      {formatPrice(price * item.quantity)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Totals */}
                      <div className="border-t border-[var(--border)] p-5 space-y-3">
                        <div className="flex justify-between font-sans text-sm">
                          <span className="text-[var(--text-secondary)]">Subtotal</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between font-sans text-sm">
                          <span className="text-[var(--text-secondary)] flex items-center gap-1">
                            <Truck size={12} /> Delivery
                          </span>
                          <span>
                            {deliveryCharge === null
                              ? '—'
                              : deliveryCharge === 0
                              ? <span className="text-emerald-600 font-semibold">FREE</span>
                              : formatPrice(deliveryCharge)
                            }
                          </span>
                        </div>
                        {couponDiscount > 0 && (
                          <div className="flex justify-between font-sans text-sm text-emerald-600">
                            <span>Coupon ({appliedCoupon?.code})</span>
                            <span>-{formatPrice(couponDiscount)}</span>
                          </div>
                        )}
                        <div className="h-px bg-[var(--border)]" />
                        <div className="flex justify-between">
                          <span className="font-sans font-semibold text-[var(--text-primary)]">Total</span>
                          <span className="font-display text-2xl font-bold text-[var(--color-rose)]">
                            {formatPrice(total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Coupon input */}
                    <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-4">
                      <h3 className="font-sans text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                        <Tag size={14} /> Apply Coupon
                      </h3>
                      {appliedCoupon ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-luxury bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20">
                          <CheckCircle size={15} className="text-emerald-500" />
                          <span className="font-sans text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            {appliedCoupon.code} applied!
                          </span>
                          <button type="button" onClick={removeCoupon} className="ml-auto font-sans text-xs text-[var(--text-muted)] hover:text-red-500">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                            placeholder="COUPON CODE"
                            className="input-luxury flex-1 uppercase tracking-wider text-sm py-2.5"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-4 py-2.5 rounded-luxury bg-[var(--bg-muted)] text-[var(--text-primary)] font-sans text-sm font-semibold hover:bg-gradient-luxury hover:text-white transition-all disabled:opacity-50"
                          >
                            {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                          </button>
                        </div>
                      )}
                      {couponError && <p className="font-sans text-xs text-red-500 mt-1.5">{couponError}</p>}
                    </div>

                    {/* Place order button */}
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      disabled={submitting}
                      className="w-full btn-primary py-5 text-base gap-3 disabled:opacity-70"
                    >
                      {submitting ? (
                        <><Loader2 size={18} className="animate-spin" /> Placing Order...</>
                      ) : (
                        <>Place Order · {formatPrice(total)}</>
                      )}
                    </motion.button>

                    <p className="font-sans text-xs text-center text-[var(--text-muted)]">
                      By placing your order you agree to our Terms & Conditions
                    </p>
                  </div>
                </motion.div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  )
}
