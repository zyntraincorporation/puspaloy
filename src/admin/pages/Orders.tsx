// src/admin/pages/Orders.tsx
import { useEffect, useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Eye,
  Package,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { subscribeToOrders, updateOrderStatus } from '@/firebase/orders'
import type { Order, OrderStatus } from '@/types'
import { formatPrice, formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'

// ── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string; darkBg: string }
> = {
  pending: {
    label: 'Pending',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400',
    darkBg: 'bg-yellow-900/20',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
    darkBg: 'bg-blue-900/20',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-400',
    darkBg: 'bg-indigo-900/20',
  },
  shipped: {
    label: 'Shipped',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-400',
    darkBg: 'bg-purple-900/20',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-400',
    darkBg: 'bg-green-900/20',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-400',
    darkBg: 'bg-red-900/20',
  },
}

// ── Status badge (exported so Dashboard can import) ─────────────────────────
export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold whitespace-nowrap',
        cfg.bg,
        cfg.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// ── Order detail modal ──────────────────────────────────────────────────────
interface OrderDetailModalProps {
  order: Order
  onClose: () => void
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>
  updatingId: string | null
}

function OrderDetailModal({ order, onClose, onStatusUpdate, updatingId }: OrderDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const isUpdating = updatingId === order.id

  const effectiveItemPrice = (item: Order['items'][0]) =>
    item.flashSalePrice ?? item.discountPrice ?? item.price

  const handleStatusChange = async () => {
    if (selectedStatus === order.status) return
    await onStatusUpdate(order.id, selectedStatus)
    setUpdateSuccess(true)
    setTimeout(() => setUpdateSuccess(false), 2000)
  }

  const paymentMethodLabel: Record<string, string> = {
    cod: 'Cash on Delivery',
    bkash: 'bKash',
    nagad: 'Nagad',
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal panel */}
      <motion.div
        className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden flex flex-col rounded-t-luxury-xl sm:rounded-luxury-xl border border-[var(--border)] shadow-2xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">
              Order Details
            </p>
            <h2 className="font-mono text-base font-bold text-[var(--color-rose)]">{order.id}</h2>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Placed {order.createdAt ? formatDateTime(order.createdAt) : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="btn-ghost p-2 rounded-full ml-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">

            {/* Customer info */}
            <section>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Customer Information
              </h3>
              <div className="rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)] p-4 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-luxury flex items-center justify-center flex-shrink-0">
                    <span className="font-sans text-xs font-bold text-white">
                      {order.customerName?.[0]?.toUpperCase() ?? 'C'}
                    </span>
                  </div>
                  <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                    {order.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Phone size={13} className="text-[var(--text-muted)]" />
                  <span className="font-sans text-sm">{order.phone}</span>
                </div>
                {order.email && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Mail size={13} className="text-[var(--text-muted)]" />
                    <span className="font-sans text-sm">{order.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <MapPin size={13} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                  <span className="font-sans text-sm leading-snug">
                    {order.address}, {order.district}
                  </span>
                </div>
                {order.notes && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <p className="font-sans text-xs text-[var(--text-muted)] mb-1">Note from customer:</p>
                    <p className="font-sans text-sm text-[var(--text-secondary)] italic">"{order.notes}"</p>
                  </div>
                )}
              </div>
            </section>

            {/* Order items */}
            <section>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Items ({order.items?.length ?? 0})
              </h3>
              <div className="space-y-2">
                {order.items?.map((item, i) => (
                  <div
                    key={`${item.productId}-${i}`}
                    className="flex items-center gap-3 rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)] p-3"
                  >
                    {/* Product image */}
                    {item.featuredImage ? (
                      <img
                        src={item.featuredImage}
                        alt={item.productName}
                        className="w-14 h-14 rounded-luxury object-cover flex-shrink-0 border border-[var(--border)]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-luxury bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <Package size={20} className="text-[var(--text-muted)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-medium text-[var(--text-primary)] truncate">
                        {item.productName}
                      </p>
                      <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
                        Qty: {item.quantity} × {formatPrice(effectiveItemPrice(item))}
                      </p>
                    </div>
                    <p className="font-sans text-sm font-semibold text-[var(--text-primary)] flex-shrink-0">
                      {formatPrice(effectiveItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Pricing breakdown */}
            <section>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Pricing Breakdown
              </h3>
              <div className="rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)] p-4 space-y-2">
                <div className="flex justify-between font-sans text-sm text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between font-sans text-sm text-green-600">
                    <span>
                      Coupon
                      {order.couponCode && (
                        <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-xs font-mono">
                          {order.couponCode}
                        </span>
                      )}
                    </span>
                    <span>−{formatPrice(order.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-sans text-sm text-[var(--text-secondary)]">
                  <span>Delivery</span>
                  <span>
                    {order.deliveryCharge === 0
                      ? <span className="text-green-600 font-semibold">Free</span>
                      : formatPrice(order.deliveryCharge)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[var(--border)] flex justify-between font-sans text-base font-bold text-[var(--text-primary)]">
                  <span>Total</span>
                  <span className="text-[var(--color-rose)]">{formatPrice(order.total)}</span>
                </div>
                <div className="pt-1 flex justify-between font-sans text-xs text-[var(--text-muted)]">
                  <span>Payment Method</span>
                  <span className="capitalize">
                    {paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between font-sans text-xs text-[var(--text-muted)]">
                  <span>Payment Status</span>
                  <span
                    className={cn(
                      'capitalize font-semibold',
                      order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    )}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </section>

            {/* Status history */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <section>
                <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                  Status History
                </h3>
                <div className="space-y-2">
                  {[...order.statusHistory].reverse().map((hist, i) => {
                    const cfg = STATUS_CONFIG[hist.status] ?? STATUS_CONFIG.pending
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 font-sans text-sm"
                      >
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                        <span className={cn('font-semibold', cfg.text, 'w-24 flex-shrink-0')}>
                          {cfg.label}
                        </span>
                        <span className="text-[var(--text-muted)] text-xs">
                          {hist.at ? formatDateTime(hist.at) : '—'}
                        </span>
                        {hist.by && (
                          <span className="text-[var(--text-muted)] text-xs ml-auto truncate max-w-[120px]">
                            by {hist.by}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Status update footer */}
        <div className="flex-shrink-0 border-t border-[var(--border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="font-sans text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
              Update Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              disabled={isUpdating}
              className="input-luxury py-2 text-sm"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleStatusChange}
            disabled={isUpdating || selectedStatus === order.status}
            className={cn(
              'btn-primary sm:w-auto sm:self-end py-2.5 px-5 text-sm',
              updateSuccess && 'bg-green-500 hover:bg-green-500'
            )}
          >
            {isUpdating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Updating…
              </>
            ) : updateSuccess ? (
              <>
                <CheckCircle2 size={14} />
                Updated!
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Update Status
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Status filter tab ───────────────────────────────────────────────────────
function StatusTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-luxury font-sans text-sm font-medium whitespace-nowrap transition-all duration-200',
        active
          ? 'bg-gradient-luxury text-white shadow-gold'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-rose)]'
      )}
    >
      {label}
      <span
        className={cn(
          'text-xs px-1.5 py-0.5 rounded-full font-semibold',
          active ? 'bg-white/20 text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
        )}
      >
        {count}
      </span>
    </button>
  )
}

// ── Main Orders component ───────────────────────────────────────────────────
export default function Orders() {
  const { adminUser } = useAuth()
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Real-time subscription (last 500 for admin)
  useEffect(() => {
    const unsub = subscribeToOrders((orders) => {
      setAllOrders(orders)
      setLoading(false)
    }, 500)
    return unsub
  }, [])

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1)
  }, [filterStatus, search])

  // Filtered & searched orders
  const filteredOrders = useMemo(() => {
    let result = allOrders

    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus)
    }

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.includes(q)
      )
    }

    return result
  }, [allOrders, filterStatus, search])

  // Status tab counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allOrders.length }
    ALL_STATUSES.forEach((s) => {
      counts[s] = allOrders.filter((o) => o.status === s).length
    })
    return counts
  }, [allOrders])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Status update handler
  const handleStatusUpdate = useCallback(
    async (orderId: string, status: OrderStatus) => {
      setUpdatingId(orderId)
      setUpdateError(null)
      try {
        await updateOrderStatus(orderId, status, adminUser?.name ?? adminUser?.email ?? 'admin')
        // Update in local state immediately for snappy UX
        setAllOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        )
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => prev ? { ...prev, status } : prev)
        }
      } catch (err) {
        setUpdateError('Failed to update status. Please try again.')
        console.error(err)
      } finally {
        setUpdatingId(null)
      }
    },
    [adminUser, selectedOrder]
  )

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-luxury bg-gradient-luxury flex items-center justify-center shadow-gold">
          <ShoppingBag size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[var(--text-primary)]">
            Orders
          </h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">
            {loading ? 'Loading…' : `${allOrders.length} total orders · real-time`}
          </p>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-4 py-3 rounded-luxury bg-red-50 border border-red-200 text-red-700 font-sans text-sm"
          >
            <AlertCircle size={15} />
            {updateError}
            <button
              onClick={() => setUpdateError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters + search ── */}
      <div className="rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4">
        {/* Status tabs — horizontally scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <StatusTab
            label="All"
            count={statusCounts.all}
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
          />
          {ALL_STATUSES.map((s) => (
            <StatusTab
              key={s}
              label={STATUS_CONFIG[s].label}
              count={statusCounts[s] ?? 0}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            />
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, customer name or phone…"
            className="input-luxury pl-9 py-2.5 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--color-rose)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Orders table ── */}
      <div className="rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-2 border-[var(--color-rose)] border-t-transparent rounded-full animate-spin" />
            <p className="font-sans text-sm text-[var(--text-muted)]">Loading orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
              <Filter size={28} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="font-serif text-xl text-[var(--text-secondary)] mb-1">
                {search ? 'No orders found' : 'No orders here'}
              </p>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                {search
                  ? `No orders match "${search}"`
                  : filterStatus !== 'all'
                  ? `There are no ${STATUS_CONFIG[filterStatus as OrderStatus]?.label.toLowerCase()} orders.`
                  : 'Orders will appear here once customers start placing them.'}
              </p>
            </div>
            {(search || filterStatus !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilterStatus('all') }}
                className="btn-ghost text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <AnimatePresence mode="popLayout">
                    {pagedOrders.map((order, idx) => (
                      <motion.tr
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.03 * idx, duration: 0.25 }}
                        className="hover:bg-[var(--bg-muted)] transition-colors duration-150 group"
                      >
                        {/* Order ID */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold text-[var(--color-rose)] tracking-tight">
                            {order.id}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <p className="font-sans text-sm font-medium text-[var(--text-primary)]">
                            {order.customerName}
                          </p>
                          <p className="font-sans text-xs text-[var(--text-muted)]">{order.phone}</p>
                        </td>

                        {/* Items count */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 font-sans text-sm text-[var(--text-secondary)]">
                            <Package size={13} className="text-[var(--text-muted)]" />
                            {order.items?.length ?? 0}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="px-5 py-3.5">
                          <span className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                            {formatPrice(order.total)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5">
                          <span className="font-sans text-xs text-[var(--text-muted)]">
                            {order.createdAt ? formatDateTime(order.createdAt) : '—'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-luxury font-sans text-xs font-semibold text-[var(--color-rose)] border border-[var(--color-rose)]/30 hover:bg-[var(--color-rose)] hover:text-white hover:border-[var(--color-rose)] transition-all duration-200"
                          >
                            <Eye size={12} />
                            Details
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
                <p className="font-sans text-xs text-[var(--text-muted)]">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length} orders
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-luxury text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-rose)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page number pills */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - page) <= 1
                    )
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === 'ellipsis' ? (
                        <span
                          key={`e-${i}`}
                          className="px-1 font-sans text-sm text-[var(--text-muted)]"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={cn(
                            'w-8 h-8 rounded-luxury font-sans text-sm font-medium transition-all duration-200',
                            page === p
                              ? 'bg-gradient-luxury text-white shadow-gold'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-rose)]'
                          )}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-luxury text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-rose)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Row count footer when single page */}
            {totalPages === 1 && filteredOrders.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--border)]">
                <p className="font-sans text-xs text-[var(--text-muted)]">
                  {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                  {filterStatus !== 'all' && ` · ${STATUS_CONFIG[filterStatus as OrderStatus]?.label}`}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            key={selectedOrder.id}
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={handleStatusUpdate}
            updatingId={updatingId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
