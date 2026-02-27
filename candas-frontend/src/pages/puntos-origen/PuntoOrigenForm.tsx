import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePuntoOrigen, useCreatePuntoOrigen, useUpdatePuntoOrigen } from '@/hooks/usePuntosOrigen'
import { puntoOrigenSchema, puntoOrigenFormDataToDto, puntoOrigenToFormData, type PuntoOrigenFormData } from '@/schemas/punto-origen'
import { Save, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { SectionTitle } from '@/components/ui/section-title'
import { LoadingState } from '@/components/states'

export default function PuntoOrigenForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: origen, isLoading: loadingOrigen } = usePuntoOrigen(id ? Number(id) : undefined)
  const createMutation = useCreatePuntoOrigen()
  const updateMutation = useUpdatePuntoOrigen()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<PuntoOrigenFormData>({
    resolver: zodResolver(puntoOrigenSchema),
    defaultValues: {
      activo: true,
    },
  })

  useEffect(() => {
    if (origen) {
      reset(puntoOrigenToFormData(origen))
    }
  }, [origen, reset])

  const onSubmit = async (data: PuntoOrigenFormData) => {
    const origenData = puntoOrigenFormDataToDto(data)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: origenData })
      } else {
        await createMutation.mutateAsync(origenData)
      }
      navigate({ to: '/puntos-origen' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingOrigen
  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return <LoadingState label="Cargando formulario..." />
  }

  return (
    <StandardPageLayout
      title={isEdit ? 'Editar Punto de Origen' : 'Nuevo Punto de Origen'}
      subtitle={isEdit ? `Editando punto de origen #${id}` : 'Registrar un nuevo punto de origen'}
      icon={<MapPin className="h-4 w-4" />}
      className="animate-in fade-in duration-500"
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/puntos-origen' })}
            disabled={isSaving}
            className="h-8"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
              form="punto-origen-form"
              size="sm"
              disabled={isSaving}
              className="h-8 px-4"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Guardar
                </>
              )}
            </Button>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <form id="punto-origen-form" onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-8">
          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Datos del Punto de Origen" variant="form" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} as="h3" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombrePuntoOrigen">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombrePuntoOrigen"
                  {...register('nombrePuntoOrigen')}
                  className={cn(errors.nombrePuntoOrigen && 'border-destructive')}
                  placeholder="Ej. Almacén Central"
                />
                <FormError message={errors.nombrePuntoOrigen?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activo">Estado</Label>
                <Select
                  value={watch('activo') ? 'true' : 'false'}
                  onValueChange={(value) => setValue('activo', value === 'true')}
                >
                  <SelectTrigger className={cn('h-9')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </form>
      </div>
    </StandardPageLayout>
  )
}
