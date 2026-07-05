import { getDB } from '.'
import { hashPassword } from '../lib/crypto'

export async function seedUsers(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('usuarios', 'readwrite')
  const store = tx.objectStore('usuarios')

  const count = await store.count()
  if (count > 0) {
    await tx.done
    return
  }

  const adminHash = await hashPassword('admin')
  const docenteHash = await hashPassword('docente')

  await store.put({
    id: crypto.randomUUID(),
    nombre: 'Administrador',
    username: 'admin@admin.com',
    passwordHash: adminHash,
    rol: 'admin',
    gradosAsignados: [],
    activo: true,
  })

  await store.put({
    id: crypto.randomUUID(),
    nombre: 'Docente',
    username: 'docente@docente.com',
    passwordHash: docenteHash,
    rol: 'docente',
    gradosAsignados: [],
    activo: true,
  })

  await tx.done
}
