import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { GradoSeccionFormData } from '../types'
import { formatGrado } from '../lib/grado'
import Button from './Button'

const GRADOS = ['1', '2', '3', '4', '5', '6']
const SECCIONES = ['A', 'B', 'C', 'D', 'E']

interface GradoSeccionFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: GradoSeccionFormData) => Promise<void>
  initial?: GradoSeccionFormData
  title?: string
}

const emptyForm: GradoSeccionFormData = { grado: '', seccion: '' }

const GradoSeccionForm = ({
  open,
  onClose,
  onSave,
  initial,
  title = 'Agregar Grado y Sección',
}: GradoSeccionFormProps) => {
  const [form, setForm] = useState<GradoSeccionFormData>(initial ?? emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.grado || !form.seccion) {
      setError('Debes seleccionar un grado y una sección')
      return
    }

    setSaving(true)
    try {
      await onSave({ ...form, grado: formatGrado(form.grado) })
      setForm(emptyForm)
      onClose()
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-sm flex-col rounded-xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grad-grado" className="text-sm font-medium text-text-secondary">
              Grado
            </label>
            <select
              id="grad-grado"
              value={form.grado}
              onChange={(e) => setForm({ ...form, grado: e.target.value })}
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
            >
              <option value="">Seleccionar</option>
              {GRADOS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="grad-seccion" className="text-sm font-medium text-text-secondary">
              Sección
            </label>
            <select
              id="grad-seccion"
              value={form.seccion}
              onChange={(e) => setForm({ ...form, seccion: e.target.value })}
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
            >
              <option value="">Seleccionar</option>
              {SECCIONES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {form.grado && form.seccion && (
            <p className="text-center text-sm text-text-muted">
              Se creará: <span className="font-semibold text-text-primary">{formatGrado(form.grado)} {form.seccion}</span>
            </p>
          )}

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

export default GradoSeccionForm
