import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCambiarEstadoPaquete } from '@/hooks/usePaquetes'
import { EstadoPaquete } from '@/types/paquete'
import { useState } from 'react'
import { ClipboardList } from 'lucide-react'

interface CambiarEstadoDialogProps {
  paqueteId: number
  estadoActual: EstadoPaquete
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CambiarEstadoDialog({
  paqueteId,
  estadoActual,
  open,
  onOpenChange,
}: CambiarEstadoDialogProps) {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPaquete>(estadoActual)
  const cambiarEstadoMutation = useCambiarEstadoPaquete()

  const handleSubmit = async () => {
    if (nuevoEstado === estadoActual) {
      onOpenChange(false)
      return
    }

    try {
      await cambiarEstadoMutation.mutateAsync({
        id: paqueteId,
        nuevoEstado,
      })
      onOpenChange(false)
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground">
              <ClipboardList className="h-4 w-4" />
            </div>
            Cambiar Estado
          </DialogTitle>
          <DialogDescription>
            Actualiza el estado actual del paquete.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5 p-3 rounded-md bg-muted/30 border border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado Actual</span>
            <span className="font-semibold text-sm">{estadoActual}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nuevo Estado</label>
            <Select
              value={nuevoEstado}
              onValueChange={(value) => setNuevoEstado(value as EstadoPaquete)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EstadoPaquete).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={cambiarEstadoMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={cambiarEstadoMutation.isPending || nuevoEstado === estadoActual}>
            {cambiarEstadoMutation.isPending ? 'Guardando...' : 'Confirmar Cambio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
