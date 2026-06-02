import { FieldRow,FormPageLayout,FormSection } from '@/components/form'
import { Input } from '@/components/ui/input'
import { usePermiso,useUpdatePermisoNombre } from '@/hooks/usePermisos'
import { cn } from '@/lib/utils'
import {
permisoEditFormDataToDto,
permisoEditSchema,
permisoToEditFormData,
type PermisoEditFormData,
} from '@/schemas/permiso'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate,useParams } from '@tanstack/react-router'
import { FileText,Folder,Key,Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useForm,type FieldValues,type UseFormReturn } from 'react-hook-form'

export default function PermisoForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })

  useEffect(() => {
    if (!id) {
      navigate({ to: '/permisos', replace: true })
    }
  }, [id, navigate])

  const {
    data: permiso,
    isLoading: loadingPermiso,
    error: loadError,
    refetch,
  } = usePermiso(id ? Number(id) : undefined)
  const updateMutation = useUpdatePermisoNombre()

  const form = useForm<PermisoEditFormData>({
    resolver: zodResolver(permisoEditSchema),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form

  useEffect(() => {
    if (permiso) {
      reset(permisoToEditFormData(permiso))
    }
  }, [permiso, reset])

  const onSubmit = async (data: PermisoEditFormData) => {
    if (!id) return
    try {
      await updateMutation.mutateAsync({
        id: Number(id),
        dto: permisoEditFormDataToDto(data),
      })
      navigate({ to: '/permisos' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  if (!id) return null

  return (
    <FormPageLayout
      title="Editar nombre del permiso"
      subtitle="Solo el nombre es editable. Los permisos se registran o eliminan desde el código del sistema."
      backUrl="/permisos"
      formId="permiso-form"
      isLoading={loadingPermiso}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={updateMutation.isPending}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form id="permiso-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Nombre"
          description="Etiqueta visible del permiso. El código técnico (recurso/acción) no se modifica aquí."
          icon={Key}
          cols={1}
        >
          <FieldRow label="Nombre" required htmlFor="nombre" error={errors.nombre}>
            <Input
              id="nombre"
              {...register('nombre')}
              className={cn(errors.nombre && 'border-destructive')}
              placeholder="ej. paquetes:ver"
            />
          </FieldRow>
        </FormSection>

        {permiso && (
          <FormSection
            title="Datos del sistema (solo lectura)"
            description="Definidos al registrar el permiso en código."
            icon={FileText}
            cols={2}
          >
            <FieldRow label="Recurso">
              <div className="flex h-9 items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground">
                <Folder className="h-3.5 w-3.5 shrink-0" />
                {permiso.recurso || '—'}
              </div>
            </FieldRow>
            <FieldRow label="Acción">
              <div className="flex h-9 items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground">
                <Zap className="h-3.5 w-3.5 shrink-0" />
                {permiso.accion || '—'}
              </div>
            </FieldRow>
            <FieldRow label="Descripción" span="full">
              <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground min-h-[72px]">
                {permiso.descripcion || '—'}
              </div>
            </FieldRow>
          </FormSection>
        )}
      </form>
    </FormPageLayout>
  )
}
