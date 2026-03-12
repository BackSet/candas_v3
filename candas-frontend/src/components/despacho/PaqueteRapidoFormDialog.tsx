import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Zap } from 'lucide-react'
import { paqueteService } from '@/lib/api/paquete.service'
import { toast } from 'sonner'
import type { Paquete } from '@/types/paquete'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  peso: z.number().min(0.01, 'El peso debe ser mayor a 0'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  nombreDestinatario: z.string().min(1, 'El nombre del destinatario es requerido'),
})

type FormData = z.infer<typeof schema>

interface PaqueteRapidoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaqueteCreado: (paquete: Paquete) => void
}

export default function PaqueteRapidoFormDialog({
  open,
  onOpenChange,
  onPaqueteCreado,
}: PaqueteRapidoFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      peso: undefined,
      descripcion: '',
      nombreDestinatario: '',
    }
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const paquete = await paqueteService.createRapido(data)
      onPaqueteCreado(paquete)
      reset()
      onOpenChange(false)
      toast.success(`Paquete rápido creado: ${paquete.numeroGuia}`)
    } catch (error) {
      console.error(error)
      toast.error('Error al crear paquete rápido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-yellow-100 flex items-center justify-center text-yellow-700">
              <Zap className="h-4 w-4" />
            </div>
            Paquete Rápido (SEPARAR)
          </DialogTitle>
          <DialogDescription>
            Crea un paquete tipo SEPARAR rápidamente para agregar al despacho.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="peso">Peso (kg)</Label>
            <Input
              id="peso"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('peso', { valueAsNumber: true })}
              autoFocus
            />
            {errors.peso && <p className="text-xs text-error">{errors.peso.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Funda)</Label>
            <Input
              id="descripcion"
              placeholder="Ej: Ropa, Zapatos..."
              {...register('descripcion')}
            />
            {errors.descripcion && <p className="text-xs text-error">{errors.descripcion.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreDestinatario">Nombre Destinatario</Label>
            <Input
              id="nombreDestinatario"
              placeholder="Nombre completo"
              {...register('nombreDestinatario')}
            />
            {errors.nombreDestinatario && <p className="text-xs text-error">{errors.nombreDestinatario.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear y Agregar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
