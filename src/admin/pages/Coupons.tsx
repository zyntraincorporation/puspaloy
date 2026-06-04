// src/admin/pages/Coupons.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Ticket, Plus, Copy, Edit2, Trash2, Check, X, Loader2, AlertTriangle } from 'lucide-react'
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/firebase/coupons'
import type { Coupon, CouponType } from '@/types'
import { formatPrice, formatDate } from '@/utils/formatters'
import { useToast } from '@/components/shared/Toast'
import { cn } from '@/utils/cn'
import { Timestamp } from 'firebase/firestore'

// ── Types ─────────────────────────────────────────────────
interface CouponFormData {
  code: string
  type: CouponType
  value: string
  minOrderAmount: string
  maxUses: string
  expiresAt: string
  active: boolean
}

const DEFAULT_FORM: CouponFormData = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '0',
  maxUses: '',
  expiresAt: '',
  active: true,
}

// ── Helpers ───────────────────────────────────────────────
function formatCouponValue(coupon: Coupon): string {
  return coupon.type === 'percentage'
    ? `${coupon.value}%`
    : formatPrice(coupon.value)
}

function isCouponExpired(coupon: Coupon): boolean {
  if (!coupon.expiresAt) return false
  return coupon.expiresAt.toDate() < new Date()
}

function isCouponExhausted(coupon: Coupon): boolean {
  if (coupon.maxUses === null) return false
  return coupon.usedCount >= coupon.maxUses
}

function getCouponStatus(coupon: Coupon): 'active' | 'expired' | 'exhausted' | 'inactive' {
  if (!coupon.active) return 'inactive'
  if (isCouponExpired(coupon)) return 'expired'
  if (isCouponExhausted(coupon)) return 'exhausted'
  return 'active'
}

function toInputDate(ts: Timestamp | null): string {
  if (!ts) return ''
  const d = ts.toDate()
  // format as YYYY-MM-DD for date input
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Sub-components ─────────────────────────────────────────
const StatusBadge = ({ coupon }: { coupon: Coupon }) => {
  const status = getCouponStatus(coupon)
  const styles = {
    active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    expired: 'bg-amber-100 text-amber-700 border border-amber-200',
    exhausted: 'bg-slate-100 text-slate-600 border border-slate-200',
    inactive: 'bg-red-50 text-red-600 border border-red-200',
  }
  const labels = {
    active: 'Active',
    expired: 'Expired',
    exhausted: 'Exhausted',
    inactive: 'Inactive',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium', styles[status])}>
      {labels[status]}
    </span>
  )
}

const TypeBadge = ({ type }: { type: CouponType }) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium',
      type === 'percentage'
        ? 'bg-purple-100 text-purple-700 border border-purple-200'
        : 'bg-blue-100 text-blue-700 border border-blue-200'
    )}
  >
    {type === 'percentage' ? 'Percentage' : 'Fixed'}
  </span>
)

// ── Modal Form ─────────────────────────────────────────────
interface CouponModalProps {
  open: boolean
  coupon: Coupon | null
  onClose: () => void
  onSave: (data: CouponFormData) => void
  isSaving: boolean
}

