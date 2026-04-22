import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ensacadoService } from '@/lib/api/ensacado.service'
import { notify } from '@/lib/notify'

/** No usar como guía cadenas que parezcan mensajes de error del backend (evita 404 con "null identifier..."). */
export function esGuiaValidaParaBuscar(guia: string | undefined): boolean {
  if (!guia || guia.trim().length < 3) return false
  const t = guia.trim().toLowerCase()
  if (t.includes('identifier') || t.includes('entity.') || t.includes('exception')) return false
  return true
}

export function useBuscarPaquete(numeroGuia: string | undefined) {
  return useQuery({
    queryKey: ['ensacado-paquete', numeroGuia],
    queryFn: () => ensacadoService.buscarPaquete(numeroGuia!),
    enabled: esGuiaValidaParaBuscar(numeroGuia),
    retry: false,
    throwOnError: false,
  })
}

export function useMarcarEnsacado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (idPaquete: number) => ensacadoService.marcarEnsacado(idPaquete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ensacado'] })
      queryClient.invalidateQueries({ queryKey: ['ensacado-despachos'] })
      queryClient.invalidateQueries({ queryKey: ['ensacado-despacho'] })
      queryClient.invalidateQueries({ queryKey: ['ensacado-session'] })
      notify.success('Paquete marcado como ensacado')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo marcar el paquete como ensacado')
    },
  })
}


export function useInfoDespacho(idDespacho: number | undefined, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['ensacado-despacho', idDespacho],
    queryFn: () => ensacadoService.obtenerInfoDespacho(idDespacho!),
    enabled: !!idDespacho,
    refetchInterval: options?.refetchInterval ?? 30000,
  })
}

export function useSessionEnsacado() {
  return useQuery({
    queryKey: ['ensacado-session'],
    queryFn: () => ensacadoService.getSession(),
    refetchInterval: 2500, // 2,5 s para vista móvil
    staleTime: 1500,
    gcTime: 60_000,
  })
}

export function useActualizarUltimaBusqueda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (numeroGuia: string) => ensacadoService.actualizarUltimaBusqueda(numeroGuia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ensacado-session'] })
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo sincronizar con la vista en curso')
    },
  })
}
