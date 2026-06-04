// src/admin/pages/FlashSales.tsx
// Flash sale management — create, activate, deactivate, add products
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, Plus, Trash2, X, Loader2, Clock, CheckCircle } from 'lucide-react'
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getAllProductsAdmin } from '@/firebase/products'
import { formatPrice, formatDateTime } from '@/utils/formatters'
import { useToast } from '@/components/shared/Toast'
import type { FlashSale, Product } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

// ── Firebase helpers ───────────────────────────────────────
async function getFlashSales(): Promise<FlashSale[]> {
  const q = query(collection(db, 'flashSales'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FlashSale))
}

async function createFlashSale(data: Omit<FlashSale, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'flashSales'), {
    ...data, createdAt: serverTimestamp(),
  })
  return ref.id
}

async function toggleFlashSaleActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'flashSales', id), { active })
}

async function deleteFlashSale(id: string): Promise<void> {
  await deleteDoc(doc(db, 'flashSales', id))
}

// ── Status badge ───────────────────────────────────────────
function SaleBadge({ sale }: { sale: FlashSale }) {
  const now = new Date()
  const start = sale.startAt?.toDate?.()
  const end = sale.endAt?.toDate?.()
  const isLive = sale.active && start && end && now >= start && now <= end
  const isExpired = end && now > end

  if (isExpired) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Expired</span>
  if (isLive) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
  if (!sale.active) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Inactive</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>
}

// ── Create Modal ───────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const { adminUser } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; productName: string; originalPrice: number; flashPrice: string }[]>([])
  const [saving, setSaving] = useState(false)

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', 'admin', 'all'],
    queryFn: async () => {
      const result = await getAllProductsAdmin()
      return result.products
    },
  })


  const addProduct = (product: Product) => {
    if (selectedProducts.find((p) => p.productId === product.id)) return
    setSelectedProducts((prev) => [...prev, {
      productId: product.id,
      productName: product.name,
      originalPrice: product.price,
      flashPrice: String(Math.round(product.price * 0.8)),
    }])
  }

  const handleCreate = async () => {
    if (!title || !startAt || !endAt || selectedProducts.length === 0) {
      toast('Fill all fields and add at least one product', 'error')
      return
    }
    setSaving(true)
    try {
      const { Timestamp } = await import('firebase/firestore')
      await createFlashSale({
        title,
        startAt: Timestamp.fromDate(new Date(startAt)),
        endAt: Timestamp.fromDate(new Date(endAt)),
        active: false,
        products: selectedProducts.map((p) => ({
          productId: p.productId,
          flashPrice: Number(p.flashPrice),
          originalPrice: p.originalPrice,
        })),
        createdBy: adminUser?.uid ?? '',
      })
      toast('Flash sale created!', 'success')
      onCreated()
      onClose()
    } catch {
      toast('Failed to create flash sale', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">New Flash Sale</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-full"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Sale Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-luxury" placeholder="e.g. Eid Special Flash Sale" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Start Date & Time</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="input-luxury" />
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">End Date & Time</label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="input-luxury" />
            </div>
          </div>

          {/* Product picker */}
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-2">Add Products to Sale</label>
            <div className="max-h-48 overflow-y-auto border border-[var(--border)] rounded-luxury divide-y divide-[var(--border)]">
              {products.slice(0, 50).map((p) => (
                <button
                  key={p.id} type="button"
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-muted)] text-left transition-colors"
                >
                  <img src={p.featuredImage} alt="" className="w-8 h-8 rounded object-cover" />
                  <span className="font-sans text-sm text-[var(--text-primary)] flex-1">{p.name}</span>
                  <span className="font-sans text-sm font-semibold text-[var(--color-rose)]">{formatPrice(p.price)}</span>
                  {selectedProducts.find((sp) => sp.productId === p.id) && (
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected products with flash price inputs */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              <p className="font-sans text-sm font-semibold text-[var(--text-secondary)]">Selected Products ({selectedProducts.length})</p>
              {selectedProducts.map((sp, i) => (
                <div key={sp.productId} className="flex items-center gap-3 p-2.5 bg-[var(--bg-muted)] rounded-luxury">
                  <span className="font-sans text-sm flex-1 truncate">{sp.productName}</span>
                  <span className="font-sans text-xs text-[var(--text-muted)] line-through">{formatPrice(sp.originalPrice)}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-sans text-xs text-[var(--color-rose)]">৳</span>
                    <input
                      type="number"
                      value={sp.flashPrice}
                      onChange={(e) => {
                        const updated = [...selectedProducts]
                        updated[i].flashPrice = e.target.value
                        setSelectedProducts(updated)
                      }}
                      className="w-20 text-sm border border-[var(--border)] rounded px-2 py-1 bg-[var(--bg-primary)]"
                    />
                  </div>
                  <button type="button" onClick={() => setSelectedProducts((prev) => prev.filter((_, j) => j !== i))}>
                    <X size={14} className="text-[var(--text-muted)]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-[var(--border)] flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost px-5">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="btn-primary px-6 gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Create Sale
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function FlashSales() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: sales = [], isLoading, refetch } = useQuery({
    queryKey: ['flashSales'],
    queryFn: getFlashSales,
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleFlashSaleActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashSales'] }),
  })

  const { mutate: deleteSale } = useMutation({
    mutationFn: deleteFlashSale,
    onSuccess: () => { toast('Flash sale deleted', 'success'); qc.invalidateQueries({ queryKey: ['flashSales'] }) },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Flash Sales</h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">Create and manage time-limited flash sales</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus size={16} /> New Flash Sale
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-luxury-lg" />)}</div>
      ) : sales.length === 0 ? (
        <div className="text-center py-20">
          <Zap size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-serif text-lg text-[var(--text-primary)]">No flash sales yet</p>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-1">Create your first flash sale to boost sales</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">{sale.title}</h3>
                    <SaleBadge sale={sale} />
                  </div>
                  <div className="flex items-center gap-4 font-sans text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      Starts: {sale.startAt ? formatDateTime(sale.startAt) : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      Ends: {sale.endAt ? formatDateTime(sale.endAt) : '—'}
                    </span>
                    <span>{sale.products?.length ?? 0} products</span>
                  </div>
                  {/* Products list */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sale.products?.slice(0, 5).map((p) => (
                      <div key={p.productId} className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-muted)] rounded-full">
                        <span className="font-sans text-xs text-[var(--text-secondary)] line-through">{formatPrice(p.originalPrice)}</span>
                        <span className="font-sans text-xs font-bold text-[var(--color-rose)]">{formatPrice(p.flashPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActive({ id: sale.id, active: !sale.active })}
                    className={`px-3 py-1.5 rounded-luxury text-xs font-semibold transition-colors ${
                      sale.active
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {sale.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => window.confirm('Delete this flash sale?') && deleteSale(sale.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateModal onClose={() => setShowCreate(false)} onCreated={refetch} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
