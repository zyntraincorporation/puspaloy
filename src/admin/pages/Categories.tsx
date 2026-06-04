// src/admin/pages/Categories.tsx
// Category management — add, edit, reorder, toggle active
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tag, Plus, Edit2, Trash2, X, Loader2, GripVertical,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
} from 'lucide-react'
import {
  collection, getDocs, addDoc, doc, updateDoc,
  deleteDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useToast } from '@/components/shared/Toast'
import { cn } from '@/utils/cn'
import type { Category, Subcategory } from '@/types'

// ── Firebase helpers ───────────────────────────────────────
async function getAllCategories(): Promise<Category[]> {
  const q = query(collection(db, 'categories'), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
}

async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'productCount'>): Promise<string> {
  const ref = await addDoc(collection(db, 'categories'), {
    ...data, productCount: 0, createdAt: serverTimestamp(),
  })
  return ref.id
}

async function saveCategory(id: string, data: Partial<Category>): Promise<void> {
  await updateDoc(doc(db, 'categories', id), data)
}

async function removeCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id))
}

// ── Category Icons ─────────────────────────────────────────
const CATEGORY_ICONS = ['💄', '👠', '🎁', '🎀', '✨', '💅', '👜', '💍', '🌸', '🌺', '🛍️', '💝']

// ── Empty form ─────────────────────────────────────────────
type CatForm = {
  name: string
  nameBn: string
  slug: string
  icon: string
  image: string
  description: string
  order: string
  active: boolean
  subcategories: Subcategory[]
}

const EMPTY_FORM: CatForm = {
  name: '', nameBn: '', slug: '', icon: '✨',
  image: '', description: '', order: '0', active: true, subcategories: [],
}

// ── Category Form Modal ────────────────────────────────────
function CategoryModal({
  initial, onClose, onSave, saving,
}: {
  initial: CatForm
  onClose: () => void
  onSave: (form: CatForm) => void
  saving: boolean
}) {
  const [form, setForm] = useState<CatForm>(initial)
  const [newSubcat, setNewSubcat] = useState('')

  const set = (key: keyof CatForm, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }))

  const addSubcat = () => {
    if (!newSubcat.trim()) return
    const sub: Subcategory = {
      name: newSubcat.trim(),
      slug: newSubcat.trim().toLowerCase().replace(/\s+/g, '-'),
    }
    set('subcategories', [...form.subcategories, sub])
    setNewSubcat('')
  }

  const removeSubcat = (i: number) =>
    set('subcategories', form.subcategories.filter((_, j) => j !== i))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-luxury-lg"
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">
            {initial.name ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Icon picker */}
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic} type="button"
                  onClick={() => set('icon', ic)}
                  className={cn(
                    'w-9 h-9 text-xl rounded-luxury flex items-center justify-center border-2 transition-colors',
                    form.icon === ic
                      ? 'border-[var(--color-rose)] bg-rose-50 dark:bg-rose-950/20'
                      : 'border-[var(--border)] hover:border-[var(--color-rose)]'
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Name (English) *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  set('name', e.target.value)
                  set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                }}
                className="input-luxury" placeholder="e.g. Cosmetics"
              />
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Name (বাংলা)</label>
              <input value={form.nameBn} onChange={(e) => set('nameBn', e.target.value)} className="input-luxury" placeholder="কসমেটিক্স" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Slug</label>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className="input-luxury font-mono text-sm" placeholder="cosmetics" />
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Display Order</label>
              <input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} className="input-luxury" placeholder="0" />
            </div>
          </div>

          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Image URL</label>
            <input value={form.image} onChange={(e) => set('image', e.target.value)} className="input-luxury" placeholder="https://..." />
            {form.image && (
              <img src={form.image} alt="" className="mt-2 w-full h-28 object-cover rounded-luxury" />
            )}
          </div>

          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="input-luxury resize-none" rows={2}
              placeholder="Short category description"
            />
          </div>

          {/* Subcategories */}
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-2">Subcategories</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newSubcat}
                onChange={(e) => setNewSubcat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubcat())}
                className="input-luxury flex-1 text-sm py-2"
                placeholder="Add subcategory..."
              />
              <button type="button" onClick={addSubcat} className="px-3 py-2 rounded-luxury bg-gradient-luxury text-white">
                <Plus size={14} />
              </button>
            </div>
            {form.subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.subcategories.map((sub, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-muted)] rounded-full font-sans text-xs text-[var(--text-primary)]">
                    {sub.name}
                    <button onClick={() => removeSubcat(i)} className="text-[var(--text-muted)] hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            <span className="font-sans text-sm text-[var(--text-secondary)]">Active (visible on website)</span>
          </label>
        </div>

        <div className="p-5 border-t border-[var(--border)] flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost px-5">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name}
            className="btn-primary px-6 gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {initial.name ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Category Row ───────────────────────────────────────────
