import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ensacadoService } from '@/lib/api/ensacado.service'
import { notify } from '@/lib/notify'
import { ENSACADO_POLL, ENSACADO_SCAN } from '@/constants/ensacado'

export const ensacadoKeys = {
  all: ['ensacado'] as const,
  paquete: (numeroGuia?: string) => ['ensacado-paquete', numeroGuia] as const,
  despacho: (idDespacho?: number) => ['ensacado-despacho', idDespacho] as const,
  session: ['ensacado-session'] as const,
}

/** No usar como guía cadenas que parezcan mensajes de error del backend. */
export function esGuiaValidaParaBuscar(guia: string | undefined): boolean {
  if (!guia || guia.trim().length < ENSACADO_SCAN.minGuiaLength) return false
  const t = guia.trim().toLowerCase()
  if (t.includes('identifier') || t.includes('entity.') || t.includes('exception')) return false
  return true
}

export function useBuscarPaquete(numeroGuia: string | undefined) {
  return useQuery({
    queryKey: ensacadoKeys.paquete(numeroGuia),
    queryFn: () => ensacadoService.buscarPaquete(numeroGuia!),
    enabled: esGuiaValidaParaBuscar(numeroGuia),
    retry: false,
    throwOnError: false,
    staleTime: 0,
  })
}

export function useMarcarEnsacado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (idPaquete: number) => ensacadoService.marcarEnsacado(idPaquete),
    onSuccess: (_data, idPaquete) => {
      void queryClient.invalidateQueries({ queryKey: ensacadoKeys.all })
      void queryClient.invalidateQueries({ queryKey: ensacadoKeys.session })
      void queryClient.invalidateQueries({ queryKey: ['ensacado-despacho'] })
      void queryClient.invalidateQueries({ queryKey: ensacadoKeys.paquete() })
      notify.success(`Guía ensacada correctamente`)
      return idPaquete
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo marcar el paquete como ensacado')
    },
  })
}

export function useInfoDespacho(
  idDespacho: number | undefined,
  options?: { refetchInterval?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: ensacadoKeys.despacho(idDespacho),
    queryFn: () => ensacadoService.obtenerInfoDespacho(idDespacho!),
    enabled: options?.enabled !== false && !!idDespacho,
    refetchInterval: options?.refetchInterval ?? ENSACADO_POLL.despachoMs,
    staleTime: 1_000,
  })
}

export function useSessionEnsacado(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ensacadoKeys.session,
    queryFn: () => ensacadoService.getSession(),
    enabled: options?.enabled !== false,
    refetchInterval: ENSACADO_POLL.sessionMs,
    staleTime: 800,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useActualizarUltimaBusqueda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (numeroGuia: string) => ensacadoService.actualizarUltimaBusqueda(numeroGuia),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ensacadoKeys.session })
    },
    retry: 2,
    retryDelay: 500,
  })
}
