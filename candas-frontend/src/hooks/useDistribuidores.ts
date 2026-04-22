import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { distribuidorService } from '@/lib/api/distribuidor.service'
import type { Distribuidor } from '@/types/distribuidor'
import { notify } from '@/lib/notify'

export interface UseDistribuidoresParams {
  page?: number
  size?: number
  search?: string
  activa?: boolean
}

export function useDistribuidores(params: UseDistribuidoresParams = {}) {
  const { page = 0, size = 20, search, activa } = params
  return useQuery({
    queryKey: ['distribuidores', page, size, search ?? null, activa ?? null],
    queryFn: () => distribuidorService.findAll({ page, size, search, activa }),
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
      notify.success('Distribuidor creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al crear el distribuidor')
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
      notify.success('Distribuidor actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar el distribuidor')
    },
  })
}

export function useDeleteDistribuidor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => distribuidorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribuidores'] })
      notify.success('Distribuidor eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al eliminar el distribuidor')
    },
  })
}

export function useBuscarOCrearDistribuidor() {
  return useMutation({
    mutationFn: ({ nombre, codigo }: { nombre?: string; codigo?: string }) =>
      distribuidorService.buscarOCrear(nombre, codigo),
    onError: (error: unknown) => {
      notify.error(error, 'Error al buscar o crear el distribuidor')
    },
  })
}
