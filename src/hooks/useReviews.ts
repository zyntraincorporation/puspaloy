// src/hooks/useReviews.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovedReviews, submitReview } from '@/firebase/reviews'
import type { Review } from '@/types'

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getApprovedReviews(productId),
    staleTime: 5 * 60 * 1000,
    enabled: !!productId,
  })
}

export function useSubmitReview(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Review, 'id' | 'status' | 'createdAt' | 'approvedAt' | 'approvedBy'>) =>
      submitReview(data),
    onSuccess: () => {
      // Invalidate the reviews list on success (though it's pending, UX-wise we just show a thank-you)
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
    },
  })
}
