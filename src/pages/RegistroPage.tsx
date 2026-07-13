import { useEffect, useState, useCallback } from 'react'
import {
  ClipboardCheck,
  Save,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useEstudiantesStore } from '../store/estudiantesStore'
import { useTiposRegistroStore } from '../store/tiposRegistroStore'
import { getRegistrosByFechaAndGrado, upsertRegistros, deleteRegistros } from '../db/registrosRepository'
import { useToastStore } from '../store/toastStore'
import { unformatGrado } from '../lib/grado'
import type { Registro, ColorCategoria } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

type Selecciones = Record<string, string | null>

const hoy = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

function abreviarNombre(nombreCompleto: string): string {
  const [apellidosPart, nombresPart] = nombreCompleto.split(',').map(s => s.trim())
  if (!nombresPart) {
    const palabras = nombreCompleto.trim().split(/\s+/)
    if (palabras.length < 2) return nombreCompleto
    return `${cap(palabras[palabras.length - 1])}, ${cap(palabras[0])}`
  }
  const primerApellido = apellidosPart.split(/\s+/)[0] ?? ''
  const primerNombre = nombresPart.split(/\s+/)[0] ?? ''
  return `${cap(primerApellido)}, ${cap(primerNombre)}`
}

const letterClasses: Record<ColorCategoria, string> = {
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  error: 'bg-error text-error-foreground',
  info: 'bg-info text-info-foreground',
  neutral: 'bg-slate-500 text-white',
}

