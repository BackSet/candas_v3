import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { manifiestoConsolidadoService } from '@/lib/api/manifiesto-consolidado.service'
import type { CrearManifiestoConsolidadoDTO, ManifiestoConsolidadoResumen } from '@/types/manifiesto-consolidado'
import { toast } from 'sonner'

export function useManifiestosConsolidados(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['manifiestos-consolidados', page, size],
    queryFn: () => manifiestoConsolidadoService.findAll(page, size),
  })
}

export function useManifiestoConsolidado(id: number | undefined) {
  return useQuery({
    queryKey: ['manifiesto-consolidado', id],
    queryFn: () => manifiestoConsolidadoService.findById(id!),
    enabled: !!id,
  })
}



export function useCreateManifiestoConsolidado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CrearManifiestoConsolidadoDTO) => {
      const manifiesto = await manifiestoConsolidadoService.crearManifiestoConsolidado(dto)
      return manifiesto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manifiestos-consolidados'] })
      toast.success('Manifiesto consolidado generado exitosamente')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al generar el manifiesto consolidado'
      toast.error(message)
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
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar el manifiesto consolidado'
      toast.error(message)
    },
  })
}
