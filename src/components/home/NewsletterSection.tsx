// src/components/home/NewsletterSection.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Sparkles, CheckCircle } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || subscribed) return
    setLoading(true)
    setError('')
    try {
      await setDoc(doc(db, 'newsletter', email.toLowerCase()), {
        email: email.toLowerCase(),
        subscribedAt: serverTimestamp(),
        active: true,
      })
      setSubscribed(true)
      setEmail('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, hsl(340,55%,62%) 0%, hsl(42,72%,50%) 100%)' }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="container-luxury relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp}>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
              <Mail size={24} className="text-white" />
            </div>

            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
              Join the PUSPALOY Circle
            </h2>

            <p className="font-sans text-base text-white/75 leading-relaxed mb-8">
              Subscribe for exclusive offers, early access to new arrivals, and luxury beauty tips delivered to your inbox.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <p className="font-serif text-xl text-white font-semibold">
                  Thank you for subscribing! ✨
                </p>
                <p className="font-sans text-sm text-white/70">
                  Welcome to the PUSPALOY family.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-5 py-3.5 rounded-luxury bg-white/20 text-white placeholder-white/50 
                      border border-white/30 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/20
                      font-sans text-sm transition-all duration-200"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-luxury
                    bg-white text-[var(--color-rose)] font-sans font-semibold text-sm
                    hover:bg-white/90 transition-all duration-200 shadow-md
                    disabled:opacity-70 whitespace-nowrap"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Subscribe
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {error && (
              <p className="font-sans text-sm text-white/80 mt-3 bg-white/10 px-4 py-2 rounded-luxury inline-block">
                {error}
              </p>
            )}

            <p className="font-sans text-xs text-white/50 mt-4">
              No spam, unsubscribe anytime. Your privacy is respected.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
