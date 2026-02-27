import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permisoService } from '@/lib/api/permiso.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Permiso } from '@/types/permiso'
import { toast } from 'sonner'

export function usePermisos(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['permisos', page, size],
    queryFn: () => permisoService.findAll(page, size),
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
      toast.success('Permiso creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el permiso'))
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
      toast.success('Permiso actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el permiso'))
    },
  })
}

export function useDeletePermiso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => permisoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permisos'] })
      toast.success('Permiso eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el permiso'))
    },
  })
}
