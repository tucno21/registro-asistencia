import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { GradoSeccion, EstudianteFormData } from '../types'
import Button from './Button'

interface EstudianteFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: EstudianteFormData) => Promise<{ ok: boolean; error?: string }>
  grados: GradoSeccion[]
  initial?: EstudianteFormData
  title?: string
}

const emptyForm: EstudianteFormData = {
  codigo: '',
  nombreCompleto: '',
  gradoSeccionId: '',
}

const EstudianteForm = ({
  open,
  onClose,
  onSave,
  grados,
  initial,
  title = 'Agregar Estudiante',
}: EstudianteFormProps) => {
  const [form, setForm] = useState<EstudianteFormData>(initial ?? emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const gradosActivos = [...grados.filter((g) => g.activo)].sort((a, b) => {
    const numA = parseInt(a.grado.match(/^(\d+)/)?.[1] ?? '0', 10)
    const numB = parseInt(b.grado.match(/^(\d+)/)?.[1] ?? '0', 10)
    if (numA !== numB) return numA - numB
    return a.seccion.localeCompare(b.seccion)
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const codigo = form.codigo.trim()
    const nombre = form.nombreCompleto.trim()

    if (!codigo || !nombre || !form.gradoSeccionId) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (!/^\d+$/.test(codigo)) {
      setError('El código / DNI solo debe contener números')
      return
    }

    const comaIdx = nombre.indexOf(',')
    if (comaIdx === -1) {
      setError('El nombre debe tener el formato: Apellidos, Nombres (separado por coma)')
      return
    }

    const apellidos = nombre.slice(0, comaIdx).trim()
    const nombres = nombre.slice(comaIdx + 1).trim()

    if (!apellidos || apellidos.split(/\s+/).length < 2) {
      setError('Debe ingresar al menos dos apellidos antes de la coma')
      return
    }

    if (!nombres) {
      setError('Debe ingresar al menos un nombre después de la coma')
      return
    }

    setSaving(true)
    const result = await onSave({
      codigo,
      nombreCompleto: nombre,
      gradoSeccionId: form.gradoSeccionId,
    })
    setSaving(false)

    if (result.ok) {
      setForm(emptyForm)
      onClose()
    } else {
      setError(result.error ?? 'Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="est-codigo" className="text-sm font-medium text-text-secondary">
              Código / DNI
            </label>
            <input
              id="est-codigo"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.replace(/\D/g, '') })}
              className="h-10 md:h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
              placeholder="Ej: 12345678"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="est-nombre" className="text-sm font-medium text-text-secondary">
              Nombre completo (Apellidos, Nombres)
            </label>
            <input
              id="est-nombre"
              value={form.nombreCompleto}
              onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
              className="h-10 md:h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
              placeholder="Apellidos, Nombres (ej: García Pérez, Juan Carlos)"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="est-grado" className="text-sm font-medium text-text-secondary">
              Grado y Sección
            </label>
            <select
              id="est-grado"
              value={form.gradoSeccionId}
              onChange={(e) => setForm({ ...form, gradoSeccionId: e.target.value })}
              className="h-10 md:h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
            >
              <option value="">Seleccionar grado</option>
              {gradosActivos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EstudianteForm
