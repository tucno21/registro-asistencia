import { useEffect } from 'react'
import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  GraduationCap,
  ListChecks,
  BarChart3,
  Shield,
  Table,
  X,
  LogOut,
  User,
} from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/registro', icon: ClipboardCheck, label: 'Registro' },
  { to: '/estudiantes', icon: Users, label: 'Estudiantes' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
]

const adminNav = [
  { to: '/grados-secciones', icon: GraduationCap, label: 'Grados/Secciones' },
  { to: '/tipos-registro', icon: ListChecks, label: 'Tipos de Registro' },
  { to: '/respaldo', icon: Shield, label: 'Respaldo' },
  { to: '/google-sheets', icon: Table, label: 'Google Sheets' },
]

const NavDrawer = () => {
  const isOpen = useUIStore((s) => s.isSidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, setSidebarOpen])

  const rolLabel = user?.rol === 'admin' ? 'Administrador' : 'Docente'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
    ].join(' ')

  return (
    <>
      {/* Overlay — mobile only */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar — drawer on mobile, static on desktop */}
      <aside
        className={[
          'flex w-60 flex-shrink-0 flex-col border-r border-border bg-surface h-dvh',
          // Mobile: fixed drawer from left
          'fixed left-0 top-0 z-50 shadow-card',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static, always visible
          'lg:static lg:z-auto lg:translate-x-0 lg:transition-none lg:shadow-none',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-base font-semibold text-text-primary">
            Registro Escolar
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-1">
            {mainNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={linkClass}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {user?.rol === 'admin' && (
            <>
              <div className="my-2 border-t border-border" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Administración
              </p>
              <div className="flex flex-col gap-1">
                {adminNav.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={linkClass}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 border-t border-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {user?.nombre}
              </p>
              <p className="text-xs text-text-muted">{rolLabel}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSidebarOpen(false)
              logout()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-bg"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

export default NavDrawer
