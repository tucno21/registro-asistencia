import { useState, type FormEvent } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { CategoriaOpcion, TipoRegistroFormData } from '../types'
import { COLORES_CATEGORIA } from '../types'
import Button from './Button'
import Badge from './Badge'

interface TipoRegistroFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: TipoRegistroFormData) => Promise<void>
  initial?: TipoRegistroFormData
  title?: string
}

const emptyForm: TipoRegistroFormData = {
  nombre: '',
  descripcion: '',
  obligatorio: true,
  categorias: [],
}

let catCounter = 0

const emptyCategoria = (): CategoriaOpcion => {
  catCounter--
  return {
    id: `nueva-${catCounter}`,
    nombre: '',
    color: 'success',
    orden: 0,
  }
}

const TipoRegistroForm = ({
  open,
  onClose,
  onSave,
  initial,
  title = 'Crear Tipo de Registro',
}: TipoRegistroFormProps) => {
  const [form, setForm] = useState<TipoRegistroFormData>(initial ?? { ...emptyForm })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const actualizarCampo = <K extends keyof TipoRegistroFormData>(
    key: K,
    value: TipoRegistroFormData[K],
  ) => setForm({ ...form, [key]: value })

  const agregarCategoria = () => {
    const cats = [...form.categorias, { ...emptyCategoria(), orden: form.categorias.length + 1 }]
    actualizarCampo('categorias', cats)
  }

  const editarCategoria = (id: string, field: keyof CategoriaOpcion, value: string | number) => {
    const cats = form.categorias.map((c) =>
      c.id === id ? { ...c, [field]: value } : c,
    )
    actualizarCampo('categorias', cats)
  }

  const eliminarCategoria = (id: string) => {
    const cats = form.categorias
      .filter((c) => c.id !== id)
      .map((c, i) => ({ ...c, orden: i + 1 }))
    actualizarCampo('categorias', cats)
  }

  const subirCategoria = (id: string) => {
    const idx = form.categorias.findIndex((c) => c.id === id)
    if (idx <= 0) return
    const cats = [...form.categorias]
    ;[cats[idx - 1], cats[idx]] = [cats[idx], cats[idx - 1]]
    actualizarCampo('categorias', cats.map((c, i) => ({ ...c, orden: i + 1 })))
  }

  const bajarCategoria = (id: string) => {
    const idx = form.categorias.findIndex((c) => c.id === id)
    if (idx === -1 || idx >= form.categorias.length - 1) return
    const cats = [...form.categorias]
    ;[cats[idx], cats[idx + 1]] = [cats[idx + 1], cats[idx]]
    actualizarCampo('categorias', cats.map((c, i) => ({ ...c, orden: i + 1 })))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (form.categorias.length < 2) {
      setError('Debe tener al menos 2 categorías')
      return
    }
    if (form.categorias.some((c) => !c.nombre.trim())) {
      setError('Todas las categorías deben tener nombre')
      return
    }

    setSaving(true)
    try {
      await onSave({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        obligatorio: form.obligatorio,
        categorias: form.categorias.map((c, i) => ({
          ...c,
          nombre: c.nombre.trim(),
          orden: i + 1,
        })),
      })
      setForm({ ...emptyForm })
      onClose()
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-xl bg-surface shadow-xl">
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
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tr-nombre" className="text-sm font-medium text-text-secondary">
              Nombre
            </label>
            <input
              id="tr-nombre"
              value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
              placeholder="Ej: Asistencia"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tr-desc" className="text-sm font-medium text-text-secondary">
              Descripción
            </label>
            <textarea
              id="tr-desc"
              rows={2}
              value={form.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary resize-none"
              placeholder="Descripción opcional"
            />
          </div>

          {/* Obligatorio */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={form.obligatorio}
                onChange={(e) => actualizarCampo('obligatorio', e.target.checked)}
                className="peer sr-only"
              />
              <span
                className={
                  'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ' +
                  (form.obligatorio
                    ? 'border-primary bg-primary'
                    : 'border-border bg-surface')
                }
              >
                {form.obligatorio && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </span>
            <span className="text-sm text-text-primary">Obligatorio</span>
          </label>

          {/* Categorías */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                Categorías ({form.categorias.length})
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={agregarCategoria}>
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>

            {form.categorias.map((cat, idx) => (
              <div key={cat.id} className="rounded-card border border-border p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-0.5 pt-1">
                    <button type="button" onClick={() => subirCategoria(cat.id)} className="h-4 w-4 text-text-muted hover:text-text-primary leading-none" disabled={idx === 0}>▲</button>
                    <button type="button" onClick={() => bajarCategoria(cat.id)} className="h-4 w-4 text-text-muted hover:text-text-primary leading-none" disabled={idx === form.categorias.length - 1}>▼</button>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      value={cat.nombre}
                      onChange={(e) => editarCategoria(cat.id, 'nombre', e.target.value)}
                      className="h-9 w-full rounded-input border border-border bg-surface px-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                      placeholder="Nombre de la categoría"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {COLORES_CATEGORIA.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => editarCategoria(cat.id, 'color', col.value)}
                          className={`h-7 rounded-full px-2.5 text-xs font-medium transition-opacity ${
                            cat.color === col.value
                              ? 'ring-2 ring-primary ring-offset-1 opacity-100'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: `var(--color-${col.value})`,
                            color: '#fff',
                          }}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarCategoria(cat.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-error-bg hover:text-error flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          {form.categorias.length > 0 && (
            <div className="rounded-card border border-border p-3">
              <p className="mb-2 text-xs font-medium text-text-muted">Vista previa:</p>
              <div className="flex flex-wrap gap-1.5">
                {form.categorias.map((cat) => (
                  <Badge key={cat.id} variant={cat.color}>
                    {cat.nombre || '(sin nombre)'}
                  </Badge>
                ))}
              </div>
            </div>
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

export default TipoRegistroForm
