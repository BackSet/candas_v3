import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agenciaService } from '@/lib/api/agencia.service'
import type { Agencia } from '@/types/agencia'
import { toast } from 'sonner'

type ApiError = { response?: { data?: { message?: string } } }

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as ApiError)?.response?.data?.message
  return typeof message === 'string' && message.trim().length > 0 ? message : fallback
}

export function useAgencias(
  page: number = 0,
  size: number = 20,
  filters?: { search?: string; nombre?: string; codigo?: string; activa?: boolean }
) {
  return useQuery({
    queryKey: ['agencias', page, size, filters],
    queryFn: () => agenciaService.findAll(page, size, filters),
  })
}

export function useAgencia(id: number | undefined) {
  return useQuery({
    queryKey: ['agencia', id],
    queryFn: () => agenciaService.findById(id!),
    enabled: !!id,
  })
}

export function useCreateAgencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Agencia) => agenciaService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })
      toast.success('Agencia creada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear la agencia'))
    },
  })
}

export function useUpdateAgencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Agencia }) =>
      agenciaService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })
      queryClient.invalidateQueries({ queryKey: ['agencia', variables.id] })
      toast.success('Agencia actualizada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar la agencia'))
    },
  })
}

export function useDeleteAgencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => agenciaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })
      toast.success('Agencia eliminada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar la agencia'))
    },
  })
}

export function useSearchAgencias(query: string) {
  return useQuery({
    queryKey: ['agencias', 'search', query],
    queryFn: () => agenciaService.search(query),
    enabled: query.length > 0,
  })
}
