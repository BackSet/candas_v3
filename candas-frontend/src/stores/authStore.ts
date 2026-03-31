import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'
import { authService } from '@/lib/api/auth.service'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  activeAgencyId: number | null
  setAuth: (user: User, token: string) => void
  setActiveAgencyId: (id: number | null) => void
  refreshMe: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      activeAgencyId: null,
      setAuth: (user, token) => {
        // Solo actualizar si el usuario realmente cambió
        const currentUser = get().user
        const agencias = user.idAgencias ?? (user.idAgencia ? [user.idAgencia] : [])
        const currentActive = get().activeAgencyId
        const nextActive = currentActive && agencias.includes(currentActive)
          ? currentActive
          : (agencias[0] ?? null)
        if (currentUser?.idUsuario !== user?.idUsuario || 
            JSON.stringify(currentUser?.roles) !== JSON.stringify(user?.roles) ||
            JSON.stringify(currentUser?.permisos) !== JSON.stringify(user?.permisos) ||
            JSON.stringify(currentUser?.idAgencias ?? []) !== JSON.stringify(user?.idAgencias ?? []) ||
            get().token !== token) {
          set({ user, token, isAuthenticated: true, activeAgencyId: nextActive })
        }
      },
      setActiveAgencyId: (id) => {
        const user = get().user
        const agencias = user?.idAgencias ?? (user?.idAgencia ? [user.idAgencia] : [])
        if (id == null || agencias.includes(id)) {
          set({ activeAgencyId: id })
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
          const idAgenciasChanged = JSON.stringify(currentUser.idAgencias ?? []) !== JSON.stringify(me.idAgencias ?? [])

          // Evitar set() si no hay cambios (previene rerenders innecesarios / loops en dev StrictMode)
          if (!rolesChanged && !permisosChanged && !idAgenciaChanged && !idAgenciasChanged) {
            return
          }

          const agencias = me.idAgencias ?? (me.idAgencia ? [me.idAgencia] : [])
          const currentActive = get().activeAgencyId
          const nextActive = currentActive && agencias.includes(currentActive)
            ? currentActive
            : (agencias[0] ?? null)

          set({
            user: {
              ...currentUser,
              ...me,
            },
            activeAgencyId: nextActive,
          })
        } catch {
          // Si falla, el interceptor de apiClient manejará 401 (logout)
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, activeAgencyId: null })
      },
    }),
    {
      name: 'candas-auth-storage',
      partialize: (state) => {
        return {
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          activeAgencyId: state.activeAgencyId,
        }
      },
    }
  )
)
