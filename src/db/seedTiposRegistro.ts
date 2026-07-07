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
      { id: 'seed-cat-asistencia-puntual', nombre: 'Puntual', color: 'success', orden: 1 },
      { id: 'seed-cat-asistencia-tarde', nombre: 'Tarde', color: 'warning', orden: 2 },
      { id: 'seed-cat-asistencia-falta', nombre: 'Falta', color: 'error', orden: 3 },
    ] as CategoriaOpcion[],
    activo: true,
    orden: 1,
    obligatorio: true,
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
