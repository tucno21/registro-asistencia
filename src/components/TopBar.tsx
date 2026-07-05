import { Menu } from 'lucide-react'
import { useUIStore } from '../store/uiStore'

interface TopBarProps {
  title?: string
  className?: string
}

const TopBar = ({ title = 'Registro Auxiliar', className = '' }: TopBarProps) => {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

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
        className="flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-alt md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
    </header>
  )
}

export default TopBar
