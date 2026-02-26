import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useSepararPaquete, usePaquete } from '@/hooks/usePaquetes'
import { Plus, Trash2, Scissors } from 'lucide-react'
import { EstadoPaquete, TipoPaquete } from '@/types/paquete'
import { cn } from '@/lib/utils'

const paqueteHijoSchema = z.object({
  numeroGuia: z.string().optional(),
  etiquetaDestinatario: z.string().optional(),
  pesoKilos: z.number().positive().optional().or(z.literal('')),
})

const separarPaqueteSchema = z.object({
  paquetesHijos: z.array(paqueteHijoSchema).min(1, 'Debe haber al menos un paquete hijo'),
})

type SepararPaqueteFormData = z.infer<typeof separarPaqueteSchema>

interface SepararPaqueteDialogProps {
  paqueteId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SepararPaqueteDialog({
  paqueteId,
  open,
  onOpenChange,
}: SepararPaqueteDialogProps) {
  const separarMutation = useSepararPaquete()
  const { data: paquetePadre } = usePaquete(paqueteId)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SepararPaqueteFormData>({
    resolver: zodResolver(separarPaqueteSchema),
    defaultValues: {
      paquetesHijos: [{ numeroGuia: '', etiquetaDestinatario: '', pesoKilos: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'paquetesHijos',
  })

  const onSubmit = async (data: SepararPaqueteFormData) => {
    if (!paquetePadre) {
      return
    }

    try {
      const paquetesHijos = data.paquetesHijos.map((hijo) => ({
        numeroGuia: hijo.numeroGuia || undefined,
        etiquetaDestinatario: hijo.etiquetaDestinatario || undefined,
        pesoKilos: hijo.pesoKilos === '' ? undefined : hijo.pesoKilos,
        estado: EstadoPaquete.REGISTRADO,
        tipoPaquete: TipoPaquete.SEPARAR,
        idClienteRemitente: paquetePadre.idClienteRemitente,
      }))

      await separarMutation.mutateAsync({
        id: paqueteId,
        paquetesHijos: paquetesHijos as any,
      })
      reset()
      onOpenChange(false)
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground">
              <Scissors className="h-4 w-4" />
            </div>
            Separar Paquete
          </DialogTitle>
          <DialogDescription>
            Crea múltiples paquetes hijos a partir de este paquete. Si no ingresa número de guía en un destinatario, se usará la guía origen del paquete padre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="group relative rounded-lg border border-border bg-card p-4 transition-all hover:shadow-sm">
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-secondary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paquete Hijo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Número de Guía</label>
                    <Input
                      {...register(`paquetesHijos.${index}.numeroGuia`)}
                      className="h-8 text-sm"
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Etiqueta Destinatario</label>
                    <Input
                      {...register(`paquetesHijos.${index}.etiquetaDestinatario`)}
                      className="h-8 text-sm"
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Peso (kg)</label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`paquetesHijos.${index}.pesoKilos`, { valueAsNumber: true })}
                      className="h-8 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ numeroGuia: '', etiquetaDestinatario: '', pesoKilos: '' })}
              className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Otro Paquete
            </Button>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={separarMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={separarMutation.isPending}>
              {separarMutation.isPending ? 'Separando...' : 'Confirmar Separación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
