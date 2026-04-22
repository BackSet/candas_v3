import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCliente, useCreateCliente, useUpdateCliente } from '@/hooks/useClientes'
import { clienteSchema, type ClienteFormData, clienteFormDataToDto } from '@/schemas/cliente'
import { MapPin, User } from 'lucide-react'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'

export default function ClienteForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: cliente,
    isLoading: loadingCliente,
    error: loadError,
    refetch,
  } = useCliente(id ? Number(id) : undefined)
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
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
    if (cliente) {
      reset({
        nombreCompleto: cliente.nombreCompleto,
        documentoIdentidad: cliente.documentoIdentidad || '',
        email: cliente.email || '',
        pais: cliente.pais || '',
        provincia: cliente.provincia || '',
        canton: cliente.canton || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        activo: cliente.activo ?? true,
      })
    }
  }, [cliente, reset])

  const onSubmit = async (data: ClienteFormData) => {
    const clienteData = clienteFormDataToDto(data)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: clienteData })
      } else {
        await createMutation.mutateAsync(clienteData)
      }
      navigate({ to: '/clientes' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingCliente
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle={
        isEdit
          ? `Modificando: ${cliente?.nombreCompleto || '...'}`
          : 'Registrar un nuevo cliente en el sistema'
      }
      backUrl="/clientes"
      formId="cliente-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form id="cliente-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Identificación"
          description="Datos principales del cliente."
          icon={User}
          cols={3}
        >
          <FieldRow
            label="Nombre completo"
            required
            htmlFor="nombreCompleto"
            error={errors.nombreCompleto}
            span={2}
          >
            <Input
              id="nombreCompleto"
              {...register('nombreCompleto')}
              placeholder="Ej: Juan Pérez"
              autoFocus={!isEdit}
            />
          </FieldRow>

          <FieldRow label="Documento de identidad" htmlFor="documentoIdentidad">
            <Input
              id="documentoIdentidad"
              {...register('documentoIdentidad')}
              placeholder="Identificación / RUC"
            />
          </FieldRow>

          <FieldRow label="Correo electrónico" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="cliente@ejemplo.com"
            />
          </FieldRow>

          <FieldRow label="Estado" htmlFor="activo">
            <Select
              value={watch('activo') ? 'true' : 'false'}
              onValueChange={(val) => setValue('activo', val === 'true', { shouldDirty: true })}
            >
              <SelectTrigger id="activo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </FormSection>

        <FormSection
          title="Contacto y dirección"
          description="Información de ubicación y medios de contacto."
          icon={MapPin}
          cols={3}
        >
          <FieldRow label="Teléfono" htmlFor="telefono" error={errors.telefono}>
            <Input
              id="telefono"
              {...register('telefono')}
              placeholder="Número de teléfono"
            />
          </FieldRow>

          <FieldRow label="País" htmlFor="pais">
            <Input id="pais" {...register('pais')} placeholder="País" />
          </FieldRow>

          <FieldRow label="Provincia" htmlFor="provincia">
            <Input id="provincia" {...register('provincia')} placeholder="Provincia" />
          </FieldRow>

          <FieldRow label="Cantón" htmlFor="canton">
            <Input id="canton" {...register('canton')} placeholder="Cantón" />
          </FieldRow>

          <FieldRow label="Dirección" htmlFor="direccion" span="full">
            <Textarea
              id="direccion"
              {...register('direccion')}
              rows={3}
              className="resize-none"
              placeholder="Dirección detallada"
            />
          </FieldRow>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
