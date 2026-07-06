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

export function normalizeRemoteData(data: SyncData): SyncData {
  return {
    ...data,
    registros: data.registros.map((r) => ({
      ...r,
      fecha: typeof r.fecha === 'string' ? r.fecha.split('T')[0] : r.fecha,
    })),
  }
}

export function mergeSyncData(local: SyncData, remote: SyncData): SyncData {
  const mergedTipos = mergeArrays(local.tiposRegistro, remote.tiposRegistro)
  const mergedRegistros = mergeArrays(local.registros, remote.registros)

  const { tiposRegistro, registros } = dedupTiposRegistro(mergedTipos, mergedRegistros)

  return {
    gradosSecciones: mergeArrays(local.gradosSecciones, remote.gradosSecciones),
    estudiantes: mergeArrays(local.estudiantes, remote.estudiantes),
    tiposRegistro,
    registros,
  }
}

function dedupTiposRegistro(
  tipos: TipoRegistro[],
  registros: Registro[],
): { tiposRegistro: TipoRegistro[]; registros: Registro[] } {
  const byName = new Map<string, TipoRegistro[]>()
  for (const t of tipos) {
    const key = t.nombre.toLowerCase().trim()
    const arr = byName.get(key) ?? []
    arr.push(t)
    byName.set(key, arr)
  }

  let changed = false
  const tipoRemap = new Map<string, { tipoId: string; catMap: Map<string, string> }>()
  const surviving: TipoRegistro[] = []

  for (const [, group] of byName) {
    if (group.length === 1) {
      surviving.push(group[0])
      continue
    }

    changed = true
    const refCount = new Map<string, number>()
    for (const t of group) refCount.set(t.id, 0)
    for (const r of registros) {
      if (refCount.has(r.tipoRegistroId)) {
        refCount.set(r.tipoRegistroId, (refCount.get(r.tipoRegistroId) ?? 0) + 1)
      }
    }

    const sorted = [...group].sort((a, b) => {
      const countDiff = (refCount.get(b.id) ?? 0) - (refCount.get(a.id) ?? 0)
      if (countDiff !== 0) return countDiff
      return (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '')
    })

    const winner = sorted[0]
    surviving.push(winner)

    for (const loser of sorted.slice(1)) {
      const catMap = new Map<string, string>()
      for (const loserCat of loser.categorias) {
        const match = winner.categorias.find(
          (wc) => wc.nombre.toLowerCase().trim() === loserCat.nombre.toLowerCase().trim()
            || wc.orden === loserCat.orden,
        )
        if (match) catMap.set(loserCat.id, match.id)
      }
      tipoRemap.set(loser.id, { tipoId: winner.id, catMap })
    }
  }

  if (!changed) return { tiposRegistro: tipos, registros }

  const remappedRegistros = registros.map((r) => {
    const remap = tipoRemap.get(r.tipoRegistroId)
    if (!remap) return r
    return {
      ...r,
      tipoRegistroId: remap.tipoId,
      categoriaSeleccionada: remap.catMap.get(r.categoriaSeleccionada) ?? r.categoriaSeleccionada,
    }
  })

  return { tiposRegistro: surviving, registros: remappedRegistros }
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
