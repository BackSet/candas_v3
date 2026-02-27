import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { destinatarioDirectoService } from '@/lib/api/destinatario-directo.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'
import { toast } from 'sonner'

export function useDestinatariosDirectos() {
  return useQuery({
    queryKey: ['destinatarios-directos'],
    queryFn: () => destinatarioDirectoService.getAll(),
  })
}

export function useDestinatarioDirecto(id: number | undefined) {
  return useQuery({
    queryKey: ['destinatario-directo', id],
    queryFn: () => destinatarioDirectoService.findById(id!),
    enabled: !!id,
  })
}

export function useSearchDestinatariosDirectos(query: string) {
  return useQuery({
    queryKey: ['destinatarios-directos', 'search', query],
    queryFn: () => destinatarioDirectoService.search(query),
    enabled: query.length > 0,
  })
}

export function useCreateDestinatarioDirecto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: DestinatarioDirecto) => destinatarioDirectoService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinatarios-directos'] })
      toast.success('Destinatario directo creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el destinatario directo'))
    },
  })
}

export function useUpdateDestinatarioDirecto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: DestinatarioDirecto }) =>
      destinatarioDirectoService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['destinatarios-directos'] })
      queryClient.invalidateQueries({ queryKey: ['destinatario-directo', variables.id] })
      toast.success('Destinatario directo actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el destinatario directo'))
    },
  })
}

export function useDeleteDestinatarioDirecto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => destinatarioDirectoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinatarios-directos'] })
      queryClient.invalidateQueries({ queryKey: ['destinatario-directo'] })
      toast.success('Destinatario directo eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el destinatario directo'))
    },
  })
}
