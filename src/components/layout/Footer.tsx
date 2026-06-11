// src/components/layout/Footer.tsx
// UPDATED:
//  - Uses useNonEmptyActiveCategories → empty categories never appear in Shop links
//  - Pulls phone, email, address, social links from Firestore settings/general
//  - Falls back gracefully to hardcoded values if settings haven't loaded yet
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Mail, Phone, MapPin, Heart } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useState } from 'react'
import { useNonEmptyActiveCategories } from '@/hooks/useCategories'
import { useGeneralSettings } from '@/hooks/useSettings'

// ── Brand icon SVGs (lucide-react excludes trademarked brand icons) ──────────
function FacebookIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ── Hardcoded fallbacks (used until Firestore settings load) ─────────────────
const FALLBACK = {
  phone: '+8809638504054',
  email: 'hello@puspaloygiftzone.shop',
  address: 'Dhaka, Bangladesh',
  facebook: '#',
  instagram: '#',
  messenger: '#',
}

const INFO_LINKS = [
  { label: 'About PUSPALOY', href: '/#brand-story' },
  { label: 'Track Your Order', href: '/search' },
  { label: 'Return Policy', href: '/#return-policy' },
  { label: 'Privacy Policy', href: '/#privacy-policy' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const { data: categories = [] } = useNonEmptyActiveCategories()
  const { data: settings } = useGeneralSettings()

  // Resolved values — prefer Firestore, fall back to hardcoded
  const phone    = settings?.phone         || FALLBACK.phone
  const emailVal = settings?.email         || FALLBACK.email
  const address  = settings?.address       || FALLBACK.address
  const facebook = settings?.socialLinks?.facebook  || FALLBACK.facebook
  const instagram = settings?.socialLinks?.instagram || FALLBACK.instagram
  const messenger = settings?.messengerPageId
    ? `https://m.me/${settings.messengerPageId}`
    : FALLBACK.messenger

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
              <span className="font-serif text-3xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent tracking-wide">
                PUSPALOY
              </span>
            </Link>
            <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
              Luxury beauty, fashion, and gifting brand from the heart of Bangladesh.
              Every product is curated with elegance and love.
            </p>

            {/* Social links — dynamic from Firestore */}
            <div className="flex items-center gap-3">
              {facebook && facebook !== '#' ? (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200"
                  aria-label="Facebook"
                >
                  <FacebookIcon size={15} />
                </a>
              ) : (
                <a
                  href="#"
                  className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200"
                  aria-label="Facebook"
                >
                  <FacebookIcon size={15} />
                </a>
              )}
              {instagram && instagram !== '#' ? (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200"
                  aria-label="Instagram"
                >
                  <InstagramIcon size={15} />
                </a>
              ) : (
                <a
                  href="#"
                  className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200"
                  aria-label="Instagram"
                >
                  <InstagramIcon size={15} />
                </a>
              )}
              <a
                href={messenger}
                target={messenger !== '#' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200"
                aria-label="Messenger"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </motion.div>

          {/* Shop links — non-empty categories only */}
          <motion.div variants={fadeInUp}>
            <h3 className="font-sans font-semibold text-sm tracking-widest uppercase text-[var(--color-gold)] mb-4">
              Shop
            </h3>
            <ul className="space-y-3">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors inline-block"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li>
                  <Link
                    to="/catalog"
                    className="font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors"
                  >
                    All Products
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>

          {/* Info links + contact */}
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

            {/* Contact info — dynamic from Firestore */}
            <div className="mt-5 space-y-2">
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors"
              >
                <Phone size={13} className="text-[var(--color-rose)] shrink-0" />
                <span>{phone}</span>
              </a>
              <a
                href={`mailto:${emailVal}`}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors"
              >
                <Mail size={13} className="text-[var(--color-rose)] shrink-0" />
                <span>{emailVal}</span>
              </a>
              <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <MapPin size={13} className="text-[var(--color-rose)] shrink-0 mt-0.5" />
                <span>{address}</span>
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
