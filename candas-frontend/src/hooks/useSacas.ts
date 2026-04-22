import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sacaService, type SacaFindAllParams } from '@/lib/api/saca.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Saca } from '@/types/saca'
import { notify } from '@/lib/notify'

export type UseSacasParams = SacaFindAllParams

export function useSacas(params: UseSacasParams = {}) {
  const { page = 0, size = 20, search, idDespacho, tamano } = params
  return useQuery({
    queryKey: ['sacas', page, size, search, idDespacho, tamano],
    queryFn: () => sacaService.findAll({ page, size, search, idDespacho, tamano }),
  })
}

export function useSaca(id: number | undefined) {
  return useQuery({
    queryKey: ['saca', id],
    queryFn: () => sacaService.findById(id!),
    enabled: !!id,
  })
}

export function usePaquetesSaca(id: number | undefined) {
  return useQuery({
    queryKey: ['saca-paquetes', id],
    queryFn: () => sacaService.obtenerPaquetes(id!),
    enabled: !!id,
  })
}

export function useCreateSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Saca) => sacaService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      notify.success('Saca creada exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al crear la saca')
    },
  })
}

export function useUpdateSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Saca }) =>
      sacaService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      queryClient.invalidateQueries({ queryKey: ['saca', variables.id] })
      notify.success('Saca actualizada exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar la saca')
    },
  })
}

export function useDeleteSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sacaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      notify.success('Saca eliminada exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al eliminar la saca')
    },
  })
}

export function useAgregarPaquetesSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idPaquetes }: { id: number; idPaquetes: number[] }) =>
      sacaService.agregarPaquetes(id, idPaquetes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      queryClient.invalidateQueries({ queryKey: ['saca', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['saca-paquetes', variables.id] })
      notify.success('Paquetes agregados exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al agregar los paquetes')
    },
  })
}

export function useCalcularPesoSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sacaService.calcularPeso(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      queryClient.invalidateQueries({ queryKey: ['saca', id] })
      notify.success('Peso calculado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al calcular el peso')
    },
  })
}
