import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuarioService } from '@/lib/api/usuario.service'
import type { Usuario } from '@/types/usuario'
import { toast } from 'sonner'

export function useUsuarios(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['usuarios', page, size],
    queryFn: () => usuarioService.findAll(page, size),
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



export function useCreateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Usuario) => usuarioService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario creado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear el usuario'
      toast.error(message)
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
      toast.success('Usuario actualizado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar el usuario'
      toast.error(message)
    },
  })
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usuarioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario eliminado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar el usuario'
      toast.error(message)
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
      toast.success('Roles asignados exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al asignar los roles'
      toast.error(message)
    },
  })
}


