// src/admin/pages/Reviews.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Trash2, Star,
  MessageSquare, Clock, AlertTriangle, X, RefreshCw,
} from 'lucide-react'
import {
  getPendingReviews,
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  deleteReview,
} from '@/firebase/reviews'
import { useAuth } from '@/contexts/AuthContext'
import { StarRatingDisplay } from '@/components/shared/StarRating'
import { formatDate, formatDateTime, truncate } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { Review, ReviewStatus } from '@/types'

// ── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
  review: Review | null
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

function DeleteModal({ review, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  if (!review) return null
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        />
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
                Delete Review
              </h3>
              <p className="font-sans text-sm text-[var(--text-secondary)]">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {review.reviewerName}'s
                </span>{' '}
                review for <span className="font-semibold text-[var(--text-primary)]">"{review.productName}"</span>?
              </p>
              <p className="font-sans text-xs text-red-500 mt-1">This action cannot be undone.</p>
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
              {isDeleting ? 'Deleting…' : 'Delete Review'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Review Status Badge ───────────────────────────────────────────────────────

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-medium',
        status === 'approved' && 'bg-emerald-100 text-emerald-700',
        status === 'pending' && 'bg-amber-100 text-amber-700',
        status === 'rejected' && 'bg-red-100 text-red-700',
      )}
    >
      {status === 'approved' && <CheckCircle size={10} />}
      {status === 'pending' && <Clock size={10} />}
      {status === 'rejected' && <XCircle size={10} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ── Review Card ───────────────────────────────────────────────────────────────

interface ReviewCardProps {
  review: Review
  showActions: boolean
  onApprove?: () => void
  onReject?: () => void
  onDelete: () => void
  isApproving?: boolean
  isRejecting?: boolean
}

function ReviewCard({
  review,
  showActions,
  onApprove,
  onReject,
  onDelete,
  isApproving,
  isRejecting,
}: ReviewCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-luxury-lg border border-[var(--border)] p-4 sm:p-5 hover:border-[var(--color-rose)]/30 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="flex gap-4">
        {/* Product image */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-luxury overflow-hidden bg-[var(--bg-muted)]">
            {review.productImage ? (
              <img
                src={review.productImage}
                alt={review.productName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MessageSquare size={20} className="text-[var(--text-muted)]" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: product name + status */}
          <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="font-sans text-xs text-[var(--text-muted)] truncate">
                {review.productName}
              </p>
              <p className="font-sans text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                {review.reviewerName}
              </p>
            </div>
            <ReviewStatusBadge status={review.status} />
          </div>

          {/* Stars + date */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <StarRatingDisplay rating={review.rating} size={13} />
            <span className="font-sans text-xs text-[var(--text-muted)]">
              {review.createdAt ? formatDateTime(review.createdAt) : '—'}
            </span>
            {review.approvedAt && review.status === 'approved' && (
              <span className="font-sans text-xs text-emerald-600">
                Approved {formatDate(review.approvedAt)}
              </span>
            )}
          </div>

          {/* Comment */}
          <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed">
            {truncate(review.comment, 220)}
          </p>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
              {onApprove && review.status !== 'approved' && (
                <button
                  onClick={onApprove}
                  disabled={isApproving || isRejecting}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-luxury text-xs font-sans font-medium transition-all',
                    'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  <CheckCircle size={13} />
                  {isApproving ? 'Approving…' : 'Approve'}
                </button>
              )}
              {onReject && review.status !== 'rejected' && (
                <button
                  onClick={onReject}
                  disabled={isApproving || isRejecting}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-luxury text-xs font-sans font-medium transition-all',
                    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  <XCircle size={13} />
                  {isRejecting ? 'Rejecting…' : 'Reject'}
                </button>
              )}
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-luxury text-xs font-sans font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all ml-auto"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ReviewSkeleton() {
  return (
    <div
      className="rounded-luxury-lg border border-[var(--border)] p-4 sm:p-5"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-luxury bg-[var(--bg-muted)] animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[var(--bg-muted)] rounded animate-pulse w-1/3" />
          <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse w-1/4" />
          <div className="h-3 bg-[var(--bg-muted)] rounded animate-pulse w-2/3" />
          <div className="h-3 bg-[var(--bg-muted)] rounded animate-pulse w-full" />
          <div className="h-3 bg-[var(--bg-muted)] rounded animate-pulse w-4/5" />
        </div>
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mb-4">
        {isPending ? (
          <Clock size={28} className="text-[var(--text-muted)]" />
        ) : (
          <Star size={28} className="text-[var(--text-muted)]" />
        )}
      </div>
      <p className="font-serif text-lg text-[var(--text-secondary)] mb-1">
        {isPending ? 'No pending reviews' : 'No reviews yet'}
      </p>
      <p className="font-sans text-sm text-[var(--text-muted)]">
        {isPending
          ? 'All reviews have been moderated.'
          : 'Reviews submitted by customers will appear here.'}
      </p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = 'pending' | 'all'

export default function Reviews() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const adminUid = user?.uid ?? ''

  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────
  const pendingQuery = useQuery({
    queryKey: ['admin-reviews-pending'],
    queryFn: getPendingReviews,
    staleTime: 1000 * 30,
  })

  const allQuery = useQuery({
    queryKey: ['admin-reviews-all'],
    queryFn: getAllReviewsAdmin,
    staleTime: 1000 * 60,
    enabled: activeTab === 'all',
  })

  const pendingReviews = pendingQuery.data ?? []
  const allReviews = allQuery.data ?? []
  const pendingCount = pendingReviews.length

  // ── Approve mutation ─────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: ({ reviewId, productId }: { reviewId: string; productId: string }) =>
      approveReview(reviewId, adminUid, productId),
    onMutate: ({ reviewId }) => {
      setActioningId(reviewId)
      // Optimistic: remove from pending list
      queryClient.setQueryData<Review[]>(['admin-reviews-pending'], (old) =>
        old ? old.filter((r) => r.id !== reviewId) : old
      )
      // Optimistic: update in all-reviews list
      queryClient.setQueryData<Review[]>(['admin-reviews-all'], (old) =>
        old
          ? old.map((r) =>
              r.id === reviewId ? { ...r, status: 'approved' as ReviewStatus } : r
            )
          : old
      )
    },
    onSettled: () => {
      setActioningId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-all'] })
    },
  })

  // ── Reject mutation ──────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: (reviewId: string) => rejectReview(reviewId, adminUid),
    onMutate: (reviewId) => {
      setActioningId(reviewId)
      // Optimistic: remove from pending list
      queryClient.setQueryData<Review[]>(['admin-reviews-pending'], (old) =>
        old ? old.filter((r) => r.id !== reviewId) : old
      )
      // Optimistic: update in all-reviews list
      queryClient.setQueryData<Review[]>(['admin-reviews-all'], (old) =>
        old
          ? old.map((r) =>
              r.id === reviewId ? { ...r, status: 'rejected' as ReviewStatus } : r
            )
          : old
      )
    },
    onSettled: () => {
      setActioningId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-all'] })
    },
  })

  // ── Delete mutation ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: (_, reviewId) => {
      queryClient.setQueryData<Review[]>(['admin-reviews-pending'], (old) =>
        old ? old.filter((r) => r.id !== reviewId) : old
      )
      queryClient.setQueryData<Review[]>(['admin-reviews-all'], (old) =>
        old ? old.filter((r) => r.id !== reviewId) : old
      )
      setReviewToDelete(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-all'] })
    },
  })

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleApprove = (review: Review) => {
    approveMutation.mutate({ reviewId: review.id, productId: review.productId })
  }

  const handleReject = (review: Review) => {
    rejectMutation.mutate(review.id)
  }

  const currentQuery = activeTab === 'pending' ? pendingQuery : allQuery
  const currentReviews = activeTab === 'pending' ? pendingReviews : allReviews
  const isLoading = currentQuery.isLoading
  const isError = currentQuery.isError

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[var(--text-primary)]">
              Review Moderation
            </h1>
            <p className="font-sans text-sm text-[var(--text-secondary)] mt-0.5">
              Manage customer reviews for your products
            </p>
          </div>
          <button
            onClick={() => currentQuery.refetch()}
            disabled={currentQuery.isFetching}
            className="btn-ghost inline-flex items-center gap-2 text-sm px-3 py-2 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={cn(currentQuery.isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div
          className="rounded-luxury-lg border border-[var(--border)] overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex border-b border-[var(--border)]">
            {([
              { key: 'pending', label: 'Pending', count: pendingCount },
              { key: 'all', label: 'All Reviews', count: null },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 sm:flex-none px-5 py-3.5 flex items-center justify-center gap-2 font-sans text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
                  activeTab === key
                    ? 'border-[var(--color-rose)] text-[var(--color-rose)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                {label}
                {count !== null && count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-sans font-semibold',
                      activeTab === key
                        ? 'bg-[var(--color-rose)] text-white'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6">
            {isError && (
              <div className="rounded-luxury-lg p-6 text-center border border-red-200 bg-red-50">
                <p className="font-sans text-sm text-red-700">
                  Failed to load reviews. Please refresh.
                </p>
              </div>
            )}

            {!isError && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {isLoading ? (
                    [...Array(4)].map((_, i) => <ReviewSkeleton key={i} />)
                  ) : currentReviews.length === 0 ? (
                    <EmptyState isPending={activeTab === 'pending'} />
                  ) : (
                    currentReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        showActions
                        onApprove={activeTab === 'pending' || review.status !== 'approved'
                          ? () => handleApprove(review)
                          : undefined
                        }
                        onReject={activeTab === 'pending' || review.status !== 'rejected'
                          ? () => handleReject(review)
                          : undefined
                        }
                        onDelete={() => setReviewToDelete(review)}
                        isApproving={approveMutation.isPending && actioningId === review.id}
                        isRejecting={rejectMutation.isPending && actioningId === review.id}
                      />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Summary footer */}
            {!isLoading && !isError && currentReviews.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="font-sans text-xs text-[var(--text-muted)] text-center">
                  {activeTab === 'pending'
                    ? `${pendingCount} review${pendingCount !== 1 ? 's' : ''} awaiting moderation`
                    : `${allReviews.length} total review${allReviews.length !== 1 ? 's' : ''} • ${allReviews.filter(r => r.status === 'approved').length} approved · ${allReviews.filter(r => r.status === 'pending').length} pending · ${allReviews.filter(r => r.status === 'rejected').length} rejected`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {reviewToDelete && (
        <DeleteModal
          review={reviewToDelete}
          onConfirm={() => deleteMutation.mutate(reviewToDelete.id)}
          onCancel={() => setReviewToDelete(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </>
  )
}
