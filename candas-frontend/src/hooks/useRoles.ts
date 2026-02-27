import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolService } from '@/lib/api/rol.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Rol } from '@/types/rol'
import { toast } from 'sonner'

export function useRoles(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['roles', page, size],
    queryFn: () => rolService.findAll(page, size),
  })
}

export function useRol(id: number | undefined) {
  return useQuery({
    queryKey: ['rol', id],
    queryFn: () => rolService.findById(id!),
    enabled: !!id,
  })
}

export function usePermisosRol(id: number | undefined) {
  return useQuery({
    queryKey: ['rol-permisos', id],
    queryFn: () => rolService.obtenerPermisos(id!),
    enabled: !!id,
  })
}

export function useCreateRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Rol) => rolService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Rol creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el rol'))
    },
  })
}

export function useUpdateRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Rol }) =>
      rolService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['rol', variables.id] })
      toast.success('Rol actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el rol'))
    },
  })
}

export function useDeleteRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => rolService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Rol eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el rol'))
    },
  })
}

export function useAsignarPermisosRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, permisos }: { id: number; permisos: number[] }) =>
      rolService.asignarPermisos(id, permisos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['rol', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['rol-permisos', variables.id] })
      toast.success('Permisos asignados exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al asignar los permisos'))
    },
  })
}
