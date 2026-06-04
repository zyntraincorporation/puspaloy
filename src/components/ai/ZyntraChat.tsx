// src/components/ai/ZyntraChat.tsx
// Complete Zyntra AI chat — optimized for instant open, live product data
// API key is NEVER in this file — all calls go through Netlify Function proxy

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  X, Sparkles, Send, RefreshCw, ShoppingBag,
  ChevronRight, Star, Loader2, AlertCircle, MessageCircle,
} from 'lucide-react'
import { useZyntraStore } from '@/store/zyntraStore'
import {
  fetchProductCatalogForAI,
  fetchStoreInfoForAI,
  fetchAISettings,
  buildSystemPrompt,
  searchProductsLocally,
} from '@/firebase/zyntra'
import { slideInBottom } from '@/lib/animations'
import type { ZyntraMessage, ProductLite } from '@/types'
import { getEffectivePrice } from '@/utils/formatters'

// ── Constants ────────────────────────────────────────────
const WHATSAPP_NUMBER = '8801883172754'
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`
const WHATSAPP_SUPPORT = `${WHATSAPP_BASE}?text=${encodeURIComponent('Hello PUSPALOY! I need help.')}`

// ── Background context cache (loaded once per app session) ─
// Pre-loads BEFORE the chat is opened so there's zero wait time
interface ContextCache {
  products: ProductLite[]
  systemPrompt: string
  model: string
  aiEnabled: boolean
  loadedAt: number
}

let contextCache: ContextCache | null = null
let contextLoadPromise: Promise<ContextCache> | null = null

async function loadContext(): Promise<ContextCache> {
  // If already cached within last 10 minutes, return instantly
  if (contextCache && Date.now() - contextCache.loadedAt < 10 * 60 * 1000) {
    return contextCache
  }
  // If already loading, wait for it
  if (contextLoadPromise) return contextLoadPromise

  contextLoadPromise = (async () => {
    try {
      const [products, storeInfo, aiSettings] = await Promise.all([
        fetchProductCatalogForAI(),
        fetchStoreInfoForAI(),
        fetchAISettings(),
      ])
      const result: ContextCache = {
        products,
        systemPrompt: aiSettings.enabled
          ? buildSystemPrompt(products, storeInfo, aiSettings.systemPromptAddition)
          : '',
        model: aiSettings.model,
        aiEnabled: aiSettings.enabled,
        loadedAt: Date.now(),
      }
      contextCache = result
      return result
    } finally {
      contextLoadPromise = null
    }
  })()

  return contextLoadPromise
}

// ── API Caller (calls Netlify Function — key stays server-side) ─
async function callZyntraAPI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemContext: string,
  model: string
): Promise<string> {
  // PRODUCTION: Netlify Function proxy (API key hidden server-side)
  // DEV: Vite proxies /.netlify/functions → localhost:8888 via vite.config.ts

  const endpoint = '/.netlify/functions/zyntra-chat'
  const payload = { messages, systemContext, model }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      const msg = errBody?.error ?? `HTTP ${res.status}`
      throw new Error(String(msg))
    }
    
    const data = await res.json()
    return data.reply as string
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('HTTP')) {
      throw err
    }
    throw new Error('AI service unavailable. Please check your connection or contact support.')
  }
}

// ── Inline Product Card ───────────────────────────────────
function InlineProductCard({ product }: { product: ProductLite }) {
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice, product.flashSalePrice)
  const hasDiscount = effectivePrice < product.price
  const isOOS = product.stock === 0

  return (
    <Link
      to={`/product/${product.slug}`}
      className="flex items-center gap-3 p-3 rounded-luxury border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--color-rose)]/50 hover:bg-rose-50 transition-all duration-200 group"
    >
      <div className="relative shrink-0">
        <img
          src={product.featuredImage}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg' }}
        />
        {isOOS && (
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">OUT</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="font-sans text-sm font-bold text-[var(--color-rose)]">
            ৳{effectivePrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="font-sans text-[10px] text-[var(--text-muted)] line-through">
              ৳{product.price.toLocaleString()}
            </span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Star size={9} className="text-amber-400 fill-amber-400" />
            <span className="font-sans text-[10px] text-[var(--text-muted)]">
              {product.avgRating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}
      </div>
      <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--color-rose)] shrink-0 transition-colors" />
    </Link>
  )
}

// ── Typing Indicator ─────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-luxury flex items-center justify-center shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-luxury-lg rounded-bl-sm bg-[var(--bg-muted)] border border-[var(--border)]">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────
function MessageBubble({ message }: { message: ZyntraMessage }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-luxury flex items-center justify-center shrink-0 mb-0.5">
          <Sparkles size={13} className="text-white" />
        </div>
      )}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-luxury-lg text-sm font-sans leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-gradient-luxury text-white rounded-br-sm'
              : 'bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        {message.products && message.products.length > 0 && !isUser && (
          <div className="space-y-2 w-full">
            {message.products.map((p) => (
              <InlineProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── WhatsApp CTA (shown on error or manually) ─────────────
function WhatsAppCTA({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={WHATSAPP_SUPPORT}
      target="_blank"
      rel="noopener noreferrer"
      className={
        compact
          ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white font-sans text-xs font-semibold hover:bg-[#1ebe5c] transition-colors'
          : 'flex items-center justify-center gap-2 w-full py-2.5 rounded-luxury bg-[#25D366] text-white font-sans text-sm font-semibold hover:bg-[#1ebe5c] transition-colors mt-2'
      }
    >
      <MessageCircle size={compact ? 12 : 15} />
      {compact ? 'WhatsApp' : `Chat on WhatsApp (+${WHATSAPP_NUMBER.slice(2)})`}
    </a>
  )
}

// ── Quick Suggestions ─────────────────────────────────────
const SUGGESTIONS = [
  'Best cosmetics under ৳500?',
  'Show me trending products',
  'Gift ideas for my mother',
  'Delivery charge to Chittagong?',
  'আমার জন্য ভালো লিপস্টিক আছে?',
  'What are your best sellers?',
]

// ── Main Component ────────────────────────────────────────
export default function ZyntraChat() {
  const { isOpen, closeChat, messages, addMessage, isLoading, setLoading, clearChat } = useZyntraStore()

  const [input, setInput] = useState('')
  const [initError, setInitError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [contextReady, setContextReady] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)

  // Live refs — updated by context loader
  const productsRef = useRef<ProductLite[]>([])
  const systemPromptRef = useRef<string>('')
  const modelRef = useRef('google/gemini-2.0-flash-exp:free')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── 1. Pre-load context in background on app mount ──────
  // This is called ONCE when the module loads so data is ready
  // by the time the user clicks the chat button.
  useEffect(() => {
    // Start loading silently in the background
    loadContext()
      .then((ctx) => {
        productsRef.current = ctx.products
        systemPromptRef.current = ctx.systemPrompt
        modelRef.current = ctx.model
        setAiEnabled(ctx.aiEnabled)
        setContextReady(true)
      })
      .catch((err) => {
        console.warn('[Zyntra] Background load failed:', err)
        // Non-fatal — will retry when chat opens
      })
  }, [])

  // ── 2. When chat opens: check ready, send welcome, focus ─
  useEffect(() => {
    if (!isOpen) return

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 300)

    // If context isn't ready yet (slow network), load now with spinner
    if (!contextReady) {
      setLoading(true)
      loadContext()
        .then((ctx) => {
          productsRef.current = ctx.products
          systemPromptRef.current = ctx.systemPrompt
          modelRef.current = ctx.model
          setAiEnabled(ctx.aiEnabled)
          setContextReady(true)
          setInitError(null)
          sendWelcome(ctx.products.length)
        })
        .catch((err) => {
          setInitError('Failed to load product catalog. You can still chat or use WhatsApp.')
          setContextReady(true) // allow chat even without products
          console.error('[Zyntra] Open-time load error:', err)
        })
        .finally(() => setLoading(false))
    } else if (messages.length === 0) {
      sendWelcome(productsRef.current.length)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendWelcome = (productCount: number) => {
    if (messages.length === 0) {
      addMessage({
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: productCount > 0
          ? `আস্সালামু আলাইকুম! ✨ I'm **Zyntra**, your PUSPALOY shopping assistant.\n\nI have live access to **${productCount} products** with real-time prices and stock info. How can I help you today? 💝`
          : `আস্সালামু আলাইকুম! ✨ I'm **Zyntra**, your PUSPALOY shopping assistant.\n\nHow can I help you find the perfect product today? 💝`,
        timestamp: new Date(),
      })
    }
  }

  // ── Send message ──────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setInput('')
    setSendError(null)

    const userMsg: ZyntraMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setLoading(true)

    try {
      const conversationHistory = messages
        .concat(userMsg)
        .filter((m) => !m.isOrder)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const reply = await callZyntraAPI(
        conversationHistory,
        systemPromptRef.current,
        modelRef.current
      )

      // Attach relevant product cards based on query
      const isProductQuery = /product|item|show|recommend|suggest|buy|price|stock|cosmetic|shoe|gift|lipstick|cream|perfume|কিনতে|দেখাও|প্রোডাক্ট|আছে|চাই/i.test(trimmed)
      const mentionedProducts = isProductQuery
        ? searchProductsLocally(productsRef.current, trimmed, 3)
        : []

      addMessage({
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        products: mentionedProducts.length > 0 ? mentionedProducts : undefined,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setSendError(msg)
      // Add error message with WhatsApp fallback built-in
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I'm having trouble connecting right now. 😔\n\nPlease try again, or reach us directly on WhatsApp — we're always happy to help! 💬`,
        timestamp: new Date(),
        isOrder: true, // flag to signal special rendering (we'll use it for WA banner)
      })
    } finally {
      setLoading(false)
    }
  }, [isLoading, messages, addMessage, setLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    clearChat()
    setContextReady(false)
    setSendError(null)
    setInitError(null)
    // Force a fresh load next time
    contextCache = null
    // Immediate re-init
    loadContext()
      .then((ctx) => {
        productsRef.current = ctx.products
        systemPromptRef.current = ctx.systemPrompt
        modelRef.current = ctx.model
        setAiEnabled(ctx.aiEnabled)
        setContextReady(true)
      })
      .catch(console.warn)
  }

  const canSend = contextReady && !isLoading && aiEnabled

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="zyntra-chat"
          variants={slideInBottom}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 flex flex-col rounded-luxury-xl shadow-luxury-lg overflow-hidden border border-[var(--border)]"
          style={{
            width: 'min(calc(100vw - 2rem), 380px)',
            height: 'min(72vh, 600px)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {/* ── Header ──────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-luxury shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-bold text-white text-sm leading-tight">Zyntra ✨</p>
              <p className="font-sans text-xs text-white/70 leading-tight">
                {contextReady && productsRef.current.length > 0
                  ? `${productsRef.current.length} products • Live data`
                  : 'PUSPALOY AI Assistant'}
              </p>
            </div>

            {/* WhatsApp button in header */}
            <a
              href={WHATSAPP_SUPPORT}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#1ebe5c] transition-colors shrink-0"
              aria-label="WhatsApp support"
            >
              <MessageCircle size={13} className="text-white" />
            </a>

            <button
              onClick={handleReset}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear chat"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={closeChat}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Messages ────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4">

            {/* AI Disabled */}
            {!aiEnabled && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-6">
                <AlertCircle size={32} className="text-amber-400" />
                <p className="font-serif text-base text-[var(--text-primary)]">AI Assistant Disabled</p>
                <p className="font-sans text-sm text-[var(--text-secondary)]">
                  Contact us directly on WhatsApp — we'll be happy to help!
                </p>
                <WhatsAppCTA />
              </div>
            )}

            {/* Init error (non-fatal) */}
            {initError && aiEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 px-3 py-2.5 mb-3 rounded-luxury bg-amber-50 border border-amber-200"
              >
                <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-amber-700">{initError}</p>
              </motion.div>
            )}

            {/* Messages */}
            {aiEnabled && messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble message={msg} />
                {/* Show WhatsApp CTA after error messages */}
                {msg.isOrder && msg.role === 'assistant' && (
                  <div className="ml-9 mb-3">
                    <WhatsAppCTA />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            {/* Send error banner with WhatsApp fallback */}
            {sendError && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2.5 mb-3 rounded-luxury bg-red-50 border border-red-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={13} className="text-red-500 shrink-0" />
                  <p className="font-sans text-xs text-red-600 font-medium">AI error — reach us on WhatsApp:</p>
                </div>
                <WhatsAppCTA compact />
              </motion.div>
            )}

            {/* Loading context spinner (only if context not pre-loaded) */}
            {!contextReady && !isLoading && aiEnabled && (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 size={18} className="animate-spin text-[var(--color-rose)]" />
                <span className="font-sans text-sm text-[var(--text-secondary)]">Loading product catalog…</span>
              </div>
            )}

            {/* Quick suggestions (shown when first message only) */}
            {aiEnabled && contextReady && messages.length <= 1 && !isLoading && (
              <div className="mt-2">
                <p className="font-sans text-xs text-[var(--text-muted)] mb-2 text-center">
                  Quick questions:
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--color-rose)] hover:bg-rose-50 transition-all duration-200 font-sans text-xs text-[var(--text-secondary)] hover:text-[var(--color-rose)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ───────────────────────────────────── */}
          {aiEnabled && (
            <div className="shrink-0 px-3 py-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={canSend ? 'Ask about products, prices, delivery…' : 'Loading…'}
                  rows={1}
                  disabled={!canSend}
                  className="flex-1 resize-none rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5 font-sans text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-rose)] transition-colors max-h-28 min-h-[40px] disabled:opacity-50"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || !canSend}
                  className="w-10 h-10 rounded-full bg-gradient-luxury text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>

              {/* Footer row: browse link + WhatsApp */}
              <div className="flex items-center justify-between mt-2">
                <Link
                  to="/category/cosmetics"
                  className="flex items-center gap-1 font-sans text-[11px] text-[var(--text-muted)] hover:text-[var(--color-rose)] transition-colors"
                >
                  <ShoppingBag size={10} />
                  Browse catalog
                </Link>
                <a
                  href={WHATSAPP_SUPPORT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-sans text-[11px] text-[#25D366] hover:text-[#1ebe5c] font-medium transition-colors"
                >
                  <MessageCircle size={10} />
                  WhatsApp us
                </a>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
