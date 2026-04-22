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
import {
  useDistribuidor,
  useCreateDistribuidor,
  useUpdateDistribuidor,
} from '@/hooks/useDistribuidores'
import { Building2, Mail } from 'lucide-react'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  distribuidorSchema,
  type DistribuidorFormData,
  distribuidorFormDataToDto,
  distribuidorToFormData,
} from '@/schemas/distribuidor'

export default function DistribuidorForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: distribuidor,
    isLoading: loadingDistribuidor,
    error: loadError,
    refetch,
  } = useDistribuidor(id ? Number(id) : undefined)
  const createMutation = useCreateDistribuidor()
  const updateMutation = useUpdateDistribuidor()

  const form = useForm<DistribuidorFormData>({
    resolver: zodResolver(distribuidorSchema),
    defaultValues: { activa: true },
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
    if (distribuidor) {
      reset(distribuidorToFormData(distribuidor))
    }
  }, [distribuidor, reset])

  const onSubmit = async (data: DistribuidorFormData) => {
    const distribuidorData = distribuidorFormDataToDto(data)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: distribuidorData })
      } else {
        await createMutation.mutateAsync(distribuidorData)
      }
      navigate({ to: '/distribuidores' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingDistribuidor
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}
      subtitle={
        isEdit
          ? `Modificando: ${distribuidor?.nombre ?? '...'}`
          : 'Registrar nuevo distribuidor'
      }
      backUrl="/distribuidores"
      formId="distribuidor-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form id="distribuidor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Datos generales"
          description="Identificación y estado del distribuidor."
          icon={Building2}
          cols={2}
        >
          <FieldRow
            label="Nombre"
            required
            htmlFor="nombre"
            error={errors.nombre}
          >
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Ej. Distribuidora Central"
              autoFocus={!isEdit}
            />
          </FieldRow>

          <FieldRow label="Código Interno" htmlFor="codigo" hint="Identificador interno opcional.">
            <Input
              id="codigo"
              {...register('codigo')}
              className="font-mono text-xs"
              placeholder="Ej. DIST-001"
            />
          </FieldRow>

          <FieldRow label="Estado" htmlFor="activa">
            <Select
              value={watch('activa') ? 'true' : 'false'}
              onValueChange={(value) =>
                setValue('activa', value === 'true', { shouldDirty: true })
              }
            >
              <SelectTrigger id="activa" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activa</SelectItem>
                <SelectItem value="false">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </FormSection>

        <FormSection
          title="Contacto"
          description="Medios de contacto del distribuidor."
          icon={Mail}
          cols={2}
        >
          <FieldRow
            label="Email de Contacto"
            htmlFor="email"
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="contacto@distribuidora.com"
            />
          </FieldRow>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
