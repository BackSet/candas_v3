import { AssignedAgencyNotice } from '@/components/agency/AssignedAgencyNotice'
import { FieldRow,FormPageLayout,FormSection } from '@/components/form'
import { Input } from '@/components/ui/input'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAtencionPaquete,useCreateAtencionPaquete,useUpdateAtencionPaquete } from '@/hooks/useAtencionPaquetes'
import { usePaquete,usePaquetePorNumeroGuia,usePaquetes } from '@/hooks/usePaquetes'
import { cn } from '@/lib/utils'
import {
atencionPaqueteFormDataToDto,
atencionPaqueteSchema,
atencionPaqueteToFormData,
type AtencionPaqueteFormData,
} from '@/schemas/atencion-paquete'
import { EstadoAtencion,TIPO_PROBLEMA_ATENCION_LABELS,TipoProblemaAtencion } from '@/types/atencion-paquete'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate,useParams } from '@tanstack/react-router'
import { AlertCircle,Check,ClipboardCheck,Package,Search } from 'lucide-react'
import { useEffect,useMemo,useState } from 'react'
import { useForm,type FieldValues,type UseFormReturn } from 'react-hook-form'

export default function AtencionPaqueteForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: atencion,
    isLoading: loadingAtencion,
    error: loadError,
    refetch,
  } = useAtencionPaquete(id ? Number(id) : undefined)
  const { data: paquetesData } = usePaquetes({ page: 0, size: 100 })
  const { data: paqueteAsociado } = usePaquete(isEdit && atencion?.idPaquete ? atencion.idPaquete : undefined)
  const createMutation = useCreateAtencionPaquete()
  const updateMutation = useUpdateAtencionPaquete()

  const [busquedaPaquete, setBusquedaPaquete] = useState('')
  const { data: paquetePorGuia } = usePaquetePorNumeroGuia(
    busquedaPaquete && busquedaPaquete.length >= 10 ? busquedaPaquete : undefined
  )

  const form = useForm<AtencionPaqueteFormData>({
    resolver: zodResolver(atencionPaqueteSchema),
    defaultValues: {
      estado: EstadoAtencion.PENDIENTE,
      tipoProblema: TipoProblemaAtencion.OTRO,
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
    if (atencion) {
      reset(atencionPaqueteToFormData(atencion))
    }
  }, [atencion, reset])

  const onSubmit = async (data: AtencionPaqueteFormData) => {
    const atencionData = atencionPaqueteFormDataToDto(data)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: atencionData })
      } else {
        await createMutation.mutateAsync(atencionData)
      }
      navigate({ to: '/atencion-paquetes' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const paquetes = useMemo(() => {
    const paquetesLista = paquetesData?.content || []
    const paquetesUnicos = new Map<number, typeof paquetesLista[0]>()
    paquetesLista.forEach((p) => {
      if (p.idPaquete) paquetesUnicos.set(p.idPaquete, p)
    })
    if (paqueteAsociado && !paquetesUnicos.has(paqueteAsociado.idPaquete!)) {
      paquetesUnicos.set(paqueteAsociado.idPaquete!, paqueteAsociado)
    }
    if (paquetePorGuia && !paquetesUnicos.has(paquetePorGuia.idPaquete!)) {
      paquetesUnicos.set(paquetePorGuia.idPaquete!, paquetePorGuia)
    }
    return Array.from(paquetesUnicos.values())
  }, [paquetesData?.content, paqueteAsociado, paquetePorGuia])

  useEffect(() => {
    if (isEdit && atencion?.idPaquete && paquetes.length > 0) {
      const paqueteExiste = paquetes.some((p) => p.idPaquete === atencion.idPaquete)
      if (paqueteExiste && watch('idPaquete') !== atencion.idPaquete) {
        setValue('idPaquete', atencion.idPaquete)
      }
    }
  }, [isEdit, atencion?.idPaquete, paquetes, setValue, watch])

  const paquetesFiltrados = useMemo(() => {
    if (!busquedaPaquete.trim()) return paquetes
    const busquedaLower = busquedaPaquete.toLowerCase().trim()
    return paquetes.filter(
      (p) =>
        p.numeroGuia?.toLowerCase().includes(busquedaLower) ||
        p.idPaquete?.toString().includes(busquedaLower)
    )
  }, [paquetes, busquedaPaquete])

  useEffect(() => {
    if (paquetePorGuia && !isEdit) {
      setValue('idPaquete', paquetePorGuia.idPaquete!, { shouldDirty: true })
    }
  }, [paquetePorGuia, isEdit, setValue])

  const isLoading = isEdit && loadingAtencion
  const isSaving = createMutation.isPending || updateMutation.isPending
  const idPaqueteSeleccionado = watch('idPaquete')

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Atención' : 'Nueva Solicitud'}
      subtitle={isEdit ? 'Modifica los detalles del incidente' : 'Registra un nuevo incidente con un paquete'}
      backUrl="/atencion-paquetes"
      formId="atencion-paquete-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
      subheader={<AssignedAgencyNotice />}
    >
      <form id="atencion-paquete-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Paquete afectado"
          description="Busca el paquete por número de guía o selecciónalo de la lista."
          icon={Package}
          cols={2}
        >
          <FieldRow label="Buscar paquete" htmlFor="busquedaPaquete" span="full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="busquedaPaquete"
                placeholder="Escanear guía o buscar..."
                value={busquedaPaquete}
                onChange={(e) => setBusquedaPaquete(e.target.value)}
                className="pl-9"
                autoFocus={!isEdit}
              />
            </div>
          </FieldRow>

          <FieldRow
            label="Paquete seleccionado"
            required
            htmlFor="idPaquete"
            error={errors.idPaquete}
            span="full"
          >
            <Select
              value={idPaqueteSeleccionado ? idPaqueteSeleccionado.toString() : ''}
              onValueChange={(value) => {
                if (value) {
                  setValue('idPaquete', Number(value), { shouldValidate: true, shouldDirty: true })
                  setBusquedaPaquete('')
                }
              }}
            >
              <SelectTrigger
                id="idPaquete"
                className={cn(errors.idPaquete && 'border-destructive')}
              >
                <SelectValue placeholder="Selecciona un paquete..." />
              </SelectTrigger>
              <SelectContent>
                {paquetesFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {busquedaPaquete ? 'No se encontraron paquetes' : 'Escribe para buscar...'}
                  </div>
                ) : (
                  paquetesFiltrados.map((p) => (
                    <SelectItem key={p.idPaquete} value={p.idPaquete!.toString()}>
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono">{p.numeroGuia}</span>
                        <span className="text-muted-foreground text-xs">#{p.idPaquete}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldRow>

          {paquetePorGuia && busquedaPaquete.length >= 10 && (
            <FieldRow span="full">
              <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-2.5 text-xs text-foreground">
                <Check className="h-3.5 w-3.5" />
                Paquete encontrado:{' '}
                <span className="font-mono font-semibold">{paquetePorGuia.numeroGuia}</span>
              </div>
            </FieldRow>
          )}
        </FormSection>

        <FormSection
          title="Detalles del incidente"
          description="Clasifica el problema y describe el motivo con detalle."
          icon={AlertCircle}
          cols={2}
        >
          <FieldRow
            label="Tipo de problema"
            required
            htmlFor="tipoProblema"
            error={errors.tipoProblema}
          >
            <Select
              value={watch('tipoProblema') || ''}
              onValueChange={(value) =>
                setValue('tipoProblema', value as TipoProblemaAtencion, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger
                id="tipoProblema"
                className={cn(errors.tipoProblema && 'border-destructive')}
              >
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TipoProblemaAtencion).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_PROBLEMA_ATENCION_LABELS[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Estado inicial" htmlFor="estado">
            <Select
              value={watch('estado')}
              onValueChange={(value) =>
                setValue('estado', value as EstadoAtencion, { shouldDirty: true })
              }
            >
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EstadoAtencion).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow
            label="Motivo detallado"
            required
            htmlFor="motivo"
            error={errors.motivo}
            span="full"
          >
            <Textarea
              id="motivo"
              {...register('motivo')}
              placeholder="Describe detalladamente el problema con el paquete..."
              className={cn(
                'min-h-[120px] resize-y',
                errors.motivo && 'border-destructive'
              )}
            />
          </FieldRow>
        </FormSection>

        {isEdit && (
          <FormSection
            title="Resolución"
            description="Notas internas sobre cómo se resolvió el incidente."
            icon={ClipboardCheck}
            cols={1}
          >
            <FieldRow
              label="Observaciones de resolución"
              htmlFor="observacionesResolucion"
              span="full"
            >
              <Textarea
                id="observacionesResolucion"
                {...register('observacionesResolucion')}
                placeholder="Opcional: detalles sobre cómo se resolvió..."
                className="min-h-[100px] resize-y"
              />
            </FieldRow>
          </FormSection>
        )}
      </form>
    </FormPageLayout>
  )
}
