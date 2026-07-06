import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
  show: (message: string, type?: ToastType) => void
  hide: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'success',
  visible: false,
  show: (message, type = 'success') => {
    set({ message, type, visible: true })
    setTimeout(() => set({ visible: false }), 3500)
  },
  hide: () => set({ visible: false }),
}))
