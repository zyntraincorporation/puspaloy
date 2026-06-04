// src/admin/pages/Moderators.tsx
// Moderator management — Super Admin only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Trash2, X, Loader2, Shield, ShieldCheck } from 'lucide-react'
import {
  collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, setDoc,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { db } from '@/firebase/config'
import app from '@/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/shared/Toast'
import { cn } from '@/utils/cn'
import type { AdminUser, AdminPermissions } from '@/types'

// ── Firestore helpers ──────────────────────────────────────
async function getAllAdmins(): Promise<AdminUser[]> {
  const snap = await getDocs(collection(db, 'admins'))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AdminUser))
}

const MODERATOR_DEFAULTS: AdminPermissions = {
  viewOrders: true,
  updateOrderStatus: true,
  addProducts: true,
  editProducts: true,
  deleteProducts: false,
  manageReviews: true,
  manageInventory: true,
  viewAnalytics: false,
  manageCoupons: false,
  manageFlashSales: false,
  manageCategories: false,
  manageHomepageContent: false,
  manageBanners: false,
  manageSettings: false,
  manageAI: false,
  managePayments: false,
  manageModerators: false,
}

const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
  viewOrders: 'View Orders',
  updateOrderStatus: 'Update Order Status',
  addProducts: 'Add Products',
  editProducts: 'Edit Products',
  deleteProducts: 'Delete Products',
  manageReviews: 'Manage Reviews',
  manageInventory: 'Manage Inventory',
  viewAnalytics: 'View Analytics',
  manageCoupons: 'Manage Coupons',
  manageFlashSales: 'Manage Flash Sales',
  manageCategories: 'Manage Categories',
  manageHomepageContent: 'Manage Homepage Content',
  manageBanners: 'Manage Banners',
  manageSettings: 'Manage Settings',
  manageAI: 'Manage AI Settings',
  managePayments: 'Manage Payments',
  manageModerators: 'Manage Moderators',
}

// ── Toggle Switch ──────────────────────────────────────────
function PermissionToggle({
  label, value, onChange, disabled,
}: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn('flex items-center justify-between gap-3 py-2', disabled && 'opacity-50 cursor-not-allowed')}>
      <span className="font-sans text-sm text-[var(--text-secondary)]">{label}</span>
      <div
        onClick={() => !disabled && onChange(!value)}
        className={cn(
          'w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          value ? 'bg-gradient-luxury' : 'bg-[var(--border)]'
        )}
      >
        <div className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          value ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </div>
    </label>
  )
}

