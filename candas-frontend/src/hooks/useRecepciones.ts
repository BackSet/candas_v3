import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recepcionService } from '@/lib/api/recepcion.service'
import type { Recepcion } from '@/types/recepcion'
import { toast } from 'sonner'

export function useRecepciones(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['recepciones', page, size],
    queryFn: () => recepcionService.findAll(page, size),
  })
}

export function useRecepcion(id: number | undefined) {
  return useQuery({
    queryKey: ['recepcion', id],
    queryFn: () => recepcionService.findById(id!),
    enabled: !!id,
  })
}

export function usePaquetesRecepcion(id: number | undefined) {
  return useQuery({
    queryKey: ['recepcion-paquetes', id],
    queryFn: () => recepcionService.obtenerPaquetes(id!),
    enabled: !!id,
  })
}

export function useCreateRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Recepcion) => recepcionService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recepciones'] })
      // El toast se muestra en el componente que maneja el flujo
      return data
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear la recepción'
      toast.error(message)
    },
  })
}

export function useUpdateRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Recepcion }) =>
      recepcionService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recepciones'] })
      queryClient.invalidateQueries({ queryKey: ['recepcion', variables.id] })
      toast.success('Recepción actualizada exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar la recepción'
      toast.error(message)
    },
  })
}

export function useDeleteRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => recepcionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recepciones'] })
      toast.success('Recepción eliminada exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar la recepción'
      toast.error(message)
    },
  })
}

export function useAgregarPaquetesRecepcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idPaquetes }: { id: number; idPaquetes: number[] }) =>
      recepcionService.agregarPaquetes(id, idPaquetes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recepciones'] })
      queryClient.invalidateQueries({ queryKey: ['recepcion', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['recepcion-paquetes', variables.id] })
      toast.success('Paquetes agregados exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al agregar los paquetes'
      toast.error(message)
    },
  })
}
