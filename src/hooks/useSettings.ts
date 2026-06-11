// src/hooks/useSettings.ts
import { useQuery } from '@tanstack/react-query'
import { getDeliverySettings } from '@/firebase/settings'
import { getGeneralSettings } from '@/firebase/content'

export function useDeliverySettings() {
  return useQuery({
    queryKey: ['settings', 'delivery'],
    queryFn: getDeliverySettings,
    staleTime: 10 * 60 * 1000,   // Cache 10 min — admin changes propagate quickly enough
    gcTime: 30 * 60 * 1000,
  })
}

export function useGeneralSettings() {
  return useQuery({
    queryKey: ['settings', 'general'],
    queryFn: getGeneralSettings,
    staleTime: 5 * 60 * 1000,    // Cache 5 min
    gcTime: 30 * 60 * 1000,
  })
}
