// src/admin/pages/Products/ProductList.tsx
import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, Package,
  ChevronLeft, ChevronRight, X, AlertTriangle,
  ToggleLeft, ToggleRight, Filter,
} from 'lucide-react'
import { getAllProductsAdmin, deleteProduct, updateProduct } from '@/firebase/products'
import { formatPrice } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { Product, ProductCategory, ProductStatus } from '@/types'

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

type CategoryFilter = 'all' | ProductCategory
type StatusFilter = 'all' | ProductStatus

const CATEGORY_PILLS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'cosmetics', label: 'Cosmetics' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'gifts', label: 'Gifts' },
  { value: 'personalized-gifts', label: 'Personalized' },
  { value: 'accessories', label: 'Accessories' },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium',
        status === 'active' && 'bg-emerald-100 text-emerald-700',
        status === 'draft' && 'bg-gray-100 text-gray-600',
        status === 'out_of_stock' && 'bg-red-100 text-red-700',
      )}
    >
      {status === 'active' ? 'Active' : status === 'draft' ? 'Draft' : 'Out of Stock'}
    </span>
  )
}

function StockBadge({ stock }: { stock: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-semibold',
        stock > 10 && 'bg-emerald-100 text-emerald-700',
        stock >= 1 && stock <= 10 && 'bg-amber-100 text-amber-700',
        stock === 0 && 'bg-red-100 text-red-700',
      )}
    >
      {stock}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border)]">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse" style={{ width: i === 0 ? '40px' : i === 1 ? '80%' : '60%' }} />
        </td>
      ))}
    </tr>
  )
}

// ── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
  product: Product | null
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

