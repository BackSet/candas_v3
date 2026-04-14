import { useAuthStore } from '@/stores/authStore'

export const MENSAJE_AGENCIA_ORIGEN_ACTIVA_REQUERIDA =
  'Debes seleccionar una agencia origen activa para continuar.'

export function assertAgenciaOrigenActivaSeleccionadaParaCreacion(): void {
  const { user, activeAgencyId } = useAuthStore.getState()
  const esAdmin = (user?.roles ?? []).includes('ADMIN')

  if (esAdmin) {
    return
  }

  if (activeAgencyId == null) {
    throw new Error(MENSAJE_AGENCIA_ORIGEN_ACTIVA_REQUERIDA)
  }
}
