import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { distribuidorService } from '@/lib/api/distribuidor.service'
import type { Distribuidor } from '@/types/distribuidor'
import { toast } from 'sonner'

type ApiError = { response?: { data?: { message?: string } } }

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as ApiError)?.response?.data?.message
  return typeof message === 'string' && message.trim().length > 0 ? message : fallback
}

export function useDistribuidores(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['distribuidores', page, size],
    queryFn: () => distribuidorService.findAll(page, size),
  })
}

export function useDistribuidor(id?: number) {
  return useQuery({
    queryKey: ['distribuidor', id],
    queryFn: () => distribuidorService.findById(id!),
    enabled: !!id,
  })
}

export function useCreateDistribuidor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (distribuidor: Distribuidor) => distribuidorService.create(distribuidor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribuidores'] })
      toast.success('Distribuidor creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el distribuidor'))
    },
  })
}

export function useUpdateDistribuidor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Distribuidor }) =>
      distribuidorService.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['distribuidores'] })
      queryClient.invalidateQueries({ queryKey: ['distribuidor', variables.id] })
      toast.success('Distribuidor actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el distribuidor'))
    },
  })
}

export function useDeleteDistribuidor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => distribuidorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribuidores'] })
      toast.success('Distribuidor eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el distribuidor'))
    },
  })
}

export function useBuscarOCrearDistribuidor() {
  return useMutation({
    mutationFn: ({ nombre, codigo }: { nombre?: string; codigo?: string }) =>
      distribuidorService.buscarOCrear(nombre, codigo),
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al buscar o crear el distribuidor'))
    },
  })
}