function CategoryRow({
  category, onEdit, onDelete, onToggleActive,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 bg-[var(--bg-surface)] rounded-luxury-lg border border-[var(--border)] hover:border-[var(--color-rose)]/30 transition-colors"
    >
      <GripVertical size={16} className="text-[var(--text-muted)] shrink-0 cursor-grab" />

      {/* Icon + image */}
      <div className="relative shrink-0">
        {category.image ? (
          <img src={category.image} alt={category.name} className="w-12 h-12 rounded-luxury object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-luxury bg-[var(--bg-muted)] flex items-center justify-center text-2xl">
            {category.icon}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-base">{category.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">{category.name}</p>
          {category.nameBn && (
            <p className="font-sans text-xs text-[var(--text-muted)]">{category.nameBn}</p>
          )}
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
            category.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          )}>
            {category.active ? 'Active' : 'Hidden'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 font-sans text-xs text-[var(--text-muted)]">
          <span className="font-mono">/{category.slug}</span>
          <span>{category.productCount ?? 0} products</span>
          {category.subcategories?.length > 0 && (
            <span>{category.subcategories.length} subcategories</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleActive}
          className={cn(
            'p-1.5 rounded-luxury transition-colors',
            category.active
              ? 'text-emerald-500 hover:bg-emerald-50'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
          )}
          title={category.active ? 'Deactivate' : 'Activate'}
        >
          {category.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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

// ── Main Page ──────────────────────────────────────────────
export default function Categories() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: getAllCategories,
  })

  const handleSave = async (form: CatForm) => {
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        nameBn: form.nameBn.trim(),
        slug: form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, '-'),
        icon: form.icon,
        image: form.image.trim(),
        description: form.description.trim(),
        order: Number(form.order) || 0,
        active: form.active,
        subcategories: form.subcategories,
      }
      if (editingCat) {
        await saveCategory(editingCat.id, payload)
        toast('Category updated!', 'success')
      } else {
        await createCategory(payload as Omit<Category, 'id' | 'createdAt' | 'productCount'>)
        toast('Category created!', 'success')
      }
      qc.invalidateQueries({ queryKey: ['categories'] })
      setShowModal(false)
      setEditingCat(null)
    } catch {
      toast('Failed to save category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return
    try {
      await removeCategory(cat.id)
      toast('Category deleted', 'success')
      qc.invalidateQueries({ queryKey: ['categories'] })
    } catch {
      toast('Failed to delete category', 'error')
    }
  }

  const handleToggleActive = async (cat: Category) => {
    try {
      await saveCategory(cat.id, { active: !cat.active })
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast(cat.active ? 'Category hidden' : 'Category activated', 'success')
    } catch {
      toast('Failed to update', 'error')
    }
  }

  const openCreate = () => { setEditingCat(null); setShowModal(true) }
  const openEdit = (cat: Category) => { setEditingCat(cat); setShowModal(true) }

  const formInitial: CatForm = editingCat ? {
    name: editingCat.name,
    nameBn: editingCat.nameBn ?? '',
    slug: editingCat.slug,
    icon: editingCat.icon ?? '✨',
    image: editingCat.image ?? '',
    description: editingCat.description ?? '',
    order: String(editingCat.order ?? 0),
    active: editingCat.active,
    subcategories: editingCat.subcategories ?? [],
  } : EMPTY_FORM

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Categories</h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · drag to reorder
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: categories.length, color: 'text-[var(--text-primary)]' },
          { label: 'Active', value: categories.filter((c) => c.active).length, color: 'text-emerald-600' },
          { label: 'Hidden', value: categories.filter((c) => !c.active).length, color: 'text-[var(--text-muted)]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[var(--bg-surface)] rounded-luxury-lg border border-[var(--border)] p-4 text-center">
            <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Category list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-luxury-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-luxury-xl">
          <Tag size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-serif text-lg text-[var(--text-primary)]">No categories yet</p>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-1 mb-4">
            Create your first category to organize products
          </p>
          <button onClick={openCreate} className="btn-primary gap-2">
            <Plus size={15} /> Create Category
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                onEdit={() => openEdit(cat)}
                onDelete={() => handleDelete(cat)}
                onToggleActive={() => handleToggleActive(cat)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CategoryModal
            initial={formInitial}
            onClose={() => { setShowModal(false); setEditingCat(null) }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
