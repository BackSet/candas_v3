import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HelpTip } from '@/components/ui/help-tip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SacaFormData } from '@/hooks/useSacasManager'
import { TamanoSaca } from '@/types/saca'
import { Check, CircleAlert, Plus, ShieldQuestion, Sparkles, Trash2, Zap } from 'lucide-react'
import { PaqueteSacaListItem } from './PaqueteSacaListItem'

export interface SacaReviewCardProps {
  saca: SacaFormData
  index: number
  sacas: SacaFormData[]
  onTamanoChange: (index: number, tamano: TamanoSaca) => void
  onPresintoChange: (index: number, value: string) => void
  onGenerarPresinto: (index: number) => void
  onAgregarPaquetes: (index: number) => void
  onPaqueteRapido: (index: number) => void
  onEliminarSaca: (index: number) => void
  onMoverPaquete: (paqueteId: number, sacaOrigenIndex: number, sacaDestinoIndex: number) => void
  onEliminarPaquete: (sacaIndex: number, paqueteId: number) => void
}

/** Card de revisión de una saca: tamaño, presinto, acciones de paquetes y lista de paquetes. */
export function SacaReviewCard({
  saca,
  index,
  sacas,
  onTamanoChange,
  onPresintoChange,
  onGenerarPresinto,
  onAgregarPaquetes,
  onPaqueteRapido,
  onEliminarSaca,
  onMoverPaquete,
  onEliminarPaquete,
}: SacaReviewCardProps) {
  const sinPaquetes = saca.idPaquetes.length === 0
  const sinPresinto = !saca.codigoPresinto?.trim()
  const estado: 'sinPaquetes' | 'pendientePresinto' | 'completa' =
    sinPaquetes ? 'sinPaquetes' : sinPresinto ? 'pendientePresinto' : 'completa'

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      <div className="p-3 sm:p-4 bg-muted/30 flex items-center justify-between border-b border-border/50 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="bg-background font-semibold">Saca {index + 1}</Badge>
          {estado === 'completa' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <Check className="h-3 w-3" /> Completa
            </span>
          )}
          {estado === 'sinPaquetes' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[11px] font-medium text-error">
              <CircleAlert className="h-3 w-3" /> Sin paquetes
            </span>
          )}
          {estado === 'pendientePresinto' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
              <ShieldQuestion className="h-3 w-3" /> Pendiente de presinto
            </span>
          )}
          <Select value={saca.tamano} onValueChange={(v: TamanoSaca) => onTamanoChange(index, v)}>
            <SelectTrigger className="h-9 w-36 text-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="PEQUENO">Pequeño</SelectItem>
              <SelectItem value="MEDIANO">Mediano</SelectItem>
              <SelectItem value="GRANDE">Grande</SelectItem>
            </SelectContent>
          </Select>
          <HelpTip>Capacidad de la saca por peso: Individual ≤5 kg · Pequeño ≤15 kg · Mediano ≤30 kg · Grande ≤50 kg.</HelpTip>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-error shrink-0" onClick={() => onEliminarSaca(index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium text-muted-foreground">{saca.idPaquetes.length} paquete(s)</span>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onAgregarPaquetes(index)}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar paquetes
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onPaqueteRapido(index)} title="Crear paquete SEPARAR rápido">
              <Zap className="h-4 w-4 mr-1.5" /> Paquete Rápido
            </Button>
          </div>
        </div>

        {saca.idPaquetes.length > 0 && (
          <div className="space-y-2 overflow-x-hidden">
            {saca.idPaquetes.map(pid => (
              <PaqueteSacaListItem
                key={pid}
                paqueteId={pid}
                index={index}
                sacas={sacas}
                onMover={onMoverPaquete}
                onEliminar={onEliminarPaquete}
              />
            ))}
          </div>
        )}

        {/* Presinto: dato compacto de cierre de la saca */}
        <div className="flex items-center gap-2 flex-wrap border-t border-border/50 pt-3">
          <Label htmlFor={`saca-presinto-${index}`} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
            Presinto
            <HelpTip>Sello/precinto físico que cierra esta saca. Déjalo vacío para que el sistema lo genere. Se imprime en la etiqueta.</HelpTip>
          </Label>
          <Input
            id={`saca-presinto-${index}`}
            value={saca.codigoPresinto ?? ''}
            onChange={(e) => onPresintoChange(index, e.target.value)}
            maxLength={64}
            placeholder="Opcional · se genera al guardar"
            className="font-mono flex-1 min-w-[140px] h-8 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 h-8"
            onClick={() => onGenerarPresinto(index)}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Generar
          </Button>
        </div>
      </div>
    </div>
  )
}
