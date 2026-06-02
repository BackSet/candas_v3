import { parametroSistemaService } from '@/lib/api/parametroSistema.service'
import { notify } from '@/lib/notify'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'

const QUERY_KEY_PLANTILLA = ['parametros-sistema', 'whatsapp-despacho'] as const
const QUERY_KEY_VARIABLES = ['parametros-sistema', 'whatsapp-despacho', 'variables'] as const

export function usePlantillaWhatsAppDespacho() {
  return useQuery({
    queryKey: QUERY_KEY_PLANTILLA,
    queryFn: () => parametroSistemaService.getPlantillaWhatsAppDespacho(),
  })
}

export function useVariablesPlantillaDespacho() {
  return useQuery({
    queryKey: QUERY_KEY_VARIABLES,
    queryFn: () => parametroSistemaService.getVariablesPlantillaDespacho(),
  })
}

export function useGuardarPlantillaWhatsAppDespacho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (plantilla: string) =>
      parametroSistemaService.guardarPlantillaWhatsAppDespacho(plantilla),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PLANTILLA })
      notify.success('Plantilla guardada correctamente')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al guardar la plantilla')
    },
  })
}
