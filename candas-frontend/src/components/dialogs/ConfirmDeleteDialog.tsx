import { Button } from '@/components/ui/button'
import {
Dialog,
DialogContent,
dialogContentPresets,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

export interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
  title?: string
  description?: string
  /** Párrafo de confirmación (ej. "¿Estás seguro de eliminar...?") */
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  title = 'Confirmar eliminación',
  description = 'Esta acción no se puede deshacer.',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogContentPresets.compact, 'gap-0 overflow-hidden p-0')}>
        <DialogHeader className="border-b border-border/40 bg-destructive/5 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </div>
            {title}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <DialogFooter className="border-t border-border/40 bg-muted/10 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Eliminando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
