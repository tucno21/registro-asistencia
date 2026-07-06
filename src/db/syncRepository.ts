import { getDB } from '.'
import type { Estudiante, GradoSeccion, TipoRegistro, Registro } from '../types'

export interface SyncData {
  gradosSecciones: GradoSeccion[]
  estudiantes: Estudiante[]
  tiposRegistro: TipoRegistro[]
  registros: Registro[]
}

export async function getLocalSyncData(): Promise<SyncData> {
  const db = await getDB()
  const tx = db.transaction(
    ['gradosSecciones', 'estudiantes', 'tiposRegistro', 'registros'],
    'readonly',
  )
  const gradosSecciones = await tx.objectStore('gradosSecciones').getAll()
  const estudiantes = await tx.objectStore('estudiantes').getAll()
  const tiposRegistro = await tx.objectStore('tiposRegistro').getAll()
  const registros = await tx.objectStore('registros').getAll()
  await tx.done
  return { gradosSecciones, estudiantes, tiposRegistro, registros }
}

export async function replaceLocalSyncData(data: SyncData): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['gradosSecciones', 'estudiantes', 'tiposRegistro', 'registros'],
    'readwrite',
  )
  for (const name of ['gradosSecciones', 'estudiantes', 'tiposRegistro', 'registros'] as const) {
    await tx.objectStore(name).clear()
  }
  for (const g of data.gradosSecciones) {
    await tx.objectStore('gradosSecciones').put(g)
  }
  for (const e of data.estudiantes) {
    await tx.objectStore('estudiantes').put(e)
  }
  for (const t of data.tiposRegistro) {
    await tx.objectStore('tiposRegistro').put(t)
  }
  for (const r of data.registros) {
    await tx.objectStore('registros').put(r)
  }
  await tx.done
}

export function mergeSyncData(local: SyncData, remote: SyncData): SyncData {
  return {
    gradosSecciones: mergeArrays(local.gradosSecciones, remote.gradosSecciones),
    estudiantes: mergeArrays(local.estudiantes, remote.estudiantes),
    tiposRegistro: mergeArrays(local.tiposRegistro, remote.tiposRegistro),
    registros: mergeArrays(local.registros, remote.registros),
  }
}

function mergeArrays<T extends { id: string; updatedAt: string }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(item.id, item)
  for (const item of remote) {
    const existing = map.get(item.id)
    if (!existing || item.updatedAt > existing.updatedAt) {
      map.set(item.id, item)
    }
  }
  return Array.from(map.values())
}
