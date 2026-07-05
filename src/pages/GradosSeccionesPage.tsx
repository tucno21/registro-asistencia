import { useEffect, useState } from 'react'
import { Plus, ToggleLeft, ToggleRight, Pencil, Trash2, GraduationCap } from 'lucide-react'
import { useEstudiantesStore } from '../store/estudiantesStore'
import GradoSeccionForm from '../components/GradoSeccionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { unformatGrado } from '../lib/grado'
import type { GradoSeccionFormData } from '../types'

const GradosSeccionesPage = () => {
  const { grados, loading, loadGrados, crearGrado, editarGrado, alternarGradoActivo, eliminarGrado } =
    useEstudiantesStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [toggleId, setToggleId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadGrados()
  }, [loadGrados])

  const editingGrado = editando
    ? grados.find((g) => g.id === editando)
    : undefined

  const handleSave = async (data: GradoSeccionFormData) => {
    if (editando) {
      const result = await editarGrado(editando, data)
      if (!result.ok) throw new Error(result.error)
      setEditando(null)
    } else {
      const result = await crearGrado(data)
      if (!result.ok) throw new Error(result.error)
    }
  }

  const handleToggle = async () => {
    if (!toggleId) return
    await alternarGradoActivo(toggleId)
    setToggleId(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await eliminarGrado(deleteId)
    setDeleteId(null)
  }

  if (loading && grados.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  const sortedGrados = [...grados].sort((a, b) => {
    const numA = parseInt(unformatGrado(a.grado), 10)
    const numB = parseInt(unformatGrado(b.grado), 10)
    if (numA !== numB) return numA - numB
    return a.seccion.localeCompare(b.seccion)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">
          Grados y Secciones
        </h2>
        <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {grados.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Sin grados registrados"
          description="Crea grados y secciones para poder asignar estudiantes."
          action={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Crear grado
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGrados.map((g) => (
            <Card key={g.id} padding="sm" className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-text-primary ${!g.activo ? 'line-through opacity-50' : ''}`}>
                    {g.nombre}
                  </span>
                  {!g.activo && <Badge variant="neutral">Inactivo</Badge>}
                </div>
                <span className="text-xs text-text-muted">
                  {g.estudianteCount} estudiante{g.estudianteCount !== 1 ? 's' : ''} activo{g.estudianteCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditando(g.id); setFormOpen(true) }}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt hover:text-text-primary"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(g.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-error-bg hover:text-error"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setToggleId(g.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
                  aria-label={g.activo ? 'Desactivar' : 'Activar'}
                >
                  {g.activo ? (
                    <ToggleRight className="h-4 w-4 text-success" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-text-muted" />
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <GradoSeccionForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null) }}
        onSave={handleSave}
        initial={editingGrado ? { grado: unformatGrado(editingGrado.grado), seccion: editingGrado.seccion } : undefined}
        title={editando ? 'Editar Grado y Sección' : 'Agregar Grado y Sección'}
      />

      <ConfirmDialog
        open={toggleId !== null}
        title="Cambiar estado"
        message={
          toggleId
            ? `¿Estás seguro de ${
                grados.find((g) => g.id === toggleId)?.activo ? 'desactivar' : 'activar'
              } este grado/sección?`
            : ''
        }
        confirmLabel="Sí, cambiar"
        onConfirm={handleToggle}
        onCancel={() => setToggleId(null)}
        variant="primary"
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar grado"
        message={
          deleteId
            ? (() => {
                const g = grados.find((g) => g.id === deleteId)
                if (!g) return ''
                const base = `¿Eliminar "${g.nombre}"? Esta acción no se puede deshacer.`
                if (g.estudianteCount && g.estudianteCount > 0) {
                  return `${base}\n\n⚠️ Tiene ${g.estudianteCount} estudiante${g.estudianteCount !== 1 ? 's' : ''} asignado${g.estudianteCount !== 1 ? 's' : ''}. Al eliminar el grado, estos estudiantes dejarán de tener grado asignado.`
                }
                return base
              })()
            : ''
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
      />
    </div>
  )
}

export default GradosSeccionesPage
