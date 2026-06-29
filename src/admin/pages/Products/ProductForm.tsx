// src/admin/pages/Products/ProductForm.tsx
// PUSPALOY Admin — Product Form v4
// Phase 2: Missing Info Detector · Confidence Indicator · SEO Score · Search Previews
//          Regenerate Protection · Smart Slug · Draft Autosave · Badge Suggestions · Search Intent
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, X, Plus, Loader2, Save,
  Sparkles, Video, ImagePlus, Eye, Rocket,
  Search, Globe, Copy, Check, ChevronDown, ChevronUp,
  Info, AlertCircle, ShieldAlert, BarChart2, RefreshCw,
  Lock, Unlock, HardDrive, BadgeCheck, TrendingUp, ShoppingCart,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getProductById, createProduct, updateProduct } from '@/firebase/products'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/shared/Toast'
import { generateSlug } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { Product, ProductStatus } from '@/types'
import { useAllCategories } from '@/hooks/useCategories'

// ── Constants ──────────────────────────────────────────────
const SITE_URL = 'https://puspaloygiftzone.shop'

const BADGE_DEFINITIONS = [
  { id: 'gift',        icon: '🎁', label: 'Gift Item',         keywords: ['gift', 'present', 'উপহার', 'গিফট', 'box'] },
  { id: 'cosmetics',  icon: '💄', label: 'Cosmetics',          keywords: ['cosmetic', 'beauty', 'makeup', 'skincare', 'cream', 'serum', 'lipstick', 'lotion'] },
  { id: 'womens',     icon: '👠', label: "Women's Fashion",    keywords: ['women', 'girl', 'ladies', 'female', 'her', 'dress', 'fashion', 'shoe', 'accessories', 'jewelry'] },
  { id: 'premium',    icon: '⭐', label: 'Premium Choice',     keywords: ['premium', 'luxury', 'exclusive', 'high-end', 'imported', 'branded', 'original'] },
  { id: 'trending',   icon: '🔥', label: 'Trending',           keywords: ['trending', 'popular', 'hot', 'bestseller', 'best seller', 'top', 'viral'] },
  { id: 'personalized', icon: '💝', label: 'Personalized Gift', keywords: ['personalized', 'customized', 'custom', 'name', 'engrave', 'unique', 'special'] },
] as const

type BadgeId = typeof BADGE_DEFINITIONS[number]['id']

// ── Form Values Type ────────────────────────────────────────
type FormValues = {
  name: string
  slug: string
  sku: string
  category: string
  additionalCategories: string[]
  subcategory: string
  tags: string
  price: string
  discountPrice: string
  stock: string
  status: ProductStatus
  featured: boolean
  newArrival: boolean
  bestSeller: boolean
  trending: boolean
  shortDescription: string
  description: string
  htmlDescription: string
  youtubeVideoId: string
  messengerText: string
  whatsappText: string
  featuredImage: string
  images: string[]
  // SEO fields
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  seoTags: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  canonicalUrl: string
  // AI display-only extended fields
  _banglaKeywords: string
  _englishKeywords: string
  _mixedKeywords: string
  _commercialKeywords: string
  _informationalKeywords: string
  // Phase 2
  _slugLocked: boolean
  badges: BadgeId[]
}

const EMPTY_FORM: FormValues = {
  name: '', slug: '', sku: '', category: '', additionalCategories: [], subcategory: '',
  tags: '', price: '', discountPrice: '', stock: '', status: 'active',
  featured: false, newArrival: false, bestSeller: false, trending: false,
  shortDescription: '', description: '', htmlDescription: '', youtubeVideoId: '',
  messengerText: '', whatsappText: '', featuredImage: '', images: [],
  seoTitle: '', seoDescription: '', seoKeywords: '', seoTags: '',
  ogTitle: '', ogDescription: '', ogImage: '', canonicalUrl: '',
  _banglaKeywords: '', _englishKeywords: '', _mixedKeywords: '',
  _commercialKeywords: '', _informationalKeywords: '',
  _slugLocked: false,
  badges: [],
}

// ═══════════════════════════════════════════════════════════
// PURE LOGIC — No JSX
// ═══════════════════════════════════════════════════════════

// Feature 1 — Missing Info Detector
function detectMissingInfo(form: FormValues): string[] {
  const combined = (form.shortDescription + ' ' + form.description + ' ' + form.name + ' ' + form.tags).toLowerCase()
  const missing: string[] = []
  if (!/package|contains|include|box|set|piece|\bitem\b|kit|\bqty\b|quantity|১টি|২টি|পিস/.test(combined))
    missing.push('Package Contents')
  if (!/for (girls?|boys?|women|men|kids?|children|ladies|him|her|couple|friends?|family)|suitable|perfect for|ideal for|মেয়ে|ছেলে|মহিলা/.test(combined))
    missing.push('Suitable For')
  if (!/material|fabric|cotton|silk|plastic|metal|gold|silver|leather|wood|glass|ceramic|crystal|brass|stainless|রেজিন|সিলভার/.test(combined))
    missing.push('Material Information')
  if (!/quality|premium|original|authentic|genuine|certified|grade|handmade|imported|উন্নত|মানসম্পন্ন/.test(combined))
    missing.push('Quality Information')
  if (!/use|usage|apply|wash|clean|care|instruction|how to|ব্যবহার/.test(combined))
    missing.push('Usage Instructions')
  return missing
}

// Feature 2 — AI Confidence Score
type ConfidenceLevel = 'high' | 'medium' | 'low'
function computeConfidence(form: FormValues): { score: number; level: ConfidenceLevel } {
  let score = 0
  if (form.name.trim()) score += 10
  if (form.category) score += 10
  const tagCount = form.tags.split(',').filter(t => t.trim()).length
  score += Math.min(tagCount * 3, 12)
  const descLen = form.shortDescription.trim().length
  if (descLen >= 300) score += 50
  else if (descLen >= 150) score += 38
  else if (descLen >= 50) score += 22
  else if (descLen > 0) score += 8
  if (form.featuredImage) score += 8
  if (form.htmlDescription.trim().length > 100) score += 5
  if (form.images.length > 0) score += 5
  const s = Math.min(score, 100)
  return { score: s, level: s >= 70 ? 'high' : s >= 38 ? 'medium' : 'low' }
}

