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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { usePaquete, useCreatePaquete, useUpdatePaquete } from '@/hooks/usePaquetes'
import { useAgencias, usePuntosOrigen } from '@/hooks/useSelectOptions'
import { useClienteManager } from '@/hooks/useClienteManager'
import { useCliente } from '@/hooks/useClientes'
import { EstadoPaquete, TipoPaquete, TipoDestino } from '@/types/paquete'
import { Package, MapPin, FileText, Building2, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClienteSearchField } from '@/components/clientes/ClienteSearchField'
import { CrearClienteFormDialog } from '@/components/clientes/CrearClienteFormDialog'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  paqueteFormDataToDto,
  paqueteSchema,
  paqueteToFormData,
  type PaqueteFormData,
} from '@/schemas/paquete'

const parseOptionalNumberInput = (value: unknown): number | '' => {
  if (value === '' || value === null || value === undefined) {
    return ''
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? '' : parsed
}

export default function PaqueteForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: paquete,
    isLoading: loadingPaquete,
    error: loadError,
    refetch,
  } = usePaquete(id ? Number(id) : undefined)
  const { data: agencias = [] } = useAgencias()
  const { data: puntosOrigen = [] } = usePuntosOrigen()

  const createMutation = useCreatePaquete()
  const updateMutation = useUpdatePaquete()

  const form = useForm<PaqueteFormData>({
    resolver: zodResolver(paqueteSchema),
    defaultValues: {
      estado: EstadoPaquete.REGISTRADO,
      tipoPaquete: '',
      tipoDestino: '',
      idPuntoOrigen: '',
      idClienteRemitente: 0,
      idClienteDestinatario: '',
      idAgenciaDestino: '',
      pesoKilos: '',
      pesoLibras: '',
      valor: '',
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

  const clienteRemitenteManager = useClienteManager((cliente) => {
    if (!cliente.idCliente) return
    setValue('idClienteRemitente', cliente.idCliente, { shouldValidate: true, shouldDirty: true })
  })

  const clienteDestinatarioManager = useClienteManager((cliente) => {
    if (!cliente.idCliente) return
    setValue('idClienteDestinatario', cliente.idCliente, { shouldValidate: true, shouldDirty: true })
  })

  const tipoPaquete = watch('tipoPaquete')
  const tipoDestino = watch('tipoDestino')
  const estado = watch('estado')
  const idClienteRemitente = watch('idClienteRemitente')
  const idClienteDestinatario = watch('idClienteDestinatario')

  const { data: clienteRemitenteData } = useCliente(paquete?.idClienteRemitente)
  const { data: clienteDestinatarioData } = useCliente(paquete?.idClienteDestinatario)

  useEffect(() => {
    if (paquete) {
      reset(paqueteToFormData(paquete))
    }
  }, [paquete, reset])

  useEffect(() => {
    if (clienteRemitenteData) {
      clienteRemitenteManager.setClienteSeleccionado(clienteRemitenteData)
    }
  }, [clienteRemitenteData, clienteRemitenteManager])

  useEffect(() => {
    if (clienteDestinatarioData) {
      clienteDestinatarioManager.setClienteSeleccionado(clienteDestinatarioData)
    }
  }, [clienteDestinatarioData, clienteDestinatarioManager])

  const onSubmit = async (data: PaqueteFormData) => {
    const paqueteData = paqueteFormDataToDto(data)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: paqueteData })
      } else {
        await createMutation.mutateAsync(paqueteData)
      }
      navigate({ to: '/paquetes' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const fillDatosGenericos = () => {
    const stamp = Date.now().toString().slice(-6)

    setValue('pesoKilos', 3.63, { shouldDirty: true })
    setValue('pesoLibras', 8, { shouldDirty: true })
    setValue('medidas', 'L:1.00 / W:1.00 / H:1.00', { shouldDirty: true })
    setValue('valor', 100, { shouldDirty: true })
    setValue('tarifaPosition', '98.07.20.00.00', { shouldDirty: true })
    setValue('ref', `REF-${stamp}`, { shouldDirty: true })
    setValue('sed', '30.37a', { shouldDirty: true })
  }

  const isLoading = isEdit && loadingPaquete
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Paquete' : 'Nuevo Paquete'}
      subtitle={isEdit ? `Editando paquete #${id}` : 'Registrar un nuevo paquete en el sistema'}
      backUrl="/paquetes"
      formId="paquete-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="xl"
      primaryAction={{
        label: isEdit ? 'Guardar cambios' : 'Crear paquete',
        loadingLabel: 'Guardando...',
      }}
      secondaryActions={
        !isEdit ? (
          <Button
            type="button"
            variant="outline"
            onClick={fillDatosGenericos}
            title="Completar pesos, medidas, valor, tarifa, REF y SED"
            className="group h-9 border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60"
          >
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Wand2 className="h-3.5 w-3.5" />
            </span>
            Datos genéricos
          </Button>
        ) : undefined
      }
    >
      <form id="paquete-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Identificación"
          description="Datos para identificar y clasificar el paquete."
          icon={Package}
          cols={4}
        >
          <FieldRow
            label="Número de guía"
            htmlFor="numeroGuia"
            error={errors.numeroGuia}
            span={2}
          >
            <Input
              id="numeroGuia"
              {...register('numeroGuia')}
              placeholder="Ej: ECA7800050105"
              className={cn(errors.numeroGuia && 'border-destructive')}
            />
          </FieldRow>

          <FieldRow label="Número master" htmlFor="numeroMaster">
            <Input id="numeroMaster" {...register('numeroMaster')} placeholder="Opcional" />
          </FieldRow>

          <FieldRow
            label="Estado"
            required
            htmlFor="estado"
            error={errors.estado}
          >
            <Select
              value={estado}
              onValueChange={(value) =>
                setValue('estado', value as EstadoPaquete, { shouldValidate: true, shouldDirty: true })
              }
            >
              <SelectTrigger id="estado" className={cn(errors.estado && 'border-destructive')}>
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EstadoPaquete).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Tipo de paquete" htmlFor="tipoPaquete">
            <Select
              value={tipoPaquete || 'none'}
              onValueChange={(value) =>
                setValue(
                  'tipoPaquete',
                  value === 'none' ? '' : (value as TipoPaquete),
                  { shouldValidate: true, shouldDirty: true }
                )
              }
            >
              <SelectTrigger id="tipoPaquete">
                <SelectValue placeholder="Sin tipo especial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin tipo especial</SelectItem>
                {Object.values(TipoPaquete).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="REF" htmlFor="ref" hint="Referencia interna">
            <Input id="ref" {...register('ref')} placeholder="Referencia interna" />
          </FieldRow>

          <FieldRow label="SED" htmlFor="sed">
            <Input id="sed" {...register('sed')} placeholder="Número SED" />
          </FieldRow>

          {tipoPaquete === TipoPaquete.SEPARAR && (
            <FieldRow
              label="Etiqueta del destinatario"
              htmlFor="etiquetaDestinatario"
              span={2}
            >
              <Input
                id="etiquetaDestinatario"
                {...register('etiquetaDestinatario')}
                placeholder="Ej: FUNDAS JUAN PEREZ"
              />
            </FieldRow>
          )}
        </FormSection>

        <FormSection
          title="Origen y destino"
          description="Cliente remitente, destinatario y agencia o punto de origen."
          icon={MapPin}
          cols={2}
        >
          <FieldRow span="full">
            <ClienteSearchField
              label="Cliente remitente"
              required
              manager={clienteRemitenteManager}
              selectedId={idClienteRemitente}
              onClear={() => {
                setValue('idClienteRemitente', 0, { shouldValidate: true, shouldDirty: true })
                clienteRemitenteManager.setClienteSeleccionado(null)
              }}
              error={errors.idClienteRemitente?.message}
            />
          </FieldRow>

          <FieldRow span="full">
            <ClienteSearchField
              label="Cliente destinatario"
              manager={clienteDestinatarioManager}
              selectedId={idClienteDestinatario}
              onClear={() => {
                setValue('idClienteDestinatario', '', { shouldValidate: true, shouldDirty: true })
                clienteDestinatarioManager.setClienteSeleccionado(null)
              }}
            />
          </FieldRow>

          <FieldRow label="Origen USA" htmlFor="idPuntoOrigen">
            <Select
              value={watch('idPuntoOrigen')?.toString() || 'none'}
              onValueChange={(value) =>
                setValue(
                  'idPuntoOrigen',
                  value === 'none' ? '' : Number(value),
                  { shouldValidate: true, shouldDirty: true }
                )
              }
            >
              <SelectTrigger id="idPuntoOrigen">
                <SelectValue placeholder="Seleccionar origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin origen</SelectItem>
                {puntosOrigen.map((origen) => (
                  <SelectItem key={origen.value} value={origen.value.toString()}>
                    {origen.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Destino" htmlFor="tipoDestino">
            <Select
              value={tipoDestino || 'none'}
              onValueChange={(value) =>
                setValue(
                  'tipoDestino',
                  value === 'none' ? '' : (value as TipoDestino),
                  { shouldValidate: true, shouldDirty: true }
                )
              }
            >
              <SelectTrigger id="tipoDestino">
                <SelectValue placeholder="Destino general" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General</SelectItem>
                {Object.values(TipoDestino).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          {tipoDestino === TipoDestino.AGENCIA && (
            <FieldRow
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Agencia destino
                </span>
              }
              required
              htmlFor="idAgenciaDestino"
              error={errors.idAgenciaDestino}
              span={2}
            >
              <Combobox
                id="idAgenciaDestino"
                options={agencias.map<ComboboxOption>((a) => ({
                  value: a.value,
                  label: a.label,
                  description: a.description,
                }))}
                value={watch('idAgenciaDestino') ? Number(watch('idAgenciaDestino')) : null}
                onValueChange={(value) =>
                  setValue(
                    'idAgenciaDestino',
                    value == null ? '' : Number(value),
                    { shouldValidate: true, shouldDirty: true }
                  )
                }
                placeholder="Seleccionar agencia"
                searchPlaceholder="Buscar por agencia, cantón o provincia..."
                clearable
                triggerClassName={cn(errors.idAgenciaDestino && 'border-destructive')}
              />
            </FieldRow>
          )}
        </FormSection>

        <FormSection
          title="Detalles"
          description="Pesos, medidas, valores, contenido y observaciones."
          icon={FileText}
          cols={4}
        >
          <FieldRow label="Peso (kg)" htmlFor="pesoKilos">
            <Input
              id="pesoKilos"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('pesoKilos', { setValueAs: parseOptionalNumberInput })}
            />
          </FieldRow>

          <FieldRow label="Peso (lbs)" htmlFor="pesoLibras">
            <Input
              id="pesoLibras"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('pesoLibras', { setValueAs: parseOptionalNumberInput })}
            />
          </FieldRow>

          <FieldRow label="Medidas" htmlFor="medidas">
            <Input id="medidas" {...register('medidas')} placeholder="Ej: 30x20x10" />
          </FieldRow>

          <FieldRow label="Valor declarado" htmlFor="valor">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="valor"
                type="number"
                step="0.01"
                className="pl-6"
                placeholder="0.00"
                {...register('valor', { setValueAs: parseOptionalNumberInput })}
              />
            </div>
          </FieldRow>

          <FieldRow label="Tarifa position" htmlFor="tarifaPosition" span={2}>
            <Input
              id="tarifaPosition"
              {...register('tarifaPosition')}
              placeholder="Código de tarifa"
            />
          </FieldRow>

          <FieldRow label="Descripción del contenido" htmlFor="descripcion" span="full">
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Detalle del contenido del paquete"
              className="resize-none min-h-24"
            />
          </FieldRow>

          <FieldRow label="Observaciones internas" htmlFor="observaciones" span="full">
            <Textarea
              id="observaciones"
              {...register('observaciones')}
              placeholder="Notas de operación (opcional)"
              className="resize-none min-h-24"
            />
          </FieldRow>
        </FormSection>
      </form>

      <CrearClienteFormDialog title="Nuevo Cliente Remitente" manager={clienteRemitenteManager} />
      <CrearClienteFormDialog title="Nuevo Cliente Destinatario" manager={clienteDestinatarioManager} />
    </FormPageLayout>
  )
}