// Clase de borde para el separador entre grupos de categorías (tipos de registro).
// Se mantiene el mismo grosor (border-l, 1px) que las columnas internas, pero con
// un color mucho más oscuro/contrastado para que el grupo se distinga claramente.
const GROUP_SEPARATOR = 'border-l border-l-slate-400 dark:border-l-slate-400'
const INNER_SEPARATOR = 'border-l border-l-border/50'

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

  const gradosFiltrados = grados
    .filter((g) => {
      if (!g.activo) return false
      if (user?.rol === 'docente' && user.gradosAsignados.length > 0) {
        return user.gradosAsignados.includes(g.id)
      }
      return true
    })
    .sort((a, b) => {
      const numA = parseInt(unformatGrado(a.grado), 10)
      const numB = parseInt(unformatGrado(b.grado), 10)
      if (numA !== numB) return numA - numB
      return a.seccion.localeCompare(b.seccion)
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

  // Se mantiene el mismo comportamiento de "toggle": si se vuelve a marcar
  // la misma categoría ya seleccionada, se deselecciona.
  const setCategoria = (estudianteId: string, tipoRegistroId: string, categoriaId: string) => {
    setSelecciones((prev) => ({
      ...prev,
      [`${estudianteId}:${tipoRegistroId}`]:
        prev[`${estudianteId}:${tipoRegistroId}`] === categoriaId ? null : categoriaId,
    }))
  }

  const marcarTodos = (tipoRegistroId: string, categoriaId: string) => {
    setSelecciones((prev) => {
      const allMarked = estudiantesSeccion.every(
        (e) => prev[`${e.id}:${tipoRegistroId}`] === categoriaId,
      )
      const next = { ...prev }
      for (const e of estudiantesSeccion) {
        next[`${e.id}:${tipoRegistroId}`] = allMarked ? null : categoriaId
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
      const existentes = await getRegistrosByFechaAndGrado(selectedDate, selectedGrado)
      const toDelete: string[] = []
      for (const r of existentes) {
        const key = `${r.estudianteId}:${r.tipoRegistroId}`
        if (!selecciones[key]) {
          toDelete.push(r.id)
        }
      }

      const registros: Registro[] = []
      const now = new Date().toISOString()

      for (const est of estudiantesSeccion) {
        for (const t of tiposActivos) {
          const key = `${est.id}:${t.id}`
          const catId = selecciones[key]
          if (!catId) continue

          const prev = existentes.find(
            (r) => r.estudianteId === est.id && r.tipoRegistroId === t.id,
          )

          registros.push({
            id: prev?.id ?? crypto.randomUUID(),
            estudianteId: est.id,
            tipoRegistroId: t.id,
            categoriaSeleccionada: catId,
            fecha: selectedDate,
            gradoSeccionId: selectedGrado,
            registradoPor: user.id,
            fechaCreacion: prev?.fechaCreacion ?? now,
            updatedAt: now,
          })
        }
      }

      if (toDelete.length > 0) {
        await deleteRegistros(toDelete)
      }

      if (registros.length > 0) {
        await upsertRegistros(registros)
      }

      await loadExisting()
      const total = registros.length
      if (total === 0 && toDelete.length === 0) {
        toast.show('No hay registros para guardar', 'warning')
      } else {
        toast.show(
          `Registro guardado (${total} marca${total !== 1 ? 's' : ''})`,
          'success',
        )
      }
    } catch {
      toast.show('Error al guardar el registro', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ===== Filter toolbar ===== */}
      <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-card md:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-semibold text-text-secondary md:mb-1.5 md:text-xs">
              Grado y Sección
            </label>
            <div className="relative">
              <select
                value={selectedGrado}
                onChange={(e) => setSelectedGrado(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-border bg-surface pl-3 pr-9 text-xs font-medium text-text-primary shadow-sm transition-all duration-150 focus-visible:border-primary focus-visible:outline-none hover:border-border/80 hover:shadow"
              >
                <option value="" className="text-text-muted">Seleccionar grado</option>
                {gradosFiltrados.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted md:h-4 md:w-4" />
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-semibold text-text-secondary md:mb-1.5 md:text-xs">
              Fecha
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted md:left-3.5 md:h-4 md:w-4" />
              <input
                type="date"
                value={selectedDate}
                max={hoy()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-xs font-medium text-text-primary shadow-sm transition-all duration-150 focus-visible:border-primary focus-visible:outline-none hover:border-border/80 hover:shadow [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>

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
          {/* =====================================================================
              Tabla estilo planilla: columna estudiante fija a la izquierda +
              scroll horizontal para columnas de iniciales de categorías.
          ====================================================================== */}
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      className="sticky left-0 top-0 z-30 min-w-[110px] border-b border-border bg-surface-alt px-2 py-1.5 text-left text-xs font-semibold text-text-secondary "
                    >
                      Estudiantes
                    </th>
                    {tiposActivos.map((t, tIdx) => (
                      <th
                        key={t.id}
                        colSpan={t.categorias.length}
                        className={[
                          'sticky top-0 z-20 border-b border-border bg-surface-alt px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted',
                          tIdx > 0 ? GROUP_SEPARATOR : '',
                        ].join(' ')}
                      >
                        {t.nombre}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {tiposActivos.flatMap((t) =>
                      t.categorias.map((cat, catIdx) => (
                        <th
                          key={cat.id}
                          className={[
                            'sticky top-[22px] z-20 min-w-[30px] border-b border-border bg-surface-alt px-0.5 py-1 text-center align-bottom',
                            catIdx === 0 ? GROUP_SEPARATOR : INNER_SEPARATOR,
                          ].join(' ')}
                        >
                          <div className="flex flex-col items-center gap-px">
                            <span className="text-xs font-bold text-text-primary leading-tight">
                              {cat.nombre.charAt(0).toUpperCase()}
                            </span>
                            <button
                              onClick={() => marcarTodos(t.id, cat.id)}
                              className="flex h-4 w-4 items-center justify-center rounded text-text-secondary/70 transition-all hover:text-primary active:scale-75"
                              aria-label={`Marcar todos como ${cat.nombre}`}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {estudiantesSeccion.map((est, idx) => {
                    const rowBg = idx % 2 === 1 ? 'bg-surface-alt' : 'bg-surface'
                    return (
                      <tr key={est.id}>
                        <td
                          className={[
                            'sticky left-0 z-10 border-b border-border px-2 py-1',
                            rowBg,
                          ].join(' ')}
                        >
                          <span className="text-[11px] font-medium text-text-primary whitespace-nowrap">
                            {idx + 1}. {abreviarNombre(est.nombreCompleto)}
                          </span>
                        </td>

                        {tiposActivos.flatMap((t) =>
                          t.categorias.map((cat, catIdx) => {
                            const selected = selecciones[`${est.id}:${t.id}`] === cat.id
                            return (
                              <td
                                key={cat.id}
                                className={[
                                  'border-b border-border px-0.5 py-1 text-center',
                                  catIdx === 0 ? GROUP_SEPARATOR : INNER_SEPARATOR,
                                  rowBg,
                                ].join(' ')}
                              >
                                <button
                                  onClick={() => setCategoria(est.id, t.id, cat.id)}
                                  className={[
                                    'mx-auto flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold transition-all duration-100 active:scale-90',
                                    selected
                                      ? letterClasses[cat.color]
                                      : 'text-text-muted hover:bg-surface-alt hover:text-text-secondary',
                                  ].join(' ')}
                                  aria-label={`${t.nombre}: ${cat.nombre}`}
                                >
                                  {cat.nombre.charAt(0).toUpperCase()}
                                </button>
                              </td>
                            )
                          }),
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="flex items-center gap-1.5 text-xs text-text-muted sm:hidden">
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            Desliza horizontalmente para ver todas las columnas
          </p>

          <p className="text-center text-xs font-medium text-primary">
            Haz clic en la <ChevronDown className="inline h-3 w-3 align-middle" /> para marcar/desmarcar a todos
          </p>

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