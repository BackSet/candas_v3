import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePermiso, useCreatePermiso, useUpdatePermiso } from '@/hooks/usePermisos'
import { Key } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  permisoSchema,
  type PermisoFormData,
  permisoFormDataToDto,
  permisoToFormData,
} from '@/schemas/permiso'

export default function PermisoForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: permiso,
    isLoading: loadingPermiso,
    error: loadError,
    refetch,
  } = usePermiso(id ? Number(id) : undefined)
  const createMutation = useCreatePermiso()
  const updateMutation = useUpdatePermiso()

  const form = useForm<PermisoFormData>({
    resolver: zodResolver(permisoSchema),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form

  useEffect(() => {
    if (permiso) {
      reset(permisoToFormData(permiso))
    }
  }, [permiso, reset])

  const onSubmit = async (data: PermisoFormData) => {
    const permisoData = permisoFormDataToDto(data)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: permisoData })
      } else {
        await createMutation.mutateAsync(permisoData)
      }
      navigate({ to: '/permisos' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingPermiso
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Permiso' : 'Nuevo Permiso'}
      subtitle={isEdit ? 'Modificar datos del permiso' : 'Crear nuevo permiso en el sistema'}
      backUrl="/permisos"
      formId="permiso-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form id="permiso-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Datos del Permiso"
          description="Nombre, código del recurso, acción y descripción."
          icon={Key}
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
              className={cn(errors.nombre && 'border-destructive')}
              placeholder="ej. USUARIOS_VER"
            />
          </FieldRow>

          <FieldRow
            label="Recurso"
            htmlFor="recurso"
            hint="Entidad o módulo al que aplica el permiso."
          >
            <Input
              id="recurso"
              {...register('recurso')}
              placeholder="ej. USUARIOS"
            />
          </FieldRow>

          <FieldRow
            label="Acción"
            htmlFor="accion"
            hint="Operación permitida (VER, CREAR, EDITAR, etc.)."
          >
            <Input
              id="accion"
              {...register('accion')}
              placeholder="ej. VER"
            />
          </FieldRow>

          <FieldRow label="Descripción" htmlFor="descripcion" span="full">
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Descripción del permiso..."
              rows={3}
            />
          </FieldRow>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
