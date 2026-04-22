import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permisoService, type PermisoListParams } from '@/lib/api/permiso.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Permiso } from '@/types/permiso'
import { notify } from '@/lib/notify'

export function usePermisos(params: PermisoListParams = {}) {
  const { page = 0, size = 20, search, recurso, accion } = params
  return useQuery({
    queryKey: ['permisos', page, size, search, recurso, accion],
    queryFn: () => permisoService.findAll({ page, size, search, recurso, accion }),
  })
}

export function usePermiso(id: number | undefined) {
  return useQuery({
    queryKey: ['permiso', id],
    queryFn: () => permisoService.findById(id!),
    enabled: !!id,
  })
}

export function useCreatePermiso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Permiso) => permisoService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permisos'] })
      notify.success('Permiso creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al crear el permiso')
    },
  })
}

export function useUpdatePermiso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Permiso }) =>
      permisoService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permisos'] })
      queryClient.invalidateQueries({ queryKey: ['permiso', variables.id] })
      notify.success('Permiso actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar el permiso')
    },
  })
}

export function useDeletePermiso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => permisoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permisos'] })
      notify.success('Permiso eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al eliminar el permiso')
    },
  })
}
