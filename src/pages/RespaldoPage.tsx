import { useState, useRef } from 'react'
import { FileDown, FileUp, Download, Trash2, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useEstudiantesStore } from '../store/estudiantesStore'
import { useTiposRegistroStore } from '../store/tiposRegistroStore'
import { getAllRegistros } from '../db/registrosRepository'
import { exportAllData, importAllData, clearAllData } from '../db/backupRepository'
import { useToastStore } from '../store/toastStore'
import { useSyncStore } from '../store/syncStore'
import Card from '../components/Card'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'

const hoy = () => new Date().toISOString().split('T')[0]

const RespaldoPage = () => {
  const { grados, estudiantes, loadAll } = useEstudiantesStore()
  const { tipos, load: loadTipos } = useTiposRegistroStore()
  const toast = useToastStore()
  const clearSyncConfig = useSyncStore((s) => s.clearScriptUrl)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [confirmImportOpen, setConfirmImportOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<File | null>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [updating, setUpdating] = useState(false)

  const estudiantesActivos = estudiantes.filter((e) => e.activo)
  const tiposActivos = tipos.filter((t) => t.activo)

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
          Estudiante: est ? est.nombreCompleto : r.estudianteId,
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
          grados.map((g) => ({ Nombre: g.nombre, Activo: g.activo })),
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

      if (!data.usuarios || !data.estudiantes || !data.registros) {
        throw new Error(
          'Estructura inválida. Asegúrate de usar un archivo de respaldo válido.',
        )
      }

      await importAllData(data)

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

  const doClear = async () => {
    setClearing(true)
    try {
      await clearAllData()
      clearSyncConfig()
      toast.show('Base de datos limpiada. Recargando...', 'success')
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.show('Error al limpiar la base de datos', 'error')
      setClearing(false)
    }
  }

  const doUpdateApp = async () => {
    setUpdating(true)
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((reg) => reg.unregister()))
      }
      toast.show('Actualizando aplicacion...', 'success')
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.show('Error al actualizar la aplicacion', 'error')
      setUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text-primary">Respaldo</h2>

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
          Restaura un respaldo JSON. Los datos actuales serán reemplazados por
          completo.
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

      <Card padding="sm">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          Actualizar aplicacion
        </h3>
        <p className="mb-4 text-sm text-text-secondary">
          Elimina los archivos en cache (JS, CSS, etc.) y descarga la version
          mas reciente. Los datos locales NO se eliminan.
        </p>
        <Button
          variant="secondary"
          onClick={doUpdateApp}
          loading={updating}
        >
          <RefreshCw className="h-4 w-4" />
          Buscar actualizaciones
        </Button>
      </Card>

      <Card padding="sm" className="border-error/30">
        <h3 className="mb-3 text-sm font-semibold text-error">
          Zona de peligro
        </h3>
        <p className="mb-4 text-sm text-text-secondary">
          Elimina todos los datos locales (estudiantes, grados, tipos, registros
          y usuarios). La app quedara como recien instalada. Esto NO afecta los
          datos en Google Sheets.
        </p>
        <Button
          variant="danger"
          onClick={() => setConfirmClearOpen(true)}
          loading={clearing}
        >
          <Trash2 className="h-4 w-4" />
          Limpiar base de datos
        </Button>
      </Card>

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

      <ConfirmDialog
        open={confirmClearOpen}
        title="Limpiar base de datos"
        message={'Se eliminaran TODOS los datos locales:\n\n- Usuarios\n- Estudiantes\n- Grados y Secciones\n- Tipos de Registro\n- Registros\n\nLa app quedara como recien instalada. Los datos en Google Sheets NO se afectan.\n\n¿Deseas continuar?'}
        confirmLabel="Si, limpiar todo"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={doClear}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  )
}

export default RespaldoPage
