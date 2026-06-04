// src/admin/pages/Settings.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  Globe,
  CreditCard,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { getDeliverySettings, updateDeliverySettings } from '@/firebase/settings'
import { getGeneralSettings, updateGeneralSettings, getAISettings, updateAISettings } from '@/firebase/content'
import type { GeneralSettings, AISettings } from '@/types'
import type { DeliverySettings } from '@/firebase/settings'
import { formatPrice } from '@/utils/formatters'
import { useToast } from '@/components/shared/Toast'
import { cn } from '@/utils/cn'

// ── Tab definition ─────────────────────────────────────────
type Tab = 'delivery' | 'general' | 'payment' | 'ai'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'general', label: 'General', icon: Globe },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'ai', label: 'AI / Zyntra', icon: Sparkles },
]

// ── Delivery Settings Tab ──────────────────────────────────
const DELIVERY_DEFAULTS: DeliverySettings = {
  insideDhaka: 60,
  outsideDhaka: 120,
  freeShippingThreshold: 2000,
}

function DeliveryTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'settings', 'delivery'],
    queryFn: getDeliverySettings,
    placeholderData: DELIVERY_DEFAULTS,
  })

  const [form, setForm] = useState({
    insideDhaka: String(DELIVERY_DEFAULTS.insideDhaka),
    outsideDhaka: String(DELIVERY_DEFAULTS.outsideDhaka),
    freeShippingThreshold: String(DELIVERY_DEFAULTS.freeShippingThreshold),
  })

  useEffect(() => {
    if (data) {
      setForm({
        insideDhaka: String(data.insideDhaka),
        outsideDhaka: String(data.outsideDhaka),
        freeShippingThreshold: String(data.freeShippingThreshold),
      })
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: Partial<DeliverySettings>) => updateDeliverySettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'delivery'] })
      toast('Delivery settings saved successfully!', 'success')
    },
    onError: () => toast('Failed to save delivery settings. Please try again.', 'error'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      insideDhaka: Number(form.insideDhaka) || 0,
      outsideDhaka: Number(form.outsideDhaka) || 0,
      freeShippingThreshold: Number(form.freeShippingThreshold) || 0,
    })
  }

  const set = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const threshold = Number(form.freeShippingThreshold) || 0
  const insideDhaka = Number(form.insideDhaka) || 0
  const outsideDhaka = Number(form.outsideDhaka) || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={26} className="animate-spin text-[var(--color-rose)]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <AlertTriangle size={26} className="text-amber-500" />
        <p className="font-sans text-sm text-[var(--text-secondary)]">Failed to load delivery settings</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Charge fields */}
      <div
        className="rounded-luxury-lg border border-[var(--border)] p-6 space-y-5"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <h3 className="font-serif text-base font-semibold text-[var(--text-primary)]">
          Delivery Charges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Inside Dhaka (৳)
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.insideDhaka}
              onChange={(e) => set('insideDhaka', e.target.value)}
              className="input-luxury w-full"
              placeholder="60"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Outside Dhaka (৳)
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.outsideDhaka}
              onChange={(e) => set('outsideDhaka', e.target.value)}
              className="input-luxury w-full"
              placeholder="120"
            />
          </div>
        </div>

        <div>
          <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Free Shipping Threshold (৳)
            <span className="font-sans text-xs text-[var(--text-muted)] ml-2">
              — Set to 0 to disable free shipping
            </span>
          </label>
          <input
            type="number"
            required
            min="0"
            value={form.freeShippingThreshold}
            onChange={(e) => set('freeShippingThreshold', e.target.value)}
            className="input-luxury w-full"
            placeholder="2000"
          />
        </div>
      </div>

      {/* Live preview */}
      <div
        className="rounded-luxury-lg border border-[var(--color-gold)]/30 p-5 space-y-3"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-[var(--color-gold)]" />
          <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">Live Preview</p>
        </div>
        <div className="space-y-2 font-sans text-sm text-[var(--text-secondary)]">
          <p>
            🏙️ Customers in <strong>Dhaka</strong> pay{' '}
            <strong className="text-[var(--color-gold)]">{formatPrice(insideDhaka)}</strong> delivery.
          </p>
          <p>
            🗺️ Customers <strong>outside Dhaka</strong> pay{' '}
            <strong className="text-[var(--color-gold)]">{formatPrice(outsideDhaka)}</strong> delivery.
          </p>
          {threshold > 0 ? (
            <p>
              🎁 Orders above{' '}
              <strong className="text-emerald-600">{formatPrice(threshold)}</strong> get{' '}
              <strong className="text-emerald-600">free shipping</strong>.
            </p>
          ) : (
            <p className="text-[var(--text-muted)]">🚫 Free shipping is currently disabled.</p>
          )}
        </div>
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary flex items-center gap-2"
      >
        {mutation.isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save size={15} />
            Save Delivery Settings
          </>
        )}
      </button>
    </form>
  )
}

