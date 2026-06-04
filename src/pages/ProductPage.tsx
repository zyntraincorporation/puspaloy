// src/pages/ProductPage.tsx
// Full Product Detail Page — Gallery | Info | Tabs (Description, Reviews) | Related
import { useParams, Link } from 'react-router-dom'
import SEO from '@/components/shared/SEO'
import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'

import { useProduct } from '@/hooks/useProducts'
import { getEffectivePrice, formatPrice } from '@/utils/formatters'
import { pageTransition, fadeInUp, staggerContainer } from '@/lib/animations'

// Sub-components
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfo from '@/components/product/ProductInfo'
import ProductTabs from '@/components/product/ProductTabs'
import ProductReviews from '@/components/product/ProductReviews'
import RelatedProducts from '@/components/product/RelatedProducts'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import SafeHtmlRenderer from '@/components/shared/SafeHtmlRenderer'

// Skeleton
function ProductPageSkeleton() {
  return (
    <div className="container-luxury py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery skeleton */}
        <div className="space-y-3">
          <div className="aspect-square skeleton rounded-luxury-lg" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="w-16 h-16 skeleton rounded-luxury" />)}
          </div>
        </div>
        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-3 w-24 skeleton rounded" />
          <div className="h-8 w-3/4 skeleton rounded" />
          <div className="h-8 w-1/2 skeleton rounded" />
          <div className="h-10 w-36 skeleton rounded" />
          <div className="h-12 skeleton rounded-luxury" />
          <div className="h-12 skeleton rounded-luxury" />
        </div>
      </div>
    </div>
  )
}

// 404 state
function ProductNotFound() {
  return (
    <div className="container-luxury py-20 text-center">
      <h1 className="font-serif text-3xl text-[var(--text-primary)] mb-4">Product Not Found</h1>
      <p className="font-sans text-[var(--text-muted)] mb-6">
        This product may have been removed or is temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary">
        <Home size={16} />
        Back to Home
      </Link>
    </div>
  )
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading, isError } = useProduct(slug ?? '')

  if (isLoading) return <ProductPageSkeleton />
  if (!product || isError) return <ProductNotFound />

  const effectivePrice = getEffectivePrice(product.price, product.discountPrice, product.flashSalePrice)
  const canonicalUrl = `https://puspaloy.com/product/${product.slug}`

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.[0] ?? product.featuredImage,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'BDT',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.avgRating,
      reviewCount: product.reviewCount,
    } : undefined,
  }

  const descriptionTab = product.htmlDescription ? (
    <SafeHtmlRenderer
      className="product-description"
      html={product.htmlDescription}
    />
  ) : (
    <p className="font-sans text-[var(--text-secondary)] leading-relaxed">
      {product.description || 'No description available.'}
    </p>
  )

  const tabs = [
    {
      id: 'description',
      label: 'Description',
      content: descriptionTab,
    },
    {
      id: 'reviews',
      label: `Reviews (${product.reviewCount})`,
      content: <ProductReviews product={product} />,
    },
    ...(product.youtubeVideoId ? [] : []),
  ]

  return (
    <>
      <SEO 
        title={product.name}
        description={product.description?.slice(0, 155) || `Buy ${product.name} from PUSPALOY — premium quality guaranteed.`}
        image={product.featuredImage}
        type="product"
        url={canonicalUrl}
        jsonLd={jsonLd}
      >
        <meta property="product:price:amount" content={String(effectivePrice)} />
        <meta property="product:price:currency" content="BDT" />
      </SEO>

      <motion.div
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Breadcrumb */}
        <div className="container-luxury pt-4 pb-0">
          <nav className="flex items-center gap-1.5 font-sans text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[var(--color-rose)] transition-colors flex items-center gap-1">
              <Home size={11} />
              Home
            </Link>
            <ChevronRight size={11} />
            <Link
              to={`/category/${product.category}`}
              className="hover:text-[var(--color-rose)] transition-colors capitalize"
            >
              {product.category}
            </Link>
            <ChevronRight size={11} />
            <span className="text-[var(--text-primary)] line-clamp-1 max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>

        {/* Main content grid */}
        <div className="container-luxury py-6 lg:py-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14"
          >
            {/* Left: Gallery */}
            <motion.div variants={fadeInUp}>
              <ProductGallery
                images={product.images?.length > 0 ? product.images : [product.featuredImage]}
                productName={product.name}
                youtubeVideoId={product.youtubeVideoId}
                badge={
                  product.flashSaleId ? (
                    <span className="badge-flash text-xs px-2.5 py-1">⚡ Flash Sale</span>
                  ) : product.newArrival ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">New</span>
                  ) : undefined
                }
              />
            </motion.div>

            {/* Right: Info */}
            <motion.div variants={fadeInUp}>
              <ProductInfo product={product} />
            </motion.div>
          </motion.div>
        </div>

        {/* Description + Reviews tabs */}
        <div className="container-luxury pb-12">
          <div className="border border-[var(--border)] rounded-luxury-xl p-5 sm:p-8 bg-[var(--bg-surface)]">
            <ProductTabs tabs={tabs} />
          </div>
        </div>

        {/* Related products */}
        <RelatedProducts product={product} />
      </motion.div>
    </>
  )
}
