import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCambiarTipoMasivo } from '@/hooks/usePaquetes'
import { TipoPaquete, type Paquete } from '@/types/paquete'

interface CambiarTipoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paquete: Paquete
  onSuccess?: () => void
}

export default function CambiarTipoDialog({
  open,
  onOpenChange,
  paquete,
  onSuccess,
}: CambiarTipoDialogProps) {
  const [nuevoTipo, setNuevoTipo] = useState<TipoPaquete | ''>('')
  const cambiarTipoMutation = useCambiarTipoMasivo()

  // Resetear estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setNuevoTipo(paquete.tipoPaquete || '')
    }
  }, [open, paquete.tipoPaquete])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nuevoTipo || !paquete.idPaquete) {
      return
    }

    // No hacer nada si el tipo no cambió
    if (nuevoTipo === paquete.tipoPaquete) {
      onOpenChange(false)
      return
    }

    try {
      await cambiarTipoMutation.mutateAsync({
        ids: [paquete.idPaquete],
        nuevoTipo: nuevoTipo as TipoPaquete,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const tiposDisponibles: TipoPaquete[] = [
    TipoPaquete.CLEMENTINA,
    TipoPaquete.SEPARAR,
    TipoPaquete.CADENITA,
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Tipo de Paquete</DialogTitle>
          <DialogDescription>
            Cambiar el tipo del paquete {paquete.numeroGuia || `ID: ${paquete.idPaquete}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo Actual</Label>
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
              {paquete.tipoPaquete || 'Sin asignar'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nuevo Tipo</Label>
            <Select value={nuevoTipo} onValueChange={(value) => setNuevoTipo(value as TipoPaquete)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposDisponibles.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={cambiarTipoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!nuevoTipo || nuevoTipo === paquete.tipoPaquete || cambiarTipoMutation.isPending}
            >
              {cambiarTipoMutation.isPending ? 'Cambiando...' : 'Cambiar Tipo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
