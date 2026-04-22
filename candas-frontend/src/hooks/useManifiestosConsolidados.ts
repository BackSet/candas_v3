import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  manifiestoConsolidadoService,
  type ManifiestoConsolidadoFindAllParams,
} from '@/lib/api/manifiesto-consolidado.service'
import type { CrearManifiestoConsolidadoDTO } from '@/types/manifiesto-consolidado'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@/lib/notify'
import { assertAgenciaOrigenActivaSeleccionadaParaCreacion } from '@/lib/auth/agencia-origen-activa'

function assertAgenciaActivaSeleccionada() {
  assertAgenciaOrigenActivaSeleccionadaParaCreacion()
}

export type UseManifiestosConsolidadosParams = ManifiestoConsolidadoFindAllParams

export function useManifiestosConsolidados(params: UseManifiestosConsolidadosParams = {}) {
  const { page = 0, size = 20, search, idAgencia, mes, anio } = params
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: [
      'manifiestos-consolidados',
      activeAgencyId,
      page,
      size,
      search,
      idAgencia,
      mes,
      anio,
    ],
    queryFn: () =>
      manifiestoConsolidadoService.findAll({ page, size, search, idAgencia, mes, anio }),
  })
}

export function useManifiestoConsolidado(id: number | undefined) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: ['manifiesto-consolidado', activeAgencyId, id],
    queryFn: () => manifiestoConsolidadoService.findById(id!),
    enabled: !!id,
  })
}

export function useCreateManifiestoConsolidado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CrearManifiestoConsolidadoDTO) => {
      assertAgenciaActivaSeleccionada()
      const manifiesto = await manifiestoConsolidadoService.crearManifiestoConsolidado(dto)
      return manifiesto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manifiestos-consolidados'] })
      notify.success('Manifiesto consolidado generado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo generar el manifiesto consolidado')
    },
  })
}

export function useDeleteManifiestoConsolidado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await manifiestoConsolidadoService.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manifiestos-consolidados'] })
      notify.success('Manifiesto consolidado eliminado exitosamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'No se pudo eliminar el manifiesto consolidado')
    },
  })
}
