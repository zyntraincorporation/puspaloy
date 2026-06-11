// src/hooks/useAnnouncements.ts
// Real-time hooks for announcements — mirrors the pattern used in useCategories.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  getAllAnnouncements,
  subscribeToActiveAnnouncements,
  subscribeToAllAnnouncements,
} from '@/firebase/announcements'

// ── Frontend: only active announcements, live subscription ──────────────────
export function useActiveAnnouncements() {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubscribe = subscribeToActiveAnnouncements((data) => {
      qc.setQueryData(['announcements', 'active'], data)
    })
    return () => unsubscribe()
  }, [qc])

  return useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: async () => {
      const all = await getAllAnnouncements()
      return all.filter(a => a.active)
    },
    staleTime: Infinity, // managed via real-time listener above
  })
}

// ── Admin panel: all announcements, live subscription ───────────────────────
export function useAllAnnouncements() {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubscribe = subscribeToAllAnnouncements((data) => {
      qc.setQueryData(['announcements', 'all'], data)
    })
    return () => unsubscribe()
  }, [qc])

  return useQuery({
    queryKey: ['announcements', 'all'],
    queryFn: getAllAnnouncements,
    staleTime: Infinity, // managed via real-time listener above
  })
}