// ── Create Moderator Modal ─────────────────────────────────
function CreateModeratorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { adminUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permissions, setPermissions] = useState<AdminPermissions>({ ...MODERATOR_DEFAULTS })
  const [saving, setSaving] = useState(false)

  const setPermission = (key: keyof AdminPermissions, val: boolean) =>
    setPermissions((p) => ({ ...p, [key]: val }))

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      toast('Name, email and password (min 8 chars) are required', 'error')
      return
    }
    setSaving(true)
    try {
      // Create Firebase Auth account
      const auth = getAuth(app)
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const uid = cred.user.uid

      // Save admin document
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email: email.trim(),
        name: name.trim(),
        role: 'moderator',
        avatar: null,
        permissions,
        createdBy: adminUser?.uid ?? '',
        createdAt: serverTimestamp(),
        active: true,
      })

      toast(`Moderator ${name} created successfully!`, 'success')
      onCreated()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create moderator'
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Add Moderator</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-full"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-luxury" placeholder="e.g. Rina Akter" />
          </div>
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-luxury" placeholder="moderator@puspaloy.com" />
          </div>
          <div>
            <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Password * <span className="text-xs text-[var(--text-muted)]">(min 8 characters)</span></label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-luxury" placeholder="••••••••" />
          </div>

          <div>
            <p className="font-sans text-sm font-semibold text-[var(--text-secondary)] mb-3">Permissions</p>
            <div className="border border-[var(--border)] rounded-luxury-lg p-4 space-y-1 divide-y divide-[var(--border)]">
              {(Object.entries(PERMISSION_LABELS) as [keyof AdminPermissions, string][]).map(([key, label]) => (
                <PermissionToggle
                  key={key}
                  label={label}
                  value={permissions[key]}
                  onChange={(v) => setPermission(key, v)}
                  disabled={key === 'manageModerators' || key === 'manageSettings' || key === 'manageAI' || key === 'managePayments'}
                />
              ))}
            </div>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-2">
              Grayed-out permissions are Super Admin only and cannot be granted to moderators.
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border)] flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost px-5">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="btn-primary px-6 gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Moderator
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function Moderators() {
  const { adminUser } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: getAllAdmins,
  })

  const moderators = admins.filter((a) => a.role === 'moderator')

  const handleDeleteModerator = async (uid: string, name: string) => {
    if (!window.confirm(`Remove moderator ${name}? They will lose all access.`)) return
    try {
      await updateDoc(doc(db, 'admins', uid), { active: false })
      toast(`${name} has been deactivated`, 'success')
      qc.invalidateQueries({ queryKey: ['admins'] })
    } catch {
      toast('Failed to remove moderator', 'error')
    }
  }

  const handlePermissionSave = async (uid: string, permissions: AdminPermissions) => {
    try {
      await updateDoc(doc(db, 'admins', uid), { permissions })
      toast('Permissions updated!', 'success')
      qc.invalidateQueries({ queryKey: ['admins'] })
      setEditingUser(null)
    } catch {
      toast('Failed to update permissions', 'error')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Moderators</h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">Manage admin team — Super Admin access only</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus size={16} /> Add Moderator
        </button>
      </div>

      {/* Super Admin card */}
      <div className="mb-6 p-4 bg-gradient-luxury rounded-luxury-xl text-white">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} />
          <div>
            <p className="font-sans text-sm font-semibold">Super Admin</p>
            <p className="font-sans text-sm opacity-80">{adminUser?.name} · {adminUser?.email}</p>
          </div>
          <span className="ml-auto text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
            Full Access
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 skeleton rounded-luxury-lg" />)}</div>
      ) : moderators.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-luxury-xl">
          <Users size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-sans text-sm text-[var(--text-muted)]">No moderators yet. Add team members above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {moderators.map((mod) => (
            <div key={mod.uid} className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-rose flex items-center justify-center shrink-0">
                  <span className="font-sans text-sm font-bold text-white">{mod.name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">{mod.name}</p>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      mod.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {mod.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[var(--text-muted)]">{mod.email}</p>
                  <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
                    {Object.values(mod.permissions).filter(Boolean).length} permissions granted
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingUser(mod)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-luxury text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-gradient-luxury hover:text-white transition-all"
                  >
                    <Shield size={12} /> Edit Permissions
                  </button>
                  <button
                    onClick={() => handleDeleteModerator(mod.uid, mod.name)}
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

      {/* Permission editor modal */}
      <AnimatePresence>
        {editingUser && (
          <PermissionEditorModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={(perms) => handlePermissionSave(editingUser.uid, perms)}
          />
        )}
        {showCreate && (
          <CreateModeratorModal
            onClose={() => setShowCreate(false)}
            onCreated={() => qc.invalidateQueries({ queryKey: ['admins'] })}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Permission Editor Modal ────────────────────────────────
function PermissionEditorModal({
  user, onClose, onSave,
}: { user: AdminUser; onClose: () => void; onSave: (p: AdminPermissions) => void }) {
  const [permissions, setPermissions] = useState<AdminPermissions>({ ...user.permissions })
  const [saving, setSaving] = useState(false)

  const setPermission = (key: keyof AdminPermissions, val: boolean) =>
    setPermissions((p) => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(permissions)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Edit Permissions</h2>
            <p className="font-sans text-sm text-[var(--text-muted)]">{user.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-full"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div className="border border-[var(--border)] rounded-luxury-lg p-4 space-y-1 divide-y divide-[var(--border)]">
            {(Object.entries(PERMISSION_LABELS) as [keyof AdminPermissions, string][]).map(([key, label]) => (
              <PermissionToggle
                key={key}
                label={label}
                value={permissions[key]}
                onChange={(v) => setPermission(key, v)}
                disabled={key === 'manageModerators' || key === 'manageSettings' || key === 'manageAI' || key === 'managePayments'}
              />
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-[var(--border)] flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost px-5">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Permissions
          </button>
        </div>
      </motion.div>
    </div>
  )
}
