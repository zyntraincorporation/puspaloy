// src/admin/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  Eye,
  Plus,
  Clock,
  Sparkles,
  Tag,
} from 'lucide-react'
import { subscribeToOrders } from '@/firebase/orders'
import { getAllProductsAdmin } from '@/firebase/products'
import { useAllCategories } from '@/hooks/useCategories'
import type { Order, OrderStatus } from '@/types'
import { formatPrice, formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

// ── Animation variants ──────────────────────────────────────────────────────
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
}

// ── Status badge ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-400',
  },
  shipped: {
    label: 'Shipped',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-400',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-400',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-400',
  },
  packed: {
    label: 'Packed',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-400',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
  },
  returned: {
    label: 'Returned',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-400',
  },
  exchange_requested: {
    label: 'Exchange Requested',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-400',
  },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold',
        cfg.bg,
        cfg.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// ── Stat card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  accentClass: string
  iconBg: string
}

function StatCard({ icon: Icon, label, value, subtext, accentClass, iconBg }: StatCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="relative overflow-hidden rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Subtle corner sparkle decoration */}
      <span className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-10 blur-xl" style={{ background: 'var(--color-rose)' }} />
      <Sparkles
        size={10}
        className={cn('absolute top-3 right-3 opacity-30', accentClass)}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1">
            {label}
          </p>
          <p className={cn('font-serif text-2xl md:text-3xl font-semibold truncate', accentClass)}>
            {value}
          </p>
          {subtext && (
            <p className="font-sans text-xs text-[var(--text-muted)] mt-1">{subtext}</p>
          )}
        </div>
        <div className={cn('flex-shrink-0 w-11 h-11 rounded-luxury flex items-center justify-center', iconBg)}>
          <Icon size={20} className={accentClass} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Real-time subscription — last 100 orders for stats
  useEffect(() => {
    const unsub = subscribeToOrders((incoming) => {
      setOrders(incoming)
      setOrdersLoading(false)
    }, 100)
    return unsub
  }, [])

  // Product count query
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => getAllProductsAdmin(200),
    staleTime: 5 * 60 * 1000,
  })

  // Category data
  const { data: allCategoriesData = [] } = useAllCategories()
  const nonArchivedCats = allCategoriesData.filter(c => !c.archived)
  const activeCats = nonArchivedCats.filter(c => c.active)
  const hiddenCats = nonArchivedCats.filter(c => !c.active)

  // Derived stats
  const totalOrders = orders.length
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total ?? 0), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const totalProducts = productsData?.products.length ?? 0

  // Recent 10 orders for table
  const recentOrders = orders.slice(0, 10)

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-luxury bg-gradient-luxury flex items-center justify-center shadow-gold">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[var(--text-primary)]">
              Dashboard
            </h1>
            <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">
              Real-time overview of your store
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/products/new"
            className="btn-primary py-2.5 px-4 text-sm"
          >
            <Plus size={15} />
            Add Product
          </Link>
          <Link
            to="/admin/orders"
            className="btn-secondary py-2.5 px-4 text-sm"
          >
            <Eye size={15} />
            View Orders
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={ordersLoading ? '—' : totalOrders.toLocaleString()}
          subtext={ordersLoading ? undefined : `${pendingOrders} pending`}
          accentClass="text-[var(--color-rose)]"
          iconBg="bg-rose-50"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={ordersLoading ? '—' : formatPrice(totalRevenue)}
          subtext="Excluding cancelled"
          accentClass="text-[var(--color-gold)]"
          iconBg="bg-amber-50"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={ordersLoading ? '—' : pendingOrders}
          subtext="Awaiting confirmation"
          accentClass="text-yellow-600"
          iconBg="bg-yellow-50"
        />
        <StatCard
          icon={Package}
          label="Total Products"
          value={totalProducts === 0 && !productsData ? '—' : totalProducts}
          subtext="All statuses"
          accentClass="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </motion.div>

      {/* ── Category overview ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.25 }}
        className="rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-[var(--color-rose)]" />
            <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)]">Categories</h2>
          </div>
          <Link
            to="/admin/categories"
            className="font-sans text-xs font-semibold text-[var(--color-rose)] hover:underline underline-offset-2"
          >
            Manage →
          </Link>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
          {[
            { label: 'Total Categories', value: nonArchivedCats.length, color: 'text-[var(--text-primary)]' },
            { label: 'Active (Visible)', value: activeCats.length, color: 'text-emerald-600' },
            { label: 'Hidden', value: hiddenCats.length, color: 'text-[var(--text-muted)]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 text-center">
              <p className={`font-serif text-2xl font-bold ${color}`}>{value}</p>
              <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {nonArchivedCats.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--border)]">
            <div className="flex flex-wrap gap-2">
              {activeCats.slice(0, 10).map(cat => (
                <Link
                  key={cat.id}
                  to={`/admin/categories`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-muted)] rounded-full font-sans text-xs text-[var(--text-secondary)] hover:text-[var(--color-rose)] transition-colors"
                >
                  {cat.icon && !cat.icon.startsWith('http') ? <span>{cat.icon}</span> : null}
                  {cat.name}
                  <span className="text-[var(--text-muted)] font-mono">·{cat.productCount ?? 0}</span>
                </Link>
              ))}
              {activeCats.length > 10 && (
                <span className="px-2.5 py-1 font-sans text-xs text-[var(--text-muted)]">+{activeCats.length - 10} more</span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Recent orders ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.35 }}
        className="rounded-luxury-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm"
      >
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[var(--color-rose)]" />
            <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
              Recent Orders
            </h2>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-muted)] font-sans text-xs font-medium text-[var(--text-muted)]">
              Last 10
            </span>
          </div>
          <Link
            to="/admin/orders"
            className="font-sans text-xs font-semibold text-[var(--color-rose)] hover:underline underline-offset-2"
          >
            View all →
          </Link>
        </div>

        {/* Table */}
        {ordersLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--color-rose)] border-t-transparent rounded-full animate-spin" />
              <p className="font-sans text-sm text-[var(--text-muted)]">Loading orders…</p>
            </div>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag size={36} className="text-[var(--text-muted)] opacity-40" />
            <p className="font-serif text-lg text-[var(--text-secondary)]">No orders yet</p>
            <p className="font-sans text-sm text-[var(--text-muted)]">
              Orders will appear here once customers start placing them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left font-sans text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentOrders.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.3 }}
                    className="hover:bg-[var(--bg-muted)] transition-colors duration-150 group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-[var(--color-rose)] tracking-tight">
                        {order.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-sans text-sm font-medium text-[var(--text-primary)]">
                        {order.customerName}
                      </p>
                      <p className="font-sans text-xs text-[var(--text-muted)]">{order.phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                        {formatPrice(order.total)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-sans text-xs text-[var(--text-muted)]">
                        {order.createdAt
                          ? formatDateTime(order.createdAt)
                          : '—'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
