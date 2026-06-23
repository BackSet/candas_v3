import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaquete } from '@/hooks/usePaquetes'
import type { SacaFormData } from '@/hooks/useSacasManager'
import { Trash2 } from 'lucide-react'

interface PaqueteSacaListItemProps {
  paqueteId: number
  index: number
  sacas: SacaFormData[]
  onMover: (paqueteId: number, sacaOrigenIndex: number, sacaDestinoIndex: number) => void
  onEliminar: (sacaIndex: number, paqueteId: number) => void
}

/** Muestra un paquete dentro de una saca (carga su detalle) con acciones de mover/eliminar. */
export function PaqueteSacaListItem({
  paqueteId,
  index,
  sacas,
  onMover,
  onEliminar,
}: PaqueteSacaListItemProps) {
  const { data: paquete, isLoading } = usePaquete(paqueteId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm animate-pulse">
        <div className="flex-1">
          <span className="text-muted-foreground">Cargando paquete #{paqueteId}...</span>
        </div>
      </div>
    )
  }

  if (!paquete) {
    return (
      <div className="flex items-center justify-between p-2 bg-error/10 rounded-md text-sm border border-error/20">
        <div className="flex-1">
          <span className="text-error font-medium">Paquete #{paqueteId} no encontrado</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-error hover:text-error hover:bg-error/10"
          onClick={() => onEliminar(index, paqueteId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  const direccion = paquete.direccionDestinatarioCompleta || paquete.direccionDestinatario || ''
  const observaciones = paquete.observaciones?.trim() || ''
  const hayDireccionUObs = !!direccion || !!observaciones

  return (
    <div className="flex items-start justify-between gap-2 p-2 bg-muted/30 hover:bg-muted/50 transition-colors rounded-md text-sm group border border-transparent hover:border-border/50">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-foreground">{paquete.numeroGuia || `#${paqueteId}`}</span>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
            {paquete.pesoKilos || '-'} kg
          </Badge>
        </div>
        {hayDireccionUObs && (
          <div className="space-y-0.5 text-xs text-muted-foreground">
            {direccion && (
              <p className="line-clamp-2 break-words" title={direccion}>{direccion}</p>
            )}
            {observaciones && (
              <p className="truncate" title={observaciones}>Obs: {observaciones}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {/* Botón para mover a otra saca */}
        {sacas.length > 1 && (
          <Select
            value=""
            onValueChange={(sacaDestinoIndex) => {
              const destinoIndex = parseInt(sacaDestinoIndex)
              if (destinoIndex !== index) {
                onMover(paqueteId, index, destinoIndex)
              }
            }}
          >
            <SelectTrigger className="h-7 w-24 text-[10px] px-2 h-7">
              <SelectValue placeholder="Mover..." />
            </SelectTrigger>
            <SelectContent>
              {sacas.map((s, idx) => {
                if (idx === index) return null
                return (
                  <SelectItem key={idx} value={idx.toString()}>
                    Saca {idx + 1}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
        {/* Botón para eliminar */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-error"
          onClick={() => onEliminar(index, paqueteId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
