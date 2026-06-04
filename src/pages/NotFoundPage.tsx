// src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
    >
      <p className="font-display text-8xl font-bold text-gradient-gold mb-4">404</p>
      <h1 className="section-title mb-3">Page Not Found</h1>
      <p className="section-subtitle mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Return to Home</Link>
    </motion.div>
  )
}
