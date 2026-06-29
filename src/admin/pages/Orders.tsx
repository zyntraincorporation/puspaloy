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
  Truck,
  ExternalLink,
  Loader2,
  Download,
} from 'lucide-react'
import { subscribeToOrders, updateOrderStatusWithNote, saveCourierInfo } from '@/firebase/orders'
import type { Order, OrderStatus, CourierInfo } from '@/types'
import { formatPrice, formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { steadfastService } from '@/lib/courier/steadfast/service'
import { generateInvoicePDF } from '@/lib/invoice/generateInvoicePDF'

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
  'exchange_requested',
]

const FILTER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string; darkBg: string }
> = {
  pending: {
    label: 'Order Placed',
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
    label: 'Processing (Packed)',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-400',
    darkBg: 'bg-indigo-900/20',
  },
  packed: {
    label: 'Packed',
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
  out_for_delivery: {
    label: 'Out for Delivery',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
    darkBg: 'bg-orange-900/20',
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
  returned: {
    label: 'Returned',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-400',
    darkBg: 'bg-rose-900/20',
  },
  exchange_requested: {
    label: 'Exchange Requested',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-400',
    darkBg: 'bg-violet-900/20',
  },
}

// ── Toast system ─────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error'
interface Toast {
  id: string
  type: ToastType
  message: string
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-luxury shadow-2xl border max-w-sm',
              t.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            )}
          >
            {t.type === 'success' ? (
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            )}
            <p className="font-sans text-sm flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className={cn(
                'flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity',
                t.type === 'success' ? 'text-green-700' : 'text-red-700'
              )}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
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

// ── Courier badge (table) ────────────────────────────────────────────────────
function CourierBadge({ courier }: { courier?: CourierInfo }) {
  if (!courier) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-[var(--bg-muted)] text-[var(--text-muted)] whitespace-nowrap">
        No Courier
      </span>
    )
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap">
        <Truck size={10} />
        {courier.provider}
      </span>
      <span className="font-mono text-[10px] text-[var(--text-muted)] pl-0.5 truncate max-w-[100px]">
        {courier.trackingCode}
      </span>
    </div>
  )
}

// ── Steadfast courier section in modal ───────────────────────────────────────
interface SteadfastSectionProps {
  order: Order
  onParcelCreated: (courier: CourierInfo) => void
  onToast: (type: ToastType, message: string) => void
}

