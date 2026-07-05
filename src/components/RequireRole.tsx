import type { ReactNode } from 'react'
import { useAuthStore } from '../store/authStore'
import type { RolUsuario } from '../types'

interface RequireRoleProps {
  roles: RolUsuario[]
  children: ReactNode
  fallback?: ReactNode
}

const RequireRole = ({ roles, children, fallback = null }: RequireRoleProps) => {
  const user = useAuthStore((s) => s.user)

  if (!user || !roles.includes(user.rol)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default RequireRole
