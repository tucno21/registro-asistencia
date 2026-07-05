import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/estudiantes', icon: Users, label: 'Estudiantes' },
  { to: '/registro', icon: ClipboardCheck, label: 'Registro' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
]

interface BottomNavProps {
  className?: string
}

const BottomNav = ({ className = '' }: BottomNavProps) => {
  return (
    <nav
      className={[
        'fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface shadow-nav',
        'pb-safe-or-0',
        className,
      ].join(' ')}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            [
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-0',
              'transition-colors',
              isActive
                ? 'text-primary'
                : 'text-text-muted hover:text-text-secondary',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={isActive ? 'h-5 w-5' : 'h-5 w-5'}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className="text-[10px] font-medium leading-tight">
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
