import { DespachoMasivoPackageRow } from '@/components/despacho-masivo/DespachoMasivoPackageRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Paquete } from '@/types/paquete'
import { TamanoSaca } from '@/types/saca'
import {
  buildSacaCopyText,
  buildSacaDestinoCopyText,
  buildSacaGuiasCopyText,
  copyText,
  type SacaCopyInput,
} from '@/utils/despachoMasivoCopy'
import { codigoDestinoDePaquete } from '@/utils/despachoMasivoPaquete'
import { formatearTamanoSaca } from '@/utils/ensacado'
import { formatDireccionPaquete, formatObservacionPaquete } from '@/utils/paqueteDisplay'
import { guiaEfectiva } from '@/utils/paqueteGuia'
import { ClipboardList, ListOrdered, MapPin, Package } from 'lucide-react'

const TAMANOS: TamanoSaca[] = [
  TamanoSaca.INDIVIDUAL,
  TamanoSaca.PEQUENO,
  TamanoSaca.MEDIANO,
  TamanoSaca.GRANDE,
]

export interface SacaBatchReviewCardProps {
  numero: number
  paquetes: Paquete[]
  tamano: TamanoSaca
  onTamanoChange: (t: TamanoSaca) => void
  presinto: string
  onPresintoChange: (v: string) => void
  /** Peso estimado de la saca en kg (suma de pesos conocidos). */
  pesoEstimado: number
}

/** Revisión de una saca del despacho masivo: tamaño, presinto, copiado y paquetes completos. */
export function SacaBatchReviewCard({
  numero,
  paquetes,
  tamano,
  onTamanoChange,
  presinto,
  onPresintoChange,
  pesoEstimado,
}: SacaBatchReviewCardProps) {
  const pesoLabel = pesoEstimado > 0 ? `${pesoEstimado.toFixed(2).replace(/\.?0+$/, '')} kg` : null

  const copyInput: SacaCopyInput = {
    numero,
    tamano,
    presinto: presinto.trim() || undefined,
    pesoEstimado,
    paquetes: paquetes.map((p) => ({
      numeroGuia: guiaEfectiva(p) || p.numeroGuia,
      pesoKilos: p.pesoKilos,
      nombreDestinatario: p.nombreClienteDestinatario,
      telefono: p.telefonoDestinatario,
      codigo: codigoDestinoDePaquete(p),
      direccion: formatDireccionPaquete(p, { fallback: 'Sin destino' }),
      observaciones: formatObservacionPaquete(p) ?? undefined,
    })),
  }

  return (
    <div className="rounded-md border border-border">
      {/* Encabezado */}
      <div className="space-y-3 border-b border-border/60 p-3">
        <div className="flex items-center gap-2">
          <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <span className="text-sm font-medium">Saca {numero}</span>
            <p className="text-xs text-muted-foreground">
              {paquetes.length} paquete(s){pesoLabel ? ` · ${pesoLabel} aprox.` : ''}
            </p>
          </div>
        </div>

        {/* Controles: grid estable, sin anchos fijos que desborden la columna */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`saca-${numero}-tamano`}>Tamaño</Label>
            <Select value={tamano} onValueChange={(v) => onTamanoChange(v as TamanoSaca)}>
              <SelectTrigger id={`saca-${numero}-tamano`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAMANOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatearTamanoSaca(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`saca-${numero}-presinto`}>Presinto (opcional)</Label>
            <Input
              id={`saca-${numero}-presinto`}
              value={presinto}
              onChange={(e) => onPresintoChange(e.target.value)}
              placeholder="Lo genera el sistema"
              className="w-full"
            />
          </div>
        </div>

        {/* Acciones de copiado por saca */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyText(buildSacaCopyText(copyInput), `Saca ${numero} copiada`)}
            title="Copiar resumen completo de la saca"
          >
            <ClipboardList className="size-4" /> Copiar saca
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => copyText(buildSacaGuiasCopyText(copyInput), 'Guías copiadas')}
            title="Copiar las guías de la saca"
          >
            <ListOrdered className="size-4" /> Copiar guías
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => copyText(buildSacaDestinoCopyText(copyInput), 'Destino copiado')}
            title="Copiar los datos de destino de la saca"
          >
            <MapPin className="size-4" /> Copiar destino
          </Button>
        </div>
      </div>

      {/* Lista de paquetes */}
      <ul className="max-h-64 divide-y divide-border/40 overflow-y-auto">
        {paquetes.map((p, i) => (
          <li key={p.idPaquete ?? p.numeroGuia ?? i} className="px-3 py-2">
            <DespachoMasivoPackageRow paquete={p} index={i + 1} />
          </li>
        ))}
      </ul>
    </div>
  )
}
