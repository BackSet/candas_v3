import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sacaService } from '@/lib/api/saca.service'
import type { Saca } from '@/types/saca'
import { toast } from 'sonner'

export function useSacas(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['sacas', page, size],
    queryFn: () => sacaService.findAll(page, size),
  })
}

export function useSaca(id: number | undefined) {
  return useQuery({
    queryKey: ['saca', id],
    queryFn: () => sacaService.findById(id!),
    enabled: !!id,
  })
}

export function usePaquetesSaca(id: number | undefined) {
  return useQuery({
    queryKey: ['saca-paquetes', id],
    queryFn: () => sacaService.obtenerPaquetes(id!),
    enabled: !!id,
  })
}

export function useCreateSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Saca) => sacaService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      toast.success('Saca creada exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear la saca'
      toast.error(message)
    },
  })
}

export function useUpdateSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Saca }) =>
      sacaService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      queryClient.invalidateQueries({ queryKey: ['saca', variables.id] })
      toast.success('Saca actualizada exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar la saca'
      toast.error(message)
    },
  })
}

export function useDeleteSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sacaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      toast.success('Saca eliminada exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar la saca'
      toast.error(message)
    },
  })
}

export function useAgregarPaquetesSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idPaquetes }: { id: number; idPaquetes: number[] }) =>
      sacaService.agregarPaquetes(id, idPaquetes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      queryClient.invalidateQueries({ queryKey: ['saca', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['saca-paquetes', variables.id] })
      toast.success('Paquetes agregados exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al agregar los paquetes'
      toast.error(message)
    },
  })
}

export function useCalcularPesoSaca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sacaService.calcularPeso(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sacas'] })
      queryClient.invalidateQueries({ queryKey: ['saca', id] })
      toast.success('Peso calculado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al calcular el peso'
      toast.error(message)
    },
  })
}
