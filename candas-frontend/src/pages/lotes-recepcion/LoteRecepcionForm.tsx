import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, Controller, type FieldValues, type UseFormReturn } from 'react-hook-form'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLoteRecepcion, useCreateLoteRecepcion, useUpdateLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { useAuthStore } from '@/stores/authStore'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { AssignedAgencyNotice } from '@/components/agency/AssignedAgencyNotice'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  loteRecepcionSchema,
  loteRecepcionFormDataToDto,
  loteRecepcionToFormData,
  defaultLoteRecepcionFormData,
  type LoteRecepcionFormData,
} from '@/schemas/lote-recepcion'

interface LoteRecepcionFormProps {
  /** URL para volver (ej. /lotes-especiales) */
  backUrl?: string
  /** Tipo de lote por defecto al crear (ej. ESPECIAL) */
  defaultTipoLote?: string
  /** Título opcional del encabezado */
  title?: string
  /** Subtítulo opcional */
  subtitle?: string
}

export default function LoteRecepcionForm({
  backUrl = '/lotes-recepcion',
  defaultTipoLote,
  title,
  subtitle,
}: LoteRecepcionFormProps = {}) {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id
  const user = useAuthStore((state) => state.user)
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  const refreshMe = useAuthStore((state) => state.refreshMe)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [nuevoLoteRecepcionId, setNuevoLoteRecepcionId] = useState<number | null>(null)

  const {
    data: loteRecepcion,
    isLoading: loadingLoteRecepcion,
    error: loadError,
    refetch,
  } = useLoteRecepcion(id ? Number(id) : undefined)
  const createMutation = useCreateLoteRecepcion()
  const updateMutation = useUpdateLoteRecepcion()

  const form = useForm<LoteRecepcionFormData>({
    resolver: zodResolver(loteRecepcionSchema),
    defaultValues: {
      ...defaultLoteRecepcionFormData(user?.nombreCompleto, activeAgencyId ?? user?.idAgencia),
      tipoLote: (defaultTipoLote === 'ESPECIAL' ? 'ESPECIAL' : 'NORMAL') as 'NORMAL' | 'ESPECIAL',
    },
  })
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = form

  // Al crear lote nuevo, refrescar usuario para obtener idAgencia actualizado desde el backend
  useEffect(() => {
    if (!isEdit) {
      refreshMe()
    }
  }, [isEdit, refreshMe])

  // Actualizar el campo de usuario y agencia automáticamente cuando el usuario/entorno estén disponibles
  useEffect(() => {
    if (user?.nombreCompleto && !isEdit) {
      setValue('usuarioRegistro', user.nombreCompleto)
    }
    if (activeAgencyId != null) {
      setValue('idAgencia', activeAgencyId, { shouldValidate: true })
      return
    }
    if (user?.idAgencia != null && !isEdit) {
      setValue('idAgencia', user.idAgencia, { shouldValidate: true })
    }
  }, [user?.nombreCompleto, user?.idAgencia, activeAgencyId, setValue, isEdit])

  useEffect(() => {
    if (loteRecepcion) {
      reset(loteRecepcionToFormData(loteRecepcion))
    }
  }, [loteRecepcion, reset])

  const onSubmit = async (data: LoteRecepcionFormData) => {
    const idAgenciaFinal = activeAgencyId ?? data.idAgencia
    const loteRecepcionData = loteRecepcionFormDataToDto(data, defaultTipoLote)
    loteRecepcionData.idAgencia = idAgenciaFinal

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: loteRecepcionData })
        navigate({ to: backUrl as never })
      } else {
        const nuevoLoteRecepcion = await createMutation.mutateAsync(loteRecepcionData)
        setNuevoLoteRecepcionId(nuevoLoteRecepcion.idLoteRecepcion || null)
        setShowSuccessDialog(true)
      }
    } catch {
      // Error ya manejado en el hook
    }
  }

  const handleVolverAlListado = () => {
    setShowSuccessDialog(false)
    navigate({ to: backUrl as never })
  }

  const handleIrAlLote = () => {
    setShowSuccessDialog(false)
    if (nuevoLoteRecepcionId)
      navigate({ to: '/lotes-recepcion/$id', params: { id: String(nuevoLoteRecepcionId) } })
    else navigate({ to: backUrl as never })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && loadingLoteRecepcion

  return (
    <>
      <FormPageLayout
        title={title ?? (isEdit ? 'Editar Lote de Recepción' : 'Nuevo Lote de Recepción')}
        subtitle={
          subtitle ??
          (isEdit
            ? 'Modifica la información del lote de recepción'
            : 'Crea un lote normal o especial; la gestión de paquetes (importar o tipiar) se hace desde el detalle del lote.')
        }
        backUrl={backUrl}
        formId="lote-recepcion-form"
        isLoading={isLoading}
        loadError={loadError}
        onRetry={() => void refetch()}
        isSubmitting={isSaving}
        errors={errors as unknown as Record<string, unknown>}
        form={form as unknown as UseFormReturn<FieldValues>}
        width="lg"
        primaryAction={{
          label: isEdit ? 'Actualizar Recepción' : 'Crear Recepción',
          icon: isEdit ? undefined : ArrowRight,
          loadingLabel: 'Guardando...',
        }}
      >
        <form
          id="lote-recepcion-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <AssignedAgencyNotice />

          <FormSection
            title={isEdit ? 'Información de la Recepción' : 'Datos de la Recepción'}
            description={
              isEdit
                ? 'Modifica los datos de la recepción.'
                : 'Completa los campos. Puedes crear lote normal o especial; la importación de paquetes o el tipiado se hace desde el detalle del lote.'
            }
            icon={Package}
            cols={2}
          >
            {!isEdit && (
              <FieldRow label="Tipo de lote" htmlFor="tipoLote" hint="Especial: podrás tipiar paquetes y clasificarlos por etiqueta al abrir el lote.">
                <Select
                  value={watch('tipoLote') || 'NORMAL'}
                  onValueChange={(value) =>
                    setValue('tipoLote', value as 'NORMAL' | 'ESPECIAL', { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="tipoLote" className="h-9">
                    <SelectValue placeholder="Tipo de lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ESPECIAL">
                      Especial (tipiar y clasificar por etiqueta)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
            )}

            <FieldRow
              label="Fecha y Hora de Recepción"
              required
              htmlFor="fechaRecepcion"
              error={errors.fechaRecepcion}
              hint={watch('fechaRecepcion') ? 'Fecha configurada' : undefined}
            >
              <Controller
                name="fechaRecepcion"
                control={control}
                render={({ field }) => (
                  <DateTimePickerForm
                    id="fechaRecepcion"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow
              label="Usuario de Registro"
              required
              htmlFor="usuarioRegistro"
              error={errors.usuarioRegistro}
              hint={
                !isEdit
                  ? `Se usa automáticamente: ${user?.nombreCompleto || 'No disponible'}`
                  : undefined
              }
            >
              <Input
                id="usuarioRegistro"
                {...register('usuarioRegistro')}
                placeholder="Usuario que registra la recepción"
                disabled
                readOnly
              />
            </FieldRow>

            <FieldRow
              label="Número de Recepción"
              htmlFor="numeroRecepcion"
              hint="Si no ingresas un número, se generará automáticamente."
            >
              <Input
                id="numeroRecepcion"
                {...register('numeroRecepcion')}
                placeholder="Se generará automáticamente si se deja vacío"
              />
            </FieldRow>

            <FieldRow label="Observaciones" htmlFor="observaciones" span="full">
              <Textarea
                id="observaciones"
                {...register('observaciones')}
                placeholder="Notas adicionales sobre esta recepción..."
                rows={3}
              />
            </FieldRow>
          </FormSection>
        </form>
      </FormPageLayout>

      {/* Diálogo de éxito después de crear */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <DialogTitle>Recepción creada</DialogTitle>
                <DialogDescription className="mt-1">
                  Desde el detalle del lote podrás importar paquetes (lote normal) o tipiar y
                  clasificar por etiqueta (lote especial).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Ir al lote para continuar con la gestión de paquetes?
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleVolverAlListado}
              className="w-full sm:w-auto"
            >
              Volver al listado
            </Button>
            <Button onClick={handleIrAlLote} className="w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              Ir al lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
