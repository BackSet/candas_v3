import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { Paquete } from '@/types/paquete'
import type { EtiquetaDestino } from '@/utils/clasificarEtiquetaDestino'
import { guiaEfectiva } from '@/utils/paqueteGuia'

interface PaqueteTableRowProps {
  paquete: Paquete
  resaltarPatron: (texto: string, tipo: 'direccion' | 'observacion') => React.ReactNode
  formatearDireccion: (paquete: Paquete) => string
  className?: string
  isSelected?: boolean
  onToggleSelect?: () => void
  mostrarNumeroGuiaPadre?: boolean
  mostrarTipoPaquete?: boolean
  /** Etiqueta visual (Agencia, Domicilio, Cadena, Separar) mostrada dentro de Observaciones */
  etiquetaDestino?: EtiquetaDestino
}

export const PaqueteTableRow = React.memo<PaqueteTableRowProps>(({
  paquete,
  resaltarPatron,
  formatearDireccion,
  className = '',
  isSelected = false,
  onToggleSelect,
  mostrarNumeroGuiaPadre = false,
  mostrarTipoPaquete = true,
  etiquetaDestino,
}) => {
  const etiquetaDestinoClass: Record<EtiquetaDestino, string> = {
    AGENCIA: 'bg-primary/10 text-primary border border-primary/20',
    DOMICILIO: 'bg-info/10 text-info border border-info/20',
    CADENA: 'bg-success/10 text-success border border-success/20',
    SEPARAR: 'bg-warning/10 text-warning border border-warning/20',
  }

  return (
    <TableRow
      className={`group hover:bg-muted/30 border-b border-border/30 transition-colors ${isSelected ? 'bg-primary/5' : ''} ${className}`}
    >
      <TableCell className="w-12 py-3.5">
        {onToggleSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </TableCell>
      <TableCell className="font-mono text-sm py-3.5 text-foreground">
        {guiaEfectiva(paquete) || '-'}
      </TableCell>
      {mostrarNumeroGuiaPadre && (
        <TableCell className="font-mono text-sm py-3.5 text-foreground">
          {paquete.numeroGuiaPaquetePadre || '-'}
        </TableCell>
      )}
      <TableCell className="py-3.5">
        <Badge variant="secondary" className="text-xs font-normal bg-muted/50 border-border/50">
          {paquete.estado}
        </Badge>
      </TableCell>
      <TableCell className="min-w-[250px] py-3.5">
        <span className="text-sm text-foreground leading-relaxed">
          {resaltarPatron(formatearDireccion(paquete), 'direccion')}
        </span>
      </TableCell>
      <TableCell className="min-w-[200px] py-3.5">
        <span className="text-sm text-muted-foreground leading-relaxed flex flex-wrap items-center gap-1.5">
          {etiquetaDestino != null && (
            <Badge variant="outline" className={`text-xs font-medium shrink-0 ${etiquetaDestinoClass[etiquetaDestino]}`}>
              {etiquetaDestino}
            </Badge>
          )}
          {etiquetaDestino != null && paquete.observaciones && <span className="text-muted-foreground/50">·</span>}
          {paquete.observaciones ? resaltarPatron(paquete.observaciones, 'observacion') : (!etiquetaDestino ? <span className="text-muted-foreground/50">-</span> : null)}
        </span>
      </TableCell>
      {mostrarTipoPaquete && (
        <TableCell className="py-3.5">
          <Badge variant="secondary" className="text-xs font-normal bg-muted/50 border-border/50">
            {paquete.tipoPaquete || 'Sin asignar'}
          </Badge>
        </TableCell>
      )}
    </TableRow>
  )
})

PaqueteTableRow.displayName = 'PaqueteTableRow'
