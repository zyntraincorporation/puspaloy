// src/admin/pages/Announcements.tsx
// Full announcement management — add, edit, delete, toggle, reorder
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
  Megaphone, Plus, Edit2, Trash2, X, Loader2,
  GripVertical, ToggleLeft, ToggleRight, Eye, EyeOff,
  Truck, Tag, Phone, Star, Gift, Zap, Heart,
} from 'lucide-react'
import { useToast } from '@/components/shared/Toast'
import { cn } from '@/utils/cn'
import { useAllAnnouncements } from '@/hooks/useAnnouncements'
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  reorderAnnouncements,
} from '@/firebase/announcements'
import type { Announcement, AnnouncementIcon } from '@/types'

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_OPTIONS: { value: AnnouncementIcon; label: string; Icon: React.ComponentType<{ size: number; className?: string }> }[] = [
  { value: 'truck',     label: 'Truck',     Icon: Truck },
  { value: 'tag',       label: 'Tag',       Icon: Tag },
  { value: 'phone',     label: 'Phone',     Icon: Phone },
  { value: 'star',      label: 'Star',      Icon: Star },
  { value: 'gift',      label: 'Gift',      Icon: Gift },
  { value: 'zap',       label: 'Zap',       Icon: Zap },
  { value: 'megaphone', label: 'Megaphone', Icon: Megaphone },
  { value: 'heart',     label: 'Heart',     Icon: Heart },
]

function getIconComponent(icon: AnnouncementIcon) {
  return ICON_OPTIONS.find(o => o.value === icon)?.Icon ?? Megaphone
}

// ── Form type ─────────────────────────────────────────────────────────────────
type AnnForm = {
  text: string
  icon: AnnouncementIcon
  active: boolean
}

const EMPTY_FORM: AnnForm = { text: '', icon: 'truck', active: true }

// ── Announcement Modal ────────────────────────────────────────────────────────
function AnnouncementModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: AnnForm
  onClose: () => void
  onSave: (form: AnnForm) => void
  saving: boolean
}) {
  const [form, setForm] = useState<AnnForm>(initial)
  const set = <K extends keyof AnnForm>(key: K, val: AnnForm[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] w-full max-w-md shadow-luxury-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">
            {initial.text ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-muted)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Text */}
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Announcement Text *
            </label>
            <input
              value={form.text}
              onChange={e => set('text', e.target.value)}
              className="input-luxury w-full"
              placeholder="e.g. Free delivery on orders above ৳1,500"
              maxLength={120}
              autoFocus
            />
            <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
              {form.text.length}/120 characters
            </p>
          </div>

          {/* Icon */}
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-2">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('icon', value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-luxury border transition-all',
                    form.icon === value
                      ? 'border-[var(--color-rose)] bg-rose-50 text-[var(--color-rose)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--color-rose)]/50'
                  )}
                  title={label}
                >
                  <Icon size={16} />
                  <span className="font-sans text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('active', !form.active)}
              className={cn(
                'w-11 h-6 rounded-full relative cursor-pointer transition-colors',
                form.active ? 'bg-gradient-luxury' : 'bg-[var(--border)]'
              )}
            >
              <div className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                form.active ? 'translate-x-6' : 'translate-x-1'
              )} />
            </div>
            <span className="font-sans text-sm text-[var(--text-secondary)]">
              {form.active ? 'Active (visible on website)' : 'Inactive (hidden)'}
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border)] flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost px-5">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.text.trim()}
            className="btn-primary px-6 gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {initial.text ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Announcement Row ──────────────────────────────────────────────────────────
