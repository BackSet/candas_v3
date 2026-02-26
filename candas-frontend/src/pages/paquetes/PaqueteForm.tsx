import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
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
import { usePaquete, useCreatePaquete, useUpdatePaquete } from '@/hooks/usePaquetes'
import { useAgencias, usePuntosOrigen } from '@/hooks/useSelectOptions'
import { useClienteManager } from '@/hooks/useClienteManager'
import { useCliente } from '@/hooks/useClientes'
import { EstadoPaquete, TipoPaquete, TipoDestino } from '@/types/paquete'
import { Package, MapPin, FileText, Loader2, Building2, ArrowLeft, Save, Scale, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionTitle } from '@/components/ui/section-title'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { ClienteSearchField } from '@/components/clientes/ClienteSearchField'
import { CrearClienteFormDialog } from '@/components/clientes/CrearClienteFormDialog'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { LoadingState } from '@/components/states'
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

  const { data: paquete, isLoading: loadingPaquete } = usePaquete(id ? Number(id) : undefined)
  const { data: agencias = [] } = useAgencias()
  const { data: puntosOrigen = [] } = usePuntosOrigen()

  const createMutation = useCreatePaquete()
  const updateMutation = useUpdatePaquete()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PaqueteFormData>({
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

  const clienteRemitenteManager = useClienteManager((cliente) => {
    if (!cliente.idCliente) return
    setValue('idClienteRemitente', cliente.idCliente, { shouldValidate: true })
  })

  const clienteDestinatarioManager = useClienteManager((cliente) => {
    if (!cliente.idCliente) return
    setValue('idClienteDestinatario', cliente.idCliente, { shouldValidate: true })
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
      // Error ya manejado
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingPaquete) {
    return <LoadingState label="Cargando información del paquete..." className="min-h-[50vh]" />
  }

  return (
    <PageContainer className="w-full flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      <PageHeader
        icon={<Package className="h-4 w-4" />}
        title={isEdit ? 'Editar Paquete' : 'Nuevo Paquete'}
        subtitle={isEdit ? `Editando paquete #${id}` : 'Registrar un nuevo paquete en el sistema'}
        actions={
          <>
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={fillDatosGenericos}
                title="Completar pesos, medidas, valor, tarifa, REF y SED"
                className="group h-9 border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 shadow-sm"
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Wand2 className="h-3.5 w-3.5" />
                </span>
                Datos genéricos
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/paquetes' })} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/paquetes' })}>
              Cancelar
            </Button>
            <Button type="submit" form="paquete-form" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear paquete'}
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <form id="paquete-form" onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-8">
          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Identificación y clasificación" variant="form" icon={<Package className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="numeroGuia">Número de guía</Label>
                <Input
                  id="numeroGuia"
                  {...register('numeroGuia')}
                  placeholder="Ej: ECA7800050105"
                  className={cn(errors.numeroGuia && 'border-destructive')}
                />
                <FormError message={errors.numeroGuia?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroMaster">Número master</Label>
                <Input id="numeroMaster" {...register('numeroMaster')} placeholder="Opcional" />
              </div>

              <div className="space-y-2">
                <Label>Estado <span className="text-destructive">*</span></Label>
                <Select value={estado} onValueChange={(value) => setValue('estado', value as EstadoPaquete, { shouldValidate: true })}>
                  <SelectTrigger className={cn(errors.estado && 'border-destructive')}>
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
                <FormError message={errors.estado?.message} />
              </div>

              <div className="space-y-2">
                <Label>Tipo de paquete</Label>
                <Select
                  value={tipoPaquete || 'none'}
                  onValueChange={(value) => setValue('tipoPaquete', value === 'none' ? '' : (value as TipoPaquete), { shouldValidate: true })}
                >
                  <SelectTrigger>
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
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Logística y clientes" variant="form" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} as="h3" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <ClienteSearchField
                  label="Cliente remitente"
                  required
                  manager={clienteRemitenteManager}
                  selectedId={idClienteRemitente}
                  onClear={() => {
                    setValue('idClienteRemitente', 0, { shouldValidate: true })
                    clienteRemitenteManager.setClienteSeleccionado(null)
                  }}
                  error={errors.idClienteRemitente?.message}
                />

                <div className="space-y-2">
                  <Label>Origen USA</Label>
                  <Select
                    value={watch('idPuntoOrigen')?.toString() || 'none'}
                    onValueChange={(value) => setValue('idPuntoOrigen', value === 'none' ? '' : Number(value), { shouldValidate: true })}
                  >
                    <SelectTrigger>
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
                </div>
              </div>

              <div className="space-y-6">
                <ClienteSearchField
                  label="Cliente destinatario"
                  manager={clienteDestinatarioManager}
                  selectedId={idClienteDestinatario}
                  onClear={() => {
                    setValue('idClienteDestinatario', '', { shouldValidate: true })
                    clienteDestinatarioManager.setClienteSeleccionado(null)
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select
                      value={tipoDestino || 'none'}
                      onValueChange={(value) => setValue('tipoDestino', value === 'none' ? '' : (value as TipoDestino), { shouldValidate: true })}
                    >
                      <SelectTrigger>
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
                  </div>

                  {tipoDestino === TipoDestino.AGENCIA && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Agencia destino <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={watch('idAgenciaDestino')?.toString() || 'none'}
                        onValueChange={(value) => setValue('idAgenciaDestino', value === 'none' ? '' : Number(value), { shouldValidate: true })}
                      >
                        <SelectTrigger className={cn(errors.idAgenciaDestino && 'border-destructive')}>
                          <SelectValue placeholder="Seleccionar agencia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar agencia</SelectItem>
                          {agencias.map((agencia) => (
                            <SelectItem key={agencia.value} value={agencia.value.toString()}>
                              {agencia.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormError message={errors.idAgenciaDestino?.message} />
                    </div>
                  )}
                </div>

                {tipoPaquete === TipoPaquete.SEPARAR && (
                  <div className="space-y-2">
                    <Label htmlFor="etiquetaDestinatario">Etiqueta del destinatario</Label>
                    <Input id="etiquetaDestinatario" {...register('etiquetaDestinatario')} placeholder="Ej: FUNDAS JUAN PEREZ" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Medidas y valores" variant="form" icon={<Scale className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pesoKilos">Peso (kg)</Label>
                <Input
                  id="pesoKilos"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('pesoKilos', { setValueAs: parseOptionalNumberInput })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pesoLibras">Peso (lbs)</Label>
                <Input
                  id="pesoLibras"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('pesoLibras', { setValueAs: parseOptionalNumberInput })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medidas">Medidas</Label>
                <Input id="medidas" {...register('medidas')} placeholder="Ej: 30x20x10" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor declarado</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="tarifaPosition">Tarifa position</Label>
                <Input id="tarifaPosition" {...register('tarifaPosition')} placeholder="Código de tarifa" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ref">REF</Label>
                <Input id="ref" {...register('ref')} placeholder="Referencia interna" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sed">SED</Label>
                <Input id="sed" {...register('sed')} placeholder="Número SED" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4 pb-8">
            <SectionTitle title="Notas y observaciones" variant="form" icon={<FileText className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción del contenido</Label>
                <Textarea id="descripcion" {...register('descripcion')} placeholder="Detalle del contenido del paquete" className="resize-none min-h-28" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones internas</Label>
                <Textarea id="observaciones" {...register('observaciones')} placeholder="Notas de operación (opcional)" className="resize-none min-h-28" />
              </div>
            </div>
          </section>
        </form>

        <CrearClienteFormDialog title="Nuevo Cliente Remitente" manager={clienteRemitenteManager} />
        <CrearClienteFormDialog title="Nuevo Cliente Destinatario" manager={clienteDestinatarioManager} />
      </div>
    </PageContainer>
  )
}
