import { ReactNode } from 'react'
import { useHasRole, useHasAnyRole } from '@/hooks/useHasRole'

interface ProtectedByRoleProps {
  role?: string
  roles?: string[]
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Componente que renderiza su contenido solo si el usuario tiene el rol o roles requeridos
 * @param role - Rol único requerido
 * @param roles - Array de roles (se muestra si el usuario tiene alguno)
 * @param fallback - Contenido a mostrar si el usuario no tiene los roles requeridos (opcional)
 * @param children - Contenido a mostrar si el usuario tiene los roles requeridos
 */
export default function ProtectedByRole({
  role,
  roles,
  fallback = null,
  children,
}: ProtectedByRoleProps) {
  const hasRole = role ? useHasRole(role) : false
  const hasAnyRole = roles ? useHasAnyRole(roles) : false

  const isAuthorized = hasRole || hasAnyRole

  if (!isAuthorized) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
