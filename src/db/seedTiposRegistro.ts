import { getDB } from '.'
import { getAllTiposRegistro } from './tiposRegistroRepository'
import type { TipoRegistro, CategoriaOpcion } from '../types'

const DESACTIVAR_SEED = false

const seedData: (Omit<TipoRegistro, 'id'> & { id: string })[] = [
  {
    id: 'seed-tipo-asistencia',
    nombre: 'Asistencia',
    descripcion: 'Registro de asistencia diaria de los estudiantes',
    categorias: [
      { id: 'seed-cat-asistencia-presente', nombre: 'Presente', color: 'success', orden: 1 },
      { id: 'seed-cat-asistencia-tardanza', nombre: 'Tardanza', color: 'warning', orden: 2 },
      { id: 'seed-cat-asistencia-ausente', nombre: 'Ausente', color: 'error', orden: 3 },
      { id: 'seed-cat-asistencia-justificado', nombre: 'Justificado', color: 'info', orden: 4 },
    ] as CategoriaOpcion[],
    activo: true,
    orden: 1,
    obligatorio: true,
    updatedAt: new Date(2020, 0, 1).toISOString(),
  },
  {
    id: 'seed-tipo-uniforme',
    nombre: 'Uniforme',
    descripcion: 'Control de uso de uniforme escolar',
    categorias: [
      { id: 'seed-cat-uniforme-si', nombre: 'Sí', color: 'success', orden: 1 },
      { id: 'seed-cat-uniforme-no', nombre: 'No', color: 'error', orden: 2 },
    ] as CategoriaOpcion[],
    activo: true,
    orden: 2,
    obligatorio: false,
    updatedAt: new Date(2020, 0, 1).toISOString(),
  },
  {
    id: 'seed-tipo-cabello',
    nombre: 'Cabello',
    descripcion: 'Control de corte y presentación del cabello',
    categorias: [
      { id: 'seed-cat-cabello-si', nombre: 'Sí', color: 'success', orden: 1 },
      { id: 'seed-cat-cabello-no', nombre: 'No', color: 'error', orden: 2 },
    ] as CategoriaOpcion[],
    activo: true,
    orden: 3,
    obligatorio: false,
    updatedAt: new Date(2020, 0, 1).toISOString(),
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
    await store.put(data)
  }

  await tx.done
}
