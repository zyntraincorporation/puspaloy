import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  getActiveCategories,
  getAllCategories,
  subscribeToActiveCategories,
  subscribeToAllCategories
} from '@/firebase/categories'

// For frontend navigation (only active categories)
export function useActiveCategories() {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubscribe = subscribeToActiveCategories((data) => {
      qc.setQueryData(['categories', 'active'], data)
    })
    return () => unsubscribe()
  }, [qc])

  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: getActiveCategories,
    staleTime: Infinity, // Manually managed via live listener
  })
}

// For Admin panel (all categories)
export function useAllCategories() {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubscribe = subscribeToAllCategories((data) => {
      qc.setQueryData(['categories', 'all'], data)
    })
    return () => unsubscribe()
  }, [qc])

  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getAllCategories,
    staleTime: Infinity,
  })
}
