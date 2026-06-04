// src/components/layout/MobileNav.tsx
// Thumb-friendly bottom navigation bar for mobile
import { Link, useLocation } from 'react-router-dom'
import { Home, Grid3X3, ShoppingBag, Heart, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cartStore'

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Grid3X3, label: 'Shop', href: '/catalog' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Heart, label: 'Wishlist', href: '/wishlist' },
  { icon: ShoppingBag, label: 'Cart', href: '/cart' },
]

export default function MobileNav() {
  const location = useLocation()
  const { getTotalItems } = useCartStore()
  const cartCount = getTotalItems()

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass border-t border-[var(--border)]"
      style={{ height: 'var(--mobile-nav-h)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="h-full grid grid-cols-5">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)
          return (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-center justify-center gap-0.5 relative group"
              aria-label={label}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${
                    active ? 'text-[var(--color-rose)]' : 'text-[var(--text-muted)] group-hover:text-[var(--color-rose)]'
                  }`}
                />
                {label === 'Cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gradient-luxury text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-sans font-medium transition-colors duration-200 ${
                  active ? 'text-[var(--color-rose)]' : 'text-[var(--text-muted)] group-hover:text-[var(--color-rose)]'
                }`}
              >
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-luxury rounded-full"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
