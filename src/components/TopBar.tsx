import { Menu, Wifi, WifiOff } from 'lucide-react'
import { useLocation } from 'react-router'
import { useUIStore } from '../store/uiStore'
import { useConnectionStore } from '../store/connectionStore'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/registro': 'Registro',
  '/estudiantes': 'Estudiantes',
  '/reportes': 'Reportes',
  '/grados-secciones': 'Grados y Secciones',
  '/tipos-registro': 'Tipos de Registro',
  '/respaldo': 'Respaldo',
  '/google-sheets': 'Google Sheets',
}

interface TopBarProps {
  title?: string
  className?: string
}

const TopBar = ({ className = '' }: TopBarProps) => {
  const location = useLocation()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const online = useConnectionStore((s) => s.online)
  const title = titles[location.pathname] ?? 'Registro Auxiliar'

  return (
    <header
      className={[
        'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-sm',
        'shadow-topbar',
        className,
      ].join(' ')}
    >
      <button
        onClick={toggleSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-alt lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="flex-1 text-lg font-semibold text-text-primary">{title}</h1>

      <div
        className="flex items-center gap-1.5 text-xs font-medium"
        title={online ? 'En línea' : 'Sin conexión'}
      >
        {online ? (
          <>
            <Wifi className="h-4 w-4 text-success" />
            <span className="hidden text-success sm:inline">En línea</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-error" />
            <span className="hidden text-error sm:inline">Sin conexión</span>
          </>
        )}
      </div>
    </header>
  )
}

export default TopBar
