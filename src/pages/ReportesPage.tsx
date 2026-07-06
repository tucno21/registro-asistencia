import { useEffect, useState, useMemo } from 'react'
import {
  Download,
  Search,
  History,
  Table2,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useEstudiantesStore } from '../store/estudiantesStore'
import { useTiposRegistroStore } from '../store/tiposRegistroStore'
import {
  getHistorialByEstudiante,
  getHistorialByGradoAndFechas,
} from '../db/registrosRepository'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import type { Registro } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

type Tab = 'estudiante' | 'seccion'

const hoy = () => new Date().toISOString().split('T')[0]

const ReportesPage = () => {
  const user = useAuthStore((s) => s.user)
  const { grados, estudiantes, loadAll } = useEstudiantesStore()
  const { tipos, load: loadTipos } = useTiposRegistroStore()
  const toast = useToastStore()

  const [tab, setTab] = useState<Tab>('estudiante')
  const [loading, setLoading] = useState(true)

  // --- Tab: Por estudiante ---
  const [selectedStudent, setSelectedStudent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [historial, setHistorial] = useState<Registro[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)

  // --- Tab: Por seccion ---
  const [selectedGradoRpt, setSelectedGradoRpt] = useState('')
  const [selectedTipoRpt, setSelectedTipoRpt] = useState('')
  const [rptFechaInicio, setRptFechaInicio] = useState('')
  const [rptFechaFin, setRptFechaFin] = useState(hoy())
  const [matriz, setMatriz] = useState<Registro[]>([])
  const [matrizLoading, setMatrizLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadAll(), loadTipos()])
      setLoading(false)
    }
    init()
  }, [loadAll, loadTipos])

  // Filter grados by role
  const gradosFiltrados = useMemo(
    () =>
      grados
        .filter((g) => {
          if (!g.activo) return false
          if (user?.rol === 'docente' && user.gradosAsignados.length > 0) {
            return user.gradosAsignados.includes(g.id)
          }
          return true
        })
        .sort((a, b) => {
          const numA = parseInt(a.grado.match(/^(\d+)/)?.[1] ?? '0', 10)
          const numB = parseInt(b.grado.match(/^(\d+)/)?.[1] ?? '0', 10)
          if (numA !== numB) return numA - numB
          return a.seccion.localeCompare(b.seccion)
        }),
    [grados, user],
  )

  const estudiantesActivos = useMemo(
    () => estudiantes.filter((e) => e.activo),
    [estudiantes],
  )

  const tiposActivos = useMemo(
    () => tipos.filter((t) => t.activo),
    [tipos],
  )

  const searchResults = useMemo(
    () => {
      if (!searchQuery.trim()) return estudiantesActivos
      const q = searchQuery.toLowerCase()
      return estudiantesActivos.filter(
        (e) =>
          e.nombreCompleto.toLowerCase().includes(q) ||
          e.codigo.toLowerCase().includes(q),
      )
    },
    [searchQuery, estudiantesActivos],
  )

  const selectedStudentName = useMemo(
    () => estudiantesActivos.find((e) => e.id === selectedStudent)?.nombreCompleto ?? '',
    [selectedStudent, estudiantesActivos],
  )

  // --- Historial por estudiante ---
  const loadHistorial = async () => {
    if (!selectedStudent) return
    setHistorialLoading(true)
    try {
      const data = await getHistorialByEstudiante(
        selectedStudent,
        fechaInicio || undefined,
        fechaFin || undefined,
      )
      setHistorial(data)
    } finally {
      setHistorialLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'estudiante') loadHistorial()
  }, [tab])

  // --- Matriz por seccion ---
  const loadMatriz = async () => {
    if (!selectedGradoRpt || !rptFechaInicio || !rptFechaFin) return
    setMatrizLoading(true)
    try {
      const data = await getHistorialByGradoAndFechas(
        selectedGradoRpt,
        rptFechaInicio,
        rptFechaFin,
      )
      setMatriz(data)
    } finally {
      setMatrizLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'seccion') loadMatriz()
  }, [tab])

  // --- Excel Export: Historial por estudiante ---
  const exportHistorial = () => {
    if (!selectedStudent) return
    const est = estudiantesActivos.find((e) => e.id === selectedStudent)
    if (!est) return

    const fechas = [...new Set(historial.map((r) => r.fecha))].sort()

    const byFecha = new Map<string, Map<string, string>>()
    for (const r of historial) {
      if (!byFecha.has(r.fecha)) byFecha.set(r.fecha, new Map())
      byFecha.get(r.fecha)!.set(r.tipoRegistroId, r.categoriaSeleccionada)
    }

    const header = ['Fecha', ...tiposActivos.map((t) => t.nombre)]

    const rows = fechas.map((f) => {
      const cats = byFecha.get(f) ?? new Map()
      const row: string[] = [f]
      for (const t of tiposActivos) {
        const catId = cats.get(t.id)
        const cat = catId ? t.categorias.find((c) => c.id === catId) : undefined
        row.push(cat?.nombre ?? '')
      }
      return row
    })

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [{ wch: 14 }, ...tiposActivos.map(() => ({ wch: 18 }))]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Historial')
    const filename = `historial_${est.nombreCompleto.replace(/\s+/g, '_')}_${hoy()}.xlsx`
    XLSX.writeFile(wb, filename)
    toast.show('Historial exportado', 'success')
  }

  // --- Excel Export: Matriz por seccion ---
  const exportMatriz = () => {
    if (!selectedGradoRpt || !selectedTipoRpt) return
    const grado = grados.find((g) => g.id === selectedGradoRpt)
    if (!grado) return
    const tipo = tiposActivos.find((t) => t.id === selectedTipoRpt)
    if (!tipo) return

    const ests = estudiantes.filter(
      (e) => e.activo && e.gradoSeccionId === selectedGradoRpt,
    )
    const fechas = [...new Set(matriz.map((r) => r.fecha))].sort()

    const byStudent = new Map<string, Map<string, string>>()
    for (const r of matriz) {
      if (r.tipoRegistroId !== selectedTipoRpt) continue
      if (!byStudent.has(r.estudianteId)) byStudent.set(r.estudianteId, new Map())
      byStudent.get(r.estudianteId)!.set(r.fecha, r.categoriaSeleccionada)
    }

    const header = ['Estudiante', ...fechas]
    const rows = ests.map((est) => {
      const dates = byStudent.get(est.id) ?? new Map()
      const row: string[] = [est.nombreCompleto]
      for (const f of fechas) {
        const catId = dates.get(f)
        const cat = catId ? tipo.categorias.find((c) => c.id === catId) : undefined
        row.push(cat?.nombre ?? '')
      }
      return row
    })

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [{ wch: 30 }, ...fechas.map(() => ({ wch: 14 }))]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${tipo.nombre} - ${grado.nombre}`)
    const filename = `${tipo.nombre.toLowerCase()}_${grado.nombre.replace(/\s+/g, '_')}_${hoy()}.xlsx`
    XLSX.writeFile(wb, filename)
    toast.show('Matriz exportada', 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: typeof History }[] = [
    { key: 'estudiante', label: 'Por Estudiante', icon: History },
    { key: 'seccion', label: 'Por Sección', icon: Table2 },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text-primary">Reportes</h2>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-alt p-1">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* --- Tab: Por Estudiante --- */}
      {tab === 'estudiante' && (
        <div className="flex flex-col gap-4">
          <Card padding="sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-text-secondary">
                  Estudiante
                </label>
                <input
                  value={selectedStudent ? selectedStudentName : searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedStudent('')
                    setHistorial([])
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Buscar estudiante..."
                  className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                {showDropdown && searchQuery.trim() !== '' && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-card border border-border bg-surface shadow-card">
                    {searchResults.slice(0, 50).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedStudent(e.id)
                          setSearchQuery('')
                          setShowDropdown(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text-primary hover:bg-surface-alt transition-colors"
                      >
                        <span className="flex-1 truncate">{e.nombreCompleto}</span>
                        <span className="text-xs text-text-muted font-mono">{e.codigo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className="text-sm font-medium text-text-secondary">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-text-secondary">
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  max={hoy()}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={loadHistorial}
                loading={historialLoading}
                disabled={!selectedStudent}
                size="md"
              >
                <Search className="h-4 w-4" />
                Consultar
              </Button>
              {historial.length > 0 && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={exportHistorial}
                >
                  <Download className="h-4 w-4" />
                  Exportar Excel
                </Button>
              )}
            </div>
          </Card>

          {historialLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={28} />
            </div>
          ) : !selectedStudent ? (
            <EmptyState
              icon={History}
              title="Selecciona un estudiante"
              description="Elige un estudiante y aplica filtros para ver su historial."
            />
          ) : historial.length === 0 ? (
            <EmptyState
              icon={History}
              title="Sin registros"
              description="No se encontraron registros para este estudiante en el rango seleccionado."
            />
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-alt text-left text-xs font-medium text-text-muted">
                    <th className="px-3 py-2.5 whitespace-nowrap">Fecha</th>
                    {tiposActivos.map((t) => (
                      <th key={t.id} className="px-3 py-2.5 text-center whitespace-nowrap min-w-[100px]">
                        {t.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const fechas = [...new Set(historial.map((r) => r.fecha))].sort()
                    const byFecha = new Map<string, Map<string, string>>()
                    for (const r of historial) {
                      if (!byFecha.has(r.fecha)) byFecha.set(r.fecha, new Map())
                      byFecha.get(r.fecha)!.set(r.tipoRegistroId, r.categoriaSeleccionada)
                    }

                    return fechas.map((f) => {
                      const cats = byFecha.get(f) ?? new Map()
                      return (
                        <tr key={f} className="border-t border-border hover:bg-surface-alt/50">
                          <td className="px-3 py-2.5 font-mono text-text-primary whitespace-nowrap">
                            {f}
                          </td>
                          {tiposActivos.map((t) => {
                            const catId = cats.get(t.id)
                            const cat = catId
                              ? t.categorias.find((c) => c.id === catId)
                              : undefined
                            return (
                              <td key={t.id} className="px-3 py-2.5 text-center">
                                {cat ? (
                                  <Badge variant={cat.color as any}>
                                    {cat.nombre}
                                  </Badge>
                                ) : (
                                  <span className="text-text-muted">—</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Tab: Por Sección --- */}
      {tab === 'seccion' && (
        <div className="flex flex-col gap-4">
          <Card padding="sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Grado y Sección
                </label>
                <select
                  value={selectedGradoRpt}
                  onChange={(e) => {
                    setSelectedGradoRpt(e.target.value)
                    setMatriz([])
                  }}
                  className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Seleccionar grado</option>
                  {gradosFiltrados.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Tipo de Registro
                </label>
                <select
                  value={selectedTipoRpt}
                  onChange={(e) => {
                    setSelectedTipoRpt(e.target.value)
                    setMatriz([])
                  }}
                  className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposActivos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Desde
                </label>
                <input
                  type="date"
                  value={rptFechaInicio}
                  onChange={(e) => setRptFechaInicio(e.target.value)}
                  className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Hasta
                </label>
                <input
                  type="date"
                  value={rptFechaFin}
                  max={hoy()}
                  onChange={(e) => setRptFechaFin(e.target.value)}
                  className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={loadMatriz}
                loading={matrizLoading}
                disabled={!selectedGradoRpt || !selectedTipoRpt || !rptFechaInicio || !rptFechaFin}
                size="md"
              >
                <Search className="h-4 w-4" />
                Consultar
              </Button>
              {matriz.length > 0 && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={exportMatriz}
                >
                  <Download className="h-4 w-4" />
                  Exportar Excel
                </Button>
              )}
            </div>
          </Card>

          {matrizLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={28} />
            </div>
          ) : !selectedGradoRpt || !selectedTipoRpt ? (
            <EmptyState
              icon={Table2}
              title="Selecciona un grado y tipo"
              description="Elige un grado, tipo de registro y rango de fechas para ver la matriz."
            />
          ) : matriz.length === 0 ? (
            <EmptyState
              icon={Table2}
              title="Sin registros"
              description="No hay registros para esta sección en el rango seleccionado."
            />
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-alt text-left text-xs font-medium text-text-muted">
                    <th className="px-3 py-2.5 min-w-[180px] sticky left-0 bg-surface-alt z-10">
                      Estudiante
                    </th>
                    {(() => {
                      const fechas = [...new Set(matriz.map((r) => r.fecha))].sort()
                      return fechas.map((f) => (
                        <th key={f} className="px-3 py-2.5 text-center min-w-[90px]">
                          {f}
                        </th>
                      ))
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const ests = estudiantes.filter(
                      (e) => e.activo && e.gradoSeccionId === selectedGradoRpt,
                    )
                    const tipo = tiposActivos.find((t) => t.id === selectedTipoRpt)
                    if (!tipo) return null

                    const fechas = [...new Set(matriz.map((r) => r.fecha))].sort()
                    const byStudent = new Map<string, Map<string, string>>()
                    for (const r of matriz) {
                      if (r.tipoRegistroId !== selectedTipoRpt) continue
                      if (!byStudent.has(r.estudianteId)) byStudent.set(r.estudianteId, new Map())
                      byStudent.get(r.estudianteId)!.set(r.fecha, r.categoriaSeleccionada)
                    }

                    return ests.map((est) => {
                      const dates = byStudent.get(est.id) ?? new Map()
                      return (
                        <tr key={est.id} className="border-t border-border hover:bg-surface-alt/50">
                          <td className="px-3 py-2.5 sticky left-0 bg-surface z-10">
                            <p className="font-medium text-text-primary truncate">
                              {est.nombreCompleto}
                            </p>
                            <p className="text-xs text-text-muted font-mono">
                              {est.codigo}
                            </p>
                          </td>
                          {fechas.map((f) => {
                            const catId = dates.get(f)
                            const cat = catId
                              ? tipo.categorias.find((c) => c.id === catId)
                              : undefined
                            return (
                              <td key={f} className="px-3 py-2.5 text-center">
                                {cat ? (
                                  <Badge variant={cat.color as any}>
                                    {cat.nombre}
                                  </Badge>
                                ) : (
                                  <span className="text-text-muted">—</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReportesPage
