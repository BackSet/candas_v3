import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paqueteService, type PaqueteFindAllParams } from '@/lib/api/paquete.service'
import type { Paquete, EstadoPaquete, TipoPaquete } from '@/types/paquete'
import { notify } from '@/lib/notify'

export type UsePaquetesParams = PaqueteFindAllParams

export function usePaquetes(params: UsePaquetesParams = {}) {
  const {
    page = 0,
    size = 20,
    search,
    estado,
    tipo,
    idAgencia,
    idLote,
    fechaDesde,
    fechaHasta,
  } = params
  return useQuery({
    queryKey: [
      'paquetes',
      page,
      size,
      search,
      estado,
      tipo,
      idAgencia,
      idLote,
      fechaDesde,
      fechaHasta,
    ],
    queryFn: () =>
      paqueteService.findAll({
        page,
        size,
        search,
        estado,
        tipo,
        idAgencia,
        idLote,
        fechaDesde,
        fechaHasta,
      }),
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
      notify.success('Paquete creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo crear el paquete')
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
      queryClient.invalidateQueries({ queryKey: ['recepciones'] })
      queryClient.invalidateQueries({ queryKey: ['recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['recepcion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion'] })
      notify.success('Paquete actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo actualizar el paquete')
    },
  })
}

export function useDeletePaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => paqueteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      notify.success('Paquete eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo eliminar el paquete')
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
      notify.success('Paquete separado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo separar el paquete')
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
      notify.success('Estado del paquete actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo cambiar el estado del paquete')
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
      paquetesActualizados.forEach((paqueteActualizado) => {
        if (paqueteActualizado.idPaquete) {
          queryClient.setQueryData(['paquete', paqueteActualizado.idPaquete], paqueteActualizado)
        }
      })

      const paquetesActualizadosMap = new Map(
        paquetesActualizados
          .filter(p => p.idPaquete)
          .map(p => [p.idPaquete!, p])
      )

      queryClient.getQueryCache().getAll().forEach((query) => {
        const queryKey = query.queryKey
        if (queryKey[0] === 'lote-recepcion-paquetes' && query.state.data) {
          const paquetes = query.state.data as Paquete[]
          if (Array.isArray(paquetes)) {
            const tienePaquetesActualizados = paquetes.some(p =>
              p.idPaquete && paquetesActualizadosMap.has(p.idPaquete)
            )

            if (tienePaquetesActualizados) {
              const paquetesNuevos = paquetes.map(p =>
                (p.idPaquete && paquetesActualizadosMap.get(p.idPaquete)) || p
              )

              queryClient.setQueryData(queryKey, paquetesNuevos)
            }
          }
        }
      })

      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion'] })
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo cambiar el tipo de los paquetes')
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
        notify.success(`${result.exitosas} asociación(es) exitosa(s)`)
      }
      if (result.fallidas > 0) {
        notify.error(`${result.fallidas} asociación(es) fallida(s)`)
      }
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudieron procesar las asociaciones')
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
        notify.success(`${result.exitosas} asociación(es) Cadenita exitosa(s)`)
      }
      if (result.fallidas > 0) {
        notify.error(`${result.fallidas} asociación(es) fallida(s)`)
      }
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo procesar la asociación Cadenita')
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
      notify.success('Etiqueta marcada como cambiada')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo marcar la etiqueta como cambiada')
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
      notify.success('Paquete marcado como separado')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo marcar el paquete como separado')
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
      notify.success('Paquete marcado como unido en caja')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo marcar el paquete como unido en caja')
    },
  })
}
