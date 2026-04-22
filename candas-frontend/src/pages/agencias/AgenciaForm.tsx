import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { notify } from '@/lib/notify'
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
import { useAgencia, useCreateAgencia, useUpdateAgencia } from '@/hooks/useAgencias'
import { Building2, Plus, Trash2, Sparkles, MapPin, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  agenciaSchema,
  agenciaFormDataToDto,
  agenciaToFormData,
  agenciaTelefonosToFormItems,
  type AgenciaFormData,
  type TelefonoFormItem,
} from '@/schemas/agencia'
import { generarCodigo10Digitos } from '@/schemas/destinatario-directo'

export default function AgenciaForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: agencia,
    isLoading: loadingAgencia,
    error: loadError,
    refetch,
  } = useAgencia(id ? Number(id) : undefined)
  const createMutation = useCreateAgencia()
  const updateMutation = useUpdateAgencia()
  const [telefonos, setTelefonos] = useState<TelefonoFormItem[]>([
    { numero: '', principal: true },
  ])

  const form = useForm<AgenciaFormData>({
    resolver: zodResolver(agenciaSchema),
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
    if (agencia) {
      reset(agenciaToFormData(agencia))
      setTelefonos(agenciaTelefonosToFormItems(agencia))
    }
  }, [agencia, reset])

  const agregarTelefono = () => {
    setTelefonos([...telefonos, { numero: '', principal: false }])
  }

  const eliminarTelefono = (index: number) => {
    if (telefonos.length > 1) {
      const nuevosTelefonos = telefonos.filter((_, i) => i !== index)
      if (telefonos[index].principal && nuevosTelefonos.length > 0) {
        nuevosTelefonos[0].principal = true
      }
      setTelefonos(nuevosTelefonos)
    }
  }

  const cambiarPrincipal = (index: number) => {
    setTelefonos(telefonos.map((t, i) => ({ ...t, principal: i === index })))
  }

  const actualizarTelefono = (index: number, numero: string) => {
    setTelefonos(telefonos.map((t, i) => (i === index ? { ...t, numero } : t)))
  }

  const onSubmit = async (data: AgenciaFormData) => {
    const telefonosValidos = telefonos.filter((t) => t.numero.trim() !== '')
    if (telefonosValidos.length === 0) {
      notify.error('Debe ingresar al menos un número de teléfono')
      return
    }

    const agenciaData = agenciaFormDataToDto(data, telefonosValidos)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: agenciaData })
      } else {
        await createMutation.mutateAsync(agenciaData)
      }
      navigate({ to: '/agencias' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingAgencia
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Agencia' : 'Nueva Agencia'}
      subtitle={isEdit ? `Modificando: ${agencia?.nombre ?? '...'}` : 'Registrar nueva agencia'}
      backUrl="/agencias"
      formId="agencia-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form id="agencia-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Datos generales"
          description="Información básica de identificación de la agencia."
          icon={Building2}
          cols={2}
        >
          <FieldRow
            label="Nombre Agencia"
            required
            htmlFor="nombre"
            error={errors.nombre}
          >
            <Input
              id="nombre"
              {...register('nombre')}
              autoFocus={!isEdit}
              placeholder="Ej. Agencia Centro"
            />
          </FieldRow>

          <FieldRow label="Código" htmlFor="codigo" hint="Identificador interno (opcional).">
            <div className="flex gap-2">
              <Input
                id="codigo"
                {...register('codigo')}
                placeholder="Escribir o generar"
                className="font-mono text-xs flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={() => setValue('codigo', generarCodigo10Digitos(), { shouldDirty: true })}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generar
              </Button>
            </div>
          </FieldRow>

          <FieldRow label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="contacto@agencia.com"
            />
          </FieldRow>

          <FieldRow label="Estado" htmlFor="activa">
            <Select
              value={watch('activa') ? 'true' : 'false'}
              onValueChange={(value) => setValue('activa', value === 'true', { shouldDirty: true })}
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
          title="Ubicación"
          description="Dirección física, cantón y horario de atención."
          icon={MapPin}
          cols={2}
        >
          <FieldRow label="Cantón" htmlFor="canton">
            <Input id="canton" {...register('canton')} placeholder="Ej. Quito" />
          </FieldRow>

          <FieldRow label="Nombre personal contacto" htmlFor="nombrePersonal">
            <Input id="nombrePersonal" {...register('nombrePersonal')} placeholder="Persona responsable" />
          </FieldRow>

          <FieldRow label="Dirección" htmlFor="direccion" span="full">
            <Textarea
              id="direccion"
              {...register('direccion')}
              placeholder="Dirección completa..."
              rows={2}
              className="min-h-[60px] resize-y"
            />
          </FieldRow>

          <FieldRow label="Horario de atención" htmlFor="horarioAtencion" span="full">
            <Textarea
              id="horarioAtencion"
              {...register('horarioAtencion')}
              placeholder="Lunes a Viernes: 9:00 - 18:00..."
              rows={2}
              className="min-h-[60px] resize-y"
            />
          </FieldRow>
        </FormSection>

        <FormSection
          title="Contacto telefónico"
          description="Al menos un número de teléfono. Marca uno como principal."
          icon={Phone}
          cols={1}
        >
          <div className="space-y-3">
            {telefonos.map((telefono, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Número de teléfono"
                    value={telefono.numero}
                    onChange={(e) => actualizarTelefono(index, e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant={telefono.principal ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => cambiarPrincipal(index)}
                  className={cn(
                    'h-9 px-3',
                    telefono.principal && 'bg-green-600 hover:bg-green-700 text-white'
                  )}
                  title={telefono.principal ? 'Teléfono principal' : 'Marcar como principal'}
                >
                  {telefono.principal ? 'Principal' : 'Hacer Principal'}
                </Button>
                {telefonos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminarTelefono(index)}
                    title="Eliminar teléfono"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={agregarTelefono}
              className="w-full border-dashed"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar otro teléfono
            </Button>
          </div>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
