import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loteRecepcionService } from '@/lib/api/lote-recepcion.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { LoteRecepcion } from '@/types/lote-recepcion'
import { toast } from 'sonner'

export function useLotesRecepcion(page: number = 0, size: number = 20, tipoLote?: string) {
  return useQuery({
    queryKey: ['lotes-recepcion', page, size, tipoLote],
    queryFn: () => loteRecepcionService.findAll(page, size, tipoLote),
  })
}

export function useLotesEspeciales(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['lotes-especiales', page, size],
    queryFn: () => loteRecepcionService.findAllEspeciales(page, size),
  })
}

export function useLoteRecepcion(id: number | undefined) {
  return useQuery({
    queryKey: ['lote-recepcion', id],
    queryFn: () => loteRecepcionService.findById(id!),
    enabled: !!id,
    staleTime: 2000,
    gcTime: 60_000,
  })
}

export function usePaquetesLoteRecepcion(id: number | undefined) {
  return useQuery({
    queryKey: ['lote-recepcion-paquetes', id],
    queryFn: () => loteRecepcionService.obtenerPaquetes(id!),
    enabled: !!id,
    staleTime: 2000,
    gcTime: 60_000,
  })
}

export function useCreateLoteRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: LoteRecepcion) => loteRecepcionService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lotes-recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['lotes-especiales'] })
      return data
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el lote de recepción'))
    },
  })
}

export function useUpdateLoteRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: LoteRecepcion }) =>
      loteRecepcionService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lotes-recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['lotes-especiales'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', variables.id] })
      toast.success('Lote de recepción actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el lote de recepción'))
    },
  })
}

export function useDeleteLoteRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => loteRecepcionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['lotes-especiales'] })
      toast.success('Lote de recepción eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el lote de recepción'))
    },
  })
}

export function useAgregarPaquetesLoteRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idPaquetes }: { id: number; idPaquetes: number[] }) =>
      loteRecepcionService.agregarPaquetes(id, idPaquetes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lotes-recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes-no-encontrados', variables.id] })
      toast.success('Paquetes agregados exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al agregar los paquetes'))
    },
  })
}

export function usePaquetesNoEncontrados(id: number | undefined) {
  return useQuery({
    queryKey: ['lote-recepcion-paquetes-no-encontrados', id],
    queryFn: () => loteRecepcionService.obtenerPaquetesNoEncontrados(id!),
    enabled: !!id,
  })
}

export function useAgregarHijosClementinaALote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ idLoteRecepcion, idPaquetePadre, idPaquetesHijos }: { idLoteRecepcion: number; idPaquetePadre: number; idPaquetesHijos: number[] }) =>
      loteRecepcionService.agregarHijosClementina(idLoteRecepcion, idPaquetePadre, idPaquetesHijos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lotes-recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', variables.idLoteRecepcion] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', variables.idLoteRecepcion] })
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', variables.idPaquetePadre] })
      toast.success('Paquetes hijos agregados al lote exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al agregar los paquetes hijos al lote'))
    },
  })
}

export function useAgregarHijoClementinaPorGuiaALote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ idLoteRecepcion, idPaquetePadre, numeroGuia }: { idLoteRecepcion: number; idPaquetePadre: number; numeroGuia: string }) =>
      loteRecepcionService.agregarHijoClementinaPorGuia(idLoteRecepcion, idPaquetePadre, numeroGuia),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lotes-recepcion'] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', variables.idLoteRecepcion] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', variables.idLoteRecepcion] })
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['paquete', variables.idPaquetePadre] })
      toast.success('Paquete hijo agregado al lote exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al agregar el paquete hijo al lote'))
    },
  })
}
