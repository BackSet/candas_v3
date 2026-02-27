import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paqueteService } from '@/lib/api/paquete.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Paquete, EstadoPaquete, TipoPaquete } from '@/types/paquete'
import { toast } from 'sonner'

export function usePaquetes(
  page: number = 0,
  size: number = 20,
  search?: string,
  estado?: string,
  tipo?: string
) {
  return useQuery({
    queryKey: ['paquetes', page, size, search, estado, tipo],
    queryFn: () => paqueteService.findAll(page, size, search, estado, tipo),
  })
}

export function usePaquete(id: number | undefined) {
  return useQuery({
    queryKey: ['paquete', id],
    queryFn: () => paqueteService.findById(id!),
    enabled: !!id,
  })
}

export function usePaquetesHijos(id: number | undefined) {
  return useQuery({
    queryKey: ['paquetes-hijos', id],
    queryFn: () => paqueteService.findHijos(id!),
    enabled: !!id,
  })
}

export function useCreatePaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Paquete) => paqueteService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      toast.success('Paquete creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el paquete'))
    },
  })
}

export function useUpdatePaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Paquete }) =>
      paqueteService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', variables.id] })
      // Invalidar queries de recepciones para actualizar estadísticas
      queryClient.invalidateQueries({ queryKey: ['recepciones'] })
      queryClient.invalidateQueries({ queryKey: ['recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['recepcion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'] })
      // Invalidar todas las queries que puedan contener este paquete
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion'] })
      toast.success('Paquete actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el paquete'))
    },
  })
}

export function useDeletePaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => paqueteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      toast.success('Paquete eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el paquete'))
    },
  })
}

export function useSepararPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, paquetesHijos }: { id: number; paquetesHijos: Paquete[] }) =>
      paqueteService.separar(id, paquetesHijos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['paquetes-hijos', variables.id] })
      toast.success('Paquete separado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al separar el paquete'))
    },
  })
}

export function useCambiarEstadoPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, nuevoEstado }: { id: number; nuevoEstado: EstadoPaquete }) =>
      paqueteService.cambiarEstado(id, nuevoEstado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', variables.id] })
      toast.success('Estado del paquete actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al cambiar el estado del paquete'))
    },
  })
}

export function usePaquetePorNumeroGuia(numeroGuia: string | undefined) {
  return useQuery({
    queryKey: ['paquete-por-guia', numeroGuia],
    queryFn: () => paqueteService.findByNumeroGuia(numeroGuia!),
    enabled: !!numeroGuia && numeroGuia.trim().length > 0,
    retry: false,
  })
}

export function useCambiarTipoMasivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, nuevoTipo }: { ids: number[]; nuevoTipo: TipoPaquete }) =>
      paqueteService.cambiarTipoMasivo(ids, nuevoTipo),
    onSuccess: (paquetesActualizados) => {
      // Actualizar el cache de forma optimista para que se vea inmediatamente
      paquetesActualizados.forEach((paqueteActualizado) => {
        if (paqueteActualizado.idPaquete) {
          // Actualizar en la query de paquetes individuales
          queryClient.setQueryData(['paquete', paqueteActualizado.idPaquete], paqueteActualizado)
        }
      })

      // Crear un mapa de paquetes actualizados para búsqueda rápida
      const paquetesActualizadosMap = new Map(
        paquetesActualizados
          .filter(p => p.idPaquete)
          .map(p => [p.idPaquete!, p])
      )

      // Actualizar todas las queries de lotes de recepción que puedan contener estos paquetes
      queryClient.getQueryCache().getAll().forEach((query) => {
        const queryKey = query.queryKey
        if (queryKey[0] === 'lote-recepcion-paquetes' && query.state.data) {
          const paquetes = query.state.data as Paquete[]
          if (Array.isArray(paquetes)) {
            // Verificar si alguno de los paquetes actualizados está en esta query
            const tienePaquetesActualizados = paquetes.some(p =>
              p.idPaquete && paquetesActualizadosMap.has(p.idPaquete)
            )

            if (tienePaquetesActualizados) {
              // Actualizar los paquetes que cambiaron
              const paquetesNuevos = paquetes.map(p =>
                (p.idPaquete && paquetesActualizadosMap.get(p.idPaquete)) || p
              )

              queryClient.setQueryData(queryKey, paquetesNuevos)
            }
          }
        }
      })

      // Invalidar otras queries relacionadas para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion'] })
      // No mostrar toast aquí, se manejará en el componente con el progreso
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al cambiar el tipo de los paquetes'))
    },
  })
}

export function useAsociarClementinaPorLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (asociaciones: Array<{ numeroGuiaPadre: string; numeroGuiaHijo: string }>) =>
      paqueteService.asociarClementinaPorLote(asociaciones),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'] })
      if (result.exitosas > 0) {
        toast.success(`${result.exitosas} asociación(es) exitosa(s)`)
      }
      if (result.fallidas > 0) {
        toast.error(`${result.fallidas} asociación(es) fallida(s)`)
      }
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al procesar las asociaciones'))
    },
  })
}

export function useAsociarCadenitaPorLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ numeroGuiaPadre, numeroGuiasHijos }: { numeroGuiaPadre: string; numeroGuiasHijos: string[] }) =>
      paqueteService.asociarCadenitaPorLote(numeroGuiaPadre, numeroGuiasHijos),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'] })
      if (result.exitosas > 0) {
        toast.success(`${result.exitosas} asociación(es) Cadenita exitosa(s)`)
      }
      if (result.fallidas > 0) {
        toast.error(`${result.fallidas} asociación(es) fallida(s)`)
      }
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al procesar asociación Cadenita'))
    },
  })
}
export function useMarcarEtiquetaCambiada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => paqueteService.marcarEtiquetaCambiada(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', id] })
      toast.success('Etiqueta marcada como cambiada')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al marcar la etiqueta como cambiada'))
    },
  })
}

export function useMarcarSeparado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => paqueteService.marcarSeparado(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', id] })
      toast.success('Paquete marcado como separado')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al marcar el paquete como separado'))
    },
  })
}

export function useMarcarUnidoEnCaja() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => paqueteService.marcarUnidoEnCaja(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', id] })
      toast.success('Paquete marcado como unido en caja')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al marcar el paquete como unido en caja'))
    },
  })
}
