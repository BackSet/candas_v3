import { useQuery } from '@tanstack/react-query'
import { clienteService, type Cliente } from '@/lib/api/cliente.service'
import { agenciaService, type Agencia } from '@/lib/api/agencia.service'
import { puntoOrigenService, type PuntoOrigen } from '@/lib/api/punto-origen.service'

export interface SelectOption {
  value: number
  label: string
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const data = await clienteService.findAll(0, 1000)
      return data.content
        .filter((c) => c.activo !== false)
        .map((c) => ({
          value: c.idCliente!,
          label: c.nombreCompleto,
        })) as SelectOption[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useAgencias() {
  return useQuery({
    queryKey: ['agencias'],
    queryFn: async () => {
      const data = await agenciaService.findAll(0, 1000)
      return data.content
        .filter((a) => a.activa !== false)
        .map((a) => ({
          value: a.idAgencia!,
          label: a.nombre,
        })) as SelectOption[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function usePuntosOrigen() {
  return useQuery({
    queryKey: ['puntos-origen'],
    queryFn: async () => {
      const data = await puntoOrigenService.findAll(0, 1000)
      return data.content
        .filter((o) => o.activo !== false)
        .map((o) => ({
          value: o.idPuntoOrigen!,
          label: o.nombrePuntoOrigen,
        })) as SelectOption[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
