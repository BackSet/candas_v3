import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolService, type RolListParams } from '@/lib/api/rol.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Rol } from '@/types/rol'
import { notify } from '@/lib/notify'

export function useRoles(params: RolListParams = {}) {
  const { page = 0, size = 20, search, activo } = params
  return useQuery({
    queryKey: ['roles', page, size, search, activo],
    queryFn: () => rolService.findAll({ page, size, search, activo }),
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
      notify.success('Rol creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al crear el rol')
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
      notify.success('Rol actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar el rol')
    },
  })
}

export function useDeleteRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => rolService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      notify.success('Rol eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al eliminar el rol')
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
      notify.success('Permisos asignados exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al asignar los permisos')
    },
  })
}
