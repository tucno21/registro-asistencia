import { useState, useRef } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { FilaImportacion } from '../types'
import { getGradoByNombre } from '../db/gradosSeccionesRepository'
import { getEstudianteByCodigo } from '../db/estudiantesRepository'
import { useEstudiantesStore } from '../store/estudiantesStore'
import { formatGrado } from '../lib/grado'
import Button from './Button'
import Badge from './Badge'

interface ExcelImportProps {
  open: boolean
  onClose: () => void
}

type Step = 'upload' | 'preview' | 'result'

const ExcelImport = ({ open, onClose }: ExcelImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [resultCount, setResultCount] = useState(0)
  const [resultSkipped, setResultSkipped] = useState(0)
  const [resultErrors, setResultErrors] = useState<string[]>([])

  const {
    importPreview,
    importValidCount,
    importErrorCount,
    prepararImportacion,
    limpiarImportacion,
    confirmarImportacion,
  } = useEstudiantesStore()

  if (!open) return null

  const resetState = () => {
    setStep('upload')
    setFileName('')
    limpiarImportacion()
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nombres', 'Apellidos', 'Código/DNI', 'Grado', 'Sección'],
    ])
    ws['!cols'] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes')
    XLSX.writeFile(wb, 'plantilla_estudiantes.xlsx')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })

      // Find header row - look for row with expected column names
      let headerRowIndex = -1
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i]
        if (!row || row.length < 3) continue
        const header = row.map((c) => (c ?? '').toString().trim().toLowerCase())
        if (
          header.some((h) => h.includes('nombres') || h.includes('nombre')) &&
          header.some((h) => h.includes('apellidos') || h.includes('apellido')) &&
          header.some((h) => h.includes('código') || h.includes('codigo') || h.includes('dni'))
        ) {
          headerRowIndex = i
          break
        }
      }

      if (headerRowIndex === -1) {
        alert(
          'No se encontró una fila de encabezados válida. Asegúrate de que el archivo tenga columnas: Nombres, Apellidos, Código/DNI, Grado, Sección.',
        )
        return
      }

      // Parse data rows (after header)
      const dataRows: FilaImportacion[] = []
      const codigosEnArchivo = new Set<string>()

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length < 3) continue
        const values = row.map((c) => (c ?? '').toString().trim())
        if (values.every((v) => !v)) continue

        const nombres = values[0] ?? ''
        const apellidos = values[1] ?? ''
        const codigo = values[2] ?? ''
        const gradoRaw = values[3] ?? ''
        const seccion = values[4] ?? ''
        const grado = formatGrado(gradoRaw)

        const errores: string[] = []

        if (!nombres) errores.push('Nombres vacío')
        if (!apellidos) errores.push('Apellidos vacío')
        if (!codigo) {
          errores.push('Código/DNI vacío')
        } else if (codigosEnArchivo.has(codigo.toLowerCase())) {
          errores.push('Código/DNI duplicado en el archivo')
        } else {
          codigosEnArchivo.add(codigo.toLowerCase())
        }
        if (!gradoRaw) errores.push('Grado vacío')
        if (!seccion) errores.push('Sección vacía')

        dataRows.push({
          rowIndex: i + 1,
          nombres,
          apellidos,
          codigo,
          grado,
          seccion,
          valida: errores.length === 0,
          errores,
        })
      }

      // Validate against DB (grado+seccion must exist, codigo must be unique)
      for (const fila of dataRows) {
        if (!fila.valida) continue

        // Check grado+seccion exists
        const nombreGrado = `${fila.grado} ${fila.seccion}`
        const gradoExistente = await getGradoByNombre(nombreGrado)
        if (!gradoExistente || !gradoExistente.activo) {
          fila.valida = false
          fila.errores.push(
            `Grado "${nombreGrado}" no existe en el sistema. Créalo primero.`,
          )
        } else {
          fila.gradoSeccionId = gradoExistente.id
        }

        // Check codigo not already in DB
        if (fila.valida) {
          const existente = await getEstudianteByCodigo(fila.codigo)
          if (existente) {
            fila.valida = false
            fila.errores.push('Código/DNI ya registrado en la base de datos')
          }
        }
      }

      prepararImportacion(dataRows)
      setStep('preview')
    } catch {
      alert('Error al leer el archivo. Asegúrate de que sea un .xlsx o .csv válido.')
    }
  }

  const handleConfirmImport = async () => {
    setImporting(true)
    try {
      const result = await confirmarImportacion()
      setResultCount(result.count)
      setResultSkipped(result.errores.length)
      setResultErrors(result.errores)
      setStep('result')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setResultCount(0)
      setResultErrors([msg])
      setStep('result')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <div className="flex max-h-[90dvh] w-full flex-col rounded-t-xl bg-surface md:mx-4 md:max-w-2xl md:rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-lg font-semibold text-text-primary">
            Importar desde Excel
          </h3>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {step === 'upload' && (
            <>
              <p className="text-sm text-text-secondary">
                Descarga la plantilla para conocer el formato esperado, luego sube tu
                archivo Excel (.xlsx) o CSV.
              </p>

              <Button variant="secondary" onClick={downloadTemplate} fullWidth>
                <Download className="h-4 w-4" />
                Descargar plantilla
              </Button>

              <div className="flex items-center gap-2 text-xs text-text-muted">
                <div className="h-px flex-1 bg-border" />
                <span>o</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-card border-2 border-dashed border-border bg-surface-alt p-8 transition-colors hover:border-primary">
                <Upload className="h-8 w-8 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">
                  Seleccionar archivo
                </span>
                <span className="text-xs text-text-muted">
                  .xlsx o .csv
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-text-secondary truncate">{fileName}</span>
              </div>

              <div className="flex gap-2 text-sm">
                <Badge variant="success">{importValidCount} válidas</Badge>
                {importErrorCount > 0 && (
                  <Badge variant="error">{importErrorCount} con errores</Badge>
                )}
              </div>

              <div className="overflow-x-auto rounded-card border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-alt text-left text-xs font-medium text-text-muted">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Nombres</th>
                      <th className="px-3 py-2">Apellidos</th>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Grado</th>
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((fila) => (
                      <tr
                        key={fila.rowIndex}
                        className="border-t border-border"
                      >
                        <td className="px-3 py-2 text-text-muted">{fila.rowIndex}</td>
                        <td className="px-3 py-2 text-text-primary">{fila.nombres}</td>
                        <td className="px-3 py-2 text-text-primary">{fila.apellidos}</td>
                        <td className="px-3 py-2 text-text-primary">{fila.codigo}</td>
                        <td className="px-3 py-2 text-text-primary">
                          {fila.grado} {fila.seccion}
                        </td>
                        <td className="px-3 py-2">
                          {fila.valida ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-error" title={fila.errores.join(' | ')}>
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{fila.errores[0]}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={importValidCount === 0 || importing}
                  loading={importing}
                  className="flex-1"
                >
                  Importar {importValidCount} estudiante{importValidCount !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}

          {step === 'result' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {resultErrors.length > 0 && resultCount === 0 ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-bg">
                    <AlertCircle className="h-8 w-8 text-error" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Error al importar</h3>
                  <div className="flex flex-col gap-1 text-sm text-error max-w-sm">
                    {resultErrors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Importación completada
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {resultCount} estudiante{resultCount !== 1 ? 's' : ''} importado{resultCount !== 1 ? 's' : ''} correctamente.
                  </p>
                  {resultSkipped > 0 && (
                    <div className="w-full rounded-card border border-border p-3 text-left text-sm">
                      <p className="mb-2 font-medium text-warning">{resultSkipped} omitido{resultSkipped !== 1 ? 's' : ''}:</p>
                      <ul className="flex flex-col gap-1 text-text-secondary">
                        {resultErrors.map((err, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs">
                            <span className="mt-0.5 text-warning">•</span>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              <Button onClick={handleClose}>Listo</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExcelImport
