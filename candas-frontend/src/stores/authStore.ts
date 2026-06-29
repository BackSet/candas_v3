import { authService } from '@/lib/api/auth.service'
import type { User } from '@/types/user'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  activeAgencyId: number | null
  /** Agencia origen preferida del usuario (persistida en localStorage por usuario). */
  defaultAgencyId: number | null
  setAuth: (user: User, token: string) => void
  setActiveAgencyId: (id: number | null) => void
  /** Marca/limpia la agencia preferida. `null` la quita. Solo persiste agencias habilitadas. */
  setDefaultAgencyId: (id: number | null) => void
  refreshMe: () => Promise<void>
  logout: () => void
}

// ---------------------------------------------------------------------------
// Preferencia "agencia por defecto": persistida por usuario en localStorage.
// Solo contiene un id de agencia (no credenciales), por lo que es seguro
// guardarla fuera del sessionStorage del token JWT.
// ---------------------------------------------------------------------------

const DEFAULT_AGENCY_KEY_PREFIX = 'candas-default-active-agency:'

function defaultAgencyStorageKey(idUsuario: number): string {
  return `${DEFAULT_AGENCY_KEY_PREFIX}${idUsuario}`
}

/** Agencias habilitadas para el usuario (idAgencias o el legacy idAgencia). */
function getAgenciasHabilitadas(user: Pick<User, 'idAgencias' | 'idAgencia'> | null | undefined): number[] {
  return user?.idAgencias ?? (user?.idAgencia ? [user.idAgencia] : [])
}

/** Lee la agencia por defecto guardada para el usuario, o `null`. */
function readDefaultAgency(idUsuario: number): number | null {
  try {
    const raw = localStorage.getItem(defaultAgencyStorageKey(idUsuario))
    if (raw == null) return null
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

function writeDefaultAgency(idUsuario: number, id: number): void {
  try {
    localStorage.setItem(defaultAgencyStorageKey(idUsuario), String(id))
  } catch {
    // localStorage no disponible: la preferencia simplemente no persistirá.
  }
}

function clearDefaultAgency(idUsuario: number): void {
  try {
    localStorage.removeItem(defaultAgencyStorageKey(idUsuario))
  } catch {
    // Ignorar: nada que limpiar si no hay acceso a localStorage.
  }
}

/**
 * Resuelve la agencia activa y la preferida al (re)autenticar.
 * Prioridad: default válida → activa actual válida → idAgencia legacy → primera → null.
 * Si la default guardada ya no está habilitada, se ignora y se limpia.
 */
function resolveAgencyState(
  idUsuario: number,
  agencias: number[],
  currentActive: number | null,
  legacyIdAgencia: number | undefined
): { activeAgencyId: number | null; defaultAgencyId: number | null } {
  let defaultAgencyId = readDefaultAgency(idUsuario)
  if (defaultAgencyId != null && !agencias.includes(defaultAgencyId)) {
    clearDefaultAgency(idUsuario)
    defaultAgencyId = null
  }

  let activeAgencyId: number | null
  if (defaultAgencyId != null) {
    activeAgencyId = defaultAgencyId
  } else if (currentActive != null && agencias.includes(currentActive)) {
    activeAgencyId = currentActive
  } else if (legacyIdAgencia != null && agencias.includes(legacyIdAgencia)) {
    activeAgencyId = legacyIdAgencia
  } else {
    activeAgencyId = agencias[0] ?? null
  }

  return { activeAgencyId, defaultAgencyId }
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
      defaultAgencyId: null,
      setAuth: (user, token) => {
        // Solo actualizar si el usuario realmente cambió
        const currentUser = get().user
        const agencias = getAgenciasHabilitadas(user)
        const { activeAgencyId, defaultAgencyId } = resolveAgencyState(
          user.idUsuario,
          agencias,
          get().activeAgencyId,
          user.idAgencia
        )
        if (shallowUserChanged(currentUser, user) || get().token !== token) {
          set({ user, token, isAuthenticated: true, activeAgencyId, defaultAgencyId })
        }
      },
      setActiveAgencyId: (id) => {
        const agencias = getAgenciasHabilitadas(get().user)
        if (id == null || agencias.includes(id)) {
          set({ activeAgencyId: id })
        }
      },
      setDefaultAgencyId: (id) => {
        const user = get().user
        if (!user) return
        if (id == null) {
          clearDefaultAgency(user.idUsuario)
          set({ defaultAgencyId: null })
          return
        }
        const agencias = getAgenciasHabilitadas(user)
        if (!agencias.includes(id)) return
        writeDefaultAgency(user.idUsuario, id)
        set({ defaultAgencyId: id })
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

          const agencias = getAgenciasHabilitadas(me)
          const { activeAgencyId, defaultAgencyId } = resolveAgencyState(
            me.idUsuario,
            agencias,
            get().activeAgencyId,
            me.idAgencia
          )

          set({
            user: {
              ...currentUser,
              ...me,
            },
            activeAgencyId,
            defaultAgencyId,
          })
        } catch {
          // Si falla, el interceptor de apiClient manejará 401 (logout)
        }
      },
      logout: () => {
        // Limpia la sesión de auth en memoria. NO borra la preferencia de
        // agencia por defecto (localStorage), para restaurarla al re-loguear.
        set({ user: null, token: null, isAuthenticated: false, activeAgencyId: null, defaultAgencyId: null })
      },
    }),
    {
      name: 'candas-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        return {
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          activeAgencyId: state.activeAgencyId,
          defaultAgencyId: state.defaultAgencyId,
        }
      },
    }
  )
)
