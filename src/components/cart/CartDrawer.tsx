// src/components/cart/CartDrawer.tsx
// Slide-in cart drawer with item management, delivery preview, and checkout CTA
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Package } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useDeliverySettings } from '@/hooks/useSettings'
import { calcDeliveryCharge } from '@/firebase/settings'
import { formatPrice, getEffectivePrice } from '@/utils/formatters'
import LazyImage from '@/components/shared/LazyImage'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal } = useCartStore()
  const { data: deliverySettings } = useDeliverySettings()
  const navigate = useNavigate()

  const subtotal = getSubtotal()
  const freeThreshold = deliverySettings?.freeShippingThreshold ?? 2000
  const amountToFree = Math.max(0, freeThreshold - subtotal)
  const freeProgress = freeThreshold > 0 ? Math.min(100, (subtotal / freeThreshold) * 100) : 0

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[120] w-full max-w-md flex flex-col shadow-luxury-lg"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            role="dialog"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} className="text-[var(--color-rose)]" />
                <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                  My Cart
                </h2>
                {items.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-gradient-luxury text-white text-[10px] font-bold flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-full hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] transition-colors"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free shipping progress bar */}
            {freeThreshold > 0 && items.length > 0 && (
              <div className="px-5 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)]">
                {amountToFree > 0 ? (
                  <p className="font-sans text-xs text-[var(--text-secondary)] mb-1.5">
                    Add <span className="font-semibold text-[var(--color-rose)]">{formatPrice(amountToFree)}</span> more for free shipping! 🚚
                  </p>
                ) : (
                  <p className="font-sans text-xs text-emerald-600 font-semibold mb-1.5">
                    🎉 You've unlocked free shipping!
                  </p>
                )}
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-luxury"
                    initial={{ width: 0 }}
                    animate={{ width: `${freeProgress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-4 text-center py-16"
                  >
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                      <ShoppingBag size={32} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="font-serif text-lg text-[var(--text-primary)]">Your cart is empty</p>
                      <p className="font-sans text-sm text-[var(--text-muted)] mt-1">
                        Add some luxury items to get started
                      </p>
                    </div>
                    <button onClick={closeCart} className="btn-primary text-sm">
                      Continue Shopping
                    </button>
                  </motion.div>
                ) : (
                  items.map((item) => {
                    const price = getEffectivePrice(item.price, item.discountPrice, item.flashSalePrice)
                    return (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                        className="flex gap-3 p-3 rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-primary)] group"
                      >
                        {/* Product image */}
                        <Link
                          to={`/product/${item.productId}`}
                          onClick={closeCart}
                          className="shrink-0"
                        >
                          <LazyImage
                            src={item.featuredImage}
                            alt={item.productName}
                            aspectRatio="square"
                            wrapperClassName="w-20 h-20 rounded-luxury"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          {/* Name */}
                          <Link to={`/product/${item.productId}`} onClick={closeCart}>
                            <p className="font-sans text-sm font-medium text-[var(--text-primary)] line-clamp-2 hover:text-[var(--color-rose)] transition-colors">
                              {item.productName}
                            </p>
                          </Link>

                          {/* Price */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-display text-base font-semibold text-[var(--color-rose)]">
                              {formatPrice(price)}
                            </span>
                            {price < item.price && (
                              <span className="font-sans text-xs text-[var(--text-muted)] line-through">
                                {formatPrice(item.price)}
                              </span>
                            )}
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-[var(--border)] rounded-luxury overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
                                aria-label="Decrease"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center font-sans text-sm font-semibold text-[var(--text-primary)]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.maxStock}
                                className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-30 transition-colors"
                                aria-label="Increase"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                                {formatPrice(price * item.quantity)}
                              </span>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors ml-1"
                                aria-label="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Footer — totals + checkout */}
            {items.length > 0 && (
              <div className="border-t border-[var(--border)] p-5 space-y-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-sans text-sm">
                    <span className="text-[var(--text-secondary)]">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between font-sans text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Package size={11} />
                      Delivery charge
                    </span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                {/* Checkout button */}
                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full py-4 text-base gap-3"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </button>

                {/* View cart link */}
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="block text-center font-sans text-sm text-[var(--text-muted)] hover:text-[var(--color-rose)] transition-colors"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
