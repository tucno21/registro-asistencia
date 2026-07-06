import { getDB } from '.'
import type { Estudiante, GradoSeccion, TipoRegistro, Registro } from '../types'

export interface BackupData {
  version: number
  exportedAt: string
  usuarios: {
    id: string
    nombre: string
    username: string
    passwordHash: string
    rol: 'admin' | 'docente'
    gradosAsignados: string[]
    activo: boolean
  }[]
  estudiantes: Estudiante[]
  gradosSecciones: GradoSeccion[]
  tiposRegistro: TipoRegistro[]
  registros: Registro[]
}

export async function exportAllData(): Promise<Blob> {
  const db = await getDB()
  const tx = db.transaction(
    ['usuarios', 'estudiantes', 'gradosSecciones', 'tiposRegistro', 'registros'],
    'readonly',
  )

  const usuarios = (await tx.objectStore('usuarios').getAll()).map((u) => ({
    ...u,
    passwordHash: '',
  }))
  const estudiantes = await tx.objectStore('estudiantes').getAll()
  const gradosSecciones = await tx.objectStore('gradosSecciones').getAll()
  const tiposRegistro = await tx.objectStore('tiposRegistro').getAll()
  const registros = await tx.objectStore('registros').getAll()
  await tx.done

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    usuarios,
    estudiantes,
    gradosSecciones,
    tiposRegistro,
    registros,
  }

  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

export async function importAllData(data: BackupData): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['usuarios', 'estudiantes', 'gradosSecciones', 'tiposRegistro', 'registros'],
    'readwrite',
  )

  for (const name of [
    'usuarios',
    'estudiantes',
    'gradosSecciones',
    'tiposRegistro',
    'registros',
  ] as const) {
    await tx.objectStore(name).clear()
  }

  for (const u of data.usuarios) {
    await tx.objectStore('usuarios').put({
      id: u.id,
      nombre: u.nombre,
      username: u.username,
      passwordHash: u.passwordHash,
      rol: u.rol,
      gradosAsignados: u.gradosAsignados,
      activo: u.activo,
    })
  }
  for (const e of data.estudiantes) {
    await tx.objectStore('estudiantes').put({
      ...e,
      updatedAt: e.updatedAt ?? e.fechaCreacion ?? new Date().toISOString(),
    })
  }
  for (const g of data.gradosSecciones) {
    await tx.objectStore('gradosSecciones').put({
      ...g,
      updatedAt: g.updatedAt ?? new Date().toISOString(),
    })
  }
  for (const t of data.tiposRegistro) {
    await tx.objectStore('tiposRegistro').put({
      ...t,
      updatedAt: t.updatedAt ?? new Date().toISOString(),
    })
  }
  for (const r of data.registros) {
    await tx.objectStore('registros').put({
      ...r,
      updatedAt: r.updatedAt ?? r.fechaCreacion ?? new Date().toISOString(),
    })
  }

  await tx.done
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['usuarios', 'estudiantes', 'gradosSecciones', 'tiposRegistro', 'registros'],
    'readwrite',
  )
  for (const name of [
    'usuarios',
    'estudiantes',
    'gradosSecciones',
    'tiposRegistro',
    'registros',
  ] as const) {
    await tx.objectStore(name).clear()
  }
  await tx.done
}
