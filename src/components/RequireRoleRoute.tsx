import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '../store/authStore'
import type { RolUsuario } from '../types'

interface RequireRoleRouteProps {
  roles: RolUsuario[]
  children: ReactNode
}

const RequireRoleRoute = ({ roles, children }: RequireRoleRouteProps) => {
  const user = useAuthStore((s) => s.user)

  if (!user || !roles.includes(user.rol)) {
    return <Navigate to={user?.rol === 'docente' ? '/registro' : '/'} replace />
  }

  return <>{children}</>
}

export default RequireRoleRoute
