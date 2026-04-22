import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { puntoOrigenService } from '@/lib/api/punto-origen.service'
import type { PuntoOrigen } from '@/types/punto-origen'
import { notify } from '@/lib/notify'

export interface UsePuntosOrigenParams {
  page?: number
  size?: number
  search?: string
  activo?: boolean
}

export function usePuntosOrigen(params: UsePuntosOrigenParams = {}) {
  const { page = 0, size = 20, search, activo } = params
  return useQuery({
    queryKey: ['puntos-origen', page, size, search ?? null, activo ?? null],
    queryFn: () => puntoOrigenService.findAll({ page, size, search, activo }),
  })
}

export function usePuntoOrigen(id: number | undefined) {
  return useQuery({
    queryKey: ['punto-origen', id],
    queryFn: () => puntoOrigenService.findById(id!),
    enabled: !!id,
  })
}

export function useCreatePuntoOrigen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: PuntoOrigen) => puntoOrigenService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puntos-origen'] })
      notify.success('Punto de origen creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al crear el punto de origen')
    },
  })
}

export function useUpdatePuntoOrigen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: PuntoOrigen }) =>
      puntoOrigenService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['puntos-origen'] })
      queryClient.invalidateQueries({ queryKey: ['punto-origen', variables.id] })
      notify.success('Punto de origen actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar el punto de origen')
    },
  })
}

export function useDeletePuntoOrigen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => puntoOrigenService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puntos-origen'] })
      notify.success('Punto de origen eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al eliminar el punto de origen')
    },
  })
}
