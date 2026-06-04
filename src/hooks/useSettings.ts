// src/hooks/useSettings.ts
import { useQuery } from '@tanstack/react-query'
import { getDeliverySettings } from '@/firebase/settings'

export function useDeliverySettings() {
  return useQuery({
    queryKey: ['settings', 'delivery'],
    queryFn: getDeliverySettings,
    staleTime: 10 * 60 * 1000,   // Cache 10 min — admin changes propagate quickly enough
    gcTime: 30 * 60 * 1000,
  })
}
