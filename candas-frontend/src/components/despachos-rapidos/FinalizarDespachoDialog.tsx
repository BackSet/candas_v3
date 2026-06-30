import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormError } from '@/components/ui/form-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDistribuidoresOptions } from '@/hooks/useDespachoRapido'
import type { DespachoRapido, FinalizarDespachoRapidoPayload } from '@/types/despacho-rapido'
import { useEffect, useState } from 'react'
import { DespachoRapidoResumenCopiable } from './DespachoRapidoResumenCopiable'

interface FinalizarDespachoDialogProps {
  despacho: DespachoRapido | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: FinalizarDespachoRapidoPayload) => void
  guardando: boolean
}

/**
 * Diálogo para que el operario en escritorio finalice un despacho rápido LISTO_PARA_GUIA:
 * ingresa el distribuidor (si falta) y el número de guía del distribuidor externo
 * (`numeroGuiaAgenciaDistribucion`). No toca paquetes ni sacas.
 */
export function FinalizarDespachoDialog({
  despacho,
  open,
  onOpenChange,
  onConfirm,
  guardando,
}: FinalizarDespachoDialogProps) {
  const [idDistribuidor, setIdDistribuidor] = useState<number | undefined>(undefined)
  const [numeroGuia, setNumeroGuia] = useState('')
  const [errorGuia, setErrorGuia] = useState<string | null>(null)

  const { data: distribuidores = [] } = useDistribuidoresOptions()

  useEffect(() => {
    if (open && despacho) {
      setIdDistribuidor(despacho.idDistribuidor)
      setNumeroGuia(despacho.numeroGuiaAgenciaDistribucion ?? '')
      setErrorGuia(null)
    }
  }, [open, despacho])

  const handleConfirm = () => {
    const guia = numeroGuia.trim()
    if (!guia) {
      setErrorGuia('El número de guía del distribuidor es obligatorio')
      return
    }
    onConfirm({ numeroGuiaAgenciaDistribucion: guia, idDistribuidor })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl">Finalizar despacho</DialogTitle>
          <DialogDescription>
            {despacho?.numeroManifiesto ?? 'Despacho'} · Copia los datos del despacho para crear la guía en el sistema externo y regístrala para finalizar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
          {/* Columna Izquierda: Datos del despacho a copiar */}
          <div className="lg:col-span-7 space-y-4">
            {despacho ? (
              <DespachoRapidoResumenCopiable despacho={despacho} />
            ) : null}
          </div>

          {/* Columna Derecha: Formulario de finalización */}
          <div className="lg:col-span-5 space-y-6 rounded-xl border border-border/60 bg-muted/10 p-5">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Registro de Guía Externa</h3>

              <div className="space-y-2">
                <Label htmlFor="finalizarDistribuidor" className="text-xs font-medium text-muted-foreground">Distribuidor</Label>
                <Select
                  value={idDistribuidor != null ? String(idDistribuidor) : undefined}
                  onValueChange={(v) => setIdDistribuidor(Number(v))}
                >
                  <SelectTrigger id="finalizarDistribuidor" className="h-10">
                    <SelectValue placeholder="Seleccionar distribuidor (opcional)" />
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

              <div className="space-y-2">
                <Label htmlFor="finalizarNumeroGuia" className="text-xs font-medium text-muted-foreground">Guía del distribuidor</Label>
                <Input
                  id="finalizarNumeroGuia"
                  value={numeroGuia}
                  onChange={(e) => {
                    setNumeroGuia(e.target.value)
                    if (errorGuia) setErrorGuia(null)
                  }}
                  placeholder="Número de guía externa"
                  className="h-10 font-mono"
                  autoComplete="off"
                />
                <FormError message={errorGuia ?? undefined} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={guardando}>
                {guardando ? 'Finalizando…' : 'Finalizar despacho'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
