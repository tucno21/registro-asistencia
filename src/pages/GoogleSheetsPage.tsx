import { useState } from 'react'
import {
  Table,
  Link2,
  Unlink,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Code2,
  Copy,
  Check,
  X,
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { useSyncStore } from '../store/syncStore'
import { useToastStore } from '../store/toastStore'
import { APPS_SCRIPT_CODE } from '../lib/appsScriptCode'

const INTERVAL_OPTIONS = [
  { value: 0, label: 'Desactivado' },
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
]

const GoogleSheetsPage = () => {
  const toast = useToastStore()
  const {
    scriptUrl,
    status,
    lastSync,
    autoSyncMin,
    errorMsg,
    setScriptUrl,
    clearScriptUrl,
    setAutoSyncMin,
    syncNow,
  } = useSyncStore()

  const [urlInput, setUrlInput] = useState(scriptUrl)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSaveUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) {
      toast.show('Ingresa una URL valida', 'warning')
      return
    }
    if (!trimmed.startsWith('https://script.google.com/')) {
      toast.show('La URL debe comenzar con https://script.google.com/', 'warning')
      return
    }
    setScriptUrl(trimmed)
    toast.show('URL guardada', 'success')
  }

  const handleClearUrl = () => {
    clearScriptUrl()
    setUrlInput('')
    setAutoSyncMin(0)
    toast.show('Desconectado', 'warning')
  }

  const handleSync = async () => {
    const ok = await syncNow()
    if (ok) {
      toast.show('Sincronizacion completada', 'success')
    } else {
      toast.show(errorMsg ?? 'Error al sincronizar', 'error')
    }
  }

  const handleIntervalChange = (min: number) => {
    setAutoSyncMin(min)
    toast.show(
      min === 0 ? 'Sincronizacion automatica desactivada' : `Auto-sync cada ${min} min`,
      'info',
    )
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE)
      setCopied(true)
      toast.show('Codigo copiado al portapapeles', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.show('No se pudo copiar. Selecciona y copia manualmente', 'warning')
    }
  }

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Nunca'
    const d = new Date(iso)
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text-primary">Google Sheets</h2>

      {/* Config */}
      <Card padding="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Table className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary">
                URL de Apps Script
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Pega la URL de despliegue del Web App de Google Apps Script
              </p>
            </div>
            {scriptUrl ? (
              <Badge variant="success">Conectado</Badge>
            ) : (
              <Badge variant="neutral">Sin configurar</Badge>
            )}
          </div>

          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfy.../exec"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex gap-2">
            <Button onClick={handleSaveUrl} size="sm">
              <Link2 className="h-4 w-4" />
              Guardar URL
            </Button>
            {scriptUrl && (
              <Button variant="ghost" onClick={handleClearUrl} size="sm">
                <Unlink className="h-4 w-4" />
                Desconectar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {scriptUrl && (
        <>
          {/* Sync status + manual */}
          <Card padding="sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Estado de sincronizacion
                </h3>
                {status === 'syncing' && <Badge variant="info">Sincronizando...</Badge>}
                {status === 'success' && <Badge variant="success">Al dia</Badge>}
                {status === 'error' && <Badge variant="error">Error</Badge>}
                {status === 'idle' && <Badge variant="neutral">Inactivo</Badge>}
              </div>

              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="h-4 w-4 text-text-muted" />
                <span>Ultima: {formatLastSync(lastSync)}</span>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-lg bg-error/10 px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-error" />
                  <p className="text-xs text-error">{errorMsg}</p>
                </div>
              )}

              <Button
                onClick={handleSync}
                loading={status === 'syncing'}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar ahora
              </Button>
            </div>
          </Card>

          {/* Auto-sync */}
          <Card padding="sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Sincronizacion automatica
                </h3>
                {autoSyncMin > 0 ? (
                  <Badge variant="info">Cada {autoSyncMin} min</Badge>
                ) : (
                  <Badge variant="neutral">Desactivada</Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                Sincroniza en segundo plano cada cierto intervalo de tiempo.
              </p>
              <div className="flex flex-wrap gap-2">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleIntervalChange(opt.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      autoSyncMin === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-alt'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Help */}
      <Card padding="sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-info" />
            <h3 className="text-sm font-semibold text-text-primary">
              Como configurar
            </h3>
          </div>
          <ol className="flex flex-col gap-2 text-sm text-text-secondary">
            <li className="flex gap-2">
              <span className="font-semibold text-text-primary">1.</span>
              <span>
                Crea un Google Sheet nuevo desde{' '}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  sheets.new
                </a>
              </span>
            </li>
            <li className="flex flex-col gap-2">
              <span className="flex gap-2">
                <span className="font-semibold text-text-primary">2.</span>
                <span>
                  Ve a <strong>Extensiones &gt; Apps Script</strong> y pega el
                  codigo del script
                </span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCode(true)}
                className="ml-5 w-fit"
              >
                <Code2 className="h-4 w-4" />
                Ver codigo
              </Button>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-text-primary">3.</span>
              <span>
                Despliega como <strong>Nueva implementacion &gt; App web</strong>,
                ejecuta como tu usuario, acceso: <strong>Cualquiera</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-text-primary">4.</span>
              <span>Copia la URL de despliegue y pegala arriba</span>
            </li>
          </ol>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            <span>
              La app usa IndexedDB local. La sincronizacion es incremental (solo
              cambios reales, politica: ultimo cambio gana).
            </span>
          </div>
        </div>
      </Card>
      {/* Code modal */}
      {showCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCode(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Codigo de Apps Script
                </h3>
              </div>
              <button
                onClick={() => setShowCode(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto bg-surface-alt/50 p-4">
              <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-text-secondary">
                <code>{APPS_SCRIPT_CODE}</code>
              </pre>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <Button variant="ghost" size="sm" onClick={() => setShowCode(false)}>
                Cerrar
              </Button>
              <Button size="sm" onClick={handleCopyCode}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar codigo
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoogleSheetsPage
