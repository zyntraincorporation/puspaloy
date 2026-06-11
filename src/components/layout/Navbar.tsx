// src/components/layout/Navbar.tsx
// REDESIGNED:
//  Desktop → categories rendered as horizontal nav links (no dropdown).
//  Mobile  → hamburger opens a full slide-in drawer with overlay, subcategory
//            accordion, smooth animations, and proper close behavior.
//  Both    → only non-empty categories (productCount > 0) are shown.

import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Heart, Search, Menu, X,
  Sun, Moon, ChevronDown, ChevronRight, Home,
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useThemeStore } from '@/store/themeStore'
import PromoStrip from '@/components/home/PromoStrip'
import { useActiveCategories } from '@/hooks/useCategories'
import { cn } from '@/utils/cn'
import type { Category } from '@/types'

// ── Helper — filter categories that have products ────────────────────────────
function withProducts(cats: Category[]) {
  return cats.filter(c => (c.productCount ?? 0) > 0)
}

// ── Desktop Category Link ────────────────────────────────────────────────────
function DesktopCatLink({ cat }: { cat: Category }) {
  const location = useLocation()
  const isActive = location.pathname === `/category/${cat.slug}`

  return (
    <NavLink
      to={`/category/${cat.slug}`}
      className={cn(
        'relative font-sans text-sm font-medium transition-colors duration-200 py-1 whitespace-nowrap',
        'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:rounded-full',
        'after:bg-gradient-luxury after:transition-all after:duration-300',
        isActive
          ? 'text-[var(--color-rose)] after:w-full'
          : 'text-[var(--text-secondary)] hover:text-[var(--color-rose)] after:w-0 hover:after:w-full'
      )}
    >
      {cat.name}
    </NavLink>
  )
}

// ── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({
  open,
  onClose,
  categories,
}: {
  open: boolean
  onClose: () => void
  categories: Category[]
}) {
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((slug: string) => {
    setExpandedSlugs(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }, [])

  // Close drawer on route change
  const location = useLocation()
  useEffect(() => { onClose() }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] flex flex-col shadow-luxury-lg"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]"
              style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
            >
              <Link to="/" className="flex items-center gap-2" onClick={onClose}>
                <div className="w-7 h-7 rounded-full overflow-hidden">
                  <img src="/favicon.ico" alt="Puspaloy" className="w-full h-full object-contain" />
                </div>
                <span className="font-serif text-xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent tracking-wide">
                  PUSPALOY
                </span>
              </Link>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--bg-muted)] transition-colors text-[var(--text-secondary)]"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable nav content */}
            <nav className="flex-1 overflow-y-auto py-3">
              {/* Home link */}
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-rose)] hover:bg-[var(--bg-muted)] transition-all duration-200"
              >
                <Home size={16} className="shrink-0" />
                Home
              </Link>

              {/* Divider + section label */}
              <div className="px-5 pt-3 pb-1">
                <p className="font-sans text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--color-gold)]">
                  Shop by Category
                </p>
              </div>

              {/* Category links */}
              {categories.map((cat) => {
                const hasSubs = (cat.subcategories?.length ?? 0) > 0
                const isExpanded = expandedSlugs.has(cat.slug)

                return (
                  <div key={cat.id}>
                    <div className="flex items-center">
                      <Link
                        to={`/category/${cat.slug}`}
                        onClick={onClose}
                        className="flex-1 flex items-center gap-3 px-5 py-3 font-sans text-sm font-medium text-[var(--text-primary)] hover:text-[var(--color-rose)] hover:bg-[var(--bg-muted)] transition-all duration-200"
                      >
                        {/* Icon */}
                        {cat.icon && !cat.icon.startsWith('http') ? (
                          <span className="text-base w-5 text-center shrink-0">{cat.icon}</span>
                        ) : cat.icon ? (
                          <img src={cat.icon} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-5 shrink-0" />
                        )}
                        {cat.name}
                        {(cat.productCount ?? 0) > 0 && (
                          <span className="ml-auto font-sans text-[10px] text-[var(--text-muted)]">
                            {cat.productCount}
                          </span>
                        )}
                      </Link>

                      {/* Expand subcategories */}
                      {hasSubs && (
                        <button
                          onClick={() => toggleExpand(cat.slug)}
                          className="px-3 py-3 text-[var(--text-muted)] hover:text-[var(--color-rose)] transition-colors"
                          aria-label={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                        >
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight size={14} />
                          </motion.div>
                        </button>
                      )}
                    </div>

                    {/* Subcategories accordion */}
                    <AnimatePresence>
                      {hasSubs && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden bg-[var(--bg-muted)]/50"
                        >
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.slug}
                              to={`/category/${cat.slug}?sub=${sub.slug}`}
                              onClick={onClose}
                              className="flex items-center gap-3 pl-14 pr-5 py-2.5 font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] hover:bg-[var(--bg-muted)] transition-all duration-200"
                            >
                              <ChevronRight size={10} className="shrink-0 opacity-50" />
                              {sub.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}

              {/* View all */}
              <div className="px-5 pt-3">
                <Link
                  to="/catalog"
                  onClick={onClose}
                  className="block w-full text-center py-3 rounded-luxury border border-[var(--color-rose)] text-[var(--color-rose)] font-sans text-sm font-medium hover:bg-[var(--color-rose)] hover:text-white transition-all duration-200"
                >
                  View All Products
                </Link>
              </div>
            </nav>

            {/* Drawer footer */}
            <div
              className="border-t border-[var(--border)] px-5 py-4 flex items-center gap-3"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <Link
                to="/search"
                onClick={onClose}
                className="flex-1 flex items-center gap-2 font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors"
              >
                <Search size={15} /> Search
              </Link>
              <Link
                to="/wishlist"
                onClick={onClose}
                className="flex items-center gap-2 font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors"
              >
                <Heart size={15} /> Wishlist
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { getTotalItems, toggleCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const { theme, toggleTheme } = useThemeStore()
  const { data: allCategories = [] } = useActiveCategories()
  const cartCount = getTotalItems()

  // Only show categories that have products
  const categories = withProducts(allCategories)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* Promo strip — hidden on scroll */}
        <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
          <PromoStrip />
        </div>

        {/* Main nav bar */}
        <div
          className={`transition-all duration-300 ${scrolled ? 'glass shadow-luxury' : 'bg-[var(--bg-primary)]/90 backdrop-blur-sm'}`}
          style={{ height: 'var(--navbar-h)' }}
        >
          <div className="container-luxury h-full flex items-center gap-4 xl:gap-6">

            {/* ── Logo ─────────────────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2 group shrink-0 mr-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/favicon.ico" alt="Puspaloy Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif text-xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent transition-all duration-300 tracking-wide">
                PUSPALOY
              </span>
            </Link>

            {/* ── Desktop horizontal category nav ──────────────────── */}
            <nav
              className="hidden md:flex items-center gap-5 xl:gap-6 flex-1 overflow-x-auto no-scrollbar"
              aria-label="Category navigation"
            >
              {categories.map((cat) => (
                <DesktopCatLink key={cat.id} cat={cat} />
              ))}
            </nav>

            {/* ── Actions ──────────────────────────────────────────── */}
            <div className="flex items-center gap-1 ml-auto shrink-0">

              {/* Search */}
              <button
                onClick={() => navigate('/search')}
                className="btn-ghost p-2.5 rounded-full"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="btn-ghost p-2.5 rounded-full"
                aria-label="Toggle theme"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </motion.div>
              </button>

              {/* Wishlist — hidden on small mobile (bottom nav handles it) */}
              <Link
                to="/wishlist"
                className="hidden sm:inline-flex btn-ghost p-2.5 rounded-full relative"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="btn-ghost p-2.5 rounded-full relative"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-luxury text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="btn-ghost p-2.5 rounded-full md:hidden"
                aria-label="Open menu"
                aria-expanded={drawerOpen}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
      />
    </>
  )
}
