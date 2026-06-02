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
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

export interface ResumenDestinoData {
  /** "Agencia" | "Destinatario directo" */
  tipoLabel: string
  nombre?: string | null
  nombreEmpresa?: string | null
  codigoDestino?: string | null
  telefono?: string | null
  direccion?: string | null
  /** Cantón / provincia. */
  ubicacion?: string | null
  pesoTotalKg: number
  totalSacas: number
  totalPaquetes: number
  /** Desglose de sacas por tamaño (solo tamaños con count > 0, ya ordenados). */
  sacasPorTamano?: { label: string; count: number }[]
}

function formatBreakdown(items?: { label: string; count: number }[]): string {
  if (!items || items.length === 0) return ''
  return items.map((s) => `${s.count} ${s.label}`).join(', ')
}

function val(v?: string | null): string | undefined {
  const t = v?.toString().trim()
  return t ? t : undefined
}

/** Construye un bloque de texto listo para pegar en plataformas del courier. */
export function buildCourierText(d: ResumenDestinoData): string {
  const lines: string[] = []
  if (val(d.nombre)) lines.push(`Destinatario: ${val(d.nombre)}`)
  if (val(d.nombreEmpresa)) lines.push(`Empresa: ${val(d.nombreEmpresa)}`)
  if (val(d.codigoDestino)) lines.push(`Código destino: ${val(d.codigoDestino)}`)
  if (val(d.telefono)) lines.push(`Teléfono: ${val(d.telefono)}`)
  if (val(d.direccion)) lines.push(`Dirección: ${val(d.direccion)}`)
  if (val(d.ubicacion)) lines.push(`Ciudad/Provincia: ${val(d.ubicacion)}`)
  lines.push(`Peso total: ${d.pesoTotalKg.toFixed(2)} kg`)
  lines.push(`Sacas: ${d.totalSacas}`)
  const breakdown = formatBreakdown(d.sacasPorTamano)
  if (breakdown) lines.push(`Sacas por tamaño: ${breakdown}`)
  lines.push(`Paquetes: ${d.totalPaquetes}`)
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
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-2xl font-bold tabular-nums select-all', accent && 'text-primary font-mono')}>
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

/**
 * Resumen del despacho con sus métricas clave (sacas, paquetes, peso, código de
 * destino) y los datos del destinatario, todos copiables individualmente y como
 * bloque de texto para pegar en plataformas del courier de distribución.
 */
export function ResumenDestinoDespacho({
  data,
  className,
}: {
  data: ResumenDestinoData
  className?: string
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
      {/* Métricas clave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={Boxes} label="Sacas" value={data.totalSacas} />
        <Metric icon={Package} label="Paquetes" value={data.totalPaquetes} />
        <Metric
          icon={Scale}
          label="Peso total"
          value={`${data.pesoTotalKg.toFixed(2)} kg`}
          copyText={`${data.pesoTotalKg.toFixed(2)} kg`}
        />
        {val(data.codigoDestino) ? (
          <Metric
            icon={Hash}
            label="Código destino"
            value={data.codigoDestino}
            copyText={data.codigoDestino ?? ''}
            accent
          />
        ) : (
          <Metric icon={Hash} label="Código destino" value={<span className="text-base text-muted-foreground">—</span>} />
        )}
      </div>

      {/* Desglose de sacas por tamaño */}
      {data.sacasPorTamano && data.sacasPorTamano.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Boxes className="h-3.5 w-3.5" />
            Sacas por tamaño
          </span>
          {data.sacasPorTamano.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
            >
              <span className="font-mono font-bold tabular-nums">{s.count}</span>
              {s.label}
            </span>
          ))}
          <CopyActionButton
            textToCopy={formatBreakdown(data.sacasPorTamano)}
            successMessage="Desglose copiado"
            errorMessage="No se pudo copiar el desglose"
            title="Copiar desglose de sacas"
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 shrink-0"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CopyActionButton>
        </div>
      ) : null}

      {/* Datos del destinatario (copiables para el courier) */}
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
