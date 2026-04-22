import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  atencionPaqueteService,
  type AtencionPaqueteFindAllParams,
} from '@/lib/api/atencion-paquete.service'
import type { AtencionPaquete } from '@/types/atencion-paquete'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@/lib/notify'
import { assertAgenciaOrigenActivaSeleccionadaParaCreacion } from '@/lib/auth/agencia-origen-activa'

function assertAgenciaActivaSeleccionada() {
  assertAgenciaOrigenActivaSeleccionadaParaCreacion()
}

export type UseAtencionPaquetesParams = AtencionPaqueteFindAllParams

export function useAtencionPaquetes(params: UseAtencionPaquetesParams = {}) {
  const {
    page = 0,
    size = 20,
    estado,
    search,
    tipoProblema,
    fechaDesde,
    fechaHasta,
    idAgencia,
  } = params
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: [
      'atencion-paquetes',
      activeAgencyId,
      page,
      size,
      estado,
      search,
      tipoProblema,
      fechaDesde,
      fechaHasta,
      idAgencia,
    ],
    queryFn: () =>
      atencionPaqueteService.findAll({
        page,
        size,
        estado,
        search,
        tipoProblema,
        fechaDesde,
        fechaHasta,
        idAgencia,
      }),
  })
}

export function useAtencionPaquete(id: number | undefined) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: ['atencion-paquete', activeAgencyId, id],
    queryFn: () => atencionPaqueteService.findById(id!),
    enabled: !!id,
  })
}


export function useAtencionPaquetesPendientes() {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: ['atencion-paquetes-pendientes', activeAgencyId],
    queryFn: () => atencionPaqueteService.findPendientes(),
  })
}

export function useCreateAtencionPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: AtencionPaquete) => {
      assertAgenciaActivaSeleccionada()
      return atencionPaqueteService.create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes-pendientes'] })
      notify.success('Solicitud de atención creada exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo crear la solicitud de atención')
    },
  })
}

export function useUpdateAtencionPaquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AtencionPaquete }) => {
      assertAgenciaActivaSeleccionada()
      return atencionPaqueteService.update(id, dto)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes'] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquete', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['atencion-paquetes-pendientes'] })
      notify.success('Atención actualizada exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo actualizar la atención')
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
      notify.success('Atención eliminada exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo eliminar la atención')
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
      notify.success('Atención resuelta exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo resolver la atención')
    },
  })
}
