import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useDestinatarioDirecto,
  useCreateDestinatarioDirecto,
  useUpdateDestinatarioDirecto,
} from '@/hooks/useDestinatariosDirectos'
import {
  destinatarioDirectoSchema,
  destinatarioDirectoFormDataToDto,
  destinatarioToFormData,
  generarCodigo10Digitos,
  type DestinatarioDirectoFormData,
} from '@/schemas/destinatario-directo'
import { User, MapPin, Sparkles } from 'lucide-react'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'

export default function DestinatarioDirectoForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: destinatario,
    isLoading: loadingDestinatario,
    error: loadError,
    refetch,
  } = useDestinatarioDirecto(id ? Number(id) : undefined)
  const createMutation = useCreateDestinatarioDirecto()
  const updateMutation = useUpdateDestinatarioDirecto()

  const form = useForm<DestinatarioDirectoFormData>({
    resolver: zodResolver(destinatarioDirectoSchema),
    defaultValues: { activo: true },
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
    if (destinatario) {
      reset(destinatarioToFormData(destinatario))
    }
  }, [destinatario, reset])

  const onSubmit = async (data: DestinatarioDirectoFormData) => {
    const destinatarioData = destinatarioDirectoFormDataToDto(data)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: destinatarioData })
      } else {
        await createMutation.mutateAsync(destinatarioData)
      }
      navigate({ to: '/destinatarios-directos' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingDestinatario
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Destinatario' : 'Nuevo Destinatario'}
      subtitle={
        isEdit
          ? `Modificando: ${destinatario?.nombreDestinatario ?? '...'}`
          : 'Registrar nuevo destinatario directo'
      }
      backUrl="/destinatarios-directos"
      formId="destinatario-directo-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form
        id="destinatario-directo-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection
          title="Datos del destinatario"
          description="Información personal y empresa asociada."
          icon={User}
          cols={2}
        >
          <FieldRow
            label="Nombre completo"
            required
            htmlFor="nombreDestinatario"
            error={errors.nombreDestinatario}
          >
            <Input
              id="nombreDestinatario"
              {...register('nombreDestinatario')}
              placeholder="Ej: Juan Pérez"
              autoFocus={!isEdit}
            />
          </FieldRow>

          <FieldRow
            label="Teléfono"
            required
            htmlFor="telefonoDestinatario"
            error={errors.telefonoDestinatario}
          >
            <Input
              id="telefonoDestinatario"
              {...register('telefonoDestinatario')}
              placeholder="Ej: 0912345678"
            />
          </FieldRow>

          <FieldRow
            label="Nombre empresa"
            htmlFor="nombreEmpresa"
            error={errors.nombreEmpresa}
            hint="Razón social o nombre comercial (opcional)."
            span="full"
          >
            <Input id="nombreEmpresa" {...register('nombreEmpresa')} placeholder="Opcional" />
          </FieldRow>
        </FormSection>

        <FormSection
          title="Ubicación y referencias"
          description="Datos de contacto y código identificador."
          icon={MapPin}
          cols={2}
        >
          <FieldRow label="Cantón" htmlFor="canton" error={errors.canton}>
            <Input id="canton" {...register('canton')} placeholder="Ej: Quito" />
          </FieldRow>

          <FieldRow label="Código" htmlFor="codigo" error={errors.codigo}>
            <div className="flex gap-2">
              <Input
                id="codigo"
                {...register('codigo')}
                placeholder="Opcional"
                className="font-mono flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={() =>
                  setValue('codigo', generarCodigo10Digitos(), { shouldDirty: true })
                }
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generar
              </Button>
            </div>
          </FieldRow>

          <FieldRow label="Estado" htmlFor="activo">
            <Select
              value={watch('activo') ? 'true' : 'false'}
              onValueChange={(value) =>
                setValue('activo', value === 'true', { shouldDirty: true })
              }
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

          <FieldRow
            label="Dirección"
            htmlFor="direccionDestinatario"
            error={errors.direccionDestinatario}
            span="full"
          >
            <Textarea
              id="direccionDestinatario"
              {...register('direccionDestinatario')}
              placeholder="Calle principal, secundaria, número de casa..."
              className="min-h-[80px] resize-none"
            />
          </FieldRow>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
