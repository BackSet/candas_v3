import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'

export default function PuntoOrigenForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: origen, isLoading: loadingOrigen, error: loadError, refetch } = usePuntoOrigen(id ? Number(id) : undefined)
  const createMutation = useCreatePuntoOrigen()
  const updateMutation = useUpdatePuntoOrigen()

  const form = useForm<PuntoOrigenFormData>({
    resolver: zodResolver(puntoOrigenSchema),
    defaultValues: {
      activo: true,
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = form

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

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Punto de Origen' : 'Nuevo Punto de Origen'}
      subtitle={isEdit ? `Editando punto de origen #${id}` : 'Registrar un nuevo punto de origen'}
      backUrl="/puntos-origen"
      formId="punto-origen-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form id="punto-origen-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Datos del Punto de Origen"
          description="Información básica del lugar donde se origina la mercadería."
          icon={MapPin}
          cols={2}
        >
          <FieldRow
            label="Nombre"
            required
            htmlFor="nombrePuntoOrigen"
            error={errors.nombrePuntoOrigen}
          >
            <Input
              id="nombrePuntoOrigen"
              {...register('nombrePuntoOrigen')}
              className={cn(errors.nombrePuntoOrigen && 'border-destructive')}
              placeholder="Ej. Almacén Central"
            />
          </FieldRow>

          <FieldRow label="Estado" htmlFor="activo">
            <Select
              value={watch('activo') ? 'true' : 'false'}
              onValueChange={(value) => setValue('activo', value === 'true', { shouldDirty: true })}
            >
              <SelectTrigger id="activo" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
