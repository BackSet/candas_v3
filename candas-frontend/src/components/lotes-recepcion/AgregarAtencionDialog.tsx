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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateAtencionPaquete } from '@/hooks/useAtencionPaquetes'
import type { Paquete } from '@/types/paquete'
import { TipoProblemaAtencion, EstadoAtencion, TIPO_PROBLEMA_ATENCION_LABELS } from '@/types/atencion-paquete'

interface AgregarAtencionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paquete: Paquete
  onSuccess?: () => void
}

export default function AgregarAtencionDialog({
  open,
  onOpenChange,
  paquete,
  onSuccess,
}: AgregarAtencionDialogProps) {
  const [motivo, setMotivo] = useState('')
  const [tipoProblema, setTipoProblema] = useState<TipoProblemaAtencion>(TipoProblemaAtencion.OTRO)
  const createMutation = useCreateAtencionPaquete()

  // Resetear estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setMotivo('')
      setTipoProblema(TipoProblemaAtencion.OTRO)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!motivo.trim() || !paquete.idPaquete) {
      return
    }

    try {
      await createMutation.mutateAsync({
        idPaquete: paquete.idPaquete,
        motivo: motivo.trim(),
        tipoProblema,
        estado: EstadoAtencion.PENDIENTE,
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

  const tiposProblema = Object.values(TipoProblemaAtencion).map((value) => ({
    value,
    label: TIPO_PROBLEMA_ATENCION_LABELS[value],
  }))

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar a Atención</DialogTitle>
          <DialogDescription>
            Crear una solicitud de atención para el paquete {paquete.numeroGuia || `ID: ${paquete.idPaquete}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipoProblema">Tipo de Problema</Label>
            <Select value={tipoProblema} onValueChange={(value) => setTipoProblema(value as TipoProblemaAtencion)}>
              <SelectTrigger id="tipoProblema">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposProblema.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo de la solicitud de atención..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-[100px] resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              {motivo.length} caracteres
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!motivo.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Atención'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
