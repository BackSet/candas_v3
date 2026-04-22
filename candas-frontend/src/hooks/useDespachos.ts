import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { despachoService, type TipoDestinoDespacho } from '@/lib/api/despacho.service'
import type { Despacho } from '@/types/despacho'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@/lib/notify'
import { assertAgenciaOrigenActivaSeleccionadaParaCreacion } from '@/lib/auth/agencia-origen-activa'

function assertAgenciaActivaSeleccionada() {
  assertAgenciaOrigenActivaSeleccionadaParaCreacion()
}

export interface UseDespachosParams {
  page?: number
  size?: number
  tipoDestino?: TipoDestinoDespacho
  fechaDesde?: string
  fechaHasta?: string
  search?: string
}

export function useDespachos(params: UseDespachosParams = {}) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  const { page = 0, size = 20, tipoDestino = 'all', fechaDesde, fechaHasta, search } = params
  return useQuery({
    queryKey: ['despachos', activeAgencyId, page, size, tipoDestino, fechaDesde, fechaHasta, search],
    queryFn: () => despachoService.findAll({ page, size, tipoDestino, fechaDesde, fechaHasta, search }),
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
      notify.success('Despacho creado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo crear el despacho')
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
      notify.success('Despacho actualizado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo actualizar el despacho')
    },
  })
}

export function useDeleteDespacho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => despachoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      notify.success('Despacho eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo eliminar el despacho')
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
      notify.success('Sacas agregadas exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudieron agregar las sacas')
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
      notify.success(`Saca Cadenita creada con ${n} guía(s)`)
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo agregar Cadenita al despacho')
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
      notify.success(`${paquetesMarcados} paquete(s) marcado(s) como despachado(s)`)
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudieron marcar los paquetes como despachados')
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
      notify.success(`${paquetesMarcados} paquete(s) marcado(s) como despachado(s)`)
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudieron marcar los paquetes como despachados')
    },
  })
}
