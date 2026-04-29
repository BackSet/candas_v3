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

function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((val, idx) => val === b[idx])
}

function shallowUserChanged(current: User | null, next: User | null): boolean {
  if (current?.idUsuario !== next?.idUsuario) return true
  if (!arraysEqual(current?.roles ?? [], next?.roles ?? [])) return true
  if (!arraysEqual(current?.permisos ?? [], next?.permisos ?? [])) return true
  if (!arraysEqual(current?.idAgencias ?? [], next?.idAgencias ?? [])) return true
  return false
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
        if (shallowUserChanged(currentUser, user) || get().token !== token) {
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
          if (!shallowUserChanged(currentUser, me) && currentUser.idAgencia === me.idAgencia) {
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