function DeleteModal({ product, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  if (!product) return null
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md rounded-luxury-lg shadow-luxury p-6"
          style={{ backgroundColor: 'var(--bg-surface)' }}
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-1">
                Delete Product
              </h3>
              <p className="font-sans text-sm text-[var(--text-secondary)] mb-1">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-[var(--text-primary)]">"{product.name}"</span>?
              </p>
              <p className="font-sans text-xs text-red-500">
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 rounded-full hover:bg-[var(--bg-muted)] transition-colors"
            >
              <X size={16} className="text-[var(--text-muted)]" />
            </button>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="btn-secondary text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-sans font-medium rounded-luxury bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting…' : 'Delete Product'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProductList() {
  const queryClient = useQueryClient()

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products-all'],
    queryFn: async () => {
      // Fetch all products (up to 500 for admin; paginate client-side)
      const result = await getAllProductsAdmin(500)
      return result.products
    },
    staleTime: 1000 * 60 * 2, // 2 min
  })

  const allProducts = data ?? []

  // ── Filtered + paginated products ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allProducts

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter)
    }

    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter)
    }

    return list
  }, [allProducts, searchQuery, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageProducts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 whenever filters change
  const handleFilterChange = useCallback((fn: () => void) => {
    fn()
    setCurrentPage(1)
  }, [])

  // ── Delete mutation ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-all'] })
      setProductToDelete(null)
    },
  })

  // ── Status toggle mutation ─────────────────────────────────────────────────
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      updateProduct(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-products-all'] })
      const previous = queryClient.getQueryData<Product[]>(['admin-products-all'])
      queryClient.setQueryData<Product[]>(['admin-products-all'], (old) =>
        old ? old.map((p) => (p.id === id ? { ...p, status } : p)) : old
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin-products-all'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-all'] })
    },
  })

  const handleToggleStatus = (product: Product) => {
    const next: ProductStatus = product.status === 'active' ? 'draft' : 'active'
    toggleStatusMutation.mutate({ id: product.id, status: next })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[var(--text-primary)]">
              Products
            </h1>
            <p className="font-sans text-sm text-[var(--text-secondary)] mt-0.5">
              {isLoading ? 'Loading…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link
            to="/admin/products/new"
            className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2.5"
          >
            <Plus size={16} />
            Add Product
          </Link>
        </div>

        {/* Filters */}
        <div
          className="rounded-luxury-lg p-4 space-y-4 border border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search by name or SKU…"
              value={searchQuery}
              onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
              className="input-luxury pl-9 pr-4 py-2.5 text-sm w-full"
            />
          </div>

          {/* Category pills + Status filter row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_PILLS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange(() => setCategoryFilter(value))}
                  className={cn(
                    'px-3 py-1.5 text-xs font-sans font-medium rounded-full border transition-all duration-150',
                    categoryFilter === value
                      ? 'bg-gradient-luxury text-white border-transparent shadow-gold'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Status select */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--text-muted)]" />
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(() => setStatusFilter(e.target.value as StatusFilter))}
                className="input-luxury py-1.5 text-sm pr-8 appearance-none bg-no-repeat"
                style={{ backgroundImage: 'none' }}
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div className="rounded-luxury-lg p-6 text-center border border-red-200 bg-red-50">
            <p className="font-sans text-sm text-red-700">
              Failed to load products. Please refresh the page.
            </p>
          </div>
        )}

        {/* Table */}
        {!isError && (
          <div
            className="rounded-luxury-lg border border-[var(--border)] overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border)]" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide w-14">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Name / SKU
                    </th>
                    <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide w-20">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                    : pageProducts.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <Package size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                          <p className="font-serif text-base text-[var(--text-secondary)]">No products found</p>
                          <p className="font-sans text-sm text-[var(--text-muted)] mt-1">
                            Try adjusting your search or filters
                          </p>
                        </td>
                      </tr>
                    )
                    : pageProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onDelete={() => setProductToDelete(product)}
                        onToggleStatus={() => handleToggleStatus(product)}
                        isTogglingStatus={toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === product.id}
                      />
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                <p className="font-sans text-xs text-[var(--text-muted)]">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-luxury border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1
                    if (totalPages > 7 && Math.abs(page - safePage) > 2 && page !== 1 && page !== totalPages) {
                      if (page === safePage - 3 || page === safePage + 3) {
                        return <span key={page} className="px-1 text-[var(--text-muted)] text-xs">…</span>
                      }
                      return null
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'w-7 h-7 text-xs font-sans rounded-luxury border transition-all',
                          safePage === page
                            ? 'bg-gradient-luxury text-white border-transparent shadow-gold'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]'
                        )}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-luxury border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {productToDelete && (
        <DeleteModal
          product={productToDelete}
          onConfirm={() => deleteMutation.mutate(productToDelete.id)}
          onCancel={() => setProductToDelete(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </>
  )
}

// ── Product Row ───────────────────────────────────────────────────────────────

interface ProductRowProps {
  product: Product
  onDelete: () => void
  onToggleStatus: () => void
  isTogglingStatus: boolean
}

function ProductRow({ product, onDelete, onToggleStatus, isTogglingStatus }: ProductRowProps) {
  const categoryLabel = product.category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors duration-150 group"
    >
      {/* Thumbnail */}
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-luxury overflow-hidden flex-shrink-0 bg-[var(--bg-muted)]">
          {product.featuredImage ? (
            <img
              src={product.featuredImage}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={16} className="text-[var(--text-muted)]" />
            </div>
          )}
        </div>
      </td>

      {/* Name + SKU */}
      <td className="px-4 py-3 max-w-[220px]">
        <p className="font-sans text-sm font-medium text-[var(--text-primary)] truncate">
          {product.name}
        </p>
        <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
          SKU: {product.sku}
        </p>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span className="font-sans text-sm text-[var(--text-secondary)]">{categoryLabel}</span>
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        {product.discountPrice ? (
          <div>
            <p className="font-sans text-sm font-semibold text-[var(--color-rose)]">
              {formatPrice(product.discountPrice)}
            </p>
            <p className="font-sans text-xs text-[var(--text-muted)] line-through">
              {formatPrice(product.price)}
            </p>
          </div>
        ) : (
          <p className="font-sans text-sm font-semibold text-[var(--text-primary)]">
            {formatPrice(product.price)}
          </p>
        )}
      </td>

      {/* Stock */}
      <td className="px-4 py-3 text-center">
        <StockBadge stock={product.stock} />
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        <StatusBadge status={product.status} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          {/* Toggle status (active ↔ draft) */}
          <button
            onClick={onToggleStatus}
            disabled={isTogglingStatus || product.status === 'out_of_stock'}
            title={product.status === 'active' ? 'Set to Draft' : 'Set to Active'}
            className={cn(
              'p-1.5 rounded-luxury transition-colors',
              product.status === 'active'
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-gray-400 hover:bg-gray-100',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {product.status === 'active'
              ? <ToggleRight size={17} />
              : <ToggleLeft size={17} />
            }
          </button>

          {/* Edit */}
          <Link
            to={`/admin/products/edit/${product.id}`}
            title="Edit product"
            className="p-1.5 rounded-luxury text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-rose)] transition-colors"
          >
            <Edit2 size={15} />
          </Link>

          {/* Delete */}
          <button
            onClick={onDelete}
            title="Delete product"
            className="p-1.5 rounded-luxury text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}
