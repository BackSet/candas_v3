import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { origenUsaService } from '@/lib/api/origen-usa.service'
import type { OrigenUsa } from '@/types/origen-usa'
import { toast } from 'sonner'

export function useOrigenesUsa(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['origenes-usa', page, size],
    queryFn: () => origenUsaService.findAll(page, size),
  })
}

export function useOrigenUsa(id: number | undefined) {
  return useQuery({
    queryKey: ['origen-usa', id],
    queryFn: () => origenUsaService.findById(id!),
    enabled: !!id,
  })
}

export function useCreateOrigenUsa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: OrigenUsa) => origenUsaService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['origenes-usa'] })
      toast.success('Origen USA creado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear el origen USA'
      toast.error(message)
    },
  })
}

export function useUpdateOrigenUsa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: OrigenUsa }) =>
      origenUsaService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['origenes-usa'] })
      queryClient.invalidateQueries({ queryKey: ['origen-usa', variables.id] })
      toast.success('Origen USA actualizado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar el origen USA'
      toast.error(message)
    },
  })
}

export function useDeleteOrigenUsa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => origenUsaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['origenes-usa'] })
      toast.success('Origen USA eliminado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar el origen USA'
      toast.error(message)
    },
  })
}
