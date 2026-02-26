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
import { Badge } from '@/components/ui/badge'

interface CambiarTipoMasivoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paquetes: Paquete[]
  onSuccess?: () => void
}

export default function CambiarTipoMasivoDialog({
  open,
  onOpenChange,
  paquetes,
  onSuccess,
}: CambiarTipoMasivoDialogProps) {
  const [nuevoTipo, setNuevoTipo] = useState<TipoPaquete | ''>('')
  const cambiarTipoMutation = useCambiarTipoMasivo()

  // Resetear estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setNuevoTipo('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nuevoTipo) {
      return
    }

    const ids = paquetes
      .map(p => p.idPaquete)
      .filter((id): id is number => id !== undefined)

    if (ids.length === 0) {
      return
    }

    try {
      await cambiarTipoMutation.mutateAsync({
        ids,
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

  // Agrupar paquetes por tipo actual
  const paquetesPorTipo = paquetes.reduce((acc, paquete) => {
    const tipo = paquete.tipoPaquete || 'Sin asignar'
    if (!acc[tipo]) {
      acc[tipo] = []
    }
    acc[tipo].push(paquete)
    return acc
  }, {} as Record<string, Paquete[]>)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Tipo de Paquetes</DialogTitle>
          <DialogDescription>
            Cambiar el tipo de {paquetes.length} paquete{paquetes.length !== 1 ? 's' : ''} seleccionado{paquetes.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipos Actuales</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(paquetesPorTipo).map(([tipo, paquetesTipo]) => (
                <div key={tipo} className="flex items-center justify-between text-sm bg-muted/30 px-3 py-2 rounded-md">
                  <span className="text-muted-foreground">{tipo}</span>
                  <Badge variant="secondary">{paquetesTipo.length}</Badge>
                </div>
              ))}
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
              disabled={!nuevoTipo || cambiarTipoMutation.isPending}
            >
              {cambiarTipoMutation.isPending ? 'Cambiando...' : `Cambiar Tipo (${paquetes.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
