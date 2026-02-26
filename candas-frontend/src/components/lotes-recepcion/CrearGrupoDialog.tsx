import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'

interface CrearGrupoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loteRecepcionId: number
  paquetesSeleccionados: Paquete[]
  ciudad: string
  canton: string
  onSuccess?: () => void
}

export default function CrearGrupoDialog({
  open,
  onOpenChange,
  loteRecepcionId,
  paquetesSeleccionados,
  ciudad,
  canton,
  onSuccess,
}: CrearGrupoDialogProps) {
  const { crearGrupo, obtenerGruposPorCiudadCanton, agregarPaquetesAGrupo } = useGruposPersonalizadosLocal(loteRecepcionId)
  const [modo, setModo] = useState<'nuevo' | 'existente'>('nuevo')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('')
  
  // Generar nombre automático: Grupo 1, Grupo 2, etc.
  const gruposExistentes = useMemo(() => obtenerGruposPorCiudadCanton(ciudad, canton), [obtenerGruposPorCiudadCanton, ciudad, canton])
  const siguienteNumero = gruposExistentes.length + 1
  const nombreAutomatico = `Grupo ${siguienteNumero}`

  // Resetear estado cuando se abre el diálogo
  React.useEffect(() => {
    if (open) {
      setModo('nuevo')
      setGrupoSeleccionado('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (paquetesSeleccionados.length === 0) {
      return
    }

    const idPaquetes = paquetesSeleccionados
      .map(p => p.idPaquete)
      .filter((id): id is number => id !== undefined)

    try {
      if (modo === 'nuevo') {
        crearGrupo({
          nombre: nombreAutomatico,
          descripcion: undefined,
          idPaquetes,
          ciudad,
          canton,
        })
      } else {
        if (!grupoSeleccionado) {
          return
        }
        agregarPaquetesAGrupo(grupoSeleccionado, idPaquetes)
      }
      
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error al asignar grupo:', error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear {nombreAutomatico}</DialogTitle>
          <DialogDescription>
            Crear un grupo con {paquetesSeleccionados.length} paquete(s) seleccionado(s) en {ciudad} {'>'} {canton}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Acción</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={modo === 'nuevo' ? 'default' : 'outline'}
                onClick={() => setModo('nuevo')}
                className="flex-1"
              >
                Crear Nuevo Grupo
              </Button>
              <Button
                type="button"
                variant={modo === 'existente' ? 'default' : 'outline'}
                onClick={() => setModo('existente')}
                className="flex-1"
                disabled={gruposExistentes.length === 0}
              >
                Asignar a Grupo Existente
              </Button>
            </div>
          </div>

          {modo === 'nuevo' ? (
            <div className="space-y-2">
              <Label>Nombre del Grupo</Label>
              <Input
                value={nombreAutomatico}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                El nombre se genera automáticamente. Ya existen {gruposExistentes.length} grupo(s) en este cantón.
              </p>
            </div>
          ) : (
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
                  No hay grupos existentes en este cantón. Crea un nuevo grupo primero.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Paquetes Seleccionados ({paquetesSeleccionados.length})</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-muted/30">
              {paquetesSeleccionados.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay paquetes seleccionados</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {paquetesSeleccionados.map((paquete) => (
                    <Badge key={paquete.idPaquete} variant="secondary" className="font-mono text-xs">
                      {paquete.numeroGuia || `ID: ${paquete.idPaquete}`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
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
              disabled={paquetesSeleccionados.length === 0 || (modo === 'existente' && !grupoSeleccionado)}
            >
              {modo === 'nuevo' ? `Crear ${nombreAutomatico}` : 'Asignar a Grupo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
