import { useEffect, useState, useCallback } from 'react'
import {
  ClipboardCheck,
  Save,
  Calendar,
  ChevronDown,
  CheckCheck,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useEstudiantesStore } from '../store/estudiantesStore'
import { useTiposRegistroStore } from '../store/tiposRegistroStore'
import { getRegistrosByFechaAndGrado, upsertRegistros } from '../db/registrosRepository'
import { useToastStore } from '../store/toastStore'
import type { Registro, ColorCategoria } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import CategoryChip from '../components/CategoryChip'
import Avatar from '../components/Avatar'

type Selecciones = Record<string, string | null>

const hoy = () => new Date().toISOString().split('T')[0]

const softBgClasses: Record<ColorCategoria, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-error-bg text-error',
  info: 'bg-info-bg text-info',
  neutral: 'bg-surface-alt text-text-secondary',
}

const RegistroPage = () => {
  const user = useAuthStore((s) => s.user)
  const { grados, estudiantes, loadAll } = useEstudiantesStore()
  const { tipos, load: loadTipos } = useTiposRegistroStore()
  const toast = useToastStore()

  const [selectedGrado, setSelectedGrado] = useState('')
  const [selectedDate, setSelectedDate] = useState(hoy())
  const [selecciones, setSelecciones] = useState<Selecciones>({})
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [warnOpen, setWarnOpen] = useState(false)
  const [warnMsg, setWarnMsg] = useState('')

  useEffect(() => {
    loadAll()
    loadTipos()
  }, [loadAll, loadTipos])

  const gradosFiltrados = grados.filter((g) => {
    if (!g.activo) return false
    if (user?.rol === 'docente' && user.gradosAsignados.length > 0) {
      return user.gradosAsignados.includes(g.id)
    }
    return true
  })

  const estudiantesSeccion = estudiantes.filter(
    (e) => e.activo && e.gradoSeccionId === selectedGrado,
  )

  const tiposActivos = tipos.filter((t) => t.activo)
  const obligatorios = tiposActivos.filter((t) => t.obligatorio)

  const loadExisting = useCallback(async () => {
    if (!selectedGrado) return
    setLoadingData(true)
    try {
      const existentes = await getRegistrosByFechaAndGrado(selectedDate, selectedGrado)
      const sel: Selecciones = {}
      for (const r of existentes) {
        const key = `${r.estudianteId}:${r.tipoRegistroId}`
        sel[key] = r.categoriaSeleccionada
      }
      setSelecciones(sel)
    } finally {
      setLoadingData(false)
    }
  }, [selectedGrado, selectedDate])

  useEffect(() => {
    loadExisting()
  }, [loadExisting])

  const setCategoria = (estudianteId: string, tipoRegistroId: string, categoriaId: string) => {
    setSelecciones((prev) => ({
      ...prev,
      [`${estudianteId}:${tipoRegistroId}`]:
        prev[`${estudianteId}:${tipoRegistroId}`] === categoriaId ? null : categoriaId,
    }))
  }

  const marcarTodos = (tipoRegistroId: string, categoriaId: string) => {
    setSelecciones((prev) => {
      const next = { ...prev }
      for (const e of estudiantesSeccion) {
        next[`${e.id}:${tipoRegistroId}`] = categoriaId
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedGrado || !user) return

    const incompletos: string[] = []

    for (const est of estudiantesSeccion) {
      for (const t of obligatorios) {
        const key = `${est.id}:${t.id}`
        if (!selecciones[key]) {
          incompletos.push(`${est.nombreCompleto} — ${t.nombre}`)
        }
      }
    }

    if (incompletos.length > 0) {
      setWarnMsg(
        `Los siguientes estudiantes tienen registros obligatorios incompletos:\n${incompletos.slice(0, 5).join('\n')}${incompletos.length > 5 ? `\n...y ${incompletos.length - 5} más` : ''}\n\n¿Guardar de todas formas?`,
      )
      setWarnOpen(true)
      return
    }

    await doSave()
  }

  const doSave = async () => {
    if (!selectedGrado || !user) return
    setSaving(true)
    try {
      const registros: Registro[] = []
      const now = new Date().toISOString()

      for (const est of estudiantesSeccion) {
        for (const t of tiposActivos) {
          const key = `${est.id}:${t.id}`
          const catId = selecciones[key]
          if (!catId) continue

          registros.push({
            id: crypto.randomUUID(),
            estudianteId: est.id,
            tipoRegistroId: t.id,
            categoriaSeleccionada: catId,
            fecha: selectedDate,
            gradoSeccionId: selectedGrado,
            registradoPor: user.id,
            fechaCreacion: now,
          })
        }
      }

      if (registros.length === 0) {
        toast.show('No hay registros para guardar', 'warning')
        return
      }

      await upsertRegistros(registros)
      await loadExisting()
      toast.show(
        `Registro guardado (${registros.length} marca${registros.length !== 1 ? 's' : ''})`,
        'success',
      )
    } catch {
      toast.show('Error al guardar el registro', 'error')
    } finally {
      setSaving(false)
    }
  }

  // --- Derived display values (no state changes) ---
  const isCompleto = (estId: string): boolean =>
    obligatorios.length > 0 &&
    obligatorios.every((t) => selecciones[`${estId}:${t.id}`])

  const resumenCategorias = tiposActivos.flatMap((t) =>
    t.categorias.map((cat) => ({
      key: `${t.id}:${cat.id}`,
      tipoNombre: t.nombre,
      catNombre: cat.nombre,
      catColor: cat.color,
      count: estudiantesSeccion.filter(
        (est) => selecciones[`${est.id}:${t.id}`] === cat.id,
      ).length,
    })),
  )
  const resumenFiltrado = resumenCategorias.filter((r) => r.count > 0)

  const completados = estudiantesSeccion.filter((e) => isCompleto(e.id)).length

  return (
    <div className="flex flex-col gap-4">
      {/* ===== Filter toolbar ===== */}
      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Grado y Sección
            </label>
            <div className="relative">
              <select
                value={selectedGrado}
                onChange={(e) => setSelectedGrado(e.target.value)}
                className="h-11 w-full appearance-none rounded-input border border-border bg-surface pl-3 pr-9 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary"
              >
                <option value="">Seleccionar grado</option>
                {gradosFiltrados.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Fecha
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="date"
                value={selectedDate}
                max={hoy()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11 w-full rounded-input border border-border bg-surface pl-9 pr-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary"
              />
            </div>
          </div>
        </div>
      </Card>

      {!selectedGrado ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Selecciona un grado"
          description="Elige un grado y sección para comenzar el registro diario."
        />
      ) : loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size={28} />
        </div>
      ) : estudiantesSeccion.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Sin estudiantes"
          description="Este grado no tiene estudiantes activos."
        />
      ) : (
        <>
          {/* ===== Summary chips bar ===== */}
          {resumenFiltrado.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {resumenFiltrado.map((r) => (
                <span
                  key={r.key}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${softBgClasses[r.catColor]}`}
                >
                  <span className="text-sm font-bold">{r.count}</span>
                  <span className="opacity-80">{r.catNombre}</span>
                </span>
              ))}
              {completados > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-success-bg text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completados} completo{completados !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* ===== Bulk action bar ===== */}
          {tiposActivos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-card bg-surface-alt px-3 py-2.5">
              <span className="mr-1 flex items-center gap-1 text-xs font-medium text-text-muted">
                <CheckCheck className="h-3.5 w-3.5" />
                Acción rápida:
              </span>
              {tiposActivos.map((t) => {
                const primeraCat = t.categorias[0]
                if (!primeraCat) return null
                return (
                  <Button
                    key={t.id}
                    size="sm"
                    variant="ghost"
                    onClick={() => marcarTodos(t.id, primeraCat.id)}
                  >
                    {t.nombre}: {primeraCat.nombre}
                  </Button>
                )
              })}
            </div>
          )}

          {/* ===== Mobile: compact list rows ===== */}
          <div className="overflow-hidden rounded-card border border-border md:hidden">
            {estudiantesSeccion.map((est, idx) => {
              const completo = isCompleto(est.id)
              const fullName = est.nombreCompleto
              return (
                <div
                  key={est.id}
                  className={[
                    'px-3 py-2.5',
                    idx !== estudiantesSeccion.length - 1 ? 'border-b border-border' : '',
                    idx % 2 === 1 ? 'bg-surface-alt/40' : '',
                  ].join(' ')}
                >
                  {/* Name row */}
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <Avatar name={fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {est.nombreCompleto}
                      </p>
                      <p className="font-mono text-xs text-text-muted">{est.codigo}</p>
                    </div>
                    {completo ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                    ) : obligatorios.length > 0 ? (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-warning" />
                    ) : null}
                  </div>
                  {/* Type groups - inline wrap */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-10.5">
                    {tiposActivos.map((t) => {
                      const selected = selecciones[`${est.id}:${t.id}`]
                      return (
                        <div key={t.id} className="flex items-center gap-1.5">
                          <span className="whitespace-nowrap text-[10px] font-medium text-text-muted">
                            {t.nombre}
                            {t.obligatorio && <span className="text-error">*</span>}
                          </span>
                          <div className="flex gap-1">
                            {t.categorias.map((cat) => (
                              <CategoryChip
                                key={cat.id}
                                label={cat.nombre}
                                color={cat.color}
                                selected={selected === cat.id}
                                onClick={() => setCategoria(est.id, t.id, cat.id)}
                                size="sm"
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ===== Desktop: table with column headers ===== */}
          <div className="hidden overflow-x-auto rounded-card border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt text-left text-xs font-medium text-text-muted">
                  <th className="px-4 py-3 min-w-[220px]">Estudiante</th>
                  {tiposActivos.map((t) => (
                    <th key={t.id} className="px-4 py-3 min-w-[140px]">
                      {t.nombre}
                      {t.obligatorio && <span className="ml-0.5 text-error">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estudiantesSeccion.map((est) => {
                  const completo = isCompleto(est.id)
                  const fullName = est.nombreCompleto
                  return (
                    <tr
                      key={est.id}
                      className="border-b border-border last:border-0 hover:bg-surface-alt/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={fullName} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">
                        {est.nombreCompleto}
                            </p>
                            <p className="font-mono text-xs text-text-muted">{est.codigo}</p>
                          </div>
                          {completo && (
                            <CheckCircle2 className="ml-auto h-4 w-4 flex-shrink-0 text-success" />
                          )}
                        </div>
                      </td>
                      {tiposActivos.map((t) => {
                        const selected = selecciones[`${est.id}:${t.id}`]
                        return (
                          <td key={t.id} className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {t.categorias.map((cat) => (
                                <CategoryChip
                                  key={cat.id}
                                  label={cat.nombre}
                                  color={cat.color}
                                  selected={selected === cat.id}
                                  onClick={() => setCategoria(est.id, t.id, cat.id)}
                                />
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ===== Save button ===== */}
          <Button
            size="lg"
            fullWidth
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            Guardar Registro
          </Button>
        </>
      )}

      <ConfirmDialog
        open={warnOpen}
        title="Registros incompletos"
        message={warnMsg}
        confirmLabel="Guardar de todas formas"
        cancelLabel="Revisar"
        onConfirm={async () => {
          setWarnOpen(false)
          await doSave()
        }}
        onCancel={() => setWarnOpen(false)}
        variant="primary"
      />
    </div>
  )
}

export default RegistroPage
