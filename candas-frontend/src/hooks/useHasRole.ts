import { useAuthStore } from '@/stores/authStore'

/**
 * Hook para verificar si el usuario actual tiene un rol específico
 * @param role - Nombre del rol a verificar (sin prefijo "ROLE_")
 * @returns true si el usuario tiene el rol, false en caso contrario
 */
export function useHasRole(role: string): boolean {
  // Usar selector específico que solo retorna el resultado booleano para evitar re-renders
  return useAuthStore((state) => {
    const roles = state.user?.roles ?? []
    return roles.includes(role)
  })
}

/**
 * Hook para verificar si el usuario actual tiene alguno de los roles especificados
 * @param roles - Array de nombres de roles a verificar
 * @returns true si el usuario tiene al menos uno de los roles, false en caso contrario
 */
export function useHasAnyRole(roles: string[]): boolean {
  return useAuthStore((state) => {
    const userRoles = state.user?.roles ?? []
    if (roles.length === 0) return false
    return roles.some(role => userRoles.includes(role))
  })
}

/**
 * Hook para verificar si el usuario actual tiene un permiso específico
 * @param permission - Nombre del permiso a verificar (ej: "usuarios:crear")
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export function useHasPermission(permission: string): boolean {
  // Usar selector específico que solo retorna el resultado booleano para evitar re-renders
  return useAuthStore((state) => {
    const permisos = state.user?.permisos ?? []
    return permisos.includes(permission)
  })
}

/**
 * Hook para verificar si el usuario actual tiene alguno de los permisos especificados
 * @param permissions - Array de nombres de permisos a verificar
 * @returns true si el usuario tiene al menos uno de los permisos, false en caso contrario
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  return useAuthStore((state) => {
    const permisos = state.user?.permisos ?? []
    if (permissions.length === 0) return false
    return permissions.some(permission => permisos.includes(permission))
  })
}
