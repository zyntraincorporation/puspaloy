// src/store/wishlistStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistItem {
  productId: string
  productName: string
  featuredImage: string
  price: number
  discountPrice: number | null
  slug: string
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  toggleItem: (item: WishlistItem) => void
  isWishlisted: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state
          return { items: [...state.items, item] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      toggleItem: (item) => {
        const { isWishlisted, addItem, removeItem } = get()
        if (isWishlisted(item.productId)) {
          removeItem(item.productId)
        } else {
          addItem(item)
        }
      },

      isWishlisted: (productId) => get().items.some((i) => i.productId === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'puspaloy-wishlist' }
  )
)