// Feature 3 — SEO Score
function computeSeoScore(form: FormValues): { score: number; breakdown: Record<string, number> } {
  const b: Record<string, number> = {
    title: 0,
    description: 0,
    keywords: 0,
    banglaKw: 0,
    englishKw: 0,
    mixedKw: 0,
    tags: 0,
    og: 0,
    canonical: 0,
  }
  // Title (15 pts)
  const tLen = form.seoTitle.length
  if (tLen > 0) b.title += 5
  if (tLen >= 50 && tLen <= 60) b.title += 10
  else if (tLen >= 40 && tLen <= 70) b.title += 5
  // Description (15 pts)
  const dLen = form.seoDescription.length
  if (dLen > 0) b.description += 5
  if (dLen >= 140 && dLen <= 160) b.description += 10
  else if (dLen >= 100 && dLen <= 180) b.description += 5
  // English keywords (10 pts)
  const kwCount = form.seoKeywords.split(',').filter(k => k.trim()).length
  if (kwCount >= 5) b.keywords += 10
  else if (kwCount > 0) b.keywords += 5
  // Bangla keywords (15 pts — BD market priority)
  const bKwCount = form._banglaKeywords.split(',').filter(k => k.trim()).length
  if (bKwCount >= 5) b.banglaKw += 15
  else if (bKwCount > 0) b.banglaKw += 8
  // English optimized (8 pts)
  if (form._englishKeywords.trim()) b.englishKw += 8
  // Mixed (7 pts)
  if (form._mixedKeywords.trim()) b.mixedKw += 7
  // SEO Tags (15 pts)
  const tagCount = form.seoTags.split(',').filter(t => t.trim()).length
  if (tagCount >= 8) b.tags += 15
  else if (tagCount >= 4) b.tags += 8
  else if (tagCount > 0) b.tags += 4
  // OG fields (10 pts)
  if (form.ogTitle.trim()) b.og += 5
  if (form.ogDescription.trim()) b.og += 5
  // Canonical (5 pts)
  if (form.slug.trim()) b.canonical += 5
  const total = Object.values(b).reduce((a, v) => a + v, 0)
  return { score: Math.min(total, 100), breakdown: b }
}

// Feature 9 — Badge Suggestions
function suggestBadges(form: FormValues): BadgeId[] {
  const combined = (form.name + ' ' + form.category + ' ' + form.tags + ' ' + form.shortDescription).toLowerCase()
  return BADGE_DEFINITIONS
    .filter(b => b.keywords.some(kw => combined.includes(kw)))
    .map(b => b.id)
}

// Draft key helper
function getDraftKey(id?: string) {
  return id ? `puspaloy_draft_product_${id}` : 'puspaloy_draft_product_new'
}

// ═══════════════════════════════════════════════════════════
// UI UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════

