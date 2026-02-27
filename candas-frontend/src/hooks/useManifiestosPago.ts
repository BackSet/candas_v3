import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { manifiestoPagoService } from '@/lib/api/manifiesto-pago.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { CrearManifiestoPagoDTO, ManifiestoPagoResumen } from '@/types/manifiesto-pago'
import { imprimirManifiestoPago } from '@/utils/imprimirManifiestoPago'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useAgencia } from '@/hooks/useAgencias'

export function useManifiestosPago(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['manifiestos-pago', page, size],
    queryFn: () => manifiestoPagoService.findAll(page, size),
  })
}

export function useManifiestoPago(id: number | undefined) {
  return useQuery({
    queryKey: ['manifiesto-pago', id],
    queryFn: () => manifiestoPagoService.findById(id!),
    enabled: !!id,
  })
}

export function useManifiestosPagoByAgencia(idAgencia: number | undefined, page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['manifiestos-pago', 'agencia', idAgencia, page, size],
    queryFn: () => manifiestoPagoService.findByAgencia(idAgencia!, page, size),
    enabled: !!idAgencia,
  })
}

export function useCreateManifiestoPago() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { data: agenciaUsuario } = useAgencia(user?.idAgencia)
  const nombreAgenciaOrigen = agenciaUsuario?.nombre ?? undefined

  return useMutation({
    mutationFn: async (dto: CrearManifiestoPagoDTO) => {
      const manifiesto = await manifiestoPagoService.crearManifiestoPago(dto)
      // Obtener detalles completos y abrir ventana de impresión
      const detalles = await manifiestoPagoService.findById(manifiesto.idManifiestoPago)
      imprimirManifiestoPago(detalles, nombreAgenciaOrigen)
      return manifiesto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manifiestos-pago'] })
      toast.success('Manifiesto de pago generado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al generar el manifiesto de pago'))
    },
  })
}
