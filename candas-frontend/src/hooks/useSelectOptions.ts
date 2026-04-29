import { useQuery } from '@tanstack/react-query'
import { clienteService } from '@/lib/api/cliente.service'
import { agenciaService } from '@/lib/api/agencia.service'
import { puntoOrigenService } from '@/lib/api/punto-origen.service'

export interface SelectOption {
  value: number
  label: string
  /**
   * Texto secundario opcional (ej: "Cantón • Provincia") para mostrar y
   * permitir búsqueda en componentes tipo Combobox.
   */
  description?: string
}

/**
 * Construye una descripción "Cantón • Provincia" a partir de los campos
 * disponibles. Devuelve `undefined` si no hay nada que mostrar.
 */
function buildLocationDescription(
  canton?: string | null,
  provincia?: string | null,
): string | undefined {
  const parts = [canton, provincia].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0,
  )
  if (parts.length === 0) return undefined
  return parts.join(' • ')
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const data = await clienteService.findAll({ page: 0, size: 100 })
      return data.content
        .filter((c) => c.activo !== false)
        .map<SelectOption>((c) => ({
          value: c.idCliente!,
          label: c.nombreCompleto,
          description: buildLocationDescription(c.canton, c.provincia),
        }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAgencias() {
  return useQuery({
    queryKey: ['agencias'],
    queryFn: async () => {
      const data = await agenciaService.findAll({ page: 0, size: 100 })
      return data.content
        .filter((a) => a.activa !== false)
        .map<SelectOption>((a) => ({
          value: a.idAgencia!,
          label: a.nombre,
          description: buildLocationDescription(a.canton, a.provincia),
        }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePuntosOrigen() {
  return useQuery({
    queryKey: ['puntos-origen'],
    queryFn: async () => {
      const data = await puntoOrigenService.findAll({ page: 0, size: 100 })
      return data.content
        .filter((o) => o.activo !== false)
        .map((o) => ({
          value: o.idPuntoOrigen!,
          label: o.nombrePuntoOrigen,
        })) as SelectOption[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
