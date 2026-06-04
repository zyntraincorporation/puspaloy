// src/components/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileNav from './MobileNav'
import CartDrawer from '@/components/cart/CartDrawer'
import ZyntraButton from '@/components/ai/ZyntraButton'
import ZyntraChat from '@/components/ai/ZyntraChat'
import { pageTransition } from '@/lib/animations'

export default function MainLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-h)] pb-[var(--mobile-nav-h)] md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <MobileNav />
      <CartDrawer />
      <ZyntraButton />
      <ZyntraChat />
    </div>
  )
}
