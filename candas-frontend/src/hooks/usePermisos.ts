import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permisoService } from '@/lib/api/permiso.service'
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
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear el permiso'
      toast.error(message)
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
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar el permiso'
      toast.error(message)
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
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar el permiso'
      toast.error(message)
    },
  })
}