// ── General Settings Tab ───────────────────────────────────
const GENERAL_DEFAULTS: Partial<GeneralSettings> = {
  siteName: 'PUSPALOY',
  tagline: '',
  phone: '',
  whatsappNumber: '',
  messengerPageId: '',
  email: '',
  address: '',
  socialLinks: { facebook: '', instagram: '', tiktok: '' },
}

function GeneralTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'settings', 'general'],
    queryFn: getGeneralSettings,
  })

  const [form, setForm] = useState({
    siteName: '',
    tagline: '',
    phone: '',
    whatsappNumber: '',
    messengerPageId: '',
    email: '',
    address: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
  })

  useEffect(() => {
    if (data) {
      setForm({
        siteName: data.siteName ?? '',
        tagline: data.tagline ?? '',
        phone: data.phone ?? '',
        whatsappNumber: data.whatsappNumber ?? '',
        messengerPageId: data.messengerPageId ?? '',
        email: data.email ?? '',
        address: data.address ?? '',
        facebookUrl: data.socialLinks?.facebook ?? '',
        instagramUrl: data.socialLinks?.instagram ?? '',
        tiktokUrl: data.socialLinks?.tiktok ?? '',
      })
    } else if (!isLoading) {
      // no document yet — use defaults
      setForm((prev) => ({
        ...prev,
        siteName: GENERAL_DEFAULTS.siteName ?? '',
      }))
    }
  }, [data, isLoading])

  const mutation = useMutation({
    mutationFn: (payload: Partial<GeneralSettings>) => updateGeneralSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'general'] })
      toast('General settings saved successfully!', 'success')
    },
    onError: () => toast('Failed to save general settings. Please try again.', 'error'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      siteName: form.siteName,
      tagline: form.tagline,
      phone: form.phone,
      whatsappNumber: form.whatsappNumber,
      messengerPageId: form.messengerPageId,
      email: form.email,
      address: form.address,
      socialLinks: {
        facebook: form.facebookUrl,
        instagram: form.instagramUrl,
        tiktok: form.tiktokUrl,
      },
    })
  }

  const set = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={26} className="animate-spin text-[var(--color-rose)]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <AlertTriangle size={26} className="text-amber-500" />
        <p className="font-sans text-sm text-[var(--text-secondary)]">Failed to load general settings</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Brand */}
      <div
        className="rounded-luxury-lg border border-[var(--border)] p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <h3 className="font-serif text-base font-semibold text-[var(--text-primary)]">Brand</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Site Name <span className="text-[var(--color-rose)]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.siteName}
              onChange={(e) => set('siteName', e.target.value)}
              className="input-luxury w-full"
              placeholder="PUSPALOY"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              className="input-luxury w-full"
              placeholder="Luxury for every woman"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div
        className="rounded-luxury-lg border border-[var(--border)] p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <h3 className="font-serif text-base font-semibold text-[var(--text-primary)]">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="input-luxury w-full"
              placeholder="+880 1700-000000"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={form.whatsappNumber}
              onChange={(e) => set('whatsappNumber', e.target.value)}
              className="input-luxury w-full"
              placeholder="8801700000000"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Messenger Page ID
            </label>
            <input
              type="text"
              value={form.messengerPageId}
              onChange={(e) => set('messengerPageId', e.target.value)}
              className="input-luxury w-full"
              placeholder="puspaloy"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="input-luxury w-full"
              placeholder="hello@puspaloy.com"
            />
          </div>
        </div>
        <div>
          <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Address
          </label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            className="input-luxury w-full resize-none"
            placeholder="Dhaka, Bangladesh"
          />
        </div>
      </div>

      {/* Social */}
      <div
        className="rounded-luxury-lg border border-[var(--border)] p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <h3 className="font-serif text-base font-semibold text-[var(--text-primary)]">Social Links</h3>
        <div className="space-y-3">
          {[
            { key: 'facebookUrl' as const, label: 'Facebook URL', placeholder: 'https://facebook.com/puspaloy' },
            { key: 'instagramUrl' as const, label: 'Instagram URL', placeholder: 'https://instagram.com/puspaloy' },
            { key: 'tiktokUrl' as const, label: 'TikTok URL', placeholder: 'https://tiktok.com/@puspaloy' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {label}
              </label>
              <input
                type="url"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className="input-luxury w-full"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary flex items-center gap-2"
      >
        {mutation.isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save size={15} />
            Save General Settings
          </>
        )}
      </button>
    </form>
  )
}

