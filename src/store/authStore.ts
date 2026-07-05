import { create } from 'zustand'
import { getDB } from '../db'
import { hashPassword, verifyPassword } from '../lib/crypto'
import type { RolUsuario } from '../types'

export type SafeUser = {
  id: string
  nombre: string
  username: string
  rol: RolUsuario
  gradosAsignados: string[]
}

type LoginResult =
  | { success: true }
  | { success: false; error: string }

interface AuthState {
  user: SafeUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>
  logout: () => void
  restoreSession: () => Promise<void>
  changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<boolean>
}

const SESSION_KEY = 'auth_session'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password, remember) => {
    try {
      const db = await getDB()
      const tx = db.transaction('usuarios', 'readonly')
      const index = tx.objectStore('usuarios').index('by-username')
      const user = await index.get(email)
      await tx.done

      if (!user || !user.activo) {
        return { success: false, error: 'Credenciales inválidas' }
      }

      const valid = await verifyPassword(password, user.passwordHash)
      if (!valid) {
        return { success: false, error: 'Credenciales inválidas' }
      }

      const safeUser: SafeUser = {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol,
        gradosAsignados: user.gradosAsignados,
      }

      const storage = remember ? localStorage : sessionStorage
      storage.setItem(SESSION_KEY, JSON.stringify(safeUser))

      set({ user: safeUser, isAuthenticated: true })
      return { success: true }
    } catch {
      return { success: false, error: 'Error al iniciar sesión. Verifica tu conexión.' }
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    set({ user: null, isAuthenticated: false })
  },

  restoreSession: async () => {
    try {
      const saved =
        localStorage.getItem(SESSION_KEY) ??
        sessionStorage.getItem(SESSION_KEY)

      if (!saved) {
        set({ isLoading: false })
        return
      }

      const safeUser = JSON.parse(saved) as SafeUser

      const db = await getDB()
      const tx = db.transaction('usuarios', 'readonly')
      const stored = await tx.objectStore('usuarios').get(safeUser.id)
      await tx.done

      if (stored && stored.activo) {
        set({ user: safeUser, isAuthenticated: true, isLoading: false })
      } else {
        localStorage.removeItem(SESSION_KEY)
        sessionStorage.removeItem(SESSION_KEY)
        set({ isLoading: false })
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      set({ isLoading: false })
    }
  },

  changePassword: async (userId, oldPassword, newPassword) => {
    try {
      const db = await getDB()
      const tx = db.transaction('usuarios', 'readwrite')
      const store = tx.objectStore('usuarios')
      const user = await store.get(userId)

      if (!user) return false

      const valid = await verifyPassword(oldPassword, user.passwordHash)
      if (!valid) return false

      user.passwordHash = await hashPassword(newPassword)
      await store.put(user)
      await tx.done
      return true
    } catch {
      return false
    }
  },
}))
