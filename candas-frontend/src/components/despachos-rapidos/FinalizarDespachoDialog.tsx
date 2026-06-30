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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar despacho</DialogTitle>
          <DialogDescription>
            {despacho?.numeroManifiesto ?? 'Despacho'} · Ingresa la guía que asignó el distribuidor
            para cerrarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finalizarDistribuidor">Distribuidor</Label>
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
            <Label htmlFor="finalizarNumeroGuia">Guía del distribuidor</Label>
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={guardando}>
            {guardando ? 'Finalizando…' : 'Finalizar despacho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
