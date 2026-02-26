import { useState } from 'react'
import { useResolverAtencionPaquete, useUpdateAtencionPaquete, useAtencionPaquete } from '@/hooks/useAtencionPaquetes'
import { EstadoAtencion } from '@/types/atencion-paquete'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Edit } from 'lucide-react'

interface ResolverDialogProps {
  atencionId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si true, muestra selector de estado (para edición desde lista). Si false, resuelve directamente. */
  allowEstadoChange?: boolean
}

export default function ResolverDialog({
  atencionId,
  open,
  onOpenChange,
  allowEstadoChange = false,
}: ResolverDialogProps) {
  const [observaciones, setObservaciones] = useState('')
  const [estado, setEstado] = useState<EstadoAtencion>(EstadoAtencion.RESUELTO)
  const { data: atencion } = useAtencionPaquete(open ? atencionId : undefined)
  const resolverMutation = useResolverAtencionPaquete()
  const updateMutation = useUpdateAtencionPaquete()

  const isPending = resolverMutation.isPending || updateMutation.isPending

  const handleSubmit = async () => {
    try {
      if (allowEstadoChange && atencion) {
        await updateMutation.mutateAsync({
          id: atencionId,
          dto: {
            ...atencion,
            observacionesResolucion: observaciones,
            estado,
          },
        })
      } else {
        await resolverMutation.mutateAsync({
          id: atencionId,
          observacionesResolucion: observaciones,
        })
      }
      setObservaciones('')
      onOpenChange(false)
    } catch {
      // Handled by hook
    }
  }

  const isResolverMode = !allowEstadoChange
  const icon = isResolverMode ? <CheckCircle className="h-5 w-5" /> : <Edit className="h-5 w-5" />
  const title = isResolverMode ? 'Resolver Solicitud' : 'Editar Solución'
  const description = isResolverMode
    ? 'Confirma la resolución de esta incidencia.'
    : 'Modifica el estado y las observaciones de resolución.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0 rounded-2xl border-border/50">
        <DialogHeader className="p-6 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isResolverMode
                ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              }`}>
              {icon}
            </div>
            <div>
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {allowEstadoChange && (
            <div className="space-y-2">
              <label htmlFor="estado" className="text-sm font-medium">
                Estado Final
              </label>
              <Select value={estado} onValueChange={(v) => setEstado(v as EstadoAtencion)}>
                <SelectTrigger id="estado" className="rounded-lg">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EstadoAtencion).map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="observaciones" className="text-sm font-medium">
              Observaciones de Resolución {isResolverMode && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Describe las acciones tomadas para resolver el problema..."
              className="min-h-[120px] resize-y rounded-xl"
            />
            {isResolverMode && (
              <p className="text-xs text-muted-foreground">Esta información será visible en el historial de resolución.</p>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-border/20 bg-muted/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (isResolverMode && !observaciones.trim())}
            className="rounded-lg"
          >
            {isPending
              ? (isResolverMode ? 'Resolviendo...' : 'Guardando...')
              : (isResolverMode ? 'Confirmar Resolución' : 'Guardar Cambios')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
