import { create } from 'zustand'
import {
  getAllTiposRegistro,
  createTipoRegistro,
  updateTipoRegistro,
  toggleTipoRegistroActivo,
  reordenarTipoRegistro,
  tieneRegistrosAsociados,
  deleteTipoRegistro,
} from '../db/tiposRegistroRepository'
import type { TipoRegistro, TipoRegistroFormData } from '../types'

interface TiposRegistroState {
  tipos: TipoRegistro[]
  loading: boolean
  load: () => Promise<void>
  crear: (data: TipoRegistroFormData) => Promise<void>
  editar: (id: string, data: TipoRegistroFormData) => Promise<void>
  alternarActivo: (id: string) => Promise<void>
  subirOrden: (id: string) => Promise<void>
  bajarOrden: (id: string) => Promise<void>
  eliminar: (id: string) => Promise<{ ok: boolean; error?: string }>
}

export const useTiposRegistroStore = create<TiposRegistroState>((set, get) => ({
  tipos: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const tipos = await getAllTiposRegistro()
    set({ tipos, loading: false })
  },

  crear: async (data) => {
    const { tipos } = get()
    const maxOrden = tipos.reduce((m, t) => Math.max(m, t.orden), 0)
    await createTipoRegistro(data, maxOrden + 1)
    await get().load()
  },

  editar: async (id, data) => {
    await updateTipoRegistro(id, data)
    await get().load()
  },

  alternarActivo: async (id) => {
    await toggleTipoRegistroActivo(id)
    await get().load()
  },

  subirOrden: async (id) => {
    const { tipos } = get()
    const idx = tipos.findIndex((t) => t.id === id)
    if (idx <= 0) return
    const prev = tipos[idx - 1]
    const curr = tipos[idx]
    await reordenarTipoRegistro(curr.id, prev.orden)
    await reordenarTipoRegistro(prev.id, curr.orden)
    await get().load()
  },

  bajarOrden: async (id) => {
    const { tipos } = get()
    const idx = tipos.findIndex((t) => t.id === id)
    if (idx === -1 || idx >= tipos.length - 1) return
    const next = tipos[idx + 1]
    const curr = tipos[idx]
    await reordenarTipoRegistro(curr.id, next.orden)
    await reordenarTipoRegistro(next.id, curr.orden)
    await get().load()
  },

  eliminar: async (id) => {
    const tiene = await tieneRegistrosAsociados(id)
    if (tiene) {
      return { ok: false, error: 'Este tipo de registro tiene registros históricos asociados. Solo puedes desactivarlo, no eliminarlo.' }
    }
    await deleteTipoRegistro(id)
    await get().load()
    return { ok: true }
  },
}))
