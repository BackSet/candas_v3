import { Button } from '@/components/ui/button'
import { CopyActionButton } from '@/components/ui/copy-action-button'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { copyTextToClipboard } from '@/utils/clipboard'
import {
  Boxes,
  Building2,
  ClipboardCopy,
  Copy,
  Hash,
  MapPin,
  Package,
  Phone,
  Scale,
  User,
  Weight,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

export interface ResumenSacaDetalle {
  numeroOrden: number
  tamanoLabel: string
  capacidadKg: number
  pesoKg: number
  totalPaquetes: number
  paquetes: {
    idPaquete: number
    numeroGuia: string
    pesoKg: number
  }[]
}

export interface ResumenDestinoData {
  tipoLabel: string
  nombre?: string | null
  nombreEmpresa?: string | null
  codigoDestino?: string | null
  telefono?: string | null
  direccion?: string | null
  ubicacion?: string | null
  pesoTotalKg: number
  totalSacas: number
  totalPaquetes: number
  sacasPorTamano?: { label: string; count: number }[]
  sacasDetalle?: ResumenSacaDetalle[]
}

function formatKg(value: number): string {
  return `${value.toFixed(2)} kg`
}

function formatBreakdown(items?: { label: string; count: number }[]): string {
  if (!items || items.length === 0) return ''
  return items.map((s) => `${s.count} ${s.label}`).join(', ')
}

function val(v?: string | null): string | undefined {
  const t = v?.toString().trim()
  return t ? t : undefined
}

function buildSacaText(saca: ResumenSacaDetalle): string {
  return [
    `Saca ${saca.numeroOrden}`,
    `Tamaño: ${saca.tamanoLabel}`,
    `Peso: ${formatKg(saca.pesoKg)}`,
  ].filter(Boolean).join(' | ')
}

function buildPesoSacasText(sacas: ResumenSacaDetalle[]): string {
  const total = sacas.reduce((acc, saca) => acc + saca.pesoKg, 0)
  return [
    ...sacas.map(buildSacaText),
    `Total sacas: ${formatKg(total)}`,
  ].join('\n')
}

export function buildCourierText(d: ResumenDestinoData): string {
  const lines: string[] = []
  if (val(d.nombre)) lines.push(`Destinatario: ${val(d.nombre)}`)
  if (val(d.nombreEmpresa)) lines.push(`Empresa: ${val(d.nombreEmpresa)}`)
  if (val(d.codigoDestino)) lines.push(`Código destino: ${val(d.codigoDestino)}`)
  if (val(d.telefono)) lines.push(`Teléfono: ${val(d.telefono)}`)
  if (val(d.direccion)) lines.push(`Dirección: ${val(d.direccion)}`)
  if (val(d.ubicacion)) lines.push(`Ciudad/Provincia: ${val(d.ubicacion)}`)
  lines.push(`Peso total: ${formatKg(d.pesoTotalKg)}`)
  lines.push(`Sacas: ${d.totalSacas}`)
  const breakdown = formatBreakdown(d.sacasPorTamano)
  if (breakdown) lines.push(`Sacas por tamaño: ${breakdown}`)
  lines.push(`Paquetes: ${d.totalPaquetes}`)

  if (d.sacasDetalle?.length) {
    lines.push('')
    lines.push('Detalle de sacas:')
    d.sacasDetalle.forEach((saca) => lines.push(buildSacaText(saca)))
  }

  return lines.join('\n')
}

function Metric({
  icon: Icon,
  label,
  value,
  copyText,
  accent,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  copyText?: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 rounded-xl border bg-background p-3.5 shadow-sm',
        accent ? 'border-primary/30 bg-primary/5' : 'border-border'
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-2 min-w-0 w-full">
        <span
          className={cn(
            'text-xl sm:text-2xl font-bold tabular-nums select-all break-all whitespace-normal min-w-0 flex-1',
            accent && 'text-lg lg:text-xl text-primary font-mono'
          )}
          title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
        >
          {value}
        </span>
        {copyText ? (
          <CopyActionButton
            textToCopy={copyText}
            successMessage={`${label} copiado`}
            errorMessage={`No se pudo copiar ${label.toLowerCase()}`}
            title={`Copiar ${label.toLowerCase()}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CopyActionButton>
        ) : null}
      </div>
    </div>
  )
}

function CopyField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value?: string | null
  mono?: boolean
}) {
  const v = val(value)
  if (!v) return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn('truncate text-sm font-medium text-foreground select-all', mono && 'font-mono')} title={v}>
          {v}
        </p>
      </div>
      <CopyActionButton
        textToCopy={v}
        successMessage={`${label} copiado`}
        errorMessage={`No se pudo copiar ${label.toLowerCase()}`}
        title={`Copiar ${label.toLowerCase()}`}
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
      >
        <Copy className="h-4 w-4 text-muted-foreground" />
      </CopyActionButton>
    </div>
  )
}

function PesosPorSaca({ sacas }: { sacas: ResumenSacaDetalle[] }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Weight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Sacas para courier</span>
        </div>
        <CopyActionButton
          textToCopy={buildPesoSacasText(sacas)}
          successMessage="Detalle de pesos copiado"
          errorMessage="No se pudo copiar el detalle de pesos"
          title="Copiar detalle de sacas"
          size="sm"
          className="h-8 gap-1.5"
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Copiar sacas
        </CopyActionButton>
      </div>

      <div className="space-y-3">
        {sacas.map((saca) => {
          return (
            <div key={saca.numeroOrden} className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">Saca {saca.numeroOrden}</span>
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium">
                      {saca.tamanoLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">{saca.totalPaquetes} paquete(s)</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <CopyActionButton
                      textToCopy={saca.tamanoLabel}
                      successMessage="Tamaño copiado"
                      title="Copiar tamaño"
                      variant="secondary"
                      size="sm"
                      className="h-7"
                    >
                      Tamaño: {saca.tamanoLabel}
                    </CopyActionButton>
                    <CopyActionButton
                      textToCopy={formatKg(saca.pesoKg)}
                      successMessage="Peso de saca copiado"
                      title="Copiar peso de saca"
                      variant="secondary"
                      size="sm"
                      className="h-7"
                    >
                      Peso: {formatKg(saca.pesoKg)}
                    </CopyActionButton>
                  </div>
                </div>
                <CopyActionButton
                  textToCopy={buildSacaText(saca)}
                  successMessage={`Saca ${saca.numeroOrden} copiada`}
                  errorMessage="No se pudo copiar la saca"
                  title={`Copiar saca ${saca.numeroOrden}`}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </CopyActionButton>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ResumenDestinoDespacho({
  data,
  className,
  columns = 'grid-cols-2 lg:grid-cols-4',
}: {
  data: ResumenDestinoData
  className?: string
  columns?: string
}) {
  const hayDestinatario =
    !!val(data.nombre) ||
    !!val(data.nombreEmpresa) ||
    !!val(data.telefono) ||
    !!val(data.direccion) ||
    !!val(data.ubicacion) ||
    !!val(data.codigoDestino)

  const handleCopiarTodo = async () => {
    const ok = await copyTextToClipboard(buildCourierText(data))
    if (ok) notify.success('Datos del despacho copiados')
    else notify.error('No se pudieron copiar los datos')
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className={cn('grid gap-3', columns)}>
        <Metric icon={Boxes} label="Sacas" value={data.totalSacas} copyText={String(data.totalSacas)} />
        <Metric icon={Package} label="Paquetes" value={data.totalPaquetes} copyText={String(data.totalPaquetes)} />
        <Metric icon={Scale} label="Peso total" value={formatKg(data.pesoTotalKg)} copyText={formatKg(data.pesoTotalKg)} />
        {val(data.codigoDestino) ? (
          <Metric
            icon={Hash}
            label="Código destino"
            value={data.codigoDestino}
            copyText={data.codigoDestino ?? ''}
            accent
          />
        ) : (
          <Metric icon={Hash} label="Código destino" value={<span className="text-base text-muted-foreground">-</span>} />
        )}
      </div>

      {data.sacasDetalle && data.sacasDetalle.length > 0 ? <PesosPorSaca sacas={data.sacasDetalle} /> : null}

      {hayDestinatario ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Datos del destinatario</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {data.tipoLabel}
              </span>
            </div>
            <Button type="button" size="sm" onClick={handleCopiarTodo} className="h-8 gap-1.5">
              <ClipboardCopy className="h-3.5 w-3.5" />
              Copiar para el courier
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <CopyField icon={User} label="Destinatario" value={data.nombre} />
            <CopyField icon={Building2} label="Empresa" value={data.nombreEmpresa} />
            <CopyField icon={Phone} label="Teléfono" value={data.telefono} mono />
            <CopyField icon={Hash} label="Código destino" value={data.codigoDestino} mono />
            <CopyField icon={MapPin} label="Dirección" value={data.direccion} />
            <CopyField icon={MapPin} label="Ciudad / Provincia" value={data.ubicacion} />
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Selecciona un destino para ver y copiar los datos del destinatario.
        </p>
      )}
    </div>
  )
}
