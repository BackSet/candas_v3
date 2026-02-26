import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { puntoOrigenService } from '@/lib/api/punto-origen.service'
import type { PuntoOrigen } from '@/types/punto-origen'
import { toast } from 'sonner'

type ApiError = { response?: { data?: { message?: string } } }

function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as ApiError)?.response?.data?.message
  return typeof message === 'string' && message.trim().length > 0 ? message : fallback
}

export function usePuntosOrigen(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['puntos-origen', page, size],
    queryFn: () => puntoOrigenService.findAll(page, size),
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
      toast.success('Punto de origen creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el punto de origen'))
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
      toast.success('Punto de origen actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el punto de origen'))
    },
  })
}

export function useDeletePuntoOrigen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => puntoOrigenService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puntos-origen'] })
      toast.success('Punto de origen eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el punto de origen'))
    },
  })
}
