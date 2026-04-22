import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { destinatarioDirectoService } from '@/lib/api/destinatario-directo.service'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'
import { notify } from '@/lib/notify'

export interface UseDestinatariosDirectosParams {
  page?: number
  size?: number
  search?: string
  activo?: boolean
}

/**
 * Versión paginada con filtros server-side (search/activo). Es el hook estándar
 * para pantallas de listado.
 */
export function useDestinatariosDirectos(params: UseDestinatariosDirectosParams = {}) {
  const { page = 0, size = 20, search, activo } = params
  return useQuery({
    queryKey: ['destinatarios-directos', 'paginado', page, size, search ?? null, activo ?? null],
    queryFn: () =>
      destinatarioDirectoService.findAll({ page, size, search, activo }),
  })
}

/**
 * Devuelve TODOS los destinatarios sin paginar. Útil para selects/listas reducidas
 * en formularios. Usa el endpoint `/all`.
 */
export function useDestinatariosDirectosAll() {
  return useQuery({
    queryKey: ['destinatarios-directos', 'all'],
    queryFn: () => destinatarioDirectoService.findAllNoPaginado(),
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
      notify.success('Destinatario directo creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al crear el destinatario directo')
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
      notify.success('Destinatario directo actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar el destinatario directo')
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
      notify.success('Destinatario directo eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al eliminar el destinatario directo')
    },
  })
}
