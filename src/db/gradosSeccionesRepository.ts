import { getDB } from '.'
import type { GradoSeccion, GradoSeccionFormData } from '../types'

export async function getAllGrados(): Promise<GradoSeccion[]> {
  const db = await getDB()
  const tx = db.transaction('gradosSecciones', 'readonly')
  const store = tx.objectStore('gradosSecciones')
  const result = await store.getAll()
  await tx.done
  return result
}

export async function getGradoById(id: string): Promise<GradoSeccion | undefined> {
  const db = await getDB()
  const tx = db.transaction('gradosSecciones', 'readonly')
  const result = await tx.objectStore('gradosSecciones').get(id)
  await tx.done
  return result
}

export async function getGradoByNombre(nombre: string): Promise<GradoSeccion | undefined> {
  const todos = await getAllGrados()
  return todos.find((g) => g.nombre.toLowerCase() === nombre.toLowerCase())
}

export async function createGrado(data: GradoSeccionFormData): Promise<GradoSeccion> {
  const grado: GradoSeccion = {
    id: crypto.randomUUID(),
    grado: data.grado,
    seccion: data.seccion,
    nombre: `${data.grado} ${data.seccion}`,
    activo: true,
  }
  const db = await getDB()
  const tx = db.transaction('gradosSecciones', 'readwrite')
  await tx.objectStore('gradosSecciones').put(grado)
  await tx.done
  return grado
}

export async function updateGrado(
  id: string,
  data: GradoSeccionFormData,
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('gradosSecciones', 'readwrite')
  const store = tx.objectStore('gradosSecciones')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Grado/Sección no encontrado')
  }
  const updated: GradoSeccion = {
    ...existing,
    grado: data.grado,
    seccion: data.seccion,
    nombre: `${data.grado} ${data.seccion}`,
  }
  await store.put(updated)
  await tx.done
}

export async function toggleGradoActivo(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('gradosSecciones', 'readwrite')
  const store = tx.objectStore('gradosSecciones')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Grado/Sección no encontrado')
  }
  await store.put({ ...existing, activo: !existing.activo })
  await tx.done
}

export async function deleteGrado(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('gradosSecciones', 'readwrite')
  const store = tx.objectStore('gradosSecciones')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Grado/Sección no encontrado')
  }
  await store.delete(id)
  await tx.done
}
