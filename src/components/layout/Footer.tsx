// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Share2, MessageCircle, Mail, Phone, MapPin, Heart } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useState } from 'react'

const QUICK_LINKS = [
  { label: 'Cosmetics', href: '/category/cosmetics' },
  { label: "Women's Shoes", href: '/category/shoes' },
  { label: 'Gift Items', href: '/category/gifts' },
  { label: 'Accessories', href: '/category/accessories' },
  { label: 'Personalized Gifts', href: '/category/personalized-gifts' },
]

const INFO_LINKS = [
  { label: 'About PUSPALOY', href: '/#brand-story' },
  { label: 'Track Your Order', href: '/search' },
  { label: 'Return Policy', href: '/#return-policy' },
  { label: 'Privacy Policy', href: '/#privacy-policy' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // TODO: write to Firestore newsletter collection
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer
      className="border-t border-[var(--border)] mt-16"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Main footer content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="container-luxury py-12 lg:py-16"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand column */}
          <motion.div variants={fadeInUp} className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/favicon.ico" alt="Puspaloy Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif text-2xl font-semibold text-[var(--text-primary)]">
                PUSPALOY
              </span>
            </Link>
            <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
              Luxury beauty, fashion, and gifting brand from the heart of Bangladesh. 
              Every product is curated with elegance and love.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200"
                aria-label="Facebook"
              >
                <Share2 size={15} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200"
                aria-label="Messenger"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div variants={fadeInUp}>
            <h3 className="font-sans font-semibold text-sm tracking-widest uppercase text-[var(--color-gold)] mb-4">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Info links */}
          <motion.div variants={fadeInUp}>
            <h3 className="font-sans font-semibold text-sm tracking-widest uppercase text-[var(--color-gold)] mb-4">
              Information
            </h3>
            <ul className="space-y-2.5">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Phone size={13} className="text-[var(--color-rose)] shrink-0" />
                <span>+8809638504054</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Mail size={13} className="text-[var(--color-rose)] shrink-0" />
                <span>hello@puspaloygiftzone.shop</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <MapPin size={13} className="text-[var(--color-rose)] shrink-0 mt-0.5" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={fadeInUp}>
            <h3 className="font-sans font-semibold text-sm tracking-widest uppercase text-[var(--color-gold)] mb-4">
              Newsletter
            </h3>
            <p className="font-sans text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              Get exclusive offers and new arrivals directly in your inbox.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <Heart size={14} className="text-rose-500 fill-rose-500" />
                Thank you for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="input-luxury text-sm"
                  required
                />
                <button type="submit" className="btn-primary text-sm py-2.5">
                  Subscribe
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)]">
        <div className="container-luxury py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-sans text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} PUSPALOY. All rights reserved.
          </p>
          <p className="font-sans text-xs text-[var(--text-muted)] flex items-center gap-1">
            Made with <Heart size={10} className="text-rose-500 fill-rose-500" /> in Bangladesh
          </p>
        </div>
      </div>
    </footer>
  )
}
