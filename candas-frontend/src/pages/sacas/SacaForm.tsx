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
import { useSaca, useCreateSaca, useUpdateSaca } from '@/hooks/useSacas'
import { TamanoSaca } from '@/types/saca'
import { ShoppingBag, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  sacaSchema,
  type SacaFormData,
  sacaFormDataToDto,
  sacaToFormData,
} from '@/schemas/saca'

export default function SacaForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: saca, isLoading: loadingSaca, error: loadError, refetch } = useSaca(id ? Number(id) : undefined)
  const createMutation = useCreateSaca()
  const updateMutation = useUpdateSaca()

  const form = useForm<SacaFormData>({
    resolver: zodResolver(sacaSchema),
    defaultValues: {
      tamano: TamanoSaca.INDIVIDUAL,
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
    if (saca) {
      reset(sacaToFormData(saca))
    }
  }, [saca, reset])

  const onSubmit = async (data: SacaFormData) => {
    const sacaData = sacaFormDataToDto(data)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: sacaData })
      } else {
        await createMutation.mutateAsync(sacaData)
      }
      navigate({ to: '/sacas' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingSaca
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Saca' : 'Nueva Saca'}
      subtitle={isEdit ? 'Modificar datos de la saca' : 'Registrar una nueva saca'}
      backUrl="/sacas"
      formId="saca-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="md"
      primaryAction={{
        label: isEdit ? 'Guardar cambios' : 'Crear saca',
        loadingLabel: 'Guardando...',
      }}
    >
      <form id="saca-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Datos de la saca"
          description="Identificación y características físicas de la saca."
          icon={ShoppingBag}
          cols={2}
        >
          <FieldRow label="Código QR" htmlFor="codigoQr" hint="Se genera automáticamente">
            <Input
              id="codigoQr"
              {...register('codigoQr')}
              placeholder="Generado por el sistema"
              disabled
              className="bg-muted/40 text-muted-foreground"
            />
          </FieldRow>

          <FieldRow
            label="Número de orden"
            required
            htmlFor="numeroOrden"
            error={errors.numeroOrden}
          >
            <Input
              id="numeroOrden"
              type="number"
              min={1}
              {...register('numeroOrden', { valueAsNumber: true })}
              className={cn(errors.numeroOrden && 'border-destructive')}
            />
          </FieldRow>

          <FieldRow
            label="Tamaño"
            required
            htmlFor="tamano"
            error={errors.tamano}
          >
            <Select
              value={watch('tamano')}
              onValueChange={(value) =>
                setValue('tamano', value as TamanoSaca, { shouldDirty: true })
              }
            >
              <SelectTrigger
                id="tamano"
                className={cn(errors.tamano && 'border-destructive')}
              >
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
          </FieldRow>
        </FormSection>

        <FormSection
          title="Despacho"
          description="Asociación opcional con un despacho existente."
          icon={Truck}
          cols={2}
        >
          <FieldRow
            label="ID de despacho"
            htmlFor="idDespacho"
            hint="Opcional"
            error={errors.idDespacho}
          >
            <Input
              id="idDespacho"
              type="number"
              {...register('idDespacho', { valueAsNumber: true })}
              placeholder="ID del despacho"
            />
          </FieldRow>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
