import { ReactNode, memo } from 'react'
import { useHasPermission, useHasAnyPermission, useHasRole } from '@/hooks/useHasRole'

interface ProtectedByPermissionProps {
  permission?: string
  permissions?: string[]
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Componente que renderiza su contenido solo si el usuario tiene el permiso o permisos requeridos
 * @param permission - Permiso único requerido
 * @param permissions - Array de permisos (se muestra si el usuario tiene alguno)
 * @param fallback - Contenido a mostrar si el usuario no tiene los permisos requeridos (opcional)
 * @param children - Contenido a mostrar si el usuario tiene los permisos requeridos
 */
function ProtectedByPermission({
  permission,
  permissions,
  fallback = null,
  children,
}: ProtectedByPermissionProps) {
  const isAdmin = useHasRole('ADMIN')
  // Llamar siempre los mismos hooks en el mismo orden (Rules of Hooks)
  const hasPermissionResult = useHasPermission(permission ?? '')
  const hasAnyPermissionResult = useHasAnyPermission(permissions ?? [])
  const hasPermission = permission ? hasPermissionResult : false
  const hasAnyPermission = permissions && permissions.length > 0 ? hasAnyPermissionResult : false

  // ADMIN tiene acceso a todo
  const isAuthorized = isAdmin || hasPermission || hasAnyPermission

  if (!isAuthorized) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Memoizar el componente para evitar re-renders innecesarios
// Eliminada la comparación personalizada porque causaba bugs al no detectar cambios en children (ej. texto del sidebar)
export default memo(ProtectedByPermission)
