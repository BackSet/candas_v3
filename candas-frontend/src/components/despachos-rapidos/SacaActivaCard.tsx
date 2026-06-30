import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DespachoRapidoSaca } from '@/types/despacho-rapido'
import { TamanoSaca } from '@/types/saca'
import { Check, Hash, Plus, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SacaActivaCardProps {
  saca: DespachoRapidoSaca | null
  onNuevaSaca: (tamano: TamanoSaca) => void
  onGuardarPresinto: (idSaca: number, codigoPresinto: string) => void
  creandoSaca: boolean
  guardandoPresinto: boolean
  disabled?: boolean
}

const TAMANO_LABEL: Record<TamanoSaca, string> = {
  [TamanoSaca.INDIVIDUAL]: 'Individual',
  [TamanoSaca.PEQUENO]: 'Pequeño',
  [TamanoSaca.MEDIANO]: 'Mediano',
  [TamanoSaca.GRANDE]: 'Grande',
}

/**
 * Saca activa del despacho rápido: muestra a qué saca se están agregando los paquetes,
 * permite ingresar/editar su presinto (el presinto pertenece a la saca) y crear una saca
 * nueva para "cambiar" la saca activa.
 */
export function SacaActivaCard({
  saca,
  onNuevaSaca,
  onGuardarPresinto,
  creandoSaca,
  guardandoPresinto,
  disabled = false,
}: SacaActivaCardProps) {
  const [presinto, setPresinto] = useState(saca?.codigoPresinto ?? '')
  const [tamano, setTamano] = useState<TamanoSaca>(TamanoSaca.MEDIANO)

  // Sincronizar el input cuando cambia la saca activa o su presinto.
  useEffect(() => {
    setPresinto(saca?.codigoPresinto ?? '')
  }, [saca?.idSaca, saca?.codigoPresinto])

  const presintoCambiado = saca != null && presinto.trim() !== (saca.codigoPresinto ?? '').trim()

  return (
    <div className="surface-panel space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Hash className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Saca activa
            </p>
            {saca ? (
              <p className="font-semibold leading-tight">
                Saca #{saca.numeroOrden}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {saca.tamano ? TAMANO_LABEL[saca.tamano] : ''} · {saca.paquetes.length} paq.
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Se creará al agregar el primer paquete</p>
            )}
            {saca?.codigoQr ? (
              <p className="font-mono text-[11px] text-muted-foreground">{saca.codigoQr}</p>
            ) : null}
          </div>
        </div>
      </div>

      {saca ? (
        <div className="space-y-1.5">
          <Label htmlFor="presintoSacaActiva" className="text-xs">
            Presinto de la saca
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ShieldCheck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="presintoSacaActiva"
                value={presinto}
                onChange={(e) => setPresinto(e.target.value)}
                placeholder="Código del presinto"
                className="h-11 pl-9 font-mono"
                autoComplete="off"
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0"
              disabled={disabled || guardandoPresinto || !presintoCambiado || !presinto.trim()}
              onClick={() => saca && onGuardarPresinto(saca.idSaca, presinto.trim())}
            >
              <Check className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-end gap-2 border-t border-border/30 pt-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tamaño nueva saca</Label>
          <Select value={tamano} onValueChange={(v) => setTamano(v as TamanoSaca)} disabled={disabled}>
            <SelectTrigger className="h-10 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TamanoSaca).map((t) => (
                <SelectItem key={t} value={t}>
                  {TAMANO_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-10 flex-1 gap-1.5"
          disabled={disabled || creandoSaca}
          onClick={() => onNuevaSaca(tamano)}
        >
          <Plus className="size-4" />
          {creandoSaca ? 'Creando…' : 'Nueva saca'}
        </Button>
      </div>
    </div>
  )
}
