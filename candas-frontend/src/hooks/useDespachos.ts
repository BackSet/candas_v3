import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { despachoService, type TipoDestinoDespacho } from '@/lib/api/despacho.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Despacho } from '@/types/despacho'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

function assertAgenciaActivaSeleccionada() {
  if (useAuthStore.getState().activeAgencyId == null) {
    throw new Error('Debes seleccionar una agencia activa para continuar.')
  }
}

export function useDespachos(
  page: number = 0,
  size: number = 20,
  tipoDestino: TipoDestinoDespacho = 'all',
  fechaDesde?: string,
  fechaHasta?: string
) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: ['despachos', activeAgencyId, page, size, tipoDestino, fechaDesde, fechaHasta],
    queryFn: () => despachoService.findAll(page, size, tipoDestino, fechaDesde, fechaHasta),
  })
}

export function useDespacho(id: number | undefined) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: ['despacho', activeAgencyId, id],
    queryFn: () => despachoService.findById(id!),
    enabled: !!id,
  })
}

export function useSacasDespacho(id: number | undefined) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: ['despacho-sacas', activeAgencyId, id],
    queryFn: () => despachoService.obtenerSacas(id!),
    enabled: !!id,
  })
}

export function useCreateDespacho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Despacho) => {
      assertAgenciaActivaSeleccionada()
      return despachoService.create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      toast.success('Despacho creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el despacho'))
    },
  })
}

export function useUpdateDespacho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Despacho }) => {
      assertAgenciaActivaSeleccionada()
      return despachoService.update(id, dto)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      queryClient.invalidateQueries({ queryKey: ['despacho', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['despacho-sacas', variables.id] })
      toast.success('Despacho actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el despacho'))
    },
  })
}

export function useDeleteDespacho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => despachoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      toast.success('Despacho eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el despacho'))
    },
  })
}

export function useAgregarSacasDespacho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idSacas }: { id: number; idSacas: number[] }) =>
      despachoService.agregarSacas(id, idSacas),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      queryClient.invalidateQueries({ queryKey: ['despacho', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['despacho-sacas', variables.id] })
      toast.success('Sacas agregadas exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al agregar las sacas'))
    },
  })
}

export function useAgregarCadenitaAlDespacho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ idDespacho, numeroGuiaPadre }: { idDespacho: number; numeroGuiaPadre: string }) =>
      despachoService.agregarCadenitaAlDespacho(idDespacho, numeroGuiaPadre),
    onSuccess: (saca, variables) => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      queryClient.invalidateQueries({ queryKey: ['despacho', variables.idDespacho] })
      queryClient.invalidateQueries({ queryKey: ['despacho-sacas', variables.idDespacho] })
      const n = saca?.idPaquetes?.length ?? 0
      toast.success(`Saca Cadenita creada con ${n} guía(s)`)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al agregar Cadenita al despacho'))
    },
  })
}

export function useMarcarDespachado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => despachoService.marcarComoDespachado(id),
    onSuccess: (paquetesMarcados, idDespacho) => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      queryClient.invalidateQueries({ queryKey: ['despacho', idDespacho] })
      queryClient.invalidateQueries({ queryKey: ['despacho-sacas', idDespacho] })
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      toast.success(`${paquetesMarcados} paquete(s) marcado(s) como despachado(s)`)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al marcar paquetes como despachados'))
    },
  })
}

export function useMarcarDespachadoBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => despachoService.marcarComoDespachadoBatch(ids),
    onSuccess: (paquetesMarcados) => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })
      toast.success(`${paquetesMarcados} paquete(s) marcado(s) como despachado(s)`)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al marcar paquetes como despachados'))
    },
  })
}
