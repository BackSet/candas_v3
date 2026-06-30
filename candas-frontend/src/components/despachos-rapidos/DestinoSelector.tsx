import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgencias } from '@/hooks/useSelectOptions'
import { useDestinatariosDirectosOptions, useDistribuidoresOptions } from '@/hooks/useDespachoRapido'
import { cn } from '@/lib/utils'
import type { ActualizarDestinoDespachoRapidoPayload, DespachoRapido } from '@/types/despacho-rapido'
import { Building2, MapPin } from 'lucide-react'
import { useState } from 'react'

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

  const { data: agencias = [] } = useAgencias()
  const { data: destinatarios = [] } = useDestinatariosDirectosOptions()
  const { data: distribuidores = [] } = useDistribuidoresOptions()

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
          <Select
            value={idAgencia != null ? String(idAgencia) : undefined}
            onValueChange={(v) => setIdAgencia(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              {agencias.map((a) => (
                <SelectItem key={a.value} value={String(a.value)}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">Destinatario directo</Label>
          <Select
            value={idDestinatario != null ? String(idDestinatario) : undefined}
            onValueChange={(v) => setIdDestinatario(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar destinatario" />
            </SelectTrigger>
            <SelectContent>
              {destinatarios.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
