// src/hooks/useCategories.ts
// FIXED: All query keys are consistent under ['categories'] prefix so that
// invalidateQueries({ queryKey: ['categories'] }) hits all sub-queries correctly.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  getActiveCategories,
  getAllCategories,
  subscribeToActiveCategories,
  subscribeToAllCategories,
} from '@/firebase/categories'
import type { Category } from '@/types'

// ── For frontend navigation (only active, non-archived categories) ──────────
export function useActiveCategories() {
  const qc = useQueryClient()

  useEffect(() => {
    // Live subscription writes directly into the cache
    const unsubscribe = subscribeToActiveCategories((data) => {
      qc.setQueryData(['categories', 'active'], data)
    })
    return () => unsubscribe()
  }, [qc])

  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: getActiveCategories,
    staleTime: Infinity, // Managed via real-time listener above
  })
}

// ── For frontend navigation — only categories that contain at least 1 product ─
// Derives from the already-cached active list (no extra Firestore query).
export function useNonEmptyActiveCategories() {
  const { data: categories = [], ...rest } = useActiveCategories()
  return { ...rest, data: categories }
}

// ── For Admin panel (all categories including archived) ─────────────────────
export function useAllCategories() {
  const qc = useQueryClient()

  useEffect(() => {
    // Live subscription writes directly into the cache
    const unsubscribe = subscribeToAllCategories((data) => {
      qc.setQueryData(['categories', 'all'], data)
    })
    return () => unsubscribe()
  }, [qc])

  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getAllCategories,
    staleTime: Infinity, // Managed via real-time listener above
  })
}

