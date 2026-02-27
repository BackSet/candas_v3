import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { agenciaDistribucionService } from '@/lib/api/agencia-distribucion.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { AgenciaDistribucion } from '@/types/agencia-distribucion'
import { toast } from 'sonner'

export function useAgenciasDistribucion(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['agencias-distribucion', page, size],
    queryFn: () => agenciaDistribucionService.findAll(page, size),
  })
}

export function useAgenciaDistribucion(id?: number) {
  return useQuery({
    queryKey: ['agencia-distribucion', id],
    queryFn: () => agenciaDistribucionService.findById(id!),
    enabled: !!id,
  })
}

export function useCreateAgenciaDistribucion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agencia: AgenciaDistribucion) => agenciaDistribucionService.create(agencia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencias-distribucion'] })
      toast.success('Agencia de distribución creada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear la agencia de distribución'))
    },
  })
}

export function useUpdateAgenciaDistribucion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AgenciaDistribucion }) =>
      agenciaDistribucionService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencias-distribucion'] })
      toast.success('Agencia de distribución actualizada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar la agencia de distribución'))
    },
  })
}

export function useDeleteAgenciaDistribucion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => agenciaDistribucionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencias-distribucion'] })
      toast.success('Agencia de distribución eliminada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar la agencia de distribución'))
    },
  })
}

export function useBuscarOCrearAgenciaDistribucion() {
  return useMutation({
    mutationFn: ({ nombre, codigo }: { nombre?: string; codigo?: string }) =>
      agenciaDistribucionService.buscarOCrear(nombre, codigo),
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al buscar o crear la agencia de distribución'))
    },
  })
}
