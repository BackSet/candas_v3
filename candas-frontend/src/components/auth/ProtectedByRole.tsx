import { useHasAnyRole,useHasRole } from '@/hooks/useHasRole'
import { ReactNode } from 'react'

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
  const hasRole = useHasRole(role ?? '')
  const hasAnyRole = useHasAnyRole(roles ?? [])

  const isAuthorized = Boolean(role && hasRole) || Boolean(roles?.length && hasAnyRole)

  if (!isAuthorized) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
