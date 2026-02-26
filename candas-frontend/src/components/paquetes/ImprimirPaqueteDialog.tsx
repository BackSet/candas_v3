import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Printer, Tag } from 'lucide-react'

export type ModoImpresionPaquete = 'multi' | 'single'

interface ImprimirPaqueteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ModoImpresionPaquete
  onElegirNormal: () => void
  onElegirZebra: () => void
}

const OPCIONES_MULTI = [
  {
    id: 'normal' as const,
    label: 'Todas etiquetas',
    hint: 'Todas en formato normal',
    icon: Printer,
  },
  {
    id: 'zebra' as const,
    label: 'Todas Zebra',
    hint: 'Todas en formato Zebra',
    icon: Tag,
  },
]

const OPCIONES_SINGLE = [
  {
    id: 'normal' as const,
    label: 'Etiqueta (normal)',
    hint: 'Formato normal',
    icon: Printer,
  },
  {
    id: 'zebra' as const,
    label: 'Etiqueta Zebra',
    hint: 'Formato Zebra',
    icon: Tag,
  },
]

export default function ImprimirPaqueteDialog({
  open,
  onOpenChange,
  mode,
  onElegirNormal,
  onElegirZebra,
}: ImprimirPaqueteDialogProps) {
  const opciones = mode === 'multi' ? OPCIONES_MULTI : OPCIONES_SINGLE

  const handleElegir = (id: 'normal' | 'zebra') => {
    if (id === 'normal') onElegirNormal()
    else onElegirZebra()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Printer className="h-4 w-4" />
            </div>
            {mode === 'multi' ? 'Imprimir paquetes' : 'Imprimir paquete'}
          </DialogTitle>
          <DialogDescription>
            Elige el tipo de impresión para las etiquetas.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {opciones.map((opcion) => {
              const Icon = opcion.icon
              return (
                <Button
                  key={opcion.id}
                  type="button"
                  variant="outline"
                  className="h-auto py-3 px-3 flex flex-col items-start gap-1 text-left"
                  onClick={() => handleElegir(opcion.id)}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 shrink-0" />
                    {opcion.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {opcion.hint}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
