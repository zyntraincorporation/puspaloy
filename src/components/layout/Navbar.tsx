import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Heart, Search, Menu, X, Sun, Moon } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useThemeStore } from '@/store/themeStore'
import PromoStrip from '@/components/home/PromoStrip'

const NAV_LINKS = [
  { label: 'Cosmetics', href: '/category/cosmetics' },
  { label: 'Shoes', href: '/category/shoes' },
  { label: 'Gifts', href: '/category/gifts' },
  { label: 'Accessories', href: '/category/accessories' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { getTotalItems, toggleCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const { theme, toggleTheme } = useThemeStore()
  const cartCount = getTotalItems()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300`}
      >
        {/* Promo strip — hidden on scroll */}
        <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
          <PromoStrip />
        </div>

        {/* Main nav bar */}
        <div className={`transition-all duration-300 ${scrolled ? 'glass shadow-luxury' : 'bg-[var(--bg-primary)]/90 backdrop-blur-sm'}`}
          style={{ height: 'var(--navbar-h)' }}
        >
          <div className="container-luxury h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
              <img src="/favicon.ico" alt="Puspaloy Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif text-xl font-semibold text-[var(--text-primary)] group-hover:text-gradient-gold transition-all duration-300">
              PUSPALOY
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
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

            {/* Wishlist */}
            <Link to="/wishlist" className="btn-ghost p-2.5 rounded-full relative" aria-label="Wishlist">
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-ghost p-2.5 rounded-full md:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 z-40 md:hidden glass shadow-luxury-md"
            style={{ top: 'var(--navbar-h)' }}
          >
            <nav className="container-luxury py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-luxury text-[var(--text-primary)] font-sans font-medium hover:bg-[var(--bg-muted)] hover:text-[var(--color-rose)] transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
