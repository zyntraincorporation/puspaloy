// src/store/zyntraStore.ts
import { create } from 'zustand'
import type { ZyntraMessage, ZyntraOrderDraft, ZyntraOrderStep } from '@/types'

interface ZyntraStore {
  isOpen: boolean
  messages: ZyntraMessage[]
  isLoading: boolean
  orderStep: ZyntraOrderStep
  orderDraft: ZyntraOrderDraft
  sessionMessageCount: number

  // Actions
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  addMessage: (message: ZyntraMessage) => void
  setLoading: (loading: boolean) => void
  setOrderStep: (step: ZyntraOrderStep) => void
  updateOrderDraft: (updates: Partial<ZyntraOrderDraft>) => void
  resetOrder: () => void
  clearChat: () => void
  incrementMessageCount: () => void
}

const defaultOrderDraft: ZyntraOrderDraft = {
  productId: null,
  productName: null,
  quantity: 1,
  customerName: null,
  phone: null,
  district: null,
  address: null,
}

export const useZyntraStore = create<ZyntraStore>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  orderStep: 'idle',
  orderDraft: defaultOrderDraft,
  sessionMessageCount: 0,

  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  setLoading: (loading) => set({ isLoading: loading }),
  setOrderStep: (step) => set({ orderStep: step }),

  updateOrderDraft: (updates) =>
    set((s) => ({ orderDraft: { ...s.orderDraft, ...updates } })),

  resetOrder: () =>
    set({ orderStep: 'idle', orderDraft: defaultOrderDraft }),

  clearChat: () =>
    set({ messages: [], orderStep: 'idle', orderDraft: defaultOrderDraft }),

  incrementMessageCount: () =>
    set((s) => ({ sessionMessageCount: s.sessionMessageCount + 1 })),
}))
