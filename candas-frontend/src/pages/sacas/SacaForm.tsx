import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSaca, useCreateSaca, useUpdateSaca } from '@/hooks/useSacas'
import { TamanoSaca, type Saca } from '@/types/saca'
import { Save, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { LoadingState } from '@/components/states/LoadingState'

const sacaSchema = z.object({
  codigoQr: z.string().optional(),
  numeroOrden: z.number().min(1, 'El número de orden es requerido'),
  tamano: z.nativeEnum(TamanoSaca),
  idDespacho: z.number().optional().or(z.literal('')),
})

type SacaFormData = z.infer<typeof sacaSchema>

export default function SacaForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: saca, isLoading: loadingSaca } = useSaca(id ? Number(id) : undefined)
  const createMutation = useCreateSaca()
  const updateMutation = useUpdateSaca()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SacaFormData>({
    resolver: zodResolver(sacaSchema),
    defaultValues: {
      tamano: TamanoSaca.INDIVIDUAL,
    },
  })

  useEffect(() => {
    if (saca) {
      setValue('codigoQr', saca.codigoQr || '')
      setValue('numeroOrden', saca.numeroOrden ?? 1)
      setValue('tamano', saca.tamano)
      setValue('idDespacho', saca.idDespacho || '')
    }
  }, [saca, setValue])

  const onSubmit = async (data: SacaFormData) => {
    const sacaData: Saca = {
      ...data,
      idDespacho: data.idDespacho === '' ? undefined : data.idDespacho,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: sacaData })
      } else {
        await createMutation.mutateAsync(sacaData)
      }
      navigate({ to: '/sacas' })
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingSaca
  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <StandardPageLayout title={isEdit ? 'Editar Saca' : 'Nueva Saca'} icon={<ShoppingBag className="h-5 w-5" />}>
        <div className="p-8">
          <LoadingState label="Cargando formulario..." />
        </div>
      </StandardPageLayout>
    )
  }

  return (
    <StandardPageLayout
      width="sm"
      title={isEdit ? 'Editar Saca' : 'Nueva Saca'}
      subtitle={isEdit ? 'Modificar datos de la saca' : 'Registrar nueva saca'}
      icon={<ShoppingBag className="h-5 w-5" />}
      className="pb-20 fade-in-section"
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate({ to: '/sacas' })} disabled={isSaving}>Cancelar</Button>
          <Button type="button" size="sm" disabled={isSaving} onClick={() => handleSubmit(onSubmit)()}>
            {isSaving ? 'Guardando...' : <><Save className="h-3.5 w-3.5 mr-2" /> Guardar</>}
          </Button>
        </div>
      }
    >
      <form id="saca-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Main Info */}
        <section className="space-y-6">
          <div className="border-b border-border/40 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5" /> Datos de la Saca
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="codigoQr" variant="muted">Código QR</Label>
              <Input
                id="codigoQr"
                {...register('codigoQr')}
                placeholder="Se genera automáticamente"
                disabled
                className="h-9 bg-muted/40 border-transparent text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground">ID único del sistema.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroOrden">Número de Orden <span className="text-destructive">*</span></Label>
              <Input
                id="numeroOrden"
                type="number"
                min={1}
                {...register('numeroOrden', { valueAsNumber: true })}
                className={cn("h-9 bg-muted/40 border-transparent focus:bg-background focus:border-border transition-all", errors.numeroOrden && "border-red-500/50")}
              />
              <FormError message={errors.numeroOrden?.message} />
            </div>

            <div className="space-y-2">
              <label htmlFor="tamano" className="text-xs font-medium text-foreground">
                Tamaño <span className="text-red-500">*</span>
              </label>
              <Select
                value={watch('tamano')}
                onValueChange={(value) => setValue('tamano', value as TamanoSaca)}
              >
                <SelectTrigger className={cn("h-9 bg-muted/40 border-transparent focus:ring-0 focus:bg-background focus:border-border", errors.tamano && "border-red-500/50")}>
                  <SelectValue placeholder="Selecciona un tamaño" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TamanoSaca).map((tamano) => (
                    <SelectItem key={tamano} value={tamano}>
                      {tamano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError message={errors.tamano?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idDespacho">Despacho ID (Opcional)</Label>
              <Input
                id="idDespacho"
                type="number"
                {...register('idDespacho', { valueAsNumber: true })}
                placeholder="ID del despacho"
                className="h-9 bg-muted/40 border-transparent focus:bg-background focus:border-border transition-all"
              />
            </div>
          </div>
        </section>
    </form>
    </StandardPageLayout>
  )
}
