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
  nombres: '',
  apellidos: '',
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

  const gradosActivos = grados.filter((g) => g.activo)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.codigo.trim() || !form.nombres.trim() || !form.apellidos.trim() || !form.gradoSeccionId) {
      setError('Todos los campos son obligatorios')
      return
    }

    setSaving(true)
    const result = await onSave({
      codigo: form.codigo.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <div className="flex max-h-[90dvh] w-full flex-col rounded-t-xl bg-surface md:mx-4 md:max-w-md md:rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="est-codigo" className="text-sm font-medium text-text-secondary">
              Código / DNI
            </label>
            <input
              id="est-codigo"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
              placeholder="Ej: 12345678"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="est-nombres" className="text-sm font-medium text-text-secondary">
              Nombres
            </label>
            <input
              id="est-nombres"
              value={form.nombres}
              onChange={(e) => setForm({ ...form, nombres: e.target.value })}
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
              placeholder="Ej: Juan Carlos"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="est-apellidos" className="text-sm font-medium text-text-secondary">
              Apellidos
            </label>
            <input
              id="est-apellidos"
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
              placeholder="Ej: Pérez García"
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
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
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

          <div className="flex gap-3 pt-2">
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
