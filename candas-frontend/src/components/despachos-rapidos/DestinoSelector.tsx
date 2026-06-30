import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgencias } from '@/hooks/useAgencias'
import { useDestinatariosDirectosAll } from '@/hooks/useDestinatariosDirectos'
import { useDistribuidoresOptions } from '@/hooks/useDespachoRapido'
import { cn } from '@/lib/utils'
import type { Agencia } from '@/types/agencia'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'
import type { ActualizarDestinoDespachoRapidoPayload, DespachoRapido } from '@/types/despacho-rapido'
import { Building2, MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type TipoDestino = 'AGENCIA' | 'DIRECTO'

interface DestinoSelectorProps {
  despacho: DespachoRapido
  onGuardar: (payload: ActualizarDestinoDespachoRapidoPayload) => void
  guardando: boolean
  disabled?: boolean
}

/**
 * Selector de destino del despacho rápido: agencia o destinatario directo (excluyentes),
 * con distribuidor opcional. El destino es obligatorio antes de marcar LISTO_PARA_GUIA.
 */
export function DestinoSelector({ despacho, onGuardar, guardando, disabled = false }: DestinoSelectorProps) {
  const [tipo, setTipo] = useState<TipoDestino>(despacho.idDestinatarioDirecto ? 'DIRECTO' : 'AGENCIA')
  const [idAgencia, setIdAgencia] = useState<number | undefined>(despacho.idAgencia)
  const [idDestinatario, setIdDestinatario] = useState<number | undefined>(despacho.idDestinatarioDirecto)
  const [idDistribuidor, setIdDistribuidor] = useState<number | undefined>(despacho.idDistribuidor)

  const { data: agenciasData } = useAgencias({ page: 0, size: 200, activa: true })
  const { data: destinatariosData = [] } = useDestinatariosDirectosAll()
  const { data: distribuidores = [] } = useDistribuidoresOptions()

  useEffect(() => {
    setTipo(despacho.idDestinatarioDirecto ? 'DIRECTO' : 'AGENCIA')
    setIdAgencia(despacho.idAgencia)
    setIdDestinatario(despacho.idDestinatarioDirecto)
    setIdDistribuidor(despacho.idDistribuidor)
  }, [despacho.idAgencia, despacho.idDestinatarioDirecto, despacho.idDistribuidor])

  const agencias = useMemo<ComboboxOption<Agencia>[]>(() => {
    return (agenciasData?.content ?? [])
      .filter((agencia) => agencia.activa !== false && agencia.idAgencia != null)
      .map((agencia) => ({
        value: agencia.idAgencia!,
        label: agencia.nombre,
        description: buildDescription(agencia.codigo, agencia.canton, agencia.provincia, agencia.direccion),
        data: agencia,
      }))
  }, [agenciasData])

  const destinatarios = useMemo<ComboboxOption<DestinatarioDirecto>[]>(() => {
    return destinatariosData
      .filter((destinatario) => destinatario.activo !== false && destinatario.idDestinatarioDirecto != null)
      .map((destinatario) => ({
        value: destinatario.idDestinatarioDirecto!,
        label: destinatario.nombreDestinatario,
        description: buildDescription(
          destinatario.codigo,
          destinatario.canton,
          destinatario.provincia,
          destinatario.direccionDestinatario,
          destinatario.telefonoDestinatario
        ),
        data: destinatario,
      }))
  }, [destinatariosData])

  const destinoListo = tipo === 'AGENCIA' ? idAgencia != null : idDestinatario != null

  const handleGuardar = () => {
    const payload: ActualizarDestinoDespachoRapidoPayload = { idDistribuidor }
    if (tipo === 'AGENCIA') payload.idAgencia = idAgencia
    else payload.idDestinatarioDirecto = idDestinatario
    onGuardar(payload)
  }

  return (
    <div className="surface-panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Destino</h3>
        {despacho.nombreAgencia || despacho.nombreDestinatarioDirecto ? (
          <span className="truncate text-xs text-muted-foreground">
            Actual: {despacho.nombreAgencia ?? despacho.nombreDestinatarioDirecto}
          </span>
        ) : (
          <span className="text-xs text-warning">Sin destino</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TipoButton
          active={tipo === 'AGENCIA'}
          icon={Building2}
          label="Agencia"
          onClick={() => setTipo('AGENCIA')}
          disabled={disabled}
        />
        <TipoButton
          active={tipo === 'DIRECTO'}
          icon={MapPin}
          label="Destinatario"
          onClick={() => setTipo('DIRECTO')}
          disabled={disabled}
        />
      </div>

      {tipo === 'AGENCIA' ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Agencia destino</Label>
          <Combobox
            options={agencias}
            value={idAgencia ?? null}
            onValueChange={(v) => setIdAgencia(v != null ? Number(v) : undefined)}
            placeholder="Buscar agencia"
            searchPlaceholder="Nombre, codigo o canton"
            emptyMessage="No se encontraron agencias"
            triggerClassName="h-11"
            disabled={disabled}
            clearable
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">Destinatario directo</Label>
          <Combobox
            options={destinatarios}
            value={idDestinatario ?? null}
            onValueChange={(v) => setIdDestinatario(v != null ? Number(v) : undefined)}
            placeholder="Buscar destinatario"
            searchPlaceholder="Nombre, canton, direccion o telefono"
            emptyMessage="No se encontraron destinatarios"
            triggerClassName="h-11"
            disabled={disabled}
            clearable
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Distribuidor (opcional)</Label>
        <Select
          value={idDistribuidor != null ? String(idDistribuidor) : undefined}
          onValueChange={(v) => setIdDistribuidor(Number(v))}
          disabled={disabled}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Seleccionar distribuidor" />
          </SelectTrigger>
          <SelectContent>
            {distribuidores.map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        onClick={handleGuardar}
        disabled={disabled || guardando || !destinoListo}
        className="w-full"
      >
        {guardando ? 'Guardando…' : 'Guardar destino'}
      </Button>
    </div>
  )
}

function buildDescription(...values: Array<string | undefined | null>): string | undefined {
  const parts = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
  return parts.length > 0 ? parts.join(' • ') : undefined
}

function TipoButton({
  active,
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  active: boolean
  icon: typeof Building2
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50',
        active
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-border/50 text-muted-foreground hover:border-border'
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}
