import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLoteRecepcion, useCreateLoteRecepcion, useUpdateLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { useAgencias } from '@/hooks/useSelectOptions'
import { useAuthStore } from '@/stores/authStore'
import { CheckCircle2, Package, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { SectionTitle } from '@/components/ui/section-title'
import { LoadingState } from '@/components/states'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import {
  loteRecepcionSchema,
  loteRecepcionFormDataToDto,
  loteRecepcionToFormData,
  defaultLoteRecepcionFormData,
  type LoteRecepcionFormData,
} from '@/schemas/lote-recepcion'
import ImportarPaquetesDialog from './ImportarPaquetesDialog'

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

export default function LoteRecepcionForm({ backUrl = '/lotes-recepcion', defaultTipoLote, title, subtitle }: LoteRecepcionFormProps = {}) {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id
  const user = useAuthStore((state) => state.user)
  const refreshMe = useAuthStore((state) => state.refreshMe)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [nuevoLoteRecepcionId, setNuevoLoteRecepcionId] = useState<number | null>(null)
  const [nuevoLoteEspecial, setNuevoLoteEspecial] = useState(false)
  const [showImportarDialog, setShowImportarDialog] = useState(false)

  const { data: loteRecepcion, isLoading: loadingLoteRecepcion } = useLoteRecepcion(id ? Number(id) : undefined)
  const { data: agencias = [], isLoading: loadingAgencias } = useAgencias()
  const createMutation = useCreateLoteRecepcion()
  const updateMutation = useUpdateLoteRecepcion()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LoteRecepcionFormData>({
    resolver: zodResolver(loteRecepcionSchema),
    defaultValues: {
      ...defaultLoteRecepcionFormData(user?.nombreCompleto, user?.idAgencia),
      tipoLote: (defaultTipoLote === 'ESPECIAL' ? 'ESPECIAL' : 'NORMAL') as 'NORMAL' | 'ESPECIAL',
    },
  })

  // Al crear lote nuevo, refrescar usuario para obtener idAgencia actualizado desde el backend
  useEffect(() => {
    if (!isEdit) {
      refreshMe()
    }
  }, [isEdit, refreshMe])

  // Actualizar el campo de usuario y agencia automáticamente cuando el usuario esté disponible
  useEffect(() => {
    if (user?.nombreCompleto && !isEdit) {
      setValue('usuarioRegistro', user.nombreCompleto)
    }
    if (user?.idAgencia != null && !isEdit) {
      setValue('idAgencia', user.idAgencia)
    }
  }, [user?.nombreCompleto, user?.idAgencia, setValue, isEdit])

  useEffect(() => {
    if (loteRecepcion) {
      reset(loteRecepcionToFormData(loteRecepcion))
    }
  }, [loteRecepcion, reset])

  const onSubmit = async (data: LoteRecepcionFormData) => {
    const loteRecepcionData = loteRecepcionFormDataToDto(data, defaultTipoLote)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: loteRecepcionData })
        navigate(backUrl)
      } else {
        const nuevoLoteRecepcion = await createMutation.mutateAsync(loteRecepcionData)
        setNuevoLoteRecepcionId(nuevoLoteRecepcion.idLoteRecepcion || null)
        setNuevoLoteEspecial(nuevoLoteRecepcion.tipoLote === 'ESPECIAL')
        setShowSuccessDialog(true)
      }
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  const handleContinuarSinImportar = () => {
    setShowSuccessDialog(false)
    navigate(backUrl)
  }

  const handleIrATipiar = () => {
    setShowSuccessDialog(false)
    if (nuevoLoteRecepcionId) navigate({ to: `/lotes-recepcion/${nuevoLoteRecepcionId}` })
    else navigate(backUrl)
  }

  const handleImportarPaquetes = () => {
    setShowSuccessDialog(false)
    if (nuevoLoteRecepcionId) {
      setShowImportarDialog(true)
    }
  }

  const handleImportSuccess = () => {
    setShowImportarDialog(false)
    navigate(backUrl)
  }

  if (isEdit && loadingLoteRecepcion) {
    return <LoadingState label="Cargando formulario..." />
  }

  return (
    <PageContainer width="lg" spacing="6">
      <PageHeader
        icon={<Package className="h-4 w-4" />}
        title={title ?? (isEdit ? 'Editar Lote de Recepción' : 'Nuevo Lote de Recepción')}
        subtitle={
          subtitle ??
          (isEdit
            ? 'Modifica la información del lote de recepción'
            : 'Crea un nuevo lote de recepción para registrar paquetes recibidos de la aduana')
        }
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <SectionTitle
            title={isEdit ? 'Información de la Recepción' : 'Datos de la Recepción'}
            variant="form"
            icon={<Package className="h-5 w-5 mr-2 text-muted-foreground" />}
            as="h2"
          />
          <CardDescription>
            {isEdit
              ? 'Modifica los datos de la recepción'
              : 'Completa los campos requeridos para crear la recepción. Luego podrás importar los paquetes.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="tipoLote">Tipo de lote</Label>
                  <Select
                    value={watch('tipoLote') || 'NORMAL'}
                    onValueChange={(value) => setValue('tipoLote', value as 'NORMAL' | 'ESPECIAL', { shouldValidate: true })}
                  >
                    <SelectTrigger id="tipoLote">
                      <SelectValue placeholder="Tipo de lote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="ESPECIAL">Especial (tipiar y clasificar por etiqueta)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Especial: podrás tipiar paquetes y clasificarlos por etiqueta al abrir el lote.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="idAgencia">
                  Agencia <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('idAgencia')?.toString() || ''}
                  onValueChange={(value) => setValue('idAgencia', Number(value), { shouldValidate: true })}
                  disabled={loadingAgencias}
                >
                  <SelectTrigger id="idAgencia" className={errors.idAgencia ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecciona una agencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencias.map((agencia) => (
                      <SelectItem key={agencia.value} value={agencia.value.toString()}>
                        {agencia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={errors.idAgencia?.message} showIcon />
                {!errors.idAgencia && watch('idAgencia') && (
                  <p className="text-xs text-muted-foreground">Agencia seleccionada</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaRecepcion">
                  Fecha y Hora de Recepción <span className="text-destructive">*</span>
                </Label>
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
                <FormError message={errors.fechaRecepcion?.message} showIcon />
                {!errors.fechaRecepcion && watch('fechaRecepcion') && (
                  <p className="text-xs text-muted-foreground">Fecha configurada</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usuarioRegistro">
                  Usuario de Registro <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usuarioRegistro"
                  {...register('usuarioRegistro')}
                  className={errors.usuarioRegistro ? 'border-destructive' : ''}
                  placeholder="Usuario que registra la recepción"
                  disabled={!isEdit}
                  readOnly={!isEdit}
                />
                {!isEdit && (
                  <p className="text-xs text-muted-foreground">
                    Se usa automáticamente el usuario registrado: <span className="font-medium">{user?.nombreCompleto || 'No disponible'}</span>
                  </p>
                )}
                <FormError message={errors.usuarioRegistro?.message} showIcon />
                {!errors.usuarioRegistro && watch('usuarioRegistro') && isEdit && (
                  <p className="text-xs text-muted-foreground">Usuario registrado</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroRecepcion">
                  Número de Recepción <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <Input
                  id="numeroRecepcion"
                  {...register('numeroRecepcion')}
                  placeholder="Se generará automáticamente si se deja vacío"
                />
                <p className="text-xs text-muted-foreground">
                  Si no ingresas un número, se generará automáticamente
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">
                Observaciones <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
              </Label>
              <Textarea
                id="observaciones"
                {...register('observaciones')}
                placeholder="Notas adicionales sobre esta recepción..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: backUrl })}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="min-w-[120px]"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </span>
                ) : isEdit ? (
                  'Actualizar Recepción'
                ) : (
                  <span className="flex items-center gap-2">
                    Crear Recepción <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Diálogo de éxito después de crear */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <DialogTitle>¡Recepción creada exitosamente!</DialogTitle>
                <DialogDescription className="mt-1">
                  {nuevoLoteEspecial
                    ? 'Lote especial registrado. Ve a tipiar y clasificar los paquetes que llegan.'
                    : 'La recepción ha sido registrada en el sistema'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            {nuevoLoteEspecial ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  En la ventana de tipiado podrás escanear cada paquete, ver su tipo (etiqueta) según el registro y clasificarlo. Los que no estén en el registro se guardan en el lote para clasificarlos después.
                </p>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Próximos pasos:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Tipiar cada paquete (número de guía) y ver su tipo</li>
                    <li>Marcar como receptado o elegir etiqueta si está en varias listas</li>
                    <li>Clasificar después los que no tenían etiqueta</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  ¿Deseas importar los paquetes ahora? Puedes hacerlo desde Excel o ingresando un listado manual.
                </p>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Próximos pasos:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Importar paquetes desde Excel o listado manual</li>
                    <li>Verificar que todos los paquetes estén asociados</li>
                    <li>Proceder con el despacho cuando esté listo</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleContinuarSinImportar}
              className="w-full sm:w-auto"
            >
              {nuevoLoteEspecial ? 'Ver listado' : 'Continuar sin importar'}
            </Button>
            {nuevoLoteEspecial ? (
              <Button onClick={handleIrATipiar} className="w-full sm:w-auto">
                <Package className="h-4 w-4 mr-2" />
                Ir a tipiar paquetes
              </Button>
            ) : (
              <Button onClick={handleImportarPaquetes} className="w-full sm:w-auto">
                <Package className="h-4 w-4 mr-2" />
                Importar Paquetes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de importar paquetes */}
      {nuevoLoteRecepcionId && (
        <ImportarPaquetesDialog
          recepcionId={nuevoLoteRecepcionId}
          open={showImportarDialog}
          onOpenChange={setShowImportarDialog}
          onImportSuccess={handleImportSuccess}
        />
      )}
    </PageContainer>
  )
}