function charCount(str: string, min: number, max: number) {
  const len = str.length
  const color = len === 0 ? 'text-[var(--text-muted)]'
    : len < min ? 'text-amber-500'
    : len > max ? 'text-red-400'
    : 'text-emerald-500'
  return <span className={cn('font-sans text-[11px] font-medium tabular-nums', color)}>{len}/{max}</span>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors">
      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// Keyword pill strip
function KwPills({ text, color }: { text: string; color: string }) {
  const pills = text.split(',').map(k => k.trim()).filter(Boolean)
  if (!pills.length) return null
  const cls = {
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    blue:   'bg-blue-100 text-blue-700 border-blue-200',
    amber:  'bg-amber-100 text-amber-700 border-amber-200',
    rose:   'bg-rose-100 text-rose-700 border-rose-200',
    teal:   'bg-teal-100 text-teal-700 border-teal-200',
  }[color] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((kw, i) => (
        <span key={i} className={cn('px-2.5 py-0.5 rounded-full text-xs font-sans border', cls)}>{kw}</span>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 6 — Confirm Regenerate Modal
// ═══════════════════════════════════════════════════════════
function ConfirmModal({ open, title, body, onConfirm, onCancel }: {
  open: boolean; title: string; body: string
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <RefreshCw size={18} className="text-amber-600" />
              </div>
              <h3 className="font-sans text-base font-semibold text-[var(--text-primary)]">{title}</h3>
            </div>
            <p className="font-sans text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">{body}</p>
            <div className="flex gap-3">
              <button type="button" onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-luxury border border-[var(--border)] font-sans text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors">
                Cancel
              </button>
              <button type="button" onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-luxury bg-gradient-to-r from-violet-600 to-purple-700 text-white font-sans text-sm font-semibold hover:opacity-90 transition-opacity">
                Generate Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 1 — Missing Info Warning Card
// ═══════════════════════════════════════════════════════════
function MissingInfoCard({ form }: { form: FormValues }) {
  const [dismissed, setDismissed] = useState(false)
  const missing = detectMissingInfo(form)
  if (!missing.length || dismissed) return null
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-luxury border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert size={15} className="text-amber-600" />
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-amber-800 mb-1">
              Add more info for a better description
            </p>
            <p className="font-sans text-xs text-amber-700 mb-2">
              Consider adding the following to get higher quality AI output:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map(m => (
                <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-xs text-amber-700 font-sans">
                  <Check size={9} />
                  {m}
                </span>
              ))}
            </div>
            <p className="font-sans text-[10px] text-amber-600 mt-2">
              This is only a suggestion — you can still generate without this info.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 2 — AI Confidence Indicator
// ═══════════════════════════════════════════════════════════
function ConfidenceIndicator({ form }: { form: FormValues }) {
  const { score, level } = computeConfidence(form)
  const config = {
    high:   { icon: '🟢', label: 'High Confidence',   sub: 'Based on detailed admin information.',  bar: 'from-emerald-400 to-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    medium: { icon: '🟡', label: 'Medium Confidence', sub: 'Some information is missing.',           bar: 'from-amber-400 to-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
    low:    { icon: '🔴', label: 'Low Confidence',    sub: 'Very limited product information.',      bar: 'from-red-400 to-red-500',       text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  }[level]
  return (
    <div className={cn('rounded-luxury border p-3 flex items-center gap-3', config.bg, config.border)}>
      <span className="text-lg shrink-0">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn('font-sans text-xs font-semibold', config.text)}>{config.label}</span>
          <span className={cn('font-sans text-[10px] tabular-nums font-medium', config.text)}>{score}%</span>
        </div>
        <div className="h-1 bg-white/60 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('h-full rounded-full bg-gradient-to-r', config.bar)} />
        </div>
        <p className={cn('font-sans text-[10px] mt-1', config.text)}>{config.sub}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 3 — SEO Score Panel (right sidebar)
// ═══════════════════════════════════════════════════════════
function SeoScorePanel({ form }: { form: FormValues }) {
  const { score } = computeSeoScore(form)
  const level = score >= 75 ? 'excellent' : score >= 45 ? 'good' : 'needs'
  const cfg = {
    excellent: { label: '🟢 Excellent',         ring: 'text-emerald-500', track: 'stroke-emerald-100', progress: 'stroke-emerald-500', bg: 'from-emerald-500 to-teal-500' },
    good:      { label: '🟡 Good',              ring: 'text-amber-500',   track: 'stroke-amber-100',   progress: 'stroke-amber-500',   bg: 'from-amber-400 to-orange-500' },
    needs:     { label: '🔴 Needs Improvement', ring: 'text-red-500',     track: 'stroke-red-100',     progress: 'stroke-red-500',     bg: 'from-red-400 to-rose-500' },
  }[level]

  const r = 22
  const circ = 2 * Math.PI * r
  const dash = circ * (score / 100)

  const checks = [
    { label: 'SEO Title', ok: form.seoTitle.length >= 50 && form.seoTitle.length <= 60 },
    { label: 'Meta Description', ok: form.seoDescription.length >= 140 && form.seoDescription.length <= 160 },
    { label: 'English Keywords', ok: form.seoKeywords.split(',').filter(Boolean).length >= 5 },
    { label: 'Bangla Keywords 🇧🇩', ok: form._banglaKeywords.split(',').filter(Boolean).length >= 5 },
    { label: 'SEO Tags', ok: form.seoTags.split(',').filter(Boolean).length >= 6 },
    { label: 'Open Graph', ok: !!(form.ogTitle && form.ogDescription) },
  ]

  return (
    <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <BarChart2 size={14} className="text-white" />
        </div>
        <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">SEO Score</h2>
      </div>

      {/* Circular score */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className={cfg.track} />
            <motion.circle
              cx="32" cy="32" r={r} fill="none" strokeWidth="6"
              strokeLinecap="round" className={cfg.progress}
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${dash} ${circ}` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-sans text-sm font-bold text-[var(--text-primary)]">{score}</span>
          </div>
        </div>
        <div>
          <p className="font-sans text-xs font-semibold text-[var(--text-primary)]">{cfg.label}</p>
          <p className="font-sans text-[10px] text-[var(--text-muted)] mt-0.5">out of 100 points</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {checks.map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0',
              ok ? 'bg-emerald-100' : 'bg-[var(--bg-muted)]')}>
              <Check size={8} className={ok ? 'text-emerald-600' : 'text-[var(--text-muted)]'} />
            </div>
            <span className={cn('font-sans text-xs flex-1', ok ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]')}>
              {label}
            </span>
            {ok
              ? <span className="font-sans text-[10px] text-emerald-500 font-medium">✓</span>
              : <span className="font-sans text-[10px] text-[var(--text-muted)]">—</span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 4 — Google Search Preview
// ═══════════════════════════════════════════════════════════
function GoogleSearchPreview({ form }: { form: FormValues }) {
  const title = form.seoTitle || form.name || 'Product Title'
  const url = form.slug ? `${SITE_URL}/product/${form.slug}` : `${SITE_URL}/product/...`
  const desc = form.seoDescription || 'Product description will appear here after you add a meta description.'
  const breadcrumb = `${SITE_URL.replace('https://', '')} › product › ${form.slug || '...'}`

  return (
    <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold text-[var(--text-primary)]">Google Search Preview</h3>
          <p className="font-sans text-[10px] text-[var(--text-muted)]">Live preview — updates as you type</p>
        </div>
      </div>

      {/* Google SERP mock */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-4 font-sans">
        {/* URL bar */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
            <Globe size={8} className="text-[var(--text-muted)]" />
          </div>
          <span className="text-[11px] text-[#202124] leading-none">{breadcrumb}</span>
        </div>
        {/* Title */}
        <h3 className="text-[18px] leading-[1.3] font-normal text-[#1a0dab] hover:underline cursor-pointer mb-1 line-clamp-1">
          {title}
        </h3>
        {/* Description */}
        <p className="text-[13px] text-[#4d5156] leading-[1.58] line-clamp-2">
          {desc}
        </p>
      </div>

      {/* Char hints */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="font-sans text-[10px] text-[var(--text-muted)]">Title: {charCount(form.seoTitle, 50, 60)}</span>
        <span className="font-sans text-[10px] text-[var(--text-muted)]">Desc: {charCount(form.seoDescription, 140, 160)}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 5 — Social / OG Preview
// ═══════════════════════════════════════════════════════════
function SocialSharePreview({ form }: { form: FormValues }) {
  const img = form.ogImage || form.featuredImage
  const title = form.ogTitle || form.seoTitle || form.name || 'Product Title'
  const desc = form.ogDescription || form.seoDescription || 'Product description'
  const domain = SITE_URL.replace('https://', '')

  return (
    <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold text-[var(--text-primary)]">Social Share Preview</h3>
          <p className="font-sans text-[10px] text-[var(--text-muted)]">Facebook · WhatsApp · Messenger</p>
        </div>
      </div>

      {/* Facebook link card mock */}
      <div className="rounded-xl overflow-hidden border border-[#dddfe2] font-sans shadow-sm">
        {/* Image area */}
        <div className="w-full h-40 bg-[#f0f2f5] flex items-center justify-center relative overflow-hidden">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#8a8d91]">
              <ImagePlus size={28} />
              <span className="text-xs">No image — will use Featured Image</span>
            </div>
          )}
          {!form.ogImage && form.featuredImage && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-sans">
              Auto: Featured Image
            </div>
          )}
        </div>
        {/* Text area */}
        <div className="bg-[#f2f3f5] px-4 py-3 border-t border-[#dddfe2]">
          <p className="text-[11px] uppercase text-[#8a8d91] mb-0.5 font-sans tracking-wide">{domain}</p>
          <p className="text-[14px] font-semibold text-[#1c1e21] line-clamp-1 mb-0.5">{title}</p>
          <p className="text-[12px] text-[#8a8d91] line-clamp-2 leading-tight">{desc}</p>
        </div>
      </div>

      {!form.ogImage && !form.featuredImage && (
        <p className="font-sans text-[10px] text-amber-600 mt-2 flex items-center gap-1">
          <AlertCircle size={10} /> Upload a featured image or set an OG image URL for the best share preview.
        </p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 8 — Draft Auto-Save indicator
// ═══════════════════════════════════════════════════════════
function DraftSavedBadge({ savedAt }: { savedAt: Date | null }) {
  if (!savedAt) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-muted)] border border-[var(--border)]"
    >
      <HardDrive size={11} className="text-[var(--text-muted)]" />
      <span className="font-sans text-[10px] text-[var(--text-muted)]">
        Draft saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE 9 — Badge Suggestions Panel
// ═══════════════════════════════════════════════════════════
function BadgeSuggestionsPanel({ form, onChange }: {
  form: FormValues
  onChange: (badges: BadgeId[]) => void
}) {
  const suggested = suggestBadges(form)
  if (!suggested.length) return null

  const toggle = (id: BadgeId) => {
    onChange(form.badges.includes(id) ? form.badges.filter(b => b !== id) : [...form.badges, id])
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
          <BadgeCheck size={14} className="text-white" />
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Badge Suggestions</h2>
          <p className="font-sans text-[10px] text-[var(--text-muted)]">Based on category & tags</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {BADGE_DEFINITIONS.filter(b => suggested.includes(b.id)).map(badge => {
          const active = form.badges.includes(badge.id)
          return (
            <button key={badge.id} type="button" onClick={() => toggle(badge.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-medium border transition-all duration-150',
                active
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-transparent shadow-sm shadow-rose-200'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]'
              )}
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
              {active && <Check size={10} className="ml-0.5" />}
            </button>
          )
        })}
      </div>
      <p className="font-sans text-[10px] text-[var(--text-muted)] mt-2">
        {form.badges.length} badge{form.badges.length !== 1 ? 's' : ''} enabled · Shown on product cards and listing pages.
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// IMAGE UPLOADERS (unchanged from v3)
// ═══════════════════════════════════════════════════════════
function ImageUploader({ label, value, onChange, folder }: {
  label: string; value: string; onChange: (url: string) => void; folder: string
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true); setProgress(20)
    try {
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY
      if (!apiKey) throw new Error('ImgBB API key missing')
      const fd = new FormData(); fd.append('image', file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body: fd })
      const d = await res.json()
      if (d.success) { setProgress(100); onChange(d.data.url) }
      else throw new Error(d.error?.message || 'Upload failed')
    } catch (e: any) { alert(e.message) }
    finally { setUploading(false); setProgress(0) }
  }

  return (
    <div>
      <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-2">{label}</label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-32 h-32 rounded-luxury object-cover border border-[var(--border)]" />
          <button type="button" onClick={() => onChange('')} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"><X size={12} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-32 h-32 rounded-luxury border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] transition-colors">
          {uploading ? <><Loader2 size={20} className="animate-spin" /><span className="text-xs">{Math.round(progress)}%</span></> : <><ImagePlus size={20} /><span className="text-xs">Upload</span></>}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}

function GalleryUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY
    if (!apiKey) { alert('ImgBB API key missing'); setUploading(false); return }
    try {
      const urls = await Promise.all(Array.from(files).slice(0, 10 - images.length).map(async (f) => {
        const fd = new FormData(); fd.append('image', f)
        const r = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body: fd })
        const d = await r.json()
        if (!d.success) throw new Error(d.error?.message || 'Upload failed')
        return d.data.url as string
      }))
      onChange([...images, ...urls])
    } catch { alert('Failed to upload one or more images') }
    finally { setUploading(false) }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img, i) => (
          <div key={i} className="relative">
            <img src={img} alt="" className="w-20 h-20 rounded-luxury object-cover border border-[var(--border)]" />
            <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X size={10} /></button>
          </div>
        ))}
        {images.length < 10 && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-luxury border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-[var(--color-rose)] transition-colors">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span className="text-[10px]">Add</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      <p className="font-sans text-xs text-[var(--text-muted)]">{images.length}/10 images.</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// AI DESCRIPTION BUTTON — with Regenerate Protection (Feature 6)
// ═══════════════════════════════════════════════════════════
function AIDescriptionButton({ productName, category, tags, shortDescription, hasExisting, onGenerated }: {
  productName: string; category: string; tags: string; shortDescription: string
  hasExisting: boolean; onGenerated: (html: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { toast } = useToast()

  const doGenerate = async () => {
    if (!productName.trim()) { toast('Enter product name first', 'error'); return }
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, category, tags, shortDescription }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server error (${res.status})`)
      }
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? ''
      if (content) { onGenerated(content); toast('✨ Premium description generated!', 'success') }
      else throw new Error('AI returned an empty response')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Please try again.'
      toast(`AI Error: ${msg}`, 'error')
    } finally { setLoading(false) }
  }

  const handleClick = () => {
    if (hasExisting) { setConfirmOpen(true) } else { doGenerate() }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-luxury bg-gradient-to-r from-violet-600 to-purple-700 text-white font-sans text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-violet-500/20">
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        {loading ? 'Generating...' : '✨ Generate Premium Description'}
      </button>
      <ConfirmModal
        open={confirmOpen}
        title="Replace current description?"
        body="This will overwrite the existing AI-generated description. You cannot undo this action."
        onConfirm={() => { setConfirmOpen(false); doGenerate() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// AI SEO SECTION — with all keyword intents + Regenerate Protection
// ═══════════════════════════════════════════════════════════
function AISeoSection({ form, onChange }: {
  form: FormValues
  onChange: (field: keyof FormValues, value: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { toast } = useToast()

  const hasExistingSeo = !!(form.seoTitle || form.seoDescription || form.seoKeywords)

  const doGenerateSeo = async () => {
    if (!form.name.trim()) { toast('Enter product name first', 'error'); return }
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.name, category: form.category, tags: form.tags,
          shortDescription: form.shortDescription, htmlDescription: form.htmlDescription,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server error (${res.status})`)
      }
      const data = await res.json()
      const seo = data.seo || {}

      if (seo.seoTitle) onChange('seoTitle', seo.seoTitle)
      if (seo.seoDescription) onChange('seoDescription', seo.seoDescription)
      if (seo.seoKeywords) onChange('seoKeywords', seo.seoKeywords)
      if (seo.ogTitle) onChange('ogTitle', seo.ogTitle)
      if (seo.ogDescription) onChange('ogDescription', seo.ogDescription)
      if (seo.banglaKeywords) onChange('_banglaKeywords', seo.banglaKeywords)
      if (seo.englishKeywords) onChange('_englishKeywords', seo.englishKeywords)
      if (seo.mixedKeywords) onChange('_mixedKeywords', seo.mixedKeywords)
      if (seo.commercialKeywords) onChange('_commercialKeywords', seo.commercialKeywords)
      if (seo.informationalKeywords) onChange('_informationalKeywords', seo.informationalKeywords)
      if (Array.isArray(seo.seoTags)) onChange('seoTags', seo.seoTags.join(', '))
      else if (typeof seo.seoTags === 'string') onChange('seoTags', seo.seoTags)

      setExpanded(true)
      toast('🚀 SEO content generated!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Please try again.'
      toast(`AI Error: ${msg}`, 'error')
    } finally { setLoading(false) }
  }

  const handleClick = () => {
    if (hasExistingSeo) { setConfirmOpen(true) } else { doGenerateSeo() }
  }

  const canonicalUrl = form.slug ? `${SITE_URL}/product/${form.slug}` : ''

  return (
    <>
      <ConfirmModal
        open={confirmOpen}
        title="Replace current SEO content?"
        body="This will overwrite your existing SEO title, description, keywords and tags. Your edits will be lost."
        onConfirm={() => { setConfirmOpen(false); doGenerateSeo() }}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Search size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[var(--text-primary)]">Product SEO</h2>
              <p className="font-sans text-xs text-[var(--text-muted)]">Search engine optimization — Bangla & English</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleClick} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-luxury bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-sans text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-emerald-500/20">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
              {loading ? 'Generating...' : '🚀 Generate SEO'}
            </button>
            <button type="button" onClick={() => setExpanded(v => !v)}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="p-5 space-y-5">

                {/* Info banner */}
                <div className="flex items-start gap-2.5 p-3 rounded-luxury bg-emerald-50 border border-emerald-200">
                  <Info size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="font-sans text-xs text-emerald-700">
                    AI reads your <strong>Product Name</strong>, <strong>Category</strong>, <strong>Tags</strong>, and <strong>Admin Info</strong> to generate SEO. All fields are editable before saving.
                  </p>
                </div>

                {/* SEO Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-sans text-sm font-medium text-[var(--text-secondary)]">SEO Title</label>
                    <div className="flex items-center gap-2">{charCount(form.seoTitle, 50, 60)}<CopyButton text={form.seoTitle} /></div>
                  </div>
                  <input type="text" value={form.seoTitle} onChange={(e) => onChange('seoTitle', e.target.value)}
                    className="input-luxury" placeholder="e.g. Premium Birthday Gift Box for Girls | PUSPALOY" maxLength={80} />
                  <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">Optimal: 50–60 characters. Appears as Google search result title.</p>
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-sans text-sm font-medium text-[var(--text-secondary)]">Meta Description</label>
                    <div className="flex items-center gap-2">{charCount(form.seoDescription, 140, 160)}<CopyButton text={form.seoDescription} /></div>
                  </div>
                  <textarea value={form.seoDescription} onChange={(e) => onChange('seoDescription', e.target.value)}
                    className="input-luxury resize-none" rows={3}
                    placeholder="Compelling description that appears in Google results. Include a call to action." maxLength={200} />
                  <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">Optimal: 140–160 characters.</p>
                </div>

                {/* SEO Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-sans text-sm font-medium text-[var(--text-secondary)]">SEO Keywords (English)</label>
                    <CopyButton text={form.seoKeywords} />
                  </div>
                  <textarea value={form.seoKeywords} onChange={(e) => onChange('seoKeywords', e.target.value)}
                    className="input-luxury resize-none font-mono text-xs" rows={2}
                    placeholder="premium gift, birthday gift, gift for girlfriend, luxury gift bangladesh" />
                </div>

                {/* ── FEATURE 10 — Search Intent Keywords ── */}
                {(form._banglaKeywords || form._englishKeywords || form._mixedKeywords || form._commercialKeywords || form._informationalKeywords) && (
                  <div className="space-y-3 p-4 rounded-luxury bg-[var(--bg-muted)] border border-[var(--border)]">
                    <p className="font-sans text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      🌐 Bangladesh-Optimized Search Intent Keywords
                    </p>

                    {/* Commercial */}
                    {form._commercialKeywords && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[var(--text-secondary)]">
                            <ShoppingCart size={11} className="text-rose-500" /> Commercial Keywords
                          </span>
                          <CopyButton text={form._commercialKeywords} />
                        </div>
                        <KwPills text={form._commercialKeywords} color="rose" />
                        <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">Buying-intent: buy, price, order, shop online</p>
                      </div>
                    )}

                    {/* Informational */}
                    {form._informationalKeywords && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[var(--text-secondary)]">
                            <TrendingUp size={11} className="text-teal-500" /> Informational Keywords
                          </span>
                          <CopyButton text={form._informationalKeywords} />
                        </div>
                        <KwPills text={form._informationalKeywords} color="teal" />
                        <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">Discovery-intent: best, ideas, guide, review</p>
                      </div>
                    )}

                    {/* Bangla */}
                    {form._banglaKeywords && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[var(--text-secondary)]">
                            🇧🇩 Bangla Keywords
                          </span>
                          <CopyButton text={form._banglaKeywords} />
                        </div>
                        <KwPills text={form._banglaKeywords} color="purple" />
                      </div>
                    )}

                    {/* English */}
                    {form._englishKeywords && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[var(--text-secondary)]">
                            🔤 English (BD Market)
                          </span>
                          <CopyButton text={form._englishKeywords} />
                        </div>
                        <KwPills text={form._englishKeywords} color="blue" />
                      </div>
                    )}

                    {/* Mixed */}
                    {form._mixedKeywords && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[var(--text-secondary)]">
                            ✨ Mixed Bangla-English
                          </span>
                          <CopyButton text={form._mixedKeywords} />
                        </div>
                        <KwPills text={form._mixedKeywords} color="amber" />
                        <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">How Bangladeshis actually search: "gift box bd", "birthday gift ঢাকা"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* SEO Tags */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <label className="font-sans text-sm font-medium text-[var(--text-secondary)]">SEO Tags</label>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-100 text-emerald-700">Separate from Product Tags</span>
                    </div>
                    <CopyButton text={form.seoTags} />
                  </div>
                  <textarea value={form.seoTags} onChange={(e) => onChange('seoTags', e.target.value)}
                    className="input-luxury resize-none font-mono text-xs" rows={3}
                    placeholder="gift box, birthday gift, anniversary gift, gift for girlfriend, premium gift, romantic gift" />
                  <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">SEO-only tags for search ranking. Different from product tags used for filtering.</p>
                </div>

                {/* Open Graph */}
                <div className="space-y-3 p-4 rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)]">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-[var(--text-secondary)]" />
                    <p className="font-sans text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Open Graph (Social Sharing)</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-sans text-xs font-medium text-[var(--text-secondary)]">OG Title</label>
                      <div className="flex items-center gap-2">{charCount(form.ogTitle, 40, 60)}<CopyButton text={form.ogTitle} /></div>
                    </div>
                    <input type="text" value={form.ogTitle} onChange={(e) => onChange('ogTitle', e.target.value)}
                      className="input-luxury" placeholder="Title shown when shared on Facebook, WhatsApp, etc." maxLength={80} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-sans text-xs font-medium text-[var(--text-secondary)]">OG Description</label>
                      <div className="flex items-center gap-2">{charCount(form.ogDescription, 100, 155)}<CopyButton text={form.ogDescription} /></div>
                    </div>
                    <textarea value={form.ogDescription} onChange={(e) => onChange('ogDescription', e.target.value)}
                      className="input-luxury resize-none" rows={2}
                      placeholder="Description shown when product is shared on social media" maxLength={200} />
                  </div>
                  <div>
                    <label className="font-sans text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                      OG Image URL
                      <span className="ml-2 text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Auto-uses featured image if empty</span>
                    </label>
                    <input type="url" value={form.ogImage} onChange={(e) => onChange('ogImage', e.target.value)}
                      className="input-luxury" placeholder="Leave empty to use featured image automatically" />
                    <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">Optional override. Recommended: 1200×630px.</p>
                  </div>
                </div>

                {/* Canonical URL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <label className="font-sans text-sm font-medium text-[var(--text-secondary)]">Canonical URL</label>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-blue-100 text-blue-700">Auto-generated</span>
                    </div>
                    {canonicalUrl && <CopyButton text={canonicalUrl} />}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)]">
                    <Globe size={13} className="text-[var(--text-muted)] shrink-0" />
                    <span className="font-mono text-xs text-[var(--text-secondary)] break-all">
                      {canonicalUrl || <span className="text-[var(--text-muted)]">Will be set from product slug automatically</span>}
                    </span>
                  </div>
                  <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">Automatically generated from product slug. Prevents duplicate content issues.</p>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed status strip */}
        {!expanded && (
          <div className="px-5 py-3 flex items-center gap-4 border-t border-[var(--border)] flex-wrap">
            {[
              { label: 'Title', ok: !!form.seoTitle },
              { label: 'Description', ok: !!form.seoDescription },
              { label: 'Keywords', ok: !!form.seoKeywords },
              { label: 'Tags', ok: !!form.seoTags },
              { label: '🇧🇩 Bangla', ok: !!form._banglaKeywords },
              { label: 'OG', ok: !!(form.ogTitle) },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <div className={cn('w-1.5 h-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-[var(--border-strong)]')} />
                <span className="font-sans text-xs">{label}</span>
              </div>
            ))}
            <button type="button" onClick={() => setExpanded(true)} className="ml-auto font-sans text-xs text-[var(--color-rose)] hover:underline">Edit SEO →</button>
          </div>
        )}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN FORM COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { adminUser } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [previewTab, setPreviewTab] = useState<'google' | 'social'>('google')
  const [showAddlCats, setShowAddlCats] = useState(false)
  const [showSocialLinks, setShowSocialLinks] = useState(false)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftKey = getDraftKey(id)

  const { data: categories = [] } = useAllCategories()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: isEdit,
  })

  // ── Load existing product (edit mode)
  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        slug: existing.slug,
        sku: existing.sku,
        category: existing.category,
        additionalCategories: existing.additionalCategories ?? [],
        subcategory: existing.subcategory ?? '',
        tags: existing.tags?.join(', ') ?? '',
        price: String(existing.price),
        discountPrice: existing.discountPrice ? String(existing.discountPrice) : '',
        stock: String(existing.stock),
        status: existing.status,
        featured: existing.featured,
        newArrival: existing.newArrival,
        bestSeller: existing.bestSeller,
        trending: existing.trending,
        shortDescription: existing.description ?? '',
        description: existing.description ?? '',
        htmlDescription: existing.htmlDescription ?? '',
        youtubeVideoId: existing.youtubeVideoId ?? '',
        messengerText: existing.messengerText ?? '',
        whatsappText: existing.whatsappText ?? '',
        featuredImage: existing.featuredImage ?? '',
        images: existing.images ?? [],
        seoTitle: existing.seoTitle ?? '',
        seoDescription: existing.seoDescription ?? '',
        seoKeywords: existing.seoKeywords ?? '',
        seoTags: existing.seoTags?.join(', ') ?? '',
        ogTitle: existing.ogTitle ?? '',
        ogDescription: existing.ogDescription ?? '',
        ogImage: existing.ogImage ?? '',
        canonicalUrl: existing.canonicalUrl ?? '',
        _banglaKeywords: '', _englishKeywords: '', _mixedKeywords: '',
        _commercialKeywords: '', _informationalKeywords: '',
        _slugLocked: true, // editing — slug is locked by default
        badges: (existing.badges ?? []) as BadgeId[],
      })
    }
  }, [existing])

  // ── Feature 8: Restore draft for NEW products only
  useEffect(() => {
    if (!isEdit) {
      try {
        const saved = localStorage.getItem(draftKey)
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<FormValues>
          setForm(prev => ({ ...prev, ...parsed, _slugLocked: false }))
          toast('📝 Draft restored', 'success')
        }
      } catch { /* ignore corrupt draft */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Feature 8: Auto-save draft on form change (debounced 1.5s)
  const saveDraft = useCallback((f: FormValues) => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      try {
        const toSave: Partial<FormValues> = {
          name: f.name, slug: f.slug, category: f.category, tags: f.tags,
          shortDescription: f.shortDescription, description: f.description,
          htmlDescription: f.htmlDescription,
          seoTitle: f.seoTitle, seoDescription: f.seoDescription, seoKeywords: f.seoKeywords,
          seoTags: f.seoTags, ogTitle: f.ogTitle, ogDescription: f.ogDescription,
          _banglaKeywords: f._banglaKeywords, _englishKeywords: f._englishKeywords,
          _mixedKeywords: f._mixedKeywords, _commercialKeywords: f._commercialKeywords,
          _informationalKeywords: f._informationalKeywords,
          badges: f.badges,
        }
        localStorage.setItem(draftKey, JSON.stringify(toSave))
        setDraftSavedAt(new Date())
      } catch { /* quota exceeded — ignore */ }
    }, 1500)
  }, [draftKey])

  const set = useCallback((field: keyof FormValues, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      saveDraft(next)
      return next
    })
  }, [saveDraft])

  // ── Feature 7: Auto slug (respects manual lock)
  const handleNameChange = (name: string) => {
    set('name', name)
    if (!form._slugLocked && !isEdit) {
      setForm(prev => {
        const next = { ...prev, name, slug: generateSlug(name) }
        saveDraft(next)
        return next
      })
    }
  }

  const handleSlugChange = (slug: string) => {
    setForm(prev => {
      const next = { ...prev, slug, _slugLocked: slug !== generateSlug(prev.name) }
      saveDraft(next)
      return next
    })
  }

  // ── Auto canonical URL
  useEffect(() => {
    if (form.slug) set('canonicalUrl', `${SITE_URL}/product/${form.slug}`)
  }, [form.slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.featuredImage) { toast('Name, price and featured image are required', 'error'); return }
    if (!form.category) { toast('Please select a primary category', 'error'); return }
    setSaving(true)
    try {
      const categorySlugs = Array.from(new Set([form.category, ...form.additionalCategories].filter(Boolean)))
      const slug = form.slug || generateSlug(form.name)
      const canonicalUrl = `${SITE_URL}/product/${slug}`

      const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: form.name.trim(), slug, sku: form.sku.trim(),
        category: form.category, additionalCategories: form.additionalCategories, categorySlugs,
        subcategory: form.subcategory.trim(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stock: Number(form.stock) || 0,
        status: form.status,
        featured: form.featured, newArrival: form.newArrival, bestSeller: form.bestSeller, trending: form.trending,
        featuredImage: form.featuredImage, images: form.images,
        description: form.shortDescription.trim() || form.description.trim(),
        htmlDescription: form.htmlDescription.trim(),
        youtubeVideoId: form.youtubeVideoId.trim() || null,
        flashSaleId: isEdit ? (existing?.flashSaleId ?? null) : null,
        flashSalePrice: isEdit ? (existing?.flashSalePrice ?? null) : null,
        messengerText: form.messengerText.trim(),
        whatsappText: form.whatsappText.trim(),
        createdBy: adminUser?.uid ?? '',
        avgRating: isEdit ? (existing?.avgRating ?? 0) : 0,
        reviewCount: isEdit ? (existing?.reviewCount ?? 0) : 0,
        salesCount: isEdit ? (existing?.salesCount ?? 0) : 0,
        viewCount: isEdit ? (existing?.viewCount ?? 0) : 0,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        seoKeywords: form.seoKeywords.trim() || null,
        seoTags: form.seoTags.split(',').map(t => t.trim()).filter(Boolean),
        ogTitle: form.ogTitle.trim() || null,
        ogDescription: form.ogDescription.trim() || null,
        ogImage: form.ogImage.trim() || null,
        canonicalUrl,
        badges: form.badges,
      }

      if (isEdit) {
        await updateProduct(id!, payload)
        toast('Product updated!', 'success')
      } else {
        await createProduct(payload)
        // Clear draft on successful publish
        localStorage.removeItem(draftKey)
        toast('Product created!', 'success')
        navigate('/admin/products')
      }
    } catch (err) {
      console.error(err)
      toast('Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-[var(--color-rose)]" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/products')} className="btn-ghost p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          {isEdit && <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">ID: {id}</p>}
        </div>
        {/* Feature 8: Draft badge */}
        <DraftSavedBadge savedAt={draftSavedAt} />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: Main fields ──────────────────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Basic Info */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Basic Information</h2>

              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Product Name *</label>
                <input type="text" value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input-luxury" placeholder="e.g. Rose Glow Face Serum" required />
              </div>

              {/* Feature 7: Smart Slug with lock indicator */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-sans text-sm font-medium text-[var(--text-secondary)]">Slug</label>
                    <button type="button"
                      onClick={() => set('_slugLocked', !form._slugLocked)}
                      className={cn('flex items-center gap-1 text-[10px] font-sans font-medium px-1.5 py-0.5 rounded transition-colors',
                        form._slugLocked ? 'text-amber-600 bg-amber-50 border border-amber-200' : 'text-emerald-600 bg-emerald-50 border border-emerald-200')}>
                      {form._slugLocked ? <Lock size={9} /> : <Unlock size={9} />}
                      {form._slugLocked ? 'Locked' : 'Auto'}
                    </button>
                  </div>
                  <input type="text" value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="input-luxury font-mono text-sm" placeholder="auto-generated" />
                  {!form._slugLocked && <p className="font-sans text-[10px] text-emerald-600 mt-1">Auto-generating from name</p>}
                </div>
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} className="input-luxury font-mono text-sm" placeholder="e.g. CSM-001" />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-4">
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Primary Category *
                    <span className="ml-1 text-[10px] text-[var(--color-rose)] font-normal">(required)</span>
                  </label>
                  <select value={form.category}
                    onChange={(e) => { set('category', e.target.value); set('additionalCategories', form.additionalCategories.filter(s => s !== e.target.value)) }}
                    className="input-luxury pr-10 appearance-none" style={{ backgroundImage: 'none' }}>
                    <option value="" disabled>Select primary category</option>
                    {categories.filter(c => !c.archived && c.slug !== 'uncategorized').map(c => (
                      <option key={c.id} value={c.slug}>{c.icon && !c.icon.startsWith('http') ? c.icon + ' ' : ''}{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <button type="button" onClick={() => setShowAddlCats(v => !v)}
                    className="flex items-center gap-2 w-full text-left">
                    <span className="font-sans text-sm font-medium text-[var(--text-secondary)]">
                      Additional Categories
                      <span className="ml-1 text-[10px] text-[var(--text-muted)] font-normal">(optional)</span>
                    </span>
                    {form.additionalCategories.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-rose-100 text-rose-700">
                        {form.additionalCategories.length} selected
                      </span>
                    )}
                    <ChevronDown size={14} className={cn('ml-auto text-[var(--text-muted)] transition-transform duration-200', showAddlCats && 'rotate-180')} />
                  </button>
                  {showAddlCats && (
                    <div className="mt-2">
                      <div className="max-h-44 overflow-y-auto border border-[var(--border)] rounded-luxury p-2 space-y-1 bg-[var(--bg-surface)]">
                        {categories.filter(c => !c.archived && c.slug !== 'uncategorized' && c.slug !== form.category).map(c => {
                          const checked = form.additionalCategories.includes(c.slug)
                          return (
                            <label key={c.id} className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded hover:bg-[var(--bg-muted)] transition-colors">
                              <input type="checkbox" checked={checked}
                                onChange={(e) => set('additionalCategories', e.target.checked ? [...form.additionalCategories, c.slug] : form.additionalCategories.filter(s => s !== c.slug))}
                                className="rounded accent-[var(--color-rose)]" />
                              <span className="font-sans text-sm text-[var(--text-primary)]">{c.icon && !c.icon.startsWith('http') ? c.icon + ' ' : ''}{c.name}</span>
                            </label>
                          )
                        })}
                        {categories.filter(c => !c.archived && c.slug !== 'uncategorized' && c.slug !== form.category).length === 0 && (
                          <p className="text-xs text-[var(--text-muted)] p-2">No other categories available.</p>
                        )}
                      </div>
                      {form.additionalCategories.length > 0 && (
                        <p className="font-sans text-xs text-[var(--text-muted)] mt-1.5">✓ Also in: {form.additionalCategories.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Subcategory</label>
                  <input type="text" value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} className="input-luxury" placeholder="e.g. Serums" />
                </div>
              </div>

              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Product Tags (comma separated)</label>
                <input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)} className="input-luxury" placeholder="skincare, glow, serum" />
                <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1">Used for search, recommendations & related products. Separate from SEO tags.</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pricing & Inventory</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Price ৳ *</label>
                  <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className="input-luxury" placeholder="0" min="0" required />
                </div>
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Discount Price ৳</label>
                  <input type="number" value={form.discountPrice} onChange={(e) => set('discountPrice', e.target.value)} className="input-luxury" placeholder="optional" min="0" />
                </div>
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="input-luxury" placeholder="0" min="0" />
                </div>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Product Description</h2>
                  <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">Fill in Admin Info below, then click Generate</p>
                </div>
                <AIDescriptionButton
                  productName={form.name} category={form.category} tags={form.tags}
                  shortDescription={form.shortDescription}
                  hasExisting={form.htmlDescription.trim().length > 50}
                  onGenerated={(html) => {
                    set('htmlDescription', html)
                    const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                    set('description', plain.slice(0, 500))
                  }}
                />
              </div>

              {/* Feature 1: Missing Info Detector */}
              <MissingInfoCard form={form} />

              {/* Feature 2: Confidence Indicator */}
              <ConfidenceIndicator form={form} />

              {/* Admin Info field — THE CORE AI INPUT */}
              <div className="rounded-luxury border-2 border-violet-200 bg-violet-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Sparkles size={11} className="text-white" />
                  </div>
                  <span className="font-sans text-xs font-semibold text-violet-700 uppercase tracking-wider">Admin Info — AI Input</span>
                  <span className="ml-auto font-sans text-[10px] text-violet-500">This is what AI reads to generate the description</span>
                </div>
                <textarea id="shortDescription" value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-violet-200 bg-white text-sm font-sans text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none transition-all"
                  rows={5}
                  placeholder={`Write specific product information here. Examples:
• What's in the package (e.g. 1 teddy bear, 2 artificial roses, 1 greeting card)
• Who is it for (e.g. suitable for girls, women, anniversaries)
• Material or quality info (e.g. premium quality, food-grade)
• Usage instructions or special notes
• Origin or special features

AI will only use what you write here — never invent.`} />
                <div className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-200">
                  <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="font-sans text-[10px] text-amber-700">
                    <strong>AI Safety:</strong> The more you write here, the better the description. AI will NEVER add fake materials, certifications, or contents.
                  </p>
                </div>
              </div>

              {/* HTML Description Output */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                    <span>Generated HTML Description</span>
                    <span className="text-xs font-normal text-violet-500 flex items-center gap-1">
                      <Sparkles size={11} /> AI Output (editable)
                    </span>
                  </label>
                </div>
                <textarea value={form.htmlDescription}
                  onChange={(e) => set('htmlDescription', e.target.value)}
                  className="input-luxury resize-none font-mono text-xs" rows={10}
                  placeholder="<p>Your HTML description here...</p>" />
              </div>

              {/* Live HTML Preview */}
              {form.htmlDescription && (
                <div className="bg-white rounded-luxury border border-[var(--border)] overflow-hidden">
                  <div className="bg-[var(--bg-muted)] border-b border-[var(--border)] px-4 py-2 flex items-center gap-2">
                    <Eye size={14} className="text-[var(--text-secondary)]" />
                    <span className="font-sans text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Live Preview</span>
                  </div>
                  <div className="p-4 max-h-[600px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: form.htmlDescription }} />
                </div>
              )}
            </div>

            {/* ── AI SEO Section ── */}
            <AISeoSection form={form} onChange={(field, value) => set(field, value)} />

            {/* Social & Video Links — collapsible */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] overflow-hidden">
              <button type="button" onClick={() => setShowSocialLinks(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-[var(--bg-muted)] transition-colors">
                <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Social &amp; Video Links
                </h2>
                <ChevronDown size={16} className={cn('text-[var(--text-muted)] transition-transform duration-200', showSocialLinks && 'rotate-180')} />
              </button>
              {showSocialLinks && (
                <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)] pt-4">
                  <div>
                    <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">WhatsApp Number</label>
                    <input type="text" value={form.whatsappText} onChange={(e) => set('whatsappText', e.target.value)} className="input-luxury" placeholder="e.g. 8801XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Messenger Page ID</label>
                    <input type="text" value={form.messengerText} onChange={(e) => set('messengerText', e.target.value)} className="input-luxury" placeholder="e.g. puspaloy" />
                  </div>
                  <div>
                    <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5 flex items-center gap-2">
                      <Video size={14} className="text-red-500" /> YouTube Video ID
                    </label>
                    <input type="text" value={form.youtubeVideoId} onChange={(e) => set('youtubeVideoId', e.target.value)} className="input-luxury font-mono text-sm" placeholder="e.g. dQw4w9WgXcQ (video ID only)" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ──────────────────────────── */}
          <div className="space-y-5">

            {/* ① PUBLISH — Status + Save at top for quick access */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Publish</h2>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)} className="input-luxury">
                  <option value="active">✅ Active — visible to customers</option>
                  <option value="draft">📝 Draft — hidden from store</option>
                  <option value="out_of_stock">❌ Out of Stock</option>
                </select>
              </div>
              <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving}
                className="w-full btn-primary py-3.5 gap-2 text-sm font-semibold">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> {isEdit ? 'Save Changes' : '🚀 Publish Product'}</>}
              </motion.button>
            </div>

            {/* ② Featured Image */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Featured Image *</h2>
              <ImageUploader label="" value={form.featuredImage}
                onChange={(url) => set('featuredImage', url)} folder="products/featured" />
              {form.featuredImage && (
                <p className="font-sans text-[10px] text-emerald-600 mt-2 flex items-center gap-1">
                  <Check size={10} /> Used as OG image if no custom OG image set
                </p>
              )}
            </div>

            {/* ③ Product Labels — moved up, more important than gallery */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Product Labels</h2>
              <div className="space-y-3">
                {([
                  { key: 'featured',   label: 'Featured',    desc: 'Show in homepage featured section' },
                  { key: 'newArrival', label: 'New Arrival', desc: 'Show in new arrivals section' },
                  { key: 'bestSeller', label: 'Best Seller', desc: 'Show in best sellers section' },
                  { key: 'trending',   label: 'Trending',    desc: 'Show in trending section' },
                ] as const).map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => set(key, !form[key])}
                      className={cn('w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer shrink-0',
                        form[key] ? 'bg-gradient-luxury' : 'bg-[var(--border-strong)]')}>
                      <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                        form[key] ? 'translate-x-5' : 'translate-x-0.5')} />
                    </div>
                    <div>
                      <p className="font-sans text-sm font-medium text-[var(--text-primary)]">{label}</p>
                      <p className="font-sans text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* ④ Product Gallery */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Product Gallery</h2>
              <GalleryUploader images={form.images} onChange={(imgs) => set('images', imgs)} />
            </div>

            {/* ⑤ Badge Suggestions */}
            <BadgeSuggestionsPanel form={form} onChange={(badges) => set('badges', badges)} />

            {/* ⑥ SEO Score */}
            <SeoScorePanel form={form} />

            {/* ⑦ Live Previews — Google + Social in one tabbed card */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] overflow-hidden">
              <div className="flex border-b border-[var(--border)]">
                <button type="button" onClick={() => setPreviewTab('google')}
                  className={cn('flex-1 py-2.5 font-sans text-xs font-semibold transition-colors',
                    previewTab === 'google'
                      ? 'bg-[var(--bg-muted)] text-[var(--text-primary)] border-b-2 border-[var(--color-rose)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')}>
                  🔍 Google
                </button>
                <button type="button" onClick={() => setPreviewTab('social')}
                  className={cn('flex-1 py-2.5 font-sans text-xs font-semibold transition-colors',
                    previewTab === 'social'
                      ? 'bg-[var(--bg-muted)] text-[var(--text-primary)] border-b-2 border-[var(--color-rose)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')}>
                  📱 Social
                </button>
              </div>
              <div className="p-4">
                {previewTab === 'google'
                  ? <GoogleSearchPreview form={form} />
                  : <SocialSharePreview form={form} />}
              </div>
            </div>

          </div>
        </div>
      </form>
    </motion.div>
  )
}
