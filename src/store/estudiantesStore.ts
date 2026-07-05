import { create } from 'zustand'
import {
  getAllGrados,
  createGrado,
  updateGrado,
  toggleGradoActivo,
  deleteGrado,
} from '../db/gradosSeccionesRepository'
import {
  getAllEstudiantes,
  createEstudiante,
  updateEstudiante,
  deactivateEstudiante,
  getEstudianteByCodigo,
  countEstudiantesByGrado,
  createEstudiantesBatch,
} from '../db/estudiantesRepository'
import type {
  Estudiante,
  EstudianteFormData,
  GradoSeccion,
  GradoSeccionFormData,
  FiltrosEstudiantes,
  FilaImportacion,
} from '../types'

interface EstudiantesState {
  estudiantes: Estudiante[]
  grados: (GradoSeccion & { estudianteCount: number })[]
  filtros: FiltrosEstudiantes
  loading: boolean
  importPreview: FilaImportacion[]
  importValidCount: number
  importErrorCount: number

  loadAll: () => Promise<void>
  loadGrados: () => Promise<void>

  setFiltros: (filtros: Partial<FiltrosEstudiantes>) => void
  estudiantesFiltrados: () => Estudiante[]

  crearGrado: (data: GradoSeccionFormData) => Promise<void>
  editarGrado: (id: string, data: GradoSeccionFormData) => Promise<void>
  alternarGradoActivo: (id: string) => Promise<void>
  eliminarGrado: (id: string) => Promise<void>

  crearEstudiante: (data: EstudianteFormData) => Promise<{ ok: boolean; error?: string }>
  editarEstudiante: (id: string, data: EstudianteFormData) => Promise<{ ok: boolean; error?: string }>
  alternarEstudianteActivo: (id: string) => Promise<void>

  prepararImportacion: (filas: FilaImportacion[]) => void
  limpiarImportacion: () => void
  confirmarImportacion: () => Promise<{ count: number; errores: string[] }>
}

export const useEstudiantesStore = create<EstudiantesState>((set, get) => ({
  estudiantes: [],
  grados: [],
  filtros: { busqueda: '', gradoSeccionId: '', activo: 'activos' },
  loading: false,
  importPreview: [],
  importValidCount: 0,
  importErrorCount: 0,

  loadAll: async () => {
    set({ loading: true })
    const [estudiantes, grados] = await Promise.all([
      getAllEstudiantes(),
      getAllGrados(),
    ])
    const gradosConCount = await Promise.all(
      grados.map(async (g) => ({
        ...g,
        estudianteCount: await countEstudiantesByGrado(g.id),
      })),
    )
    set({ estudiantes, grados: gradosConCount, loading: false })
  },

  loadGrados: async () => {
    const grados = await getAllGrados()
    const gradosConCount = await Promise.all(
      grados.map(async (g) => ({
        ...g,
        estudianteCount: await countEstudiantesByGrado(g.id),
      })),
    )
    set({ grados: gradosConCount })
  },

  setFiltros: (filtros) => {
    set((s) => ({ filtros: { ...s.filtros, ...filtros } }))
  },

  estudiantesFiltrados: () => {
    const { estudiantes, grados, filtros } = get()
    const gradoMap = new Map(grados.map((g) => [g.id, g]))

    return estudiantes.filter((e) => {
      if (filtros.activo === 'activos' && !e.activo) return false
      if (filtros.activo === 'inactivos' && e.activo) return false
      if (filtros.gradoSeccionId && e.gradoSeccionId !== filtros.gradoSeccionId) return false
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase()
        const nombre = e.nombreCompleto.toLowerCase()
        const grado = gradoMap.get(e.gradoSeccionId)?.nombre ?? ''
        if (
          !nombre.includes(q) &&
          !e.codigo.toLowerCase().includes(q) &&
          !grado.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  },

  crearGrado: async (data) => {
    await createGrado(data)
    await get().loadGrados()
  },

  editarGrado: async (id, data) => {
    await updateGrado(id, data)
    await get().loadGrados()
  },

  alternarGradoActivo: async (id) => {
    await toggleGradoActivo(id)
    await get().loadGrados()
  },

  eliminarGrado: async (id) => {
    await deleteGrado(id)
    await get().loadGrados()
  },

  crearEstudiante: async (data) => {
    const existente = await getEstudianteByCodigo(data.codigo)
    if (existente) {
      return { ok: false, error: 'Ya existe un estudiante activo con ese código/DNI' }
    }
    await createEstudiante(data)
    await get().loadAll()
    return { ok: true }
  },

  editarEstudiante: async (id, data) => {
    const existente = await getEstudianteByCodigo(data.codigo)
    if (existente && existente.id !== id) {
      return { ok: false, error: 'Ya existe otro estudiante activo con ese código/DNI' }
    }
    await updateEstudiante(id, data)
    await get().loadAll()
    return { ok: true }
  },

  alternarEstudianteActivo: async (id) => {
    await deactivateEstudiante(id)
    await get().loadAll()
  },

  prepararImportacion: (filas) => {
    const validas = filas.filter((f) => f.valida).length
    const errores = filas.filter((f) => !f.valida).length
    set({ importPreview: filas, importValidCount: validas, importErrorCount: errores })
  },

  limpiarImportacion: () => {
    set({ importPreview: [], importValidCount: 0, importErrorCount: 0 })
  },

  confirmarImportacion: async () => {
    const { importPreview } = get()
    const validas = importPreview.filter((f) => f.valida)
    const data: EstudianteFormData[] = validas.map((f) => ({
      codigo: f.codigo,
      nombreCompleto: f.nombreCompleto,
      gradoSeccionId: f.gradoSeccionId!,
    }))
    const result = await createEstudiantesBatch(data)
    await get().loadAll()
    return result
  },
}))