function CouponModal({ open, coupon, onClose, onSave, isSaving }: CouponModalProps) {
  const [form, setForm] = useState<CouponFormData>(DEFAULT_FORM)

  useEffect(() => {
    if (coupon) {
      setForm({
        code: coupon.code,
        type: coupon.type,
        value: String(coupon.value),
        minOrderAmount: String(coupon.minOrderAmount),
        maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : '',
        expiresAt: toInputDate(coupon.expiresAt),
        active: coupon.active,
      })
    } else {
      setForm(DEFAULT_FORM)
    }
  }, [coupon, open])

  const set = <K extends keyof CouponFormData>(key: K, val: CouponFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-lg rounded-luxury-lg border border-[var(--border)] shadow-luxury overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-luxury flex items-center justify-center">
                <Ticket size={15} className="text-white" />
              </div>
              <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                {coupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Code */}
            <div>
              <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Coupon Code <span className="text-[var(--color-rose)]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="e.g. WELCOME20"
                className="input-luxury w-full font-mono uppercase tracking-wider"
                disabled={!!coupon} // can't edit existing code
              />
              {coupon && (
                <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
                  Coupon codes cannot be changed after creation.
                </p>
              )}
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Discount Type <span className="text-[var(--color-rose)]">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as CouponType)}
                  className="input-luxury w-full"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  {form.type === 'percentage' ? 'Percentage (%)' : 'Amount (৳)'}{' '}
                  <span className="text-[var(--color-rose)]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  placeholder={form.type === 'percentage' ? '20' : '50'}
                  className="input-luxury w-full"
                />
              </div>
            </div>

            {/* Min order + max uses */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Min Order Amount (৳) <span className="text-[var(--color-rose)]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.minOrderAmount}
                  onChange={(e) => set('minOrderAmount', e.target.value)}
                  placeholder="0"
                  className="input-luxury w-full"
                />
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Max Uses
                  <span className="font-sans text-xs text-[var(--text-muted)] ml-1">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => set('maxUses', e.target.value)}
                  placeholder="Unlimited"
                  className="input-luxury w-full"
                />
              </div>
            </div>

            {/* Expiry date */}
            <div>
              <label className="block font-sans text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Expiry Date
                <span className="font-sans text-xs text-[var(--text-muted)] ml-1">(optional)</span>
              </label>
              <input
                type="date"
                value={form.expiresAt}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('expiresAt', e.target.value)}
                className="input-luxury w-full"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-sans text-sm font-medium text-[var(--text-secondary)]">Active</p>
                <p className="font-sans text-xs text-[var(--text-muted)]">Inactive coupons cannot be applied</p>
              </div>
              <button
                type="button"
                onClick={() => set('active', !form.active)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
                  form.active ? 'bg-gradient-luxury' : 'bg-[var(--bg-muted)]'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                    form.active ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>{coupon ? 'Update Coupon' : 'Create Coupon'}</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Delete Confirm ─────────────────────────────────────────
interface DeleteConfirmProps {
  coupon: Coupon | null
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteConfirm({ coupon, onClose, onConfirm, isDeleting }: DeleteConfirmProps) {
  if (!coupon) return null

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm rounded-luxury-lg border border-[var(--border)] shadow-luxury p-6 text-center"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-1.5">
            Delete Coupon?
          </h3>
          <p className="font-sans text-sm text-[var(--text-secondary)] mb-5">
            You are about to permanently delete{' '}
            <span className="font-mono font-bold text-[var(--color-rose)]">{coupon.code}</span>. This action
            cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={isDeleting}>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-luxury bg-red-600 text-white font-sans text-sm font-medium hover:bg-red-700 transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function Coupons() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Data ─────────────────────────────────────────────────
  const {
    data: coupons = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: getAllCoupons,
  })

  // ── Mutations ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createCoupon>[0]) => createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      toast('Coupon created successfully!', 'success')
      setModalOpen(false)
    },
    onError: () => toast('Failed to create coupon. Please try again.', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) => updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      toast('Coupon updated successfully!', 'success')
      setModalOpen(false)
      setEditingCoupon(null)
    },
    onError: () => toast('Failed to update coupon. Please try again.', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      toast('Coupon deleted.', 'success')
      setDeletingCoupon(null)
    },
    onError: () => toast('Failed to delete coupon. Please try again.', 'error'),
  })

  // ── Handlers ──────────────────────────────────────────────
  const handleSave = (formData: CouponFormData) => {
    const expiresAt = formData.expiresAt
      ? Timestamp.fromDate(new Date(formData.expiresAt + 'T23:59:59'))
      : null
    const payload = {
      code: formData.code,
      type: formData.type,
      value: Number(formData.value),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      expiresAt,
      active: formData.active,
      createdBy: '',
    }

    if (editingCoupon) {
      const { code: _code, createdBy: _cb, ...updatePayload } = payload
      updateMutation.mutate({ id: editingCoupon.id, data: updatePayload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleToggleActive = (coupon: Coupon) => {
    updateMutation.mutate({
      id: coupon.id,
      data: { active: !coupon.active },
    })
  }

  const handleCopy = async (coupon: Coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopiedId(coupon.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast('Could not copy to clipboard', 'error')
    }
  }

  const openCreate = () => {
    setEditingCoupon(null)
    setModalOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setModalOpen(true)
  }

  // ── Sorted coupons: active first ─────────────────────────
  const sorted = [...coupons].sort((a, b) => {
    const order = { active: 0, inactive: 1, exhausted: 2, expired: 3 }
    return order[getCouponStatus(a)] - order[getCouponStatus(b)]
  })

  const isMutating = updateMutation.isPending && !deletingCoupon

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[var(--text-primary)]">Coupons</h1>
          <p className="font-sans text-sm text-[var(--text-secondary)] mt-0.5">
            Manage discount codes and promotions
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Stats strip */}
      {!isLoading && coupons.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total',
              value: coupons.length,
              color: 'text-[var(--text-primary)]',
            },
            {
              label: 'Active',
              value: coupons.filter((c) => getCouponStatus(c) === 'active').length,
              color: 'text-emerald-600',
            },
            {
              label: 'Expired',
              value: coupons.filter((c) => isCouponExpired(c)).length,
              color: 'text-amber-600',
            },
            {
              label: 'Total Uses',
              value: coupons.reduce((s, c) => s + c.usedCount, 0),
              color: 'text-[var(--color-rose)]',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="glass rounded-luxury p-4 border border-[var(--border)]"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <p className="font-sans text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
              <p className={cn('font-serif text-2xl font-semibold', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div
        className="rounded-luxury-lg border border-[var(--border)] shadow-luxury overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[var(--color-rose)]" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertTriangle size={28} className="text-amber-500" />
            <p className="font-sans text-sm text-[var(--text-secondary)]">Failed to load coupons</p>
          </div>
        ) : coupons.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-luxury flex items-center justify-center opacity-40">
              <Ticket size={28} className="text-white" />
            </div>
            <div className="text-center">
              <p className="font-serif text-lg font-semibold text-[var(--text-primary)]">No coupons yet</p>
              <p className="font-sans text-sm text-[var(--text-secondary)] mt-1">
                Create your first discount coupon to get started
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 mt-1">
              <Plus size={16} />
              Create Coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]" style={{ backgroundColor: 'var(--bg-muted)' }}>
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sorted.map((coupon) => {
                  const isCopied = copiedId === coupon.id
                  const isUpdating = updateMutation.isPending && isMutating
                  return (
                    <motion.tr
                      key={coupon.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-[var(--bg-muted)] transition-colors group"
                    >
                      {/* Code */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[var(--text-primary)] text-sm tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon)}
                            className={cn(
                              'p-1 rounded transition-all opacity-0 group-hover:opacity-100',
                              isCopied
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-[var(--text-muted)] hover:text-[var(--color-rose)] hover:bg-[var(--bg-muted)]'
                            )}
                            title="Copy code"
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <TypeBadge type={coupon.type} />
                      </td>

                      {/* Value */}
                      <td className="px-4 py-3.5">
                        <span className="font-sans text-sm font-semibold text-[var(--color-gold)]">
                          {formatCouponValue(coupon)}
                        </span>
                      </td>

                      {/* Min order */}
                      <td className="px-4 py-3.5">
                        <span className="font-sans text-sm text-[var(--text-secondary)]">
                          {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : '—'}
                        </span>
                      </td>

                      {/* Uses */}
                      <td className="px-4 py-3.5">
                        <span className="font-sans text-sm text-[var(--text-secondary)]">
                          {coupon.usedCount}
                          {coupon.maxUses !== null ? (
                            <span className="text-[var(--text-muted)]"> / {coupon.maxUses}</span>
                          ) : (
                            <span className="text-[var(--text-muted)]"> / ∞</span>
                          )}
                        </span>
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'font-sans text-sm',
                            coupon.expiresAt && isCouponExpired(coupon)
                              ? 'text-red-500'
                              : 'text-[var(--text-secondary)]'
                          )}
                        >
                          {coupon.expiresAt ? formatDate(coupon.expiresAt) : '—'}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            disabled={isUpdating}
                            className={cn(
                              'relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0',
                              coupon.active ? 'bg-gradient-luxury' : 'bg-[var(--bg-muted)] border border-[var(--border)]'
                            )}
                            title={coupon.active ? 'Deactivate' : 'Activate'}
                          >
                            <span
                              className={cn(
                                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                                coupon.active ? 'translate-x-4' : 'translate-x-0'
                              )}
                            />
                          </button>
                          <StatusBadge coupon={coupon} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(coupon)}
                            className="p-1.5 rounded-luxury text-[var(--text-muted)] hover:text-[var(--color-gold)] hover:bg-[var(--bg-muted)] transition-colors"
                            title="Edit coupon"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingCoupon(coupon)}
                            className="p-1.5 rounded-luxury text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coupon Modal */}
      <CouponModal
        open={modalOpen}
        coupon={editingCoupon}
        onClose={() => { setModalOpen(false); setEditingCoupon(null) }}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirm */}
      <DeleteConfirm
        coupon={deletingCoupon}
        onClose={() => setDeletingCoupon(null)}
        onConfirm={() => deletingCoupon && deleteMutation.mutate(deletingCoupon.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
