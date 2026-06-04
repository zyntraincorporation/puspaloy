// src/pages/WishlistPage.tsx
import SEO from '@/components/shared/SEO'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useToast } from '@/components/shared/Toast'
import LazyImage from '@/components/shared/LazyImage'
import { formatPrice } from '@/utils/formatters'
import { staggerContainer, fadeInUp } from '@/lib/animations'

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore()
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const handleMoveToCart = (item: typeof items[0]) => {
    addItem({
      productId: item.productId,
      productName: item.productName,
      featuredImage: item.featuredImage,
      price: item.price,
      discountPrice: item.discountPrice,
      flashSalePrice: null,
      quantity: 1,
      maxStock: 99,
    })
    removeItem(item.productId)
    toast(`"${item.productName}" moved to cart`, 'success')
  }

  return (
    <>
      <SEO title="Wishlist" noindex />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container-luxury pt-8 pb-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={fadeInUp} className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-[var(--text-primary)]">My Wishlist</h1>
                <p className="font-sans text-sm text-[var(--text-muted)] mt-1">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
              {items.length > 0 && (
                <Link to="/category/cosmetics" className="btn-secondary text-sm">
                  Continue Shopping
                </Link>
              )}
            </motion.div>

            {/* Empty state */}
            {items.length === 0 && (
              <motion.div
                variants={fadeInUp}
                className="text-center py-24 flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                  <Heart size={32} className="text-[var(--text-muted)]" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">Your wishlist is empty</h2>
                  <p className="font-sans text-sm text-[var(--text-muted)] mt-2">
                    Save products you love and find them here later
                  </p>
                </div>
                <Link to="/category/cosmetics" className="btn-primary mt-2">
                  Explore Products
                </Link>
              </motion.div>
            )}

            {/* Wishlist grid */}
            <AnimatePresence>
              {items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      className="card-product group"
                    >
                      {/* Image */}
                      <div className="relative">
                        <Link to={`/product/${item.slug}`}>
                          <LazyImage
                            src={item.featuredImage}
                            alt={item.productName}
                            aspectRatio="portrait"
                            wrapperClassName="w-full"
                          />
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <Link to={`/product/${item.slug}`}>
                          <h3 className="font-sans text-sm font-medium text-[var(--text-primary)] line-clamp-2 hover:text-[var(--color-rose)] transition-colors">
                            {item.productName}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-display text-base font-semibold text-[var(--color-rose)]">
                            {formatPrice(item.discountPrice ?? item.price)}
                          </span>
                          {item.discountPrice && (
                            <span className="font-sans text-xs text-[var(--text-muted)] line-through">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleMoveToCart(item)}
                          className="w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 rounded-luxury font-sans text-xs font-semibold bg-[var(--bg-muted)] hover:bg-gradient-luxury hover:text-white hover:shadow-gold transition-all duration-300"
                        >
                          <ShoppingBag size={12} />
                          Move to Cart
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  )
}
