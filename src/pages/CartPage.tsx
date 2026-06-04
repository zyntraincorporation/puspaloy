// src/pages/CartPage.tsx
// Full cart page view (mirrors CartDrawer but as a full page)
import SEO from '@/components/shared/SEO'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Package } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useDeliverySettings } from '@/hooks/useSettings'
import { calcDeliveryCharge } from '@/firebase/settings'
import { formatPrice, getEffectivePrice } from '@/utils/formatters'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import LazyImage from '@/components/shared/LazyImage'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore()
  const { data: deliverySettings } = useDeliverySettings()
  const navigate = useNavigate()

  const subtotal = getSubtotal()
  const freeThreshold = deliverySettings?.freeShippingThreshold ?? 2000
  const amountToFree = Math.max(0, freeThreshold - subtotal)
  const freeProgress = freeThreshold > 0 ? Math.min(100, (subtotal / freeThreshold) * 100) : 0

  // Estimate delivery — assume outside Dhaka until they pick district at checkout
  const estimatedDelivery = deliverySettings
    ? calcDeliveryCharge('outside', subtotal, deliverySettings)
    : 120
  const estimatedTotal = subtotal + (amountToFree === 0 ? 0 : estimatedDelivery)

  return (
    <>
      <SEO title="My Cart" noindex />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container-luxury py-8 lg:py-12">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {/* Page header */}
            <motion.div variants={fadeInUp} className="mb-8">
              <h1 className="font-serif text-3xl font-semibold text-[var(--text-primary)]">
                Shopping Cart
              </h1>
              <p className="font-sans text-sm text-[var(--text-muted)] mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </motion.div>

            {items.length === 0 ? (
              /* Empty cart */
              <motion.div variants={fadeInUp} className="text-center py-24 flex flex-col items-center gap-5">
                <div className="w-24 h-24 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                  <ShoppingBag size={40} className="text-[var(--text-muted)]" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">Your cart is empty</h2>
                  <p className="font-sans text-sm text-[var(--text-muted)] mt-2">
                    Discover our luxury collection and add some items!
                  </p>
                </div>
                <Link to="/" className="btn-primary gap-2">
                  <ShoppingBag size={16} />
                  Continue Shopping
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Item list */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Free shipping progress */}
                  {freeThreshold > 0 && (
                    <motion.div variants={fadeInUp} className="p-4 rounded-luxury-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                      {amountToFree > 0 ? (
                        <p className="font-sans text-sm text-[var(--text-secondary)] mb-2">
                          Add <span className="font-semibold text-[var(--color-rose)]">{formatPrice(amountToFree)}</span> more for free shipping 🚚
                        </p>
                      ) : (
                        <p className="font-sans text-sm text-emerald-600 font-semibold mb-2">
                          🎉 You've unlocked free shipping!
                        </p>
                      )}
                      <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-luxury"
                          animate={{ width: `${freeProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Cart items */}
                  <AnimatePresence>
                    {items.map((item) => {
                      const price = getEffectivePrice(item.price, item.discountPrice, item.flashSalePrice)
                      return (
                        <motion.div
                          key={item.productId}
                          layout
                          variants={fadeInUp}
                          exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.25 } }}
                          className="flex gap-4 p-4 sm:p-5 rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)]"
                        >
                          {/* Image */}
                          <Link to={`/product/${item.productId}`} className="shrink-0">
                            <LazyImage
                              src={item.featuredImage}
                              alt={item.productName}
                              aspectRatio="square"
                              wrapperClassName="w-24 h-24 sm:w-28 sm:h-28 rounded-luxury"
                            />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link to={`/product/${item.productId}`}>
                              <h3 className="font-sans text-base font-medium text-[var(--text-primary)] hover:text-[var(--color-rose)] transition-colors line-clamp-2">
                                {item.productName}
                              </h3>
                            </Link>

                            {/* Price per unit */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="font-display text-lg font-semibold text-[var(--color-rose)]">
                                {formatPrice(price)}
                              </span>
                              {price < item.price && (
                                <span className="font-sans text-sm text-[var(--text-muted)] line-through">
                                  {formatPrice(item.price)}
                                </span>
                              )}
                              <span className="font-sans text-xs text-[var(--text-muted)]">each</span>
                            </div>

                            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                              {/* Qty controls */}
                              <div className="flex items-center border border-[var(--border)] rounded-luxury overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-10 text-center font-sans text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= item.maxStock}
                                  className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-30 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Line total */}
                                <span className="font-display text-lg font-bold text-[var(--text-primary)]">
                                  {formatPrice(price * item.quantity)}
                                </span>
                                <button
                                  onClick={() => removeItem(item.productId)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all"
                                  aria-label="Remove item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {/* Clear cart */}
                  <motion.div variants={fadeInUp} className="flex justify-end pt-1">
                    <button
                      onClick={clearCart}
                      className="font-sans text-sm text-[var(--text-muted)] hover:text-red-500 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      Clear cart
                    </button>
                  </motion.div>
                </div>

                {/* Order summary sidebar */}
                <motion.div variants={fadeInUp} className="lg:col-span-1">
                  <div className="sticky top-24 bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
                    <h2 className="font-serif text-xl font-semibold text-[var(--text-primary)]">
                      Order Summary
                    </h2>

                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between font-sans text-sm">
                        <span className="text-[var(--text-secondary)]">Subtotal</span>
                        <span className="font-medium text-[var(--text-primary)]">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-sans text-sm">
                        <span className="text-[var(--text-secondary)] flex items-center gap-1">
                          <Package size={12} />
                          Delivery (est.)
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {amountToFree === 0 ? (
                            <span className="text-emerald-600">FREE</span>
                          ) : (
                            formatPrice(estimatedDelivery)
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] -mt-1 pl-4">
                        Final charge calculated at checkout
                      </div>

                      <div className="h-px bg-[var(--border)]" />

                      <div className="flex justify-between font-sans">
                        <span className="font-semibold text-[var(--text-primary)]">Estimated Total</span>
                        <span className="font-display text-xl font-bold text-[var(--color-rose)]">
                          {formatPrice(estimatedTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Coupon hint */}
                    <div className="flex items-center gap-2 p-3 rounded-luxury border border-dashed border-[var(--border)] text-[var(--text-muted)]">
                      <Tag size={14} />
                      <span className="font-sans text-xs">Have a coupon? Apply at checkout</span>
                    </div>

                    {/* Checkout CTA */}
                    <button
                      onClick={() => navigate('/checkout')}
                      className="btn-primary w-full py-4 text-base gap-2"
                    >
                      Proceed to Checkout
                      <ArrowRight size={16} />
                    </button>

                    <Link
                      to="/"
                      className="block text-center font-sans text-sm text-[var(--text-muted)] hover:text-[var(--color-rose)] transition-colors"
                    >
                      ← Continue Shopping
                    </Link>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
