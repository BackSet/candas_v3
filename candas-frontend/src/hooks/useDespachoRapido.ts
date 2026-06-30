import { destinatarioDirectoService } from '@/lib/api/destinatario-directo.service'
import { distribuidorService } from '@/lib/api/distribuidor.service'
import type { SelectOption } from '@/hooks/useSelectOptions'
import { useQuery } from '@tanstack/react-query'

/**
 * Opciones de destino y distribuidor para el selector del despacho rápido.
 * Las agencias se obtienen con `useAgencias` (de `useSelectOptions`); aquí se agregan
 * destinatarios directos y distribuidores con el mismo formato `SelectOption`.
 */

export function useDestinatariosDirectosOptions() {
  return useQuery({
    queryKey: ['destinatarios-directos', 'options'],
    queryFn: async () => {
      const lista = await destinatarioDirectoService.findAllNoPaginado()
      return lista
        .filter((d) => d.activo !== false)
        .map<SelectOption>((d) => ({
          value: d.idDestinatarioDirecto!,
          label: d.nombreDestinatario,
          description: d.canton ?? undefined,
        }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDistribuidoresOptions() {
  return useQuery({
    queryKey: ['distribuidores', 'options'],
    queryFn: async () => {
      const data = await distribuidorService.findAll({ page: 0, size: 100 })
      return data.content.map<SelectOption>((d) => ({
        value: d.idDistribuidor!,
        label: d.nombre,
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}
