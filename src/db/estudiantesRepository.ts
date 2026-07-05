import { getDB } from '.'
import type { Estudiante, EstudianteFormData } from '../types'

export async function getAllEstudiantes(): Promise<Estudiante[]> {
  const db = await getDB()
  const tx = db.transaction('estudiantes', 'readonly')
  const result = await tx.objectStore('estudiantes').getAll()
  await tx.done
  return result
}

export async function getEstudianteById(id: string): Promise<Estudiante | undefined> {
  const db = await getDB()
  const tx = db.transaction('estudiantes', 'readonly')
  const result = await tx.objectStore('estudiantes').get(id)
  await tx.done
  return result
}

export async function getEstudiantesByGrado(gradoSeccionId: string): Promise<Estudiante[]> {
  const db = await getDB()
  const tx = db.transaction('estudiantes', 'readonly')
  const index = tx.objectStore('estudiantes').index('by-grado')
  const result = await index.getAll(gradoSeccionId)
  await tx.done
  return result
}

export async function getEstudianteByCodigo(codigo: string): Promise<Estudiante | undefined> {
  const todos = await getAllEstudiantes()
  return todos.find(
    (e) => e.codigo.toLowerCase() === codigo.toLowerCase() && e.activo,
  )
}

export async function createEstudiante(data: EstudianteFormData): Promise<Estudiante> {
  const estudiante: Estudiante = {
    id: crypto.randomUUID(),
    codigo: data.codigo,
    nombres: data.nombres,
    apellidos: data.apellidos,
    gradoSeccionId: data.gradoSeccionId,
    activo: true,
    fechaCreacion: new Date().toISOString(),
  }
  const db = await getDB()
  const tx = db.transaction('estudiantes', 'readwrite')
  await tx.objectStore('estudiantes').put(estudiante)
  await tx.done
  return estudiante
}

export async function updateEstudiante(
  id: string,
  data: EstudianteFormData,
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('estudiantes', 'readwrite')
  const store = tx.objectStore('estudiantes')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Estudiante no encontrado')
  }
  await store.put({
    ...existing,
    codigo: data.codigo,
    nombres: data.nombres,
    apellidos: data.apellidos,
    gradoSeccionId: data.gradoSeccionId,
  })
  await tx.done
}

export async function deactivateEstudiante(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('estudiantes', 'readwrite')
  const store = tx.objectStore('estudiantes')
  const existing = await store.get(id)
  if (!existing) {
    await tx.done
    throw new Error('Estudiante no encontrado')
  }
  await store.put({ ...existing, activo: !existing.activo })
  await tx.done
}

export async function countEstudiantesByGrado(gradoSeccionId: string): Promise<number> {
  const estudiantes = await getEstudiantesByGrado(gradoSeccionId)
  return estudiantes.filter((e) => e.activo).length
}

export async function createEstudiantesBatch(
  estudiantes: EstudianteFormData[],
): Promise<{ count: number; errores: string[] }> {
  const todos = await getAllEstudiantes()
  const codigosExistentes = new Set(
    todos.filter((e) => e.activo).map((e) => e.codigo.toLowerCase()),
  )

  const db = await getDB()
  const tx = db.transaction('estudiantes', 'readwrite')
  const store = tx.objectStore('estudiantes')
  let count = 0
  const errores: string[] = []

  for (const data of estudiantes) {
    if (codigosExistentes.has(data.codigo.toLowerCase())) {
      errores.push(`Código "${data.codigo}" ya existe en la BD`)
      continue
    }
    await store.put({
      id: crypto.randomUUID(),
      codigo: data.codigo,
      nombres: data.nombres,
      apellidos: data.apellidos,
      gradoSeccionId: data.gradoSeccionId,
      activo: true,
      fechaCreacion: new Date().toISOString(),
    })
    codigosExistentes.add(data.codigo.toLowerCase())
    count++
  }
  await tx.done
  return { count, errores }
}
