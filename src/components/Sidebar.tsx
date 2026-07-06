import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
  ListChecks,
  GraduationCap,
  X,
} from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/estudiantes', icon: Users, label: 'Estudiantes' },
]

const adminNavItems = [
  { to: '/grados-secciones', icon: GraduationCap, label: 'Grados/Secciones' },
  { to: '/tipos-registro', icon: ListChecks, label: 'Tipos Registro' },
]

const commonNavItems = [
  { to: '/registro', icon: ClipboardCheck, label: 'Registro' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
]

interface SidebarProps {
  className?: string
}

const Sidebar = ({ className = '' }: SidebarProps) => {
  const isOpen = useUIStore((s) => s.isSidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const user = useAuthStore((s) => s.user)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          // Mobile: drawer that slides in
          'fixed left-0 top-0 z-50 h-full w-60 flex-shrink-0 bg-surface border-r border-border',
          'transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'md:static md:z-auto md:translate-x-0 md:transition-none',
          className,
        ].join(' ')}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-base font-semibold text-text-primary">
            Registro Escolar
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.rol === 'admin' && (
            <>
              <div className="my-1 border-t border-border" />
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Administración
              </p>
              {adminNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                    ].join(' ')
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}

          <div className="my-1 border-t border-border" />
          {commonNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
