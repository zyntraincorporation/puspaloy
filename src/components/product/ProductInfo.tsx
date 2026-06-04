// src/components/product/ProductInfo.tsx
// Main product info panel: price, badges, quantity, add-to-cart, wishlist, share, WhatsApp/Messenger CTAs
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag, Heart, Share2, Minus, Plus, Zap,
  MessageCircle, Phone, CheckCircle, Package, ShieldCheck,
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useToast } from '@/components/shared/Toast'
import CountdownTimer from '@/components/shared/CountdownTimer'
import { StarRatingDisplay } from '@/components/shared/StarRating'
import { formatPrice, getEffectivePrice, calcDiscountPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { Product } from '@/types'

interface ProductInfoProps {
  product: Product
  flashSaleEnd?: Date | null
}

const DEMO_FLASH_END = new Date(Date.now() + 24 * 60 * 60 * 1000)

export default function ProductInfo({ product, flashSaleEnd }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const { addItem, items, openCart } = useCartStore()
  const { toggleItem, isWishlisted } = useWishlistStore()
  const { toast } = useToast()

  const effectivePrice = getEffectivePrice(product.price, product.discountPrice, product.flashSalePrice)
  const hasDiscount = effectivePrice < product.price
  const discountPercent = hasDiscount ? calcDiscountPercent(product.price, effectivePrice) : 0
  const isFlashSale = !!product.flashSaleId && !!product.flashSalePrice
  const outOfStock = product.stock === 0 || product.status === 'out_of_stock'
  const wishlisted = isWishlisted(product.id)
  const inCart = items.some((i) => i.productId === product.id)
  const maxQty = Math.min(product.stock, 10)

  const handleAddToCart = () => {
    if (outOfStock) return
    addItem({
      productId: product.id,
      productName: product.name,
      featuredImage: product.featuredImage,
      price: product.price,
      discountPrice: product.discountPrice,
      flashSalePrice: product.flashSalePrice,
      quantity,
      maxStock: product.stock,
    })
    toast(`"${product.name}" added to cart!`, 'success')
    openCart()
  }

  const handleBuyNow = () => {
    handleAddToCart()
    // Navigate to checkout handled by cart drawer
  }

  const handleWishlist = () => {
    toggleItem({
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      featuredImage: product.featuredImage,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
    })
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!', wishlisted ? 'info' : 'success')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: product.name, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast('Link copied!', 'success')
    }
  }

  const whatsappMsg = encodeURIComponent(
    `Hi PUSPALOY! 👋\nI want to purchase:\n*${product.name}*\nPrice: ৳${effectivePrice.toLocaleString()}\n${window.location.href}`
  )
  const whatsappUrl = `https://wa.me/8801883172754?text=${whatsappMsg}`
  const messengerUrl = `https://m.me/puspaloy?text=${encodeURIComponent(`I'd like to order: ${product.name}`)}`

  return (
    <div className="flex flex-col gap-5">
      {/* Category + SKU */}
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-wider text-[var(--text-muted)]">
          {product.subcategory || product.category}
        </span>
        <span className="font-sans text-xs text-[var(--text-muted)]">SKU: {product.sku}</span>
      </div>

      {/* Product name */}
      <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[var(--text-primary)] leading-tight">
        {product.name}
      </h1>

      {/* Rating */}
      {product.reviewCount > 0 && (
        <StarRatingDisplay rating={product.avgRating} count={product.reviewCount} size={15} />
      )}

      {/* Flash sale countdown */}
      {isFlashSale && (
        <div className="flex items-center gap-3 p-3 rounded-luxury bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40">
          <Zap size={16} className="text-orange-500 fill-orange-500 shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-sans text-xs font-semibold text-orange-700 dark:text-orange-400">Flash Sale ends in:</span>
            <CountdownTimer
              targetDate={flashSaleEnd ?? DEMO_FLASH_END}
              variant="compact"
            />
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="flex items-end gap-3 flex-wrap">
        <span className={cn(
          'font-display text-4xl font-bold',
          isFlashSale ? 'text-orange-500' : 'text-[var(--color-rose)]'
        )}>
          {formatPrice(effectivePrice)}
        </span>
        {hasDiscount && (
          <>
            <span className="font-sans text-xl text-[var(--text-muted)] line-through mb-0.5">
              {formatPrice(product.price)}
            </span>
            <span className={cn(
              'px-2.5 py-1 rounded-full text-sm font-sans font-bold',
              isFlashSale
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
            )}>
              -{discountPercent}% OFF
            </span>
          </>
        )}
      </div>

      {/* Stock status */}
      <div className="flex items-center gap-2">
        {outOfStock ? (
          <span className="inline-flex items-center gap-1.5 font-sans text-sm text-red-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Out of Stock
          </span>
        ) : product.stock <= 5 ? (
          <span className="inline-flex items-center gap-1.5 font-sans text-sm text-orange-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Only {product.stock} left in stock!
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-sans text-sm text-emerald-600 font-medium">
            <CheckCircle size={14} className="text-emerald-500" />
            In Stock
          </span>
        )}
      </div>

      {/* Quantity selector */}
      {!outOfStock && (
        <div className="flex items-center gap-4">
          <span className="font-sans text-sm font-medium text-[var(--text-secondary)]">Quantity:</span>
          <div className="flex items-center border border-[var(--border)] rounded-luxury overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-30 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="w-12 text-center font-sans text-sm font-semibold text-[var(--text-primary)]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-30 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="font-sans text-xs text-[var(--text-muted)]">Max {maxQty}</span>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-4 rounded-luxury font-sans font-semibold text-sm tracking-wide transition-all duration-300',
            outOfStock
              ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed'
              : inCart
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--color-rose)] hover:text-white hover:border-transparent hover:shadow-gold'
          )}
        >
          <ShoppingBag size={16} />
          {outOfStock ? 'Out of Stock' : inCart ? 'Added to Cart ✓' : 'Add to Cart'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="flex-1 btn-primary py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Buy Now
        </motion.button>
      </div>

      {/* Wishlist + Share row */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleWishlist}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-luxury border font-sans text-sm font-medium transition-all duration-200',
            wishlisted
              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]'
          )}
        >
          <Heart size={15} className={cn(wishlisted && 'fill-current')} />
          {wishlisted ? 'Wishlisted' : 'Wishlist'}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 rounded-luxury border border-[var(--border)] font-sans text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all duration-200"
        >
          <Share2 size={15} />
          Share
        </button>
      </div>

      {/* WhatsApp + Messenger instant order */}
      <div className="p-4 rounded-luxury-lg bg-[var(--bg-muted)] border border-[var(--border)]">
        <p className="font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Order via Social Media
        </p>
        <div className="flex gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-luxury bg-[#25D366] text-white font-sans text-sm font-semibold hover:bg-[#1ebe5c] transition-colors"
          >
            <Phone size={15} />
            WhatsApp
          </a>
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-luxury bg-[#0099FF] text-white font-sans text-sm font-semibold hover:bg-[#007acc] transition-colors"
          >
            <MessageCircle size={15} />
            Messenger
          </a>
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { icon: ShieldCheck, text: '100% Authentic', sub: 'Quality guaranteed' },
          { icon: Package, text: 'Safe Packaging', sub: 'Damage-free delivery' },
        ].map((badge) => {
          const Icon = badge.icon
          return (
            <div key={badge.text} className="flex items-center gap-2 p-2.5 rounded-luxury bg-[var(--bg-muted)]">
              <Icon size={16} className="text-[var(--color-gold)] shrink-0" />
              <div>
                <p className="font-sans text-xs font-semibold text-[var(--text-primary)]">{badge.text}</p>
                <p className="font-sans text-[10px] text-[var(--text-muted)]">{badge.sub}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
