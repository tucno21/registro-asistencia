import { useEffect, useState } from 'react'
import {
  Plus,
  ToggleLeft,
  ToggleRight,
  Pencil,
  ArrowUp,
  ArrowDown,
  ListChecks,
  Trash2,
  MoreVertical,
  GripVertical,
  ListOrdered,
} from 'lucide-react'
import { useTiposRegistroStore } from '../store/tiposRegistroStore'
import TipoRegistroForm from '../components/TipoRegistroForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import type { TipoRegistroFormData } from '../types'

const TiposRegistroPage = () => {
  const { tipos, loading, load, crear, editar, alternarActivo, subirOrden, bajarOrden, eliminar } =
    useTiposRegistroStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [toggleId, setToggleId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [load])

  const editingTipo = editando ? tipos.find((t) => t.id === editando) : undefined

  const handleSave = async (data: TipoRegistroFormData) => {
    if (editando) {
      await editar(editando, data)
      setEditando(null)
    } else {
      await crear(data)
    }
  }

  const handleToggle = async () => {
    if (!toggleId) return
    await alternarActivo(toggleId)
    setToggleId(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await eliminar(deleteId)
    if (result.ok) {
      setDeleteId(null)
      setDeleteError('')
    } else {
      setDeleteError(result.error ?? '')
    }
  }

  if (loading && tipos.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">
          Tipos de Registro
        </h2>
        <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {tipos.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Sin tipos de registro"
          description="Crea tipos de registro como Asistencia, Uniforme o Cabello con sus categorías."
          action={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Crear tipo
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {tipos.map((t) => {
            const esPrimero = tipos[0].id === t.id
            const esUltimo = tipos[tipos.length - 1].id === t.id
            return (
              <Card key={t.id} padding="md" className="!p-0 overflow-visible">
                <div className="flex">
                  {/* ===== Reorder handle (left) ===== */}
                  <div className="flex flex-col items-center justify-center gap-1 border-r border-border bg-surface-alt/50 px-1.5 py-4">
                    <button
                      onClick={() => subirOrden(t.id)}
                      disabled={esPrimero}
                      className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-surface hover:text-text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      aria-label="Subir"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <GripVertical className="h-3.5 w-3.5 text-text-muted/40" />
                    <button
                      onClick={() => bajarOrden(t.id)}
                      disabled={esUltimo}
                      className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-surface hover:text-text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      aria-label="Bajar"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* ===== Main content ===== */}
                  <div className="flex-1 min-w-0 px-4 py-3.5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-base font-semibold text-text-primary ${
                            !t.activo ? 'line-through opacity-50' : ''
                          }`}
                        >
                          {t.nombre}
                        </span>
                        {t.obligatorio && (
                          <Badge variant="warning">Obligatorio</Badge>
                        )}
                        {!t.activo && <Badge variant="neutral">Inactivo</Badge>}
                      </div>

                      {/* Kebab menu */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() =>
                            setMenuOpenId(menuOpenId === t.id ? null : t.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors"
                          aria-label="Más opciones"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpenId === t.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-card border border-border bg-surface py-1 shadow-card">
                              <button
                                onClick={() => {
                                  setEditando(t.id)
                                  setFormOpen(true)
                                  setMenuOpenId(null)
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setToggleId(t.id)
                                  setMenuOpenId(null)
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt transition-colors"
                              >
                                {t.activo ? (
                                  <ToggleRight className="h-3.5 w-3.5 text-success" />
                                ) : (
                                  <ToggleLeft className="h-3.5 w-3.5" />
                                )}
                                {t.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <div className="my-1 border-t border-border" />
                              <button
                                onClick={() => {
                                  setDeleteId(t.id)
                                  setDeleteError('')
                                  setMenuOpenId(null)
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error-bg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {t.descripcion && (
                      <p className="mt-2 text-sm text-text-secondary">
                        {t.descripcion}
                      </p>
                    )}

                    {/* Divider + Categories */}
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Categorías
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {t.categorias.map((cat) => (
                          <Badge key={cat.id} variant={cat.color}>
                            {cat.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
                      <ListOrdered className="h-3.5 w-3.5" />
                      <span>
                        Orden: {t.orden} · {t.categorias.length} categoría
                        {t.categorias.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <TipoRegistroForm
        key={editando ?? 'nuevo'}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null) }}
        onSave={handleSave}
        initial={
          editingTipo
            ? {
                nombre: editingTipo.nombre,
                descripcion: editingTipo.descripcion,
                obligatorio: editingTipo.obligatorio,
                categorias: editingTipo.categorias,
              }
            : undefined
        }
        title={editando ? 'Editar Tipo de Registro' : 'Crear Tipo de Registro'}
      />

      <ConfirmDialog
        open={toggleId !== null}
        title="Cambiar estado"
        message={
          toggleId
            ? `¿${tipos.find((t) => t.id === toggleId)?.activo ? 'Desactivar' : 'Activar'} "${tipos.find((t) => t.id === toggleId)?.nombre}"?`
            : ''
        }
        confirmLabel="Sí, cambiar"
        onConfirm={handleToggle}
        onCancel={() => setToggleId(null)}
        variant="primary"
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar tipo de registro"
        message={
          deleteError
            ? deleteError
            : deleteId
              ? `¿Eliminar "${tipos.find((t) => t.id === deleteId)?.nombre}"? Esta acción no se puede deshacer.`
              : ''
        }
        confirmLabel={deleteError ? 'Entendido' : 'Eliminar'}
        onConfirm={deleteError ? () => { setDeleteId(null); setDeleteError('') } : handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteError('') }}
        variant={deleteError ? 'primary' : 'danger'}
      />
    </div>
  )
}

export default TiposRegistroPage
