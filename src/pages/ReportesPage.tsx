import { useEffect, useState, useRef, useMemo } from 'react'
import {
  FileDown,
  FileUp,
  Download,
  Search,
  History,
  Table2,
  Shield,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useEstudiantesStore } from '../store/estudiantesStore'
import { useTiposRegistroStore } from '../store/tiposRegistroStore'
import {
  getHistorialByEstudiante,
  getHistorialByGradoAndFechas,
  getAllRegistros,
} from '../db/registrosRepository'
import { exportAllData, importAllData } from '../db/backupRepository'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import type { Registro } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

type Tab = 'estudiante' | 'seccion' | 'respaldo'

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
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [historial, setHistorial] = useState<Registro[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)

  // --- Tab: Por seccion ---
  const [selectedGradoRpt, setSelectedGradoRpt] = useState('')
  const [rptFechaInicio, setRptFechaInicio] = useState('')
  const [rptFechaFin, setRptFechaFin] = useState(hoy())
  const [matriz, setMatriz] = useState<Registro[]>([])
  const [matrizLoading, setMatrizLoading] = useState(false)

  // --- Tab: Respaldo ---
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [confirmImportOpen, setConfirmImportOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<File | null>(null)

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
      grados.filter((g) => {
        if (!g.activo) return false
        if (user?.rol === 'docente' && user.gradosAsignados.length > 0) {
          return user.gradosAsignados.includes(g.id)
        }
        return true
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

    const rows = historial.map((r) => {
      const tipo = tiposActivos.find((t) => t.id === r.tipoRegistroId)
      const cat = tipo?.categorias.find((c) => c.id === r.categoriaSeleccionada)
      return {
        Fecha: r.fecha,
        'Tipo Registro': tipo?.nombre ?? '',
        Categoría: cat?.nombre ?? '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Historial')
    const filename = `historial_${est.nombreCompleto.replace(/\s+/g, '_')}_${hoy()}.xlsx`
    XLSX.writeFile(wb, filename)
    toast.show('Historial exportado', 'success')
  }

  // --- Excel Export: Matriz por seccion (fechas como columnas, estudiantes como filas) ---
  const exportMatriz = () => {
    if (!selectedGradoRpt) return
    const grado = grados.find((g) => g.id === selectedGradoRpt)
    if (!grado) return

    const ests = estudiantes.filter(
      (e) => e.activo && e.gradoSeccionId === selectedGradoRpt,
    )

    // Gather all unique dates
    const fechas = [...new Set(matriz.map((r) => r.fecha))].sort()

    // Group by student
    const byStudent = new Map<string, Map<string, Registro[]>>()
    for (const r of matriz) {
      if (!byStudent.has(r.estudianteId))
        byStudent.set(r.estudianteId, new Map())
      const byFecha = byStudent.get(r.estudianteId)!
      if (!byFecha.has(r.fecha)) byFecha.set(r.fecha, [])
      byFecha.get(r.fecha)!.push(r)
    }

    const header = [
      'Estudiante',
      ...fechas.flatMap((f) =>
        tiposActivos.map((t) => `${f} - ${t.nombre}`),
      ),
    ]

    const rows = ests.map((est) => {
      const registrosPorFecha = byStudent.get(est.id) ?? new Map()
      const row = [est.nombreCompleto]
      for (const f of fechas) {
        for (const t of tiposActivos) {
          const regs = registrosPorFecha.get(f) ?? []
          const match = regs.find((r: Registro) => r.tipoRegistroId === t.id)
          const cat = match
            ? t.categorias.find((c) => c.id === match.categoriaSeleccionada)
            : undefined
          row.push(cat?.nombre ?? '')
        }
      }
      return row
    })

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    // Column widths
    ws['!cols'] = [
      { wch: 30 },
      ...fechas.flatMap(() => tiposActivos.map(() => ({ wch: 14 }))),
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Matriz ${grado.nombre}`)
    const filename = `matriz_${grado.nombre.replace(/\s+/g, '_')}_${hoy()}.xlsx`
    XLSX.writeFile(wb, filename)
    toast.show('Matriz exportada', 'success')
  }

  // --- Excel Export: Backup completo (todas las tablas en un solo archivo) ---
  const exportBackupExcel = async () => {
    try {
      const allRegistros = await getAllRegistros()
      const estRows = estudiantesActivos.map((e) => {
        const g = grados.find((g) => g.id === e.gradoSeccionId)
        return {
          Código: e.codigo,
          'Nombre Completo': e.nombreCompleto,
          Grado: g?.nombre ?? '',
        }
      })
      const regRows = allRegistros.map((r) => {
        const est = estudiantesActivos.find((e) => e.id === r.estudianteId)
        const tipo = tiposActivos.find((t) => t.id === r.tipoRegistroId)
        const cat = tipo?.categorias.find(
          (c) => c.id === r.categoriaSeleccionada,
        )
        return {
          Fecha: r.fecha,
          Estudiante: est
            ? est.nombreCompleto
            : r.estudianteId,
          Tipo: tipo?.nombre ?? '',
          Categoría: cat?.nombre ?? '',
          Grado: r.gradoSeccionId,
        }
      })

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(estRows),
        'Estudiantes',
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(regRows),
        'Registros',
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          gradosFiltrados.map((g) => ({ Nombre: g.nombre, Activo: g.activo })),
        ),
        'Secciones',
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          tiposActivos.map((t) => ({
            Nombre: t.nombre,
            Obligatorio: t.obligatorio,
            Categorías: t.categorias.map((c) => c.nombre).join(', '),
          })),
        ),
        'Tipos de Registro',
      )

      XLSX.writeFile(wb, `backup_completo_${hoy()}.xlsx`)
      toast.show('Backup Excel exportado', 'success')
    } catch {
      toast.show('Error al exportar backup Excel', 'error')
    }
  }

  // --- JSON Backup / Restore ---
  const handleExportJSON = async () => {
    try {
      const blob = await exportAllData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `respaldo_registros_${hoy()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.show('Respaldo JSON descargado', 'success')
    } catch {
      toast.show('Error al crear el respaldo', 'error')
    }
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImport(file)
    setConfirmImportOpen(true)
  }

  const doImport = async () => {
    if (!pendingImport) return
    setImporting(true)
    try {
      const text = await pendingImport.text()
      const data = JSON.parse(text)

      // Validate structure
      if (!data.usuarios || !data.estudiantes || !data.registros) {
        throw new Error(
          'Estructura inválida. Asegúrate de usar un archivo de respaldo válido.',
        )
      }

      await importAllData(data)

      // Reload stores
      await Promise.all([loadAll(), loadTipos()])

      toast.show('Datos importados correctamente. Recarga la página.', 'success')
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : 'Error al importar',
        'error',
      )
    } finally {
      setImporting(false)
      setConfirmImportOpen(false)
      setPendingImport(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
    { key: 'respaldo', label: 'Respaldo', icon: Shield },
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
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Estudiante
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value)
                    setHistorial([])
                  }}
                  className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Seleccionar estudiante</option>
                  {estudiantesActivos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombreCompleto} — {e.codigo}
                    </option>
                  ))}
                </select>
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
                    <th className="px-3 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Tipo</th>
                    <th className="px-3 py-2.5">Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((r) => {
                    const tipo = tiposActivos.find(
                      (t) => t.id === r.tipoRegistroId,
                    )
                    const cat = tipo?.categorias.find(
                      (c) => c.id === r.categoriaSeleccionada,
                    )
                    return (
                      <tr
                        key={r.id}
                        className="border-t border-border hover:bg-surface-alt/50"
                      >
                        <td className="px-3 py-2.5 font-mono text-text-primary">
                          {r.fecha}
                        </td>
                        <td className="px-3 py-2.5 text-text-primary">
                          {tipo?.nombre ?? r.tipoRegistroId}
                        </td>
                        <td className="px-3 py-2.5">
                          {cat && (
                            <Badge variant={cat.color as any}>
                              {cat.nombre}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
                disabled={!selectedGradoRpt || !rptFechaInicio || !rptFechaFin}
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
          ) : !selectedGradoRpt ? (
            <EmptyState
              icon={Table2}
              title="Selecciona un grado"
              description="Elige un grado y rango de fechas para ver la matriz."
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
                    {tiposActivos.map((t) => (
                      <th
                        key={t.id}
                        className="px-3 py-2.5 text-center min-w-[100px]"
                      >
                        {t.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const ests = estudiantes.filter(
                      (e) =>
                        e.activo &&
                        e.gradoSeccionId === selectedGradoRpt,
                    )
                    // Last record per student per tipo
                    const latestByStudent = new Map<
                      string,
                      Map<string, Registro>
                    >()
                    for (const r of matriz) {
                      if (!latestByStudent.has(r.estudianteId))
                        latestByStudent.set(r.estudianteId, new Map())
                      const byTipo = latestByStudent.get(r.estudianteId)!
                      const existing = byTipo.get(r.tipoRegistroId)
                      if (!existing || r.fecha > existing.fecha) {
                        byTipo.set(r.tipoRegistroId, r)
                      }
                    }

                    return ests.map((est) => {
                      const byTipo = latestByStudent.get(est.id) ?? new Map()
                      return (
                        <tr
                          key={est.id}
                          className="border-t border-border hover:bg-surface-alt/50"
                        >
                          <td className="px-3 py-2.5 sticky left-0 bg-surface z-10">
                            <p className="font-medium text-text-primary truncate">
                              {est.nombreCompleto}
                            </p>
                            <p className="text-xs text-text-muted font-mono">
                              {est.codigo}
                            </p>
                          </td>
                          {tiposActivos.map((t) => {
                            const r = byTipo.get(t.id)
                            const cat = r
                              ? t.categorias.find(
                                  (c) => c.id === r.categoriaSeleccionada,
                                )
                              : undefined
                            return (
                              <td
                                key={t.id}
                                className="px-3 py-2.5 text-center"
                              >
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

      {/* --- Tab: Respaldo --- */}
      {tab === 'respaldo' && (
        <div className="flex flex-col gap-4">
          <Card padding="sm">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Exportar datos
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
              Descarga un archivo JSON con todos los datos del sistema (sin
              contraseñas) o un archivo Excel con múltiples hojas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExportJSON}>
                <FileDown className="h-4 w-4" />
                Exportar JSON
              </Button>
              <Button variant="ghost" onClick={exportBackupExcel}>
                <Download className="h-4 w-4" />
                Exportar Excel completo
              </Button>
            </div>
          </Card>

          <Card padding="sm">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Importar datos
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
              Restaura un respaldo JSON. Los datos actuales serán reemplazados
              por completo.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              loading={importing}
            >
              <FileUp className="h-4 w-4" />
              Importar JSON
            </Button>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmImportOpen}
        title="Importar respaldo"
        message="Esta acción reemplazará TODOS los datos actuales del sistema. Los usuarios actuales se mantendrán pero sus datos (estudiantes, grados, tipos de registro, registros) serán sobrescritos. ¿Deseas continuar?"
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={doImport}
        onCancel={() => {
          setConfirmImportOpen(false)
          setPendingImport(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
      />
    </div>
  )
}

export default ReportesPage
