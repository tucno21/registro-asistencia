import { useEffect, useState } from 'react'
import {
  Plus,
  Upload,
  Search,
  Pencil,
  UserX,
  UserCheck,
  GraduationCap,
  Filter,
  X,
} from 'lucide-react'
import { useEstudiantesStore } from '../store/estudiantesStore'
import type { EstudianteFormData } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import EstudianteForm from '../components/EstudianteForm'
import ExcelImport from '../components/ExcelImport'
import RequireRole from '../components/RequireRole'
import Avatar from '../components/Avatar'

const EstudiantesPage = () => {
  const {
    estudiantes,
    grados,
    loading,
    loadAll,
    setFiltros,
    estudiantesFiltrados,
    filtros,
    crearEstudiante,
    editarEstudiante,
    alternarEstudianteActivo,
  } = useEstudiantesStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = estudiantesFiltrados()

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const editingStudent = editando
    ? estudiantes.find((e) => e.id === editando)
    : undefined

  const handleSave = async (data: EstudianteFormData): Promise<{ ok: boolean; error?: string }> => {
    if (editando) {
      const result = await editarEstudiante(editando, data)
      if (result.ok) setEditando(null)
      return result
    }
    return crearEstudiante(data)
  }

  const handleToggleActive = async () => {
    if (!confirmId) return
    await alternarEstudianteActivo(confirmId)
    setConfirmId(null)
  }

  const gradosActivos = grados.filter((g) => g.activo)
  const gradoMap = new Map(grados.map((g) => [g.id, g]))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-text-primary">Estudiantes</h2>
        <div className="flex gap-2">
          <RequireRole roles={['admin']}>
            <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </RequireRole>
          <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ busqueda: e.target.value })}
              placeholder="Buscar por nombre o código..."
              className="h-10 w-full rounded-input border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
            />
            {filtros.busqueda && (
              <button
                onClick={() => setFiltros({ busqueda: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-text-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-10 w-10 items-center justify-center rounded-input border transition-colors ${
              showFilters || filtros.gradoSeccionId || filtros.activo !== 'activos'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-text-muted hover:border-primary'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select
              value={filtros.gradoSeccionId}
              onChange={(e) => setFiltros({ gradoSeccionId: e.target.value })}
              className="h-9 flex-1 min-w-[140px] rounded-input border border-border bg-surface px-3 text-sm text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary"
            >
              <option value="">Todos los grados</option>
              {gradosActivos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
            <select
              value={filtros.activo}
              onChange={(e) =>
                setFiltros({ activo: e.target.value as 'todos' | 'activos' | 'inactivos' })
              }
              className="h-9 flex-1 min-w-[120px] rounded-input border border-border bg-surface px-3 text-sm text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary"
            >
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        )}
      </Card>

      {/* Count */}
      <p className="text-sm text-text-muted">
        {filtered.length} estudiante{filtered.length !== 1 ? 's' : ''}
        {filtros.gradoSeccionId && ` en ${grados.find((g) => g.id === filtros.gradoSeccionId)?.nombre}`}
      </p>

      {/* Student list */}
      {loading && estudiantes.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={estudiantes.length === 0 ? GraduationCap : Search}
          title={
            estudiantes.length === 0
              ? 'Sin estudiantes registrados'
              : 'Sin resultados'
          }
          description={
            estudiantes.length === 0
              ? 'Agrega estudiantes manualmente o importa desde Excel.'
              : 'Intenta ajustar los filtros de búsqueda.'
          }
          action={
            estudiantes.length === 0 ? (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Agregar estudiante
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-card border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt text-left text-xs font-medium text-text-muted">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombres</th>
                  <th className="px-4 py-3">Apellidos</th>
                  <th className="px-4 py-3">Grado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((est) => {
                  const grado = gradoMap.get(est.gradoSeccionId)
                  return (
                    <tr key={est.id} className="border-t border-border hover:bg-surface-alt/50">
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{est.codigo}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{est.nombres}</td>
                      <td className="px-4 py-3 text-text-primary">{est.apellidos}</td>
                      <td className="px-4 py-3 text-text-secondary">{grado?.nombre ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={est.activo ? 'success' : 'neutral'}>
                          {est.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditando(est.id); setFormOpen(true) }}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt hover:text-text-primary"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmId(est.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
                            aria-label={est.activo ? 'Desactivar' : 'Activar'}
                          >
                            {est.activo ? (
                              <UserX className="h-4 w-4 text-error" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-success" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((est) => {
              const grado = gradoMap.get(est.gradoSeccionId)
              return (
                <Card key={est.id} padding="sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Avatar name={`${est.nombres} ${est.apellidos}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {est.nombres} {est.apellidos}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          <span className="font-mono">{est.codigo}</span>
                          {' · '}
                          {grado?.nombre ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={est.activo ? 'success' : 'neutral'}>
                        {est.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditando(est.id); setFormOpen(true) }}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmId(est.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
                          aria-label={est.activo ? 'Desactivar' : 'Activar'}
                        >
                          {est.activo ? (
                            <UserX className="h-4 w-4 text-error" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-success" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Modals */}
      <EstudianteForm
        key={editando ?? 'nuevo'}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null) }}
        onSave={handleSave}
        grados={grados}
        initial={
          editingStudent
            ? {
                codigo: editingStudent.codigo,
                nombres: editingStudent.nombres,
                apellidos: editingStudent.apellidos,
                gradoSeccionId: editingStudent.gradoSeccionId,
              }
            : undefined
        }
        title={editando ? 'Editar Estudiante' : 'Agregar Estudiante'}
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Cambiar estado"
        message={
          confirmId
            ? `¿Estás seguro de ${
                estudiantes.find((e) => e.id === confirmId)?.activo
                  ? 'desactivar'
                  : 'reactivar'
              } este estudiante?`
            : ''
        }
        confirmLabel="Sí, cambiar"
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmId(null)}
      />

      <ExcelImport open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

export default EstudiantesPage
