import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Star, Zap, Eye, MessageCircle } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useToast } from '@/components/shared/Toast'
import LazyImage from '@/components/shared/LazyImage'
import { formatPrice, getEffectivePrice, calcDiscountPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { fadeInUp } from '@/lib/animations'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
  variant?: 'grid' | 'horizontal' | 'featured'
  priority?: boolean       // for above-fold images
  animationDelay?: number  // stagger delay
}

const WHATSAPP_NUMBER = '8801883172754'

function buildWhatsAppUrl(name: string, price: number, slug: string): string {
  const productUrl = `${window.location.origin}/product/${slug}`
  const text = `Hi PUSPALOY! 👋\nI want to purchase:\n*${name}*\nPrice: ৳${price.toLocaleString()}\n${productUrl}`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

const ProductCard = memo(function ProductCard({
  product,
  className,
  variant = 'grid',
  priority = false,
  animationDelay = 0,
}: ProductCardProps) {
  const { addItem, items } = useCartStore()
  const { toggleItem, isWishlisted } = useWishlistStore()
  const { toast } = useToast()

  const effectivePrice = getEffectivePrice(product.price, product.discountPrice, product.flashSalePrice)
  const hasDiscount = effectivePrice < product.price
  const discountPercent = hasDiscount ? calcDiscountPercent(product.price, effectivePrice) : 0
  const isFlashSale = product.flashSaleId !== null && product.flashSalePrice !== null
  const wishlisted = isWishlisted(product.id)
  const inCart = items.some((i) => i.productId === product.id)
  const outOfStock = product.stock === 0 || product.status === 'out_of_stock'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem({
      productId: product.id,
      productName: product.name,
      featuredImage: product.featuredImage,
      price: product.price,
      discountPrice: product.discountPrice,
      flashSalePrice: product.flashSalePrice,
      quantity: 1,
      maxStock: product.stock,
    })
    if (!inCart) toast(`"${product.name}" added to cart`, 'success')
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleItem({
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      featuredImage: product.featuredImage,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
    })
  }

  if (variant === 'horizontal') {
    return (
      <motion.div
        variants={fadeInUp}
        custom={animationDelay}
        className={cn(
          'card-product flex gap-3 p-3 group',
          className
        )}
      >
        <Link to={`/product/${product.slug}`} className="shrink-0">
          <LazyImage
            src={product.featuredImage}
            alt={product.name}
            aspectRatio="square"
            wrapperClassName="w-20 h-20 rounded-luxury"
            priority={priority}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/product/${product.slug}`}>
            <p className="font-sans text-xs text-[var(--text-muted)] capitalize mb-0.5">{product.category}</p>
            <h3 className="font-sans text-sm font-medium text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--color-rose)] transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-display text-base font-semibold text-[var(--color-rose)]">
              {formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="font-sans text-xs text-[var(--text-muted)] line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      custom={animationDelay}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'card-product group relative',
        outOfStock && 'opacity-70',
        className
      )}
    >
      {/* === Image Area === */}
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block">
          <LazyImage
            src={product.featuredImage}
            alt={product.name}
            aspectRatio="portrait"
            wrapperClassName="w-full transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isFlashSale && (
            <span className="badge-flash">
              <Zap size={9} className="fill-current" />
              SALE
            </span>
          )}
          {!isFlashSale && hasDiscount && (
            <span className="price-discount-badge">
              -{discountPercent}%
            </span>
          )}
          {product.newArrival && !isFlashSale && !hasDiscount && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-100 text-emerald-700">
              New
            </span>
          )}
          {product.bestSeller && !isFlashSale && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-100 text-amber-700">
              Best Seller
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="font-sans text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick action buttons — revealed on hover (desktop) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 z-10
          translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100
          transition-all duration-300 ease-luxury">
          {/* Wishlist */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
              'w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all duration-200',
              wishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-rose-500 hover:text-white'
            )}
          >
            <Heart size={14} className={cn(wishlisted && 'fill-current')} />
          </motion.button>

          {/* Quick view */}
          <Link
            to={`/product/${product.slug}`}
            aria-label="Quick view"
            className="w-8 h-8 rounded-full shadow-md bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--color-rose)] hover:text-white flex items-center justify-center transition-all duration-200"
          >
            <Eye size={14} />
          </Link>

          {/* WhatsApp quick order */}
          <a
            href={buildWhatsAppUrl(product.name, effectivePrice, product.slug)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Order via WhatsApp"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full shadow-md bg-[#25D366] text-white hover:bg-[#1ebe5c] flex items-center justify-center transition-all duration-200"
          >
            <MessageCircle size={14} />
          </a>
        </div>

        {/* Mobile wishlist button — always visible on touch devices */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all duration-200 md:hidden',
            wishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-[var(--bg-surface)]/90 text-[var(--text-secondary)]'
          )}
        >
          <Heart size={14} className={cn(wishlisted && 'fill-current')} />
        </button>
      </div>

      {/* === Content Area === */}
      <div className="p-3 pt-2.5">
        {/* Category */}
        <p className="font-sans text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
          {product.subcategory || product.category}
        </p>

        {/* Name */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-sans text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--color-rose)] transition-colors duration-200 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={10}
                  className={
                    star <= Math.round(product.avgRating)
                      ? 'text-gold-500 fill-gold-500'
                      : 'text-[var(--border-strong)]'
                  }
                />
              ))}
            </div>
            <span className="font-sans text-[10px] text-[var(--text-muted)]">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className={cn(
            'font-display font-semibold',
            isFlashSale ? 'text-orange-500 text-base' : 'text-[var(--color-rose)] text-base'
          )}>
            {formatPrice(effectivePrice)}
          </span>
          {hasDiscount && (
            <span className="font-sans text-xs text-[var(--text-muted)] line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={cn(
            'w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 rounded-luxury font-sans text-xs font-semibold tracking-wide transition-all duration-300',
            outOfStock
              ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed'
              : inCart
              ? 'bg-emerald-500 text-white'
              : 'bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-gradient-luxury hover:text-white hover:shadow-gold'
          )}
        >
          <ShoppingBag size={13} />
          {outOfStock ? 'Out of Stock' : inCart ? 'Added ✓' : 'Add to Cart'}
        </motion.button>

        {/* Mini WhatsApp button */}
        {!outOfStock && (
          <a
            href={buildWhatsAppUrl(product.name, effectivePrice, product.slug)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 w-full mt-1.5 py-2 rounded-luxury bg-[#e7fdf0] text-[#1a8a3d] font-sans text-xs font-semibold hover:bg-[#25D366] hover:text-white transition-all duration-200"
          >
            <MessageCircle size={11} />
            Buy on WhatsApp
          </a>
        )}
      </div>
    </motion.div>
  )
})

export default ProductCard
