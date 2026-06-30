import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DespachoRapidoPaquete } from '@/types/despacho-rapido'
import { MapPin, PackageCheck, Scale } from 'lucide-react'
import type React from 'react'

interface PaqueteTipeadoCardProps {
  paquete: DespachoRapidoPaquete
  numeroSaca: number
  active?: boolean
  recent?: boolean
  action?: React.ReactNode
}

function formatPeso(peso?: number): string | null {
  if (peso == null || Number.isNaN(peso)) return null
  return `${Number(peso).toFixed(2)} kg`
}

function firstText(...values: Array<string | undefined | null>): string | undefined {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim()
}

function destinoPrincipal(paquete: DespachoRapidoPaquete): string {
  return firstText(
    paquete.nombreAgenciaDestino,
    paquete.nombreDestinatarioDirecto,
    paquete.nombreClienteDestinatario
  ) ?? 'Destino por confirmar'
}

function destinoDetalle(paquete: DespachoRapidoPaquete): string {
  return firstText(
    paquete.direccionDestinatarioDirecto,
    paquete.direccionDestinatario,
    paquete.cantonDestinatarioDirecto,
    paquete.cantonAgenciaDestino,
    paquete.cantonDestinatario,
    paquete.provinciaDestinatario
  ) ?? 'Sin direccion/canton registrado'
}

function clasificacion(paquete: DespachoRapidoPaquete): string {
  const tipoDestino = paquete.tipoDestino === 'DOMICILIO' ? 'Domicilio' : paquete.tipoDestino === 'AGENCIA' ? 'Agencia' : null
  const tipoPaquete = paquete.tipoPaquete?.replace(/_/g, ' ').toLowerCase()
  return [tipoDestino, tipoPaquete].filter(Boolean).join(' / ') || 'Sin clasificacion'
}

export function PaqueteTipeadoCard({ paquete, numeroSaca, active = false, recent = false, action }: PaqueteTipeadoCardProps) {
  const peso = formatPeso(paquete.pesoKilos)
  const detalle = destinoDetalle(paquete)

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-colors',
        active && 'border-primary/50 bg-primary/5',
        recent && 'border-success/50 bg-success/5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-semibold text-foreground">{paquete.numeroGuia}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              Saca #{numeroSaca}
            </Badge>
            <Badge variant="info" className="px-1.5 py-0 text-[10px]">
              {paquete.estado}
            </Badge>
            {recent ? (
              <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                Ultimo
              </Badge>
            ) : null}
          </div>
          <p className="text-xs font-medium text-foreground">{destinoPrincipal(paquete)}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 break-words">{detalle}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <PackageCheck className="size-3.5" />
            {clasificacion(paquete)}
          </span>
          {peso ? (
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Scale className="size-3.5" />
              {peso}
            </span>
          ) : null}
          {paquete.ref ? <span>Ref: {paquete.ref}</span> : null}
          {paquete.telefonoDestinatario ? <span>Tel: {paquete.telefonoDestinatario}</span> : null}
        </div>
        {paquete.observaciones ? (
          <p className="rounded-md bg-muted/40 px-2 py-1 text-[11px] text-foreground/80">
            <span className="font-medium text-muted-foreground">Obs:</span> {paquete.observaciones}
          </p>
        ) : null}
      </div>
    </div>
  )
}