function SteadfastSection({ order, onParcelCreated, onToast }: SteadfastSectionProps) {
  const [creating, setCreating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const hasParcel = !!order.courier

  const handleCreate = async () => {
    if (hasParcel || creating) return
    setValidationError(null)
    setCreating(true)

    const result = await steadfastService.createParcel({ order })

    if (!result.success) {
      setCreating(false)
      setValidationError(result.message)
      onToast('error', result.message)
      return
    }

    // Save to Firestore
    try {
      await saveCourierInfo(order.id, result.courier)
      onParcelCreated(result.courier)
      onToast('success', `Parcel created! Tracking: ${result.courier.trackingCode}`)
    } catch (err) {
      console.error('[SteadfastSection] saveCourierInfo failed:', err)
      onToast('error', 'Parcel created on Steadfast but failed to save to database. Please note the tracking code manually.')
      // Still surface the courier info to local state so admin can see it
      onParcelCreated(result.courier)
    } finally {
      setCreating(false)
    }
  }

  return (
    <section>
      <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
        <Truck size={13} className="text-emerald-600" />
        Steadfast Courier
      </h3>

      {hasParcel ? (
        // ── Parcel info ────────────────────────────────────────────────────────
        <div className="rounded-luxury border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10 dark:border-emerald-800/40 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-sans text-xs font-semibold text-emerald-700">Parcel Created</p>
                <p className="font-sans text-[10px] text-emerald-600/70">
                  {order.courier!.provider} Courier
                </p>
              </div>
            </div>
            {/* View Tracking button */}
            <a
              href={steadfastService.trackingUrl(order.courier!.trackingCode)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-luxury font-sans text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200 shadow-sm"
            >
              <ExternalLink size={11} />
              View Tracking
            </a>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-emerald-200/60">
            <div>
              <p className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                Parcel ID
              </p>
              <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                {order.courier!.parcelId}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                Tracking Code
              </p>
              <p className="font-mono text-xs font-semibold text-emerald-700">
                {order.courier!.trackingCode}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                Consignment ID
              </p>
              <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                {order.courier!.consignmentId}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                Courier Status
              </p>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 capitalize">
                {order.courier!.status}
              </span>
            </div>
            {order.courier!.createdAt && (
              <div className="col-span-2">
                <p className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                  Created
                </p>
                <p className="font-sans text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <Clock size={10} className="text-[var(--text-muted)]" />
                  {(() => {
                    try {
                      const ts = order.courier!.createdAt
                      if (ts && typeof (ts as unknown as { toDate: () => Date }).toDate === 'function') {
                        return formatDateTime(ts as unknown as { toDate: () => Date })
                      }
                    } catch { /* ignore */ }
                    return 'Just now'
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── Create parcel panel ────────────────────────────────────────────────
        <div className="rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)] p-4 space-y-3">
          <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed">
            No courier parcel has been created for this order yet. Click below to send this order to{' '}
            <strong className="text-[var(--text-primary)]">Steadfast Courier</strong>.
          </p>

          {/* Validation error */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start gap-2 px-3 py-2.5 rounded-luxury bg-red-50 border border-red-200 text-red-700"
              >
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p className="font-sans text-xs leading-snug">{validationError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* COD preview */}
          <div className="flex items-center justify-between px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border)]">
            <p className="font-sans text-xs text-[var(--text-muted)]">COD Amount (= Order Total)</p>
            <p className="font-sans text-sm font-bold text-[var(--color-rose)]">
              {formatPrice(order.total)}
            </p>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-luxury font-sans text-sm font-semibold transition-all duration-200 shadow-sm',
              creating
                ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            {creating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Creating Parcel…
              </>
            ) : (
              <>
                <Truck size={15} />
                Create Steadfast Parcel
              </>
            )}
          </button>

          <p className="font-sans text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
            This will submit the order to Steadfast Courier API and save the tracking information.
          </p>
        </div>
      )}
    </section>
  )
}

// ── Order detail modal ────────────────────────────────────────────────────────
interface OrderDetailModalProps {
  order: Order
  onClose: () => void
  onStatusUpdate: (orderId: string, status: OrderStatus, note: string) => Promise<void>
  onParcelCreated: (orderId: string, courier: CourierInfo) => void
  onToast: (type: ToastType, message: string) => void
  updatingId: string | null
}

function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
  onParcelCreated,
  onToast,
  updatingId,
}: OrderDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status)
  const [trackingNote, setTrackingNote] = useState(order.trackingNote ?? '')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [localOrder, setLocalOrder] = useState<Order>(order)
  const [isDownloading, setIsDownloading] = useState(false)
  const isUpdating = updatingId === order.id

  // Keep localOrder in sync when parent order changes (e.g. real-time update)
  useEffect(() => {
    setLocalOrder(order)
  }, [order])

  const effectiveItemPrice = (item: Order['items'][0]) =>
    item.flashSalePrice ?? item.discountPrice ?? item.price

  const handleStatusChange = async () => {
    if (selectedStatus === localOrder.status && trackingNote === (localOrder.trackingNote ?? '')) return
    await onStatusUpdate(localOrder.id, selectedStatus, trackingNote.trim())
    setUpdateSuccess(true)
    setTimeout(() => setUpdateSuccess(false), 2500)
  }

  const hasChanges =
    selectedStatus !== localOrder.status || trackingNote.trim() !== (localOrder.trackingNote ?? '').trim()

  const paymentMethodLabel: Record<string, string> = {
    cod: 'Cash on Delivery',
    bkash: 'bKash',
    nagad: 'Nagad',
  }

  const handleParcelCreated = (courier: CourierInfo) => {
    setLocalOrder((prev) => ({ ...prev, courier }))
    onParcelCreated(localOrder.id, courier)
  }

  const handleDownloadInvoice = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await generateInvoicePDF(localOrder)
    } catch (err) {
      console.error('Failed to generate invoice PDF:', err)
      onToast('error', 'Failed to generate invoice PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
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
            <h2 className="font-mono text-base font-bold text-[var(--color-rose)]">{localOrder.id}</h2>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Placed {localOrder.createdAt ? formatDateTime(localOrder.createdAt) : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={localOrder.status} />
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
                      {localOrder.customerName?.[0]?.toUpperCase() ?? 'C'}
                    </span>
                  </div>
                  <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                    {localOrder.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Phone size={13} className="text-[var(--text-muted)]" />
                  <span className="font-sans text-sm">{localOrder.phone}</span>
                </div>
                {localOrder.email && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Mail size={13} className="text-[var(--text-muted)]" />
                    <span className="font-sans text-sm">{localOrder.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <MapPin size={13} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                  <span className="font-sans text-sm leading-snug">
                    {localOrder.address}, {localOrder.district}
                  </span>
                </div>
                {localOrder.notes && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <p className="font-sans text-xs text-[var(--text-muted)] mb-1">Note from customer:</p>
                    <p className="font-sans text-sm text-[var(--text-secondary)] italic">"{localOrder.notes}"</p>
                  </div>
                )}
              </div>
            </section>

            {/* Order items */}
            <section>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Items ({localOrder.items?.length ?? 0})
              </h3>
              <div className="space-y-2">
                {localOrder.items?.map((item, i) => (
                  <div
                    key={`${item.productId}-${i}`}
                    className="flex items-center gap-3 rounded-luxury border border-[var(--border)] bg-[var(--bg-muted)] p-3"
                  >
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
                  <span>{formatPrice(localOrder.subtotal)}</span>
                </div>
                {localOrder.couponDiscount > 0 && (
                  <div className="flex justify-between font-sans text-sm text-green-600">
                    <span>
                      Coupon
                      {localOrder.couponCode && (
                        <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-xs font-mono">
                          {localOrder.couponCode}
                        </span>
                      )}
                    </span>
                    <span>−{formatPrice(localOrder.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-sans text-sm text-[var(--text-secondary)]">
                  <span>Delivery</span>
                  <span>
                    {localOrder.deliveryCharge === 0
                      ? <span className="text-green-600 font-semibold">Free</span>
                      : formatPrice(localOrder.deliveryCharge)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[var(--border)] flex justify-between font-sans text-base font-bold text-[var(--text-primary)]">
                  <span>Total</span>
                  <span className="text-[var(--color-rose)]">{formatPrice(localOrder.total)}</span>
                </div>
                <div className="pt-1 flex justify-between font-sans text-xs text-[var(--text-muted)]">
                  <span>Payment Method</span>
                  <span className="capitalize">
                    {paymentMethodLabel[localOrder.paymentMethod] ?? localOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between font-sans text-xs text-[var(--text-muted)]">
                  <span>Payment Status</span>
                  <span
                    className={cn(
                      'capitalize font-semibold',
                      localOrder.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    )}
                  >
                    {localOrder.paymentStatus}
                  </span>
                </div>
              </div>
            </section>

            {/* ── Steadfast Courier section ── */}
            <SteadfastSection
              order={localOrder}
              onParcelCreated={handleParcelCreated}
              onToast={onToast}
            />

            {/* Current tracking note */}
            {localOrder.trackingNote && (
              <section>
                <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                  Current Tracking Note
                </h3>
                <div className="rounded-luxury border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-3">
                  <p className="font-sans text-sm text-[var(--text-secondary)] italic leading-relaxed">
                    "{localOrder.trackingNote}"
                  </p>
                  <p className="font-sans text-[10px] text-[var(--text-muted)] mt-1.5">
                    Visible to customer on tracking page
                  </p>
                </div>
              </section>
            )}

            {/* Status history */}
            {localOrder.statusHistory && localOrder.statusHistory.length > 0 && (
              <section>
                <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                  Status History
                </h3>
                <div className="space-y-2">
                  {[...localOrder.statusHistory].reverse().map((hist, i) => {
                    const cfg = STATUS_CONFIG[hist.status] ?? STATUS_CONFIG.pending
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 font-sans text-sm"
                      >
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                        <span className={cn('font-semibold', cfg.text, 'w-28 flex-shrink-0')}>
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
        <div className="flex-shrink-0 border-t border-[var(--border)] p-4 space-y-3">
          {/* Status selector */}
          <div>
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

          {/* Tracking note */}
          <div>
            <label className="font-sans text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
              Tracking Note{' '}
              <span className="font-normal text-[var(--text-muted)] normal-case tracking-normal">
                (optional · shown to customer)
              </span>
            </label>
            <textarea
              value={trackingNote}
              onChange={(e) => setTrackingNote(e.target.value)}
              disabled={isUpdating}
              placeholder="e.g. Courier has received the parcel. Package reached Dhaka hub."
              rows={2}
              className="input-luxury py-2 text-sm resize-none w-full"
            />
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between gap-3">
            {/* Download Invoice PDF */}
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-luxury border border-[var(--color-rose)] text-[var(--color-rose)] font-sans text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download Invoice PDF
                </>
              )}
            </button>

            {/* Save status changes */}
            <button
              onClick={handleStatusChange}
              disabled={isUpdating || !hasChanges}
              className={cn(
                'btn-primary py-2.5 px-6 text-sm',
                updateSuccess && 'bg-green-500 hover:bg-green-500'
              )}
            >
              {isUpdating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving…
                </>
              ) : updateSuccess ? (
                <>
                  <CheckCircle2 size={14} />
                  Saved!
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Status filter tab ─────────────────────────────────────────────────────────
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

// ── Main Orders component ─────────────────────────────────────────────────────
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
  const [toasts, setToasts] = useState<Toast[]>([])

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToOrders((orders) => {
      setAllOrders(orders)
      setLoading(false)
    }, 500)
    return unsub
  }, [])

  // Reset page on filter/search change
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
    async (orderId: string, status: OrderStatus, trackingNote: string) => {
      setUpdatingId(orderId)
      setUpdateError(null)
      try {
        await updateOrderStatusWithNote(
          orderId,
          status,
          adminUser?.name ?? adminUser?.email ?? 'admin',
          trackingNote || null
        )
        setAllOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status, trackingNote: trackingNote || null } : o))
        )
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status, trackingNote: trackingNote || null } : prev
          )
        }
      } catch (err) {
        setUpdateError('Failed to update. Please try again.')
        console.error(err)
      } finally {
        setUpdatingId(null)
      }
    },
    [adminUser, selectedOrder]
  )

  // Parcel created handler — updates both allOrders list and selectedOrder
  const handleParcelCreated = useCallback((orderId: string, courier: CourierInfo) => {
    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, courier } : o))
    )
    setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, courier } : prev))
  }, [])

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
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <StatusTab
            label="All"
            count={statusCounts.all}
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
          />
          {FILTER_STATUSES.map((s) => (
            <StatusTab
              key={s}
              label={STATUS_CONFIG[s].label}
              count={statusCounts[s] ?? 0}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            />
          ))}
        </div>

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
              <table className="w-full min-w-[840px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Courier', 'Date', 'Actions'].map(
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

                        {/* Courier */}
                        <td className="px-5 py-3.5">
                          <CourierBadge courier={order.courier} />
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
            onParcelCreated={handleParcelCreated}
            onToast={addToast}
            updatingId={updatingId}
          />
        )}
      </AnimatePresence>

      {/* ── Toast notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