function AnnouncementRow({
  ann,
  onEdit,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  ann: Announcement
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const Icon = getIconComponent(ann.icon)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'flex items-center gap-3 p-4 rounded-luxury-lg border transition-colors',
        'bg-[var(--bg-surface)] hover:border-[var(--color-rose)]/30',
        ann.active ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-60'
      )}
    >
      {/* Drag handle / reorder */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 text-[var(--text-muted)] hover:text-[var(--color-rose)] disabled:opacity-30 transition-colors"
          title="Move up"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2L1 8h10L6 2z" />
          </svg>
        </button>
        <GripVertical size={14} className="text-[var(--text-muted)]" />
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 text-[var(--text-muted)] hover:text-[var(--color-rose)] disabled:opacity-30 transition-colors"
          title="Move down"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 10L1 4h10L6 10z" />
          </svg>
        </button>
      </div>

      {/* Icon */}
      <div className="w-9 h-9 rounded-full bg-[var(--bg-muted)] flex items-center justify-center shrink-0">
        <Icon size={16} className="text-[var(--color-gold)]" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-[var(--text-primary)] truncate">{ann.text}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn(
            'font-sans text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full',
            ann.active
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          )}>
            {ann.active ? 'Active' : 'Inactive'}
          </span>
          <span className="font-sans text-[10px] text-[var(--text-muted)] capitalize">
            {ann.icon}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggle}
          className={cn(
            'p-1.5 rounded-luxury transition-colors',
            ann.active
              ? 'text-emerald-500 hover:bg-emerald-50'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
          )}
          title={ann.active ? 'Deactivate' : 'Activate'}
        >
          {ann.active ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-luxury text-[var(--text-muted)] hover:text-[var(--color-rose)] hover:bg-rose-50 transition-colors"
          title="Edit"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-luxury text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Announcements() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: announcements = [], isLoading } = useAllAnnouncements()

  const activeCount = announcements.filter(a => a.active).length

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (form: AnnForm) => {
    setSaving(true)
    try {
      if (editing) {
        await updateAnnouncement(editing.id, form)
        toast('Announcement updated!', 'success')
      } else {
        await createAnnouncement({ ...form, order: announcements.length })
        toast('Announcement created!', 'success')
      }
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowModal(false)
      setEditing(null)
    } catch {
      toast('Failed to save announcement', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (ann: Announcement) => {
    if (!window.confirm(`Delete "${ann.text}"?`)) return
    try {
      await deleteAnnouncement(ann.id)
      toast('Announcement deleted', 'success')
      qc.invalidateQueries({ queryKey: ['announcements'] })
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const handleToggle = async (ann: Announcement) => {
    try {
      await updateAnnouncement(ann.id, { active: !ann.active })
      qc.invalidateQueries({ queryKey: ['announcements'] })
      toast(ann.active ? 'Announcement hidden' : 'Announcement is now active', 'success')
    } catch {
      toast('Failed to update', 'error')
    }
  }

  // ── Reorder ─────────────────────────────────────────────────────────────────
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newList = [...announcements]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newList.length) return
    ;[newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]]
    // Optimistic update via cache
    qc.setQueryData(['announcements', 'all'], newList)
    try {
      await reorderAnnouncements(newList.map(a => a.id))
    } catch {
      toast('Failed to reorder', 'error')
      qc.invalidateQueries({ queryKey: ['announcements'] })
    }
  }

  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit = (ann: Announcement) => { setEditing(ann); setShowModal(true) }

  const formInitial: AnnForm = editing
    ? { text: editing.text, icon: editing.icon, active: editing.active }
    : EMPTY_FORM

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Announcements</h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">
            {announcements.length} total · {activeCount} active · Shown in the scrolling strip at the top of the site
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: announcements.length, color: 'text-[var(--text-primary)]' },
          { label: 'Active', value: activeCount, color: 'text-emerald-600' },
          { label: 'Inactive', value: announcements.length - activeCount, color: 'text-[var(--text-muted)]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-luxury-lg border border-[var(--border)] p-4 text-center bg-[var(--bg-muted)]">
            <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Preview strip */}
      {activeCount > 0 && (
        <div className="mb-6 rounded-luxury-lg overflow-hidden border border-[var(--border)]">
          <p className="font-sans text-xs text-[var(--text-muted)] px-3 pt-2 pb-1">Live preview:</p>
          <div className="overflow-hidden py-2" style={{ backgroundColor: '#0a0a0a' }}>
            <div className="flex items-center gap-0 whitespace-nowrap overflow-x-auto no-scrollbar px-4">
              {announcements.filter(a => a.active).map((ann) => {
                const Icon = getIconComponent(ann.icon)
                return (
                  <span key={ann.id} className="inline-flex items-center gap-1.5 mx-6 font-sans text-xs text-white/70 shrink-0">
                    <Icon size={11} className="text-yellow-400" />
                    {ann.text}
                    <span className="ml-4 text-yellow-400">•</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-luxury-lg" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-luxury-xl">
          <Megaphone size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-serif text-lg text-[var(--text-primary)]">No announcements yet</p>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-1 mb-4">
            Create your first announcement to display in the promo strip.
          </p>
          <button onClick={openCreate} className="btn-primary gap-2">
            <Plus size={15} /> Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-sans text-xs text-[var(--text-muted)] mb-3">
            Use the arrows to reorder. Order affects display sequence in the strip.
          </p>
          <AnimatePresence>
            {announcements.map((ann, index) => (
              <AnnouncementRow
                key={ann.id}
                ann={ann}
                onEdit={() => openEdit(ann)}
                onDelete={() => handleDelete(ann)}
                onToggle={() => handleToggle(ann)}
                onMoveUp={() => handleMove(index, 'up')}
                onMoveDown={() => handleMove(index, 'down')}
                isFirst={index === 0}
                isLast={index === announcements.length - 1}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AnnouncementModal
            initial={formInitial}
            onClose={() => { setShowModal(false); setEditing(null) }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
