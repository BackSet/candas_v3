import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteService } from '@/lib/api/cliente.service'
import type { Cliente } from '@/types/cliente'
import { showMutationError, showMutationSuccess } from '@/hooks/mutationFeedback'

export interface UseClientesParams {
  page?: number
  size?: number
  search?: string
  nombre?: string
  documento?: string
  email?: string
  activo?: boolean
}

export function useClientes(params: UseClientesParams = {}) {
  const { page = 0, size = 20, search, nombre, documento, email, activo } = params
  return useQuery({
    queryKey: [
      'clientes',
      page,
      size,
      search ?? null,
      nombre ?? null,
      documento ?? null,
      email ?? null,
      activo ?? null,
    ],
    queryFn: () => clienteService.findAll({ page, size, search, nombre, documento, email, activo }),
  })
}

export function useCliente(id: number | undefined) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clienteService.findById(id!),
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Cliente) => clienteService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      showMutationSuccess('Cliente creado exitosamente')
    },
    onError: (error: unknown) => {
      showMutationError(error, 'Error al crear el cliente')
    },
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Cliente }) =>
      clienteService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] })
      showMutationSuccess('Cliente actualizado exitosamente')
    },
    onError: (error: unknown) => {
      showMutationError(error, 'Error al actualizar el cliente')
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => clienteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      showMutationSuccess('Cliente eliminado exitosamente')
    },
    onError: (error: unknown) => {
      showMutationError(error, 'Error al eliminar el cliente')
    },
  })
}
