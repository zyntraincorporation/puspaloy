// src/pages/SearchPage.tsx
// Full client-side fuzzy search using Fuse.js + product lite index
import { useState, useMemo, useEffect } from 'react'
import SEO from '@/components/shared/SEO'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Fuse from 'fuse.js'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useProductIndex } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import SkeletonProductCard from '@/components/product/SkeletonProductCard'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import type { ProductLite, ProductCategory } from '@/types'

const CATEGORIES: { label: string; value: ProductCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Cosmetics', value: 'cosmetics' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Gifts', value: 'gifts' },
  { label: 'Personalized', value: 'personalized-gifts' },
  { label: 'Accessories', value: 'accessories' },
]

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Best Selling', value: 'sales' },
]

function productToFull(lite: ProductLite) {
  return {
    ...lite,
    sku: '',
    htmlDescription: '',
    description: '',
    images: [],
    youtubeVideoId: null,
    reviewCount: lite.reviewCount,
    viewCount: 0,
    salesCount: lite.salesCount,
    messengerText: '',
    whatsappText: '',
    newArrival: false,
    createdAt: null as never,
    updatedAt: null as never,
    createdBy: '',
  }
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all')
  const [sort, setSort] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)

  const { data: products = [], isLoading } = useProductIndex()

  // Build Fuse.js instance
  const fuse = useMemo(() => new Fuse(products, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'tags', weight: 1.5 },
      { name: 'category', weight: 1 },
      { name: 'subcategory', weight: 1 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
  }), [products])

  const results = useMemo(() => {
    let filtered: ProductLite[] = query.trim()
      ? fuse.search(query).map((r) => r.item)
      : [...products]

    if (activeCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === activeCategory)
    }

    switch (sort) {
      case 'price_asc': filtered.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)); break
      case 'price_desc': filtered.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)); break
      case 'rating': filtered.sort((a, b) => b.avgRating - a.avgRating); break
      case 'sales': filtered.sort((a, b) => b.salesCount - a.salesCount); break
    }

    return filtered
  }, [query, products, fuse, activeCategory, sort])

  // Sync query param
  useEffect(() => {
    if (query) setSearchParams({ q: query }, { replace: true })
    else setSearchParams({}, { replace: true })
  }, [query, setSearchParams])

  return (
    <>
      <SEO title={query ? `"${query}" – Search` : 'Search'} noindex />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container-luxury pt-8 pb-16">

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-serif text-2xl font-semibold text-[var(--text-primary)] mb-5">
              {query ? `Results for "${query}"` : 'Search Products'}
            </h1>

            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cosmetics, shoes, gifts..."
                className="input-luxury pl-11 pr-10 py-4 text-base"
                autoFocus
                id="search-input"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Category pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value as ProductCategory | 'all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all duration-200 ${
                    activeCategory === cat.value
                      ? 'bg-gradient-luxury text-white shadow-gold'
                      : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort + result count */}
            <div className="flex items-center gap-3 ml-auto">
              {!isLoading && (
                <span className="font-sans text-xs text-[var(--text-muted)]">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              )}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs font-sans px-3 py-2 rounded-luxury border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-rose)]"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Search size={40} className="text-[var(--text-muted)] mx-auto mb-4" />
              <p className="font-serif text-xl text-[var(--text-primary)] mb-2">No results found</p>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Try a different search term or browse our categories
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {results.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={productToFull(product) as never}
                  animationDelay={index * 0.04}
                  priority={index < 4}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
