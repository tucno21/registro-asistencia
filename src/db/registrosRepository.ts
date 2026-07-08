import { getDB } from '.'
import type { Registro } from '../types'

export async function getRegistrosByFechaAndGrado(
  fecha: string,
  gradoSeccionId: string,
): Promise<Registro[]> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readonly')
  const index = tx.objectStore('registros').index('by-grado-fecha')
  const result = await index.getAll([gradoSeccionId, fecha])
  await tx.done
  return result
}

export async function upsertRegistros(registros: Registro[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readwrite')
  const store = tx.objectStore('registros')
  for (const r of registros) {
    await store.put(r)
  }
  await tx.done
}

export async function getHistorialByEstudiante(
  estudianteId: string,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<Registro[]> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readonly')
  const index = tx.objectStore('registros').index('by-estudiante')
  let result = await index.getAll(estudianteId)
  await tx.done

  result.sort((a, b) => b.fecha.localeCompare(a.fecha))

  if (fechaInicio) result = result.filter((r) => r.fecha >= fechaInicio)
  if (fechaFin) result = result.filter((r) => r.fecha <= fechaFin)

  return result
}

export async function getHistorialByGradoAndFechas(
  gradoSeccionId: string,
  fechaInicio: string,
  fechaFin: string,
): Promise<Registro[]> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readonly')
  const index = tx.objectStore('registros').index('by-grado-fecha')
  const all = await index.getAll()
  await tx.done

  return all.filter(
    (r) =>
      r.gradoSeccionId === gradoSeccionId &&
      r.fecha >= fechaInicio &&
      r.fecha <= fechaFin,
  )
}

export async function getRegistrosByFecha(fecha: string): Promise<Registro[]> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readonly')
  const index = tx.objectStore('registros').index('by-fecha')
  const result = await index.getAll(fecha)
  await tx.done
  return result
}

export async function deleteRegistros(ids: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readwrite')
  const store = tx.objectStore('registros')
  for (const id of ids) {
    await store.delete(id)
  }
  await tx.done
}

export async function getAllRegistros(): Promise<Registro[]> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readonly')
  const result = await tx.objectStore('registros').getAll()
  await tx.done
  return result
}
