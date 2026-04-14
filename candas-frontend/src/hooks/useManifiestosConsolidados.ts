import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { manifiestoConsolidadoService } from '@/lib/api/manifiesto-consolidado.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { CrearManifiestoConsolidadoDTO, ManifiestoConsolidadoResumen } from '@/types/manifiesto-consolidado'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { assertAgenciaOrigenActivaSeleccionadaParaCreacion } from '@/lib/auth/agencia-origen-activa'

function assertAgenciaActivaSeleccionada() {
  assertAgenciaOrigenActivaSeleccionadaParaCreacion()
}

export function useManifiestosConsolidados(page: number = 0, size: number = 20) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  return useQuery({
    queryKey: ['manifiestos-consolidados', activeAgencyId, page, size],
    queryFn: () => manifiestoConsolidadoService.findAll(page, size),
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
      toast.success('Manifiesto consolidado generado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al generar el manifiesto consolidado'))
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
      toast.success('Manifiesto consolidado eliminado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el manifiesto consolidado'))
    },
  })
}
