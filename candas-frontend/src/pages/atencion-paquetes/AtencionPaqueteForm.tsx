import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useAtencionPaquete, useCreateAtencionPaquete, useUpdateAtencionPaquete } from '@/hooks/useAtencionPaquetes'
import { EstadoAtencion, TipoProblemaAtencion, TIPO_PROBLEMA_ATENCION_LABELS, type AtencionPaquete } from '@/types/atencion-paquete'
import { usePaquetes, usePaquetePorNumeroGuia, usePaquete } from '@/hooks/usePaquetes'
import { Search, ArrowLeft, Save, Package, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/states'

const atencionPaqueteSchema = z.object({
  idPaquete: z.number().min(1, 'El paquete es requerido'),
  motivo: z.string().min(1, 'El motivo es requerido'),
  tipoProblema: z.nativeEnum(TipoProblemaAtencion),
  estado: z.nativeEnum(EstadoAtencion),
  observacionesResolucion: z.string().optional(),
})

type AtencionPaqueteFormData = z.infer<typeof atencionPaqueteSchema>

export default function AtencionPaqueteForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: atencion, isLoading: loadingAtencion } = useAtencionPaquete(id ? Number(id) : undefined)
  const { data: paquetesData } = usePaquetes(0, 100)
  const { data: paqueteAsociado } = usePaquete(isEdit && atencion?.idPaquete ? atencion.idPaquete : undefined)
  const createMutation = useCreateAtencionPaquete()
  const updateMutation = useUpdateAtencionPaquete()

  const [busquedaPaquete, setBusquedaPaquete] = useState('')
  const { data: paquetePorGuia } = usePaquetePorNumeroGuia(
    busquedaPaquete && busquedaPaquete.length >= 10 ? busquedaPaquete : undefined
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AtencionPaqueteFormData>({
    resolver: zodResolver(atencionPaqueteSchema),
    defaultValues: {
      estado: EstadoAtencion.PENDIENTE,
      tipoProblema: TipoProblemaAtencion.OTRO,
    },
  })

  useEffect(() => {
    if (atencion) {
      setValue('motivo', atencion.motivo)
      setValue('tipoProblema', atencion.tipoProblema)
      setValue('estado', atencion.estado)
      setValue('observacionesResolucion', atencion.observacionesResolucion || '')
    }
  }, [atencion, setValue])

  const onSubmit = async (data: AtencionPaqueteFormData) => {
    const atencionData: AtencionPaquete = {
      ...data,
      observacionesResolucion: data.observacionesResolucion || undefined,
    }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: atencionData })
      } else {
        await createMutation.mutateAsync(atencionData)
      }
      navigate({ to: '/atencion-paquetes' })
    } catch { /* hook */ }
  }

  const paquetes = useMemo(() => {
    const paquetesLista = paquetesData?.content || []
    const paquetesUnicos = new Map<number, typeof paquetesLista[0]>()
    paquetesLista.forEach(p => { if (p.idPaquete) paquetesUnicos.set(p.idPaquete, p) })
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
      const paqueteExiste = paquetes.some(p => p.idPaquete === atencion.idPaquete)
      if (paqueteExiste && watch('idPaquete') !== atencion.idPaquete) {
        setValue('idPaquete', atencion.idPaquete)
      }
    }
  }, [isEdit, atencion?.idPaquete, paquetes, setValue, watch])

  const paquetesFiltrados = useMemo(() => {
    if (!busquedaPaquete.trim()) return paquetes
    const busquedaLower = busquedaPaquete.toLowerCase().trim()
    return paquetes.filter((p) =>
      p.numeroGuia?.toLowerCase().includes(busquedaLower) ||
      p.idPaquete?.toString().includes(busquedaLower)
    )
  }, [paquetes, busquedaPaquete])

  useEffect(() => {
    if (paquetePorGuia && !isEdit) {
      setValue('idPaquete', paquetePorGuia.idPaquete!)
    }
  }, [paquetePorGuia, isEdit, setValue])

  if (isEdit && loadingAtencion) {
    return <LoadingState label="Cargando..." className="min-h-[50vh]" />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/70 backdrop-blur-xl border-b border-border/30">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/atencion-paquetes' })} type="button" className="text-muted-foreground hover:text-foreground rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {isEdit ? 'Editar Atención' : 'Nueva Solicitud'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isEdit ? 'Modifica los detalles del incidente' : 'Registra un nuevo incidente con un paquete'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: '/atencion-paquetes' })} type="button" className="rounded-lg">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg">
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Section 1: Package Selection */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Paquete Afectado</h3>
            <p className="text-xs text-muted-foreground mt-1">Busca el paquete por número de guía o ID</p>
          </div>
          <div className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm p-6 space-y-6 shadow-sm">
            <div className="space-y-2">
              <label htmlFor="idPaquete" className="text-sm font-medium">Buscar Paquete</label>
              <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50 pointer-events-none group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Escanear guía o buscar..."
                  value={busquedaPaquete}
                  onChange={(e) => setBusquedaPaquete(e.target.value)}
                  className="pl-9 bg-background rounded-xl border-border/40 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all"
                  autoFocus={!isEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar de Resultados</label>
              <Select
                value={watch('idPaquete') ? watch('idPaquete').toString() : ''}
                onValueChange={(value) => {
                  if (value) { setValue('idPaquete', Number(value)); setBusquedaPaquete('') }
                }}
              >
                <SelectTrigger className={cn("bg-background rounded-xl border-border/40", errors.idPaquete && "border-destructive focus:ring-destructive/20")}>
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
              {errors.idPaquete && <p className="text-xs text-destructive mt-1">{errors.idPaquete.message}</p>}
              {paquetePorGuia && busquedaPaquete.length >= 10 && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Paquete encontrado: <span className="font-mono font-semibold">{paquetePorGuia.numeroGuia}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Incident Details */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Detalles del Incidente</h3>
          </div>
          <div className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm p-6 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Problema <span className="text-destructive">*</span></label>
                <Select
                  value={watch('tipoProblema') || ''}
                  onValueChange={(value) => setValue('tipoProblema', value as TipoProblemaAtencion)}
                >
                  <SelectTrigger className={cn("rounded-xl border-border/40", errors.tipoProblema && "border-destructive")}>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TipoProblemaAtencion).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{TIPO_PROBLEMA_ATENCION_LABELS[tipo]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoProblema && <p className="text-xs text-destructive">{errors.tipoProblema.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estado Inicial</label>
                <Select value={watch('estado')} onValueChange={(value) => setValue('estado', value as EstadoAtencion)}>
                  <SelectTrigger className="rounded-xl border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EstadoAtencion).map((estado) => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo detallado <span className="text-destructive">*</span></label>
              <Textarea
                {...register('motivo')}
                placeholder="Describe detalladamente el problema con el paquete..."
                className={cn("min-h-[120px] resize-y rounded-xl border-border/40", errors.motivo && "border-destructive")}
              />
              {errors.motivo && <p className="text-xs text-destructive">{errors.motivo.message}</p>}
            </div>
          </div>
        </section>

        {/* Section 3: Resolution (edit only) */}
        {isEdit && (
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Resolución</h3>
            </div>
            <div className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm p-6 border-l-4 border-l-primary/20 shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Observaciones de Resolución</label>
                <Textarea
                  {...register('observacionesResolucion')}
                  placeholder="Opcional: Detalles sobre cómo se resolvió..."
                  className="min-h-[100px] rounded-xl border-border/40"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </form>
  )
}
