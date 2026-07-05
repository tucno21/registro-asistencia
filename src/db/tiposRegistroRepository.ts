import { getDB } from '.'
import type { TipoRegistro, TipoRegistroFormData } from '../types'

export async function getAllTiposRegistro(): Promise<TipoRegistro[]> {
  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readonly')
  const store = tx.objectStore('tiposRegistro')
  const result = await store.getAll()
  await tx.done
  return result.sort((a, b) => a.orden - b.orden)
}

export async function getTipoRegistroById(id: string): Promise<TipoRegistro | undefined> {
  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readonly')
  const result = await tx.objectStore('tiposRegistro').get(id)
  await tx.done
  return result
}

export async function createTipoRegistro(
  data: TipoRegistroFormData,
  orden: number,
): Promise<TipoRegistro> {
  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readwrite')
  const store = tx.objectStore('tiposRegistro')
  const entity: TipoRegistro = {
    id: crypto.randomUUID(),
    nombre: data.nombre,
    descripcion: data.descripcion,
    categorias: data.categorias,
    activo: true,
    orden,
    obligatorio: data.obligatorio,
  }
  await store.put(entity)
  await tx.done
  return entity
}

export async function updateTipoRegistro(
  id: string,
  data: TipoRegistroFormData,
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readwrite')
  const store = tx.objectStore('tiposRegistro')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Tipo de registro no encontrado')
  }
  await store.put({
    ...existing,
    nombre: data.nombre,
    descripcion: data.descripcion,
    categorias: data.categorias,
    obligatorio: data.obligatorio,
  })
  await tx.done
}

export async function toggleTipoRegistroActivo(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readwrite')
  const store = tx.objectStore('tiposRegistro')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Tipo de registro no encontrado')
  }
  await store.put({ ...existing, activo: !existing.activo })
  await tx.done
}

export async function reordenarTipoRegistro(
  id: string,
  nuevoOrden: number,
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readwrite')
  const store = tx.objectStore('tiposRegistro')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Tipo de registro no encontrado')
  }
  await store.put({ ...existing, orden: nuevoOrden })
  await tx.done
}

export async function tieneRegistrosAsociados(tipoRegistroId: string): Promise<boolean> {
  const db = await getDB()
  const tx = db.transaction('registros', 'readonly')
  const index = tx.objectStore('registros').index('by-fecha')
  const todos = await index.getAll()
  await tx.done
  return todos.some((r) => r.tipoRegistroId === tipoRegistroId)
}

export async function deleteTipoRegistro(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('tiposRegistro', 'readwrite')
  await tx.objectStore('tiposRegistro').delete(id)
  await tx.done
}
