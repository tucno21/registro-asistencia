import { openDB, type IDBPDatabase } from 'idb'
import type { Estudiante, GradoSeccion, TipoRegistro, Registro, Usuario } from '../types'

export interface RegistroAuxiliarDB {
  usuarios: {
    key: string
    value: Usuario
    indexes: { 'by-username': string }
  }
  estudiantes: {
    key: string
    value: Estudiante
    indexes: { 'by-grado': string; 'by-activo': number }
  }
  gradosSecciones: {
    key: string
    value: GradoSeccion
  }
  tiposRegistro: {
    key: string
    value: TipoRegistro
    indexes: { 'by-orden': number }
  }
  registros: {
    key: string
    value: Registro
    indexes: {
      'by-fecha': string
      'by-estudiante': string
      'by-grado-fecha': [string, string]
    }
  }
}

const DB_NAME = 'registroAuxiliarDB'
const DB_VERSION = 3

let _dbInstance: IDBPDatabase<RegistroAuxiliarDB> | null = null

export async function getDB(): Promise<IDBPDatabase<RegistroAuxiliarDB>> {
  if (_dbInstance) return _dbInstance

  _dbInstance = await openDB<RegistroAuxiliarDB>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('usuarios')) {
        const store = db.createObjectStore('usuarios', { keyPath: 'id' })
        store.createIndex('by-username', 'username', { unique: true })
      }

      if (!db.objectStoreNames.contains('estudiantes')) {
        const store = db.createObjectStore('estudiantes', { keyPath: 'id' })
        store.createIndex('by-grado', 'gradoSeccionId', { unique: false })
        store.createIndex('by-activo', 'activo', { unique: false })
      }

      if (!db.objectStoreNames.contains('gradosSecciones')) {
        db.createObjectStore('gradosSecciones', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('tiposRegistro')) {
        const store = db.createObjectStore('tiposRegistro', { keyPath: 'id' })
        store.createIndex('by-orden', 'orden', { unique: false })
      }

      if (!db.objectStoreNames.contains('registros')) {
        const store = db.createObjectStore('registros', { keyPath: 'id' })
        store.createIndex('by-fecha', 'fecha', { unique: false })
        store.createIndex('by-estudiante', 'estudianteId', { unique: false })
        store.createIndex('by-grado-fecha', ['gradoSeccionId', 'fecha'], {
          unique: false,
        })
      }

      // v2: clear estudiantes (nombres/apellidos → nombreCompleto)
      if (oldVersion < 2 && db.objectStoreNames.contains('estudiantes')) {
        transaction.objectStore('estudiantes').clear()
      }

      // v3: add updatedAt to all syncable stores
      if (oldVersion < 3) {
        const now = new Date().toISOString()
        const syncStores = ['estudiantes', 'gradosSecciones', 'tiposRegistro', 'registros'] as const
        for (const name of syncStores) {
          if (!db.objectStoreNames.contains(name)) continue
          const store = transaction.objectStore(name)
          let cursor = await store.openCursor()
          while (cursor) {
            const record = cursor.value as Record<string, unknown>
            if (!record.updatedAt) {
              await cursor.update({ ...record, updatedAt: record.fechaCreacion ?? now })
            }
            cursor = await cursor.continue()
          }
        }
      }
    },
  })

  return _dbInstance
}
