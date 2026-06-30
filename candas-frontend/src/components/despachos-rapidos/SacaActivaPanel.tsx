import { Badge } from '@/components/ui/badge'
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
import { formatearTamanoSaca } from '@/utils/ensacado'
import { capacidadMaximaKg } from '@/utils/saca'
import { Check, PackagePlus, Scale, ShieldCheck } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'

interface SacaActivaPanelProps {
  saca: DespachoRapidoSaca | null
  tamanoSugerido: TamanoSaca
  onNuevaSaca: (tamano: TamanoSaca) => void
  onGuardarPresinto: (idSaca: number, codigoPresinto: string) => void
  creandoSaca: boolean
  guardandoPresinto: boolean
  disabled?: boolean
}

const TAMANOS = [
  TamanoSaca.INDIVIDUAL,
  TamanoSaca.PEQUENO,
  TamanoSaca.MEDIANO,
  TamanoSaca.GRANDE,
]

function formatPeso(value: number): string {
  return `${value.toFixed(2)} kg`
}

export function SacaActivaPanel({
  saca,
  tamanoSugerido,
  onNuevaSaca,
  onGuardarPresinto,
  creandoSaca,
  guardandoPresinto,
  disabled = false,
}: SacaActivaPanelProps) {
  const [presinto, setPresinto] = useState(saca?.codigoPresinto ?? '')
  const [tamanoNuevaSaca, setTamanoNuevaSaca] = useState<TamanoSaca>(tamanoSugerido)
  const [tamanoEditadoManual, setTamanoEditadoManual] = useState(false)

  const pesoTotal = useMemo(
    () =>
      (saca?.paquetes ?? []).reduce((total, paquete) => {
        const peso = paquete.pesoKilos == null ? 0 : Number(paquete.pesoKilos)
        return Number.isFinite(peso) ? total + peso : total
      }, 0),
    [saca?.paquetes]
  )
  const capacidadActiva = saca?.tamano ? capacidadMaximaKg(saca.tamano) : null
  const capacidadNueva = capacidadMaximaKg(tamanoNuevaSaca)
  const presintoCambiado = saca != null && presinto.trim() !== (saca.codigoPresinto ?? '').trim()

  useEffect(() => {
    setPresinto(saca?.codigoPresinto ?? '')
    setTamanoEditadoManual(false)
  }, [saca?.idSaca, saca?.codigoPresinto])

  useEffect(() => {
    if (!tamanoEditadoManual) setTamanoNuevaSaca(tamanoSugerido)
  }, [tamanoSugerido, tamanoEditadoManual])

  const handleCrearSaca = () => {
    onNuevaSaca(tamanoNuevaSaca)
    setTamanoEditadoManual(false)
  }

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b border-border/40 bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Saca activa
            </p>
            {saca ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold leading-tight text-foreground">Saca #{saca.numeroOrden}</h3>
                {saca.tamano ? <Badge variant="secondary">{formatearTamanoSaca(saca.tamano)}</Badge> : null}
              </div>
            ) : (
              <h3 className="mt-1 text-base font-semibold text-foreground">Lista para crear al capturar</h3>
            )}
          </div>
          <Badge variant={saca ? 'info' : 'secondary'} className="shrink-0">
            {saca ? `${saca.paquetes.length} paq.` : 'Sin saca'}
          </Badge>
        </div>

        {saca ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Peso" value={pesoTotal > 0 ? formatPeso(pesoTotal) : 'Sin peso'} icon={<Scale className="size-4" />} />
            <Stat
              label="Capacidad"
              value={capacidadActiva != null ? `${capacidadActiva} kg` : 'Pendiente'}
              icon={<PackagePlus className="size-4" />}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Si no hay saca activa, el primer paquete crea una saca automaticamente.
          </p>
        )}

        {saca?.codigoQr ? <p className="mt-3 font-mono text-[11px] text-muted-foreground">{saca.codigoQr}</p> : null}
      </div>

      <div className="space-y-4 p-4">
        {saca ? (
          <div className="space-y-2">
            <Label htmlFor="presintoSacaActiva" className="text-xs">
              Presinto
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ShieldCheck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="presintoSacaActiva"
                  value={presinto}
                  onChange={(e) => setPresinto(e.target.value)}
                  placeholder="Codigo del presinto"
                  className="h-11 pl-9 font-mono"
                  autoComplete="off"
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                disabled={disabled || guardandoPresinto || !presintoCambiado || !presinto.trim()}
                onClick={() => saca && onGuardarPresinto(saca.idSaca, presinto.trim())}
                title="Guardar presinto"
                aria-label="Guardar presinto"
              >
                <Check className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Nueva saca
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sugerido: {formatearTamanoSaca(tamanoSugerido)}. Puedes cambiarlo antes de crear.
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 bg-background">
              {capacidadNueva} kg
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <Select
              value={tamanoNuevaSaca}
              onValueChange={(value) => {
                setTamanoNuevaSaca(value as TamanoSaca)
                setTamanoEditadoManual(true)
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-11 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAMANOS.map((tamano) => (
                  <SelectItem key={tamano} value={tamano}>
                    {formatearTamanoSaca(tamano)} - {capacidadMaximaKg(tamano)} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              className="h-11 gap-1.5 px-3"
              disabled={disabled || creandoSaca}
              onClick={handleCrearSaca}
            >
              <PackagePlus className="size-4" />
              {creandoSaca ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/70 p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
