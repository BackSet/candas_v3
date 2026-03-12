import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { despachoMasivoSessionService } from '@/lib/api/despacho-masivo-session.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { DespachoMasivoSessionPayload } from '@/types/despacho-masivo-session'
import { toast } from 'sonner'

/**
 * Sesión de despacho masivo del usuario autenticado (cola de paquetes, Ver despacho en curso).
 * La API devuelve siempre la sesión del usuario actual; varios operarios pueden usar la vista
 * a la vez sin compartir cola ni datos.
 */
export function useDespachoMasivoSession(options?: { refetchInterval?: number | false; refetchOnMount?: true | 'always' }) {
  return useQuery({
    queryKey: ['despacho-masivo-session'],
    queryFn: () => despachoMasivoSessionService.getSession(),
    refetchInterval: options?.refetchInterval ?? 2500,
    refetchOnMount: options?.refetchOnMount ?? true,
    staleTime: 1500,
    gcTime: 60_000,
  })
}

export function useUpdateDespachoMasivoSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DespachoMasivoSessionPayload | Record<string, unknown>) =>
      despachoMasivoSessionService.updateSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despacho-masivo-session'] })
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'No se pudo sincronizar la sesión de despacho masivo'))
    },
  })
}
