import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuarioService, type UsuarioListParams } from '@/lib/api/usuario.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Usuario } from '@/types/usuario'
import { notify } from '@/lib/notify'

export function useUsuarios(params: UsuarioListParams = {}) {
  const { page = 0, size = 20, search, username, email, activo } = params
  return useQuery({
    queryKey: ['usuarios', page, size, search, username, email, activo],
    queryFn: () => usuarioService.findAll({ page, size, search, username, email, activo }),
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

export function useUsuario(id: number | undefined) {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: () => usuarioService.findById(id!),
    enabled: !!id,
  })
}

export function useRolesUsuario(id: number | undefined) {
  return useQuery({
    queryKey: ['usuario-roles', id],
    queryFn: () => usuarioService.obtenerRoles(id!),
    enabled: !!id,
  })
}

export function useAgenciasUsuario(id: number | undefined) {
  return useQuery({
    queryKey: ['usuario-agencias', id],
    queryFn: () => usuarioService.obtenerAgencias(id!),
    enabled: !!id,
  })
}



export function useCreateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Usuario) => usuarioService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      notify.success('Usuario creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al crear el usuario')
    },
  })
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Usuario }) =>
      usuarioService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuario', variables.id] })
      notify.success('Usuario actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar el usuario')
    },
  })
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usuarioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      notify.success('Usuario eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al eliminar el usuario')
    },
  })
}

export function useAsignarRolesUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: number[] }) =>
      usuarioService.asignarRoles(id, roles),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuario', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['usuario-roles', variables.id] })
      notify.success('Roles asignados exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al asignar los roles')
    },
  })
}

export function useAsignarAgenciasUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, agencias }: { id: number; agencias: number[] }) =>
      usuarioService.asignarAgencias(id, agencias),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuario', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['usuario-agencias', variables.id] })
      notify.success('Agencias asignadas exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al asignar agencias')
    },
  })
}


