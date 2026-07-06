import { create } from 'zustand'

interface ConnectionState {
  online: boolean
  init: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  init: () => {
    set({ online: navigator.onLine })
    window.addEventListener('online', () => set({ online: true }))
    window.addEventListener('offline', () => set({ online: false }))
  },
}))