// ── Payment Methods Tab ────────────────────────────────────
function PaymentTab() {
  return (
    <div className="space-y-5 max-w-2xl">
      {/* Info banner */}
      <div
        className="flex items-start gap-3 px-5 py-4 rounded-luxury-lg border border-blue-200/60 bg-blue-50"
      >
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="font-sans text-sm text-blue-700">
          Mobile payment integration will be added in a future release. Currently only Cash on Delivery is available.
        </p>
      </div>

      {/* COD card — enabled */}
      <div
        className="rounded-luxury-lg border-2 border-[var(--color-gold)]/40 p-5 flex items-start gap-4"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle size={20} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-serif text-base font-semibold text-[var(--text-primary)]">
              Cash on Delivery (COD)
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle size={11} />
              Enabled
            </span>
          </div>
          <p className="font-sans text-sm text-[var(--text-secondary)] mt-1">
            Customers pay in cash upon delivery. No payment gateway fees.
          </p>
        </div>
      </div>

      {/* Bkash — coming soon */}
      <div
        className="rounded-luxury-lg border border-[var(--border)] p-5 flex items-start gap-4 opacity-60"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center shrink-0">
          <Lock size={18} className="text-[var(--text-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-serif text-base font-semibold text-[var(--text-primary)]">bKash</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-slate-100 text-slate-500 border border-slate-200">
              Coming Soon
            </span>
          </div>
          <p className="font-sans text-sm text-[var(--text-secondary)] mt-1">
            Mobile financial service — integration planned for a future release.
          </p>
        </div>
      </div>

      {/* Nagad — coming soon */}
      <div
        className="rounded-luxury-lg border border-[var(--border)] p-5 flex items-start gap-4 opacity-60"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center shrink-0">
          <Lock size={18} className="text-[var(--text-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-serif text-base font-semibold text-[var(--text-primary)]">Nagad</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-slate-100 text-slate-500 border border-slate-200">
              Coming Soon
            </span>
          </div>
          <p className="font-sans text-sm text-[var(--text-secondary)] mt-1">
            Bangladesh Post Office digital financial service — integration planned for a future release.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── AI / Zyntra Settings Tab ─────────────────────────────
const AI_MODELS = [
  { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
  { value: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
  { value: 'anthropic/claude-haiku', label: 'Claude Haiku' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
]

function AITab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings', 'ai'],
    queryFn: getAISettings,
  })

  const defaults: Partial<AISettings> = {
    model: 'google/gemini-2.0-flash-exp:free',
    maxMessagesPerSession: 20,
    systemPromptAddition: '',
    enabled: true,
  }

  const [form, setForm] = useState({
    enabled: true,
    model: defaults.model!,
    maxMessagesPerSession: String(defaults.maxMessagesPerSession),
    systemPromptAddition: '',
  })

  useEffect(() => {
    if (data) {
      setForm({
        enabled: data.enabled ?? true,
        model: data.model ?? defaults.model!,
        maxMessagesPerSession: String(data.maxMessagesPerSession ?? 20),
        systemPromptAddition: data.systemPromptAddition ?? '',
      })
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: Partial<AISettings>) => updateAISettings(payload as object),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'ai'] })
      toast('AI settings saved!', 'success')
    },
    onError: () => toast('Failed to save AI settings', 'error'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      enabled: form.enabled,
      model: form.model,
      maxMessagesPerSession: Number(form.maxMessagesPerSession) || 20,
      systemPromptAddition: form.systemPromptAddition.trim(),
    })
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--color-rose)]" /></div>

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* API Key notice */}
      <div className="rounded-luxury-lg border border-blue-200/60 bg-blue-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-blue-500 shrink-0" />
          <p className="font-sans text-sm font-semibold text-blue-700">API Key Security</p>
        </div>
        <p className="font-sans text-sm text-blue-700 leading-relaxed">
          The OpenRouter API key is <strong>never stored in source code</strong>. It lives in your
          Netlify environment variables (Netlify Dashboard → Site settings → Environment variables).
        </p>
        <p className="font-sans text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
          Variable name: OPENROUTER_API_KEY
        </p>
      </div>

      {/* Enable/Disable */}
      <div className="rounded-luxury-lg border border-[var(--border)] p-5 space-y-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <h3 className="font-serif text-base font-semibold text-[var(--text-primary)]">Zyntra AI Assistant</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className={cn(
              'w-12 h-6 rounded-full relative cursor-pointer transition-colors',
              form.enabled ? 'bg-gradient-luxury' : 'bg-[var(--border)]'
            )}
          >
            <div className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
              form.enabled ? 'translate-x-7' : 'translate-x-1'
            )} />
          </div>
          <div>
            <p className="font-sans text-sm font-medium text-[var(--text-primary)]">
              {form.enabled ? 'Zyntra is Active' : 'Zyntra is Disabled'}
            </p>
            <p className="font-sans text-xs text-[var(--text-muted)]">
              {form.enabled ? 'Customers can use the AI assistant' : 'The chat widget will show a disabled message'}
            </p>
          </div>
        </label>
      </div>

      {/* Model + Limits */}
      <div className="rounded-luxury-lg border border-[var(--border)] p-5 space-y-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <h3 className="font-serif text-base font-semibold text-[var(--text-primary)]">Model Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">AI Model</label>
            <select
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="input-luxury w-full"
            >
              {AI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Max messages per session
            </label>
            <input
              type="number" min="5" max="100"
              value={form.maxMessagesPerSession}
              onChange={(e) => setForm((f) => ({ ...f, maxMessagesPerSession: e.target.value }))}
              className="input-luxury w-full"
            />
          </div>
        </div>
      </div>

      {/* Custom system prompt */}
      <div className="rounded-luxury-lg border border-[var(--border)] p-5 space-y-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div>
          <h3 className="font-serif text-base font-semibold text-[var(--text-primary)]">Custom Instructions</h3>
          <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
            These instructions are appended to the Zyntra system prompt. Use to add seasonal promotions, special policies, etc.
          </p>
        </div>
        <textarea
          rows={4}
          value={form.systemPromptAddition}
          onChange={(e) => setForm((f) => ({ ...f, systemPromptAddition: e.target.value }))}
          className="input-luxury w-full resize-none font-mono text-sm"
          placeholder="e.g. During Eid, offer a 10% discount code EIDMUBARAK on orders above ৳1500."
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary flex items-center gap-2"
      >
        {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save AI Settings
      </button>
    </form>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function Settings() {

  const [activeTab, setActiveTab] = useState<Tab>('delivery')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <p className="font-sans text-sm text-[var(--text-secondary)] mt-0.5">
          Manage store configuration — super admin only
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-luxury-lg border border-[var(--border)] w-fit"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-luxury font-sans text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'text-white shadow-gold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {activeTab === id && (
              <motion.div
                layoutId="settings-tab-bg"
                className="absolute inset-0 bg-gradient-luxury rounded-luxury"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={15} />
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'delivery' && <DeliveryTab />}
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'payment' && <PaymentTab />}
          {activeTab === 'ai' && <AITab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
