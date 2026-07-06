import { getDB } from '.'
import { getAllTiposRegistro } from './tiposRegistroRepository'
import type { TipoRegistro, CategoriaOpcion } from '../types'

const DESACTIVAR_SEED = false

const seedData: Omit<TipoRegistro, 'id'>[] = [
  {
    nombre: 'Asistencia',
    descripcion: 'Registro de asistencia diaria de los estudiantes',
    categorias: [
      { id: crypto.randomUUID(), nombre: 'Presente', color: 'success', orden: 1 },
      { id: crypto.randomUUID(), nombre: 'Tardanza', color: 'warning', orden: 2 },
      { id: crypto.randomUUID(), nombre: 'Ausente', color: 'error', orden: 3 },
      { id: crypto.randomUUID(), nombre: 'Justificado', color: 'info', orden: 4 },
    ] as CategoriaOpcion[],
    activo: true,
    orden: 1,
    obligatorio: true,
    updatedAt: new Date().toISOString(),
  },
  {
    nombre: 'Uniforme',
    descripcion: 'Control de uso de uniforme escolar',
    categorias: [
      { id: crypto.randomUUID(), nombre: 'Sí', color: 'success', orden: 1 },
      { id: crypto.randomUUID(), nombre: 'No', color: 'error', orden: 2 },
    ] as CategoriaOpcion[],
    activo: true,
    orden: 2,
    obligatorio: false,
    updatedAt: new Date().toISOString(),
  },
  {
    nombre: 'Cabello',
    descripcion: 'Control de corte y presentación del cabello',
    categorias: [
      { id: crypto.randomUUID(), nombre: 'Sí', color: 'success', orden: 1 },
      { id: crypto.randomUUID(), nombre: 'No', color: 'error', orden: 2 },
    ] as CategoriaOpcion[],
    activo: true,
    orden: 3,
    obligatorio: false,
    updatedAt: new Date().toISOString(),
  },
]

export async function seedTiposRegistro(): Promise<void> {
  if (DESACTIVAR_SEED) return

  const existentes = await getAllTiposRegistro()
  if (existentes.length > 0) return

  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readwrite')
  const store = tx.objectStore('tiposRegistro')

  for (const data of seedData) {
    await store.put({ ...data, id: crypto.randomUUID() })
  }

  await tx.done
}
