import React, { useState, useMemo, useEffect } from 'react'
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
import { useGruposPersonalizadosLocal } from '@/hooks/useGruposPersonalizadosLocal'
import type { Paquete } from '@/types/paquete'

interface MoverPaqueteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loteRecepcionId?: number
  paquete: Paquete
  ciudad: string
  canton: string
  onSuccess?: () => void
}

export default function MoverPaqueteDialog({
  open,
  onOpenChange,
  loteRecepcionId,
  paquete,
  ciudad,
  canton,
  onSuccess,
}: MoverPaqueteDialogProps) {
  const { moverPaqueteAGrupo, obtenerGruposPorCiudadCanton } = useGruposPersonalizadosLocal(loteRecepcionId)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('')
  
  const gruposExistentes = useMemo(() => obtenerGruposPorCiudadCanton(ciudad, canton), [obtenerGruposPorCiudadCanton, ciudad, canton])

  // Resetear estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setGrupoSeleccionado('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!grupoSeleccionado || !paquete.idPaquete) {
      return
    }

    try {
      moverPaqueteAGrupo(paquete.idPaquete, grupoSeleccionado, ciudad, canton)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error al mover paquete:', error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mover Paquete a Grupo</DialogTitle>
          <DialogDescription>
            Mover el paquete {paquete.numeroGuia || `ID: ${paquete.idPaquete}`} a un grupo en {ciudad} {'>'} {canton}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Grupo</Label>
            <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {gruposExistentes.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre} ({grupo.idPaquetes.length} paquetes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gruposExistentes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay grupos existentes en este cantón. Crea un grupo primero desde el toolbar.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!grupoSeleccionado || gruposExistentes.length === 0}
            >
              Mover a Grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
