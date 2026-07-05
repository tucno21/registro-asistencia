import { useEffect, useState } from 'react'
import {
  Plus,
  Upload,
  Search,
  Pencil,
  UserX,
  UserCheck,
  GraduationCap,
} from 'lucide-react'
import { useEstudiantesStore } from '../store/estudiantesStore'
import type { Estudiante, EstudianteFormData } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import EstudianteForm from '../components/EstudianteForm'
import ExcelImport from '../components/ExcelImport'
import RequireRole from '../components/RequireRole'
import Avatar from '../components/Avatar'
import DataTable, { type DataTableColumn } from '../components/DataTable'

const selectClass =
  'h-9 flex-1 min-w-[140px] rounded-input border border-border bg-surface px-3 text-sm text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary'

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

  const columns: DataTableColumn<Estudiante>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (est) => (
        <span className="font-mono text-xs text-text-secondary">{est.codigo}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre Completo',
      render: (est) => (
        <span className="font-medium text-text-primary">{est.nombreCompleto}</span>
      ),
    },
    {
      key: 'grado',
      header: 'Grado',
      render: (est) => {
        const grado = gradoMap.get(est.gradoSeccionId)
        return <span className="text-text-secondary">{grado?.nombre ?? '—'}</span>
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (est) => (
        <Badge variant={est.activo ? 'success' : 'neutral'}>
          {est.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (est) => (
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
      ),
    },
  ]

  const renderMobileCard = (est: Estudiante) => {
    const grado = gradoMap.get(est.gradoSeccionId)
    return (
      <Card padding="sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Avatar name={est.nombreCompleto} />
            <div className="min-w-0">
              <p className="font-medium text-text-primary truncate">
                {est.nombreCompleto}
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
  }

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

      {/* DataTable */}
      <DataTable<Estudiante>
        columns={columns}
        data={filtered}
        rowKey={(est) => est.id}
        searchValue={filtros.busqueda}
        onSearchChange={(value) => setFiltros({ busqueda: value })}
        searchPlaceholder="Buscar por nombre o código..."
        filtersActive={!!filtros.gradoSeccionId || filtros.activo !== 'activos'}
        filters={
          <>
            <select
              value={filtros.gradoSeccionId}
              onChange={(e) => setFiltros({ gradoSeccionId: e.target.value })}
              className={selectClass}
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
              className={selectClass}
            >
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
              <option value="todos">Todos</option>
            </select>
          </>
        }
        loading={loading && estudiantes.length === 0}
        emptyIcon={estudiantes.length === 0 ? GraduationCap : Search}
        emptyTitle={
          estudiantes.length === 0
            ? 'Sin estudiantes registrados'
            : 'Sin resultados'
        }
        emptyDescription={
          estudiantes.length === 0
            ? 'Agrega estudiantes manualmente o importa desde Excel.'
            : 'Intenta ajustar los filtros de búsqueda.'
        }
        emptyAction={
          estudiantes.length === 0 ? (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Agregar estudiante
            </Button>
          ) : undefined
        }
        mobileCard={renderMobileCard}
        countLabel={(n) =>
          `${n} estudiante${n !== 1 ? 's' : ''}` +
          (filtros.gradoSeccionId
            ? ` en ${grados.find((g) => g.id === filtros.gradoSeccionId)?.nombre}`
            : '')
        }
      />

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
                nombreCompleto: editingStudent.nombreCompleto,
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
