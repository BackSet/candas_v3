import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { atencionPaqueteService } from '@/lib/api/atencion-paquete.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { AtencionPaquete } from '@/types/atencion-paquete'
import { toast } from 'sonner'

export function useAtencionPaquetes(
  page: number = 0,
  size: number = 20,
  estado?: string,
  search?: string
) {
  return useQuery({
    queryKey: ['atencion-paquetes', page, size, estado, search],
    queryFn: () => atencionPaqueteService.findAll(page, size, estado, search),
  })
}

export function useAtencionPaquete(id: number | undefined) {
  return useQuery({
    queryKey: ['atencion-paquete', id],
    queryFn: () => atencionPaqueteService.findById(id!),
    enabled: !!id,
  })
}


export function useAtencionPaquetesPendientes() {
  return useQuery({
    queryKey: ['atencion-paquetes-pendientes'],
    queryFn: () => atencionPaqueteService.findPendientes(),
  })
}

export function useCreateAtencionPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: AtencionPaquete) => atencionPaqueteService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes-pendientes'] })
      toast.success('Solicitud de atención creada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear la solicitud de atención'))
    },
  })
}

export function useUpdateAtencionPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AtencionPaquete }) =>
      atencionPaqueteService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquete', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes-pendientes'] })
      toast.success('Atención actualizada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar la atención'))
    },
  })
}

export function useDeleteAtencionPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => atencionPaqueteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes-pendientes'] })
      toast.success('Atención eliminada exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar la atención'))
    },
  })
}

export function useResolverAtencionPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, observacionesResolucion }: { id: number; observacionesResolucion: string }) =>
      atencionPaqueteService.resolver(id, observacionesResolucion),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquete', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes-pendientes'] })
      toast.success('Atención resuelta exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al resolver la atención'))
    },
  })
}
