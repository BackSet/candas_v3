import type { StatusVariant } from '@/components/detail/StatusBadge'
import { EstadoPaquete } from '@/types/paquete'

export function getEstadoPaqueteBadgeVariant(estado: EstadoPaquete): StatusVariant {
  switch (estado) {
    case EstadoPaquete.DESPACHADO:
      return 'completed'
    case EstadoPaquete.ENSACADO:
      return 'in-progress'
    case EstadoPaquete.ASIGNADO_SACA:
    case EstadoPaquete.RECIBIDO:
      return 'pending'
    case EstadoPaquete.RETENER:
      return 'error'
    default:
      return 'active'
  }
}
