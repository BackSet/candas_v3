import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'
import { authService } from '@/lib/api/auth.service'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  refreshMe: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        // Solo actualizar si el usuario realmente cambió
        const currentUser = get().user
        if (currentUser?.idUsuario !== user?.idUsuario || 
            JSON.stringify(currentUser?.roles) !== JSON.stringify(user?.roles) ||
            JSON.stringify(currentUser?.permisos) !== JSON.stringify(user?.permisos)) {
          set({ user, token, isAuthenticated: true })
        }
      },
      refreshMe: async () => {
        const token = get().token
        if (!token) return
        try {
          const me = await authService.me()
          const currentUser = get().user
          if (!currentUser) return
          const rolesChanged = JSON.stringify(currentUser.roles ?? []) !== JSON.stringify(me.roles ?? [])
          const permisosChanged = JSON.stringify(currentUser.permisos ?? []) !== JSON.stringify(me.permisos ?? [])
          const idAgenciaChanged = currentUser.idAgencia !== me.idAgencia

          // Evitar set() si no hay cambios (previene rerenders innecesarios / loops en dev StrictMode)
          if (!rolesChanged && !permisosChanged && !idAgenciaChanged) {
            return
          }

          set({
            user: {
              ...currentUser,
              ...me,
            },
          })
        } catch {
          // Si falla, el interceptor de apiClient manejará 401 (logout)
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'candas-auth-storage',
      partialize: (state) => {
        return { user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }
      },
    }
  )
)
