import { useBlocker } from '@tanstack/react-router'

interface UseDirtyGuardOptions {
  /** Si true, bloquea la navegación interna. */
  enabled: boolean
  /**
   * Si true, además registra `beforeunload` para refrescos/cierre de pestaña.
   * Por defecto, sigue a `enabled`. Pasar `false` cuando el formulario
   * persiste sus datos como borrador (localStorage) y no necesitamos el
   * diálogo nativo del navegador.
   */
  enableBeforeUnload?: boolean
}

interface DirtyGuardReturn {
  /** Hay una navegación pendiente esperando confirmación. */
  isBlocked: boolean
  /** Procede con la navegación bloqueada. */
  proceed: () => void
  /** Cancela la navegación bloqueada y queda en la página actual. */
  reset: () => void
}

/**
 * Hook que evita perder cambios sin guardar.
 * - Bloquea las navegaciones internas (TanStack Router) cuando `enabled` es true.
 * - Por defecto activa `beforeunload` para refrescos / cierre de pestaña.
 *
 * Devuelve los handlers para que el caller renderice un dialog de confirmación
 * o decida una estrategia distinta (ej. auto-proceed + toast en modo borrador).
 */
export function useDirtyGuard({
  enabled,
  enableBeforeUnload,
}: UseDirtyGuardOptions): DirtyGuardReturn {
  const beforeUnload = enableBeforeUnload ?? enabled
  const blocker = useBlocker({
    shouldBlockFn: () => enabled,
    enableBeforeUnload: () => beforeUnload,
    withResolver: true,
  })

  return {
    isBlocked: blocker.status === 'blocked',
    proceed: () => {
      if (blocker.status === 'blocked') blocker.proceed()
    },
    reset: () => {
      if (blocker.status === 'blocked') blocker.reset()
    },
  }
}
