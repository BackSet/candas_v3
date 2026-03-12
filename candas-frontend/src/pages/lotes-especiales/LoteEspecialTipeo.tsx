import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLoteRecepcion, usePaquetesLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScanLine, Loader2, List } from 'lucide-react'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { LoadingState } from '@/components/states'
import { toast } from 'sonner'
import type { GuiaListaEtiquetadaConsultaDTO } from '@/types/listas-etiquetadas'

export default function LoteEspecialTipeo() {
  const { id: idParam } = useParams({ strict: false })
  const id = idParam ? Number(idParam) : undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: lote, isLoading } = useLoteRecepcion(id)
  const { data: paquetes = [] } = usePaquetesLoteRecepcion(id)

  const [tipiarGuia, setTipiarGuia] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [consultaResultado, setConsultaResultado] = useState<GuiaListaEtiquetadaConsultaDTO | null | 'sin_etiqueta'>(null)

  const marcarReceptadoMutation = useMutation({
    mutationFn: ({ numeroGuia }: { numeroGuia: string }) =>
      listasEtiquetadasService.marcarReceptado(numeroGuia, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', id] })
      setTipiarGuia('')
      toast.success('Paquete marcado como receptado')
      inputRef.current?.focus()
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, 'Error al marcar')
      toast.error(msg)
    },
  })

  const handleConsultarGuia = async () => {
    const n = tipiarGuia.trim().toUpperCase()
    if (!n || id == null) return
    setConsultando(true)
    setConsultaResultado(null)
    try {
      const res = await listasEtiquetadasService.consultarGuia(n)
      if (res == null) {
        setConsultaResultado('sin_etiqueta')
        marcarReceptadoMutation.mutate({ numeroGuia: n })
      } else {
        setConsultaResultado(res)
        marcarReceptadoMutation.mutate({ numeroGuia: n })
      }
    } catch {
      setConsultaResultado('sin_etiqueta')
      marcarReceptadoMutation.mutate({ numeroGuia: n })
    } finally {
      setConsultando(false)
    }
  }

  useEffect(() => {
    if (lote && lote.tipoLote !== 'ESPECIAL') {
      if (id != null) {
        navigate({ to: '/lotes-recepcion/$id', params: { id: String(id) }, replace: true })
      } else {
        navigate({ to: '/lotes-recepcion', replace: true })
      }
    }
  }, [lote, id, navigate])

  if (id == null) {
    navigate({ to: '/lotes-recepcion', replace: true })
    return null
  }

  if (isLoading || !lote) {
    return (
      <DetailPageLayout title="Cargando..." backUrl="/lotes-recepcion" maxWidth="2xl">
        <LoadingState />
      </DetailPageLayout>
    )
  }

  if (lote.tipoLote !== 'ESPECIAL') {
    return null
  }

  const mostrarResultado = consultaResultado !== null && !marcarReceptadoMutation.isPending

  return (
    <DetailPageLayout
      title={lote.numeroRecepcion || `Lote #${lote.idLoteRecepcion}`}
      subtitle="Recepción de Lote Especial"
      backUrl="/lotes-recepcion"
      maxWidth="2xl"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Barra de acciones — estilo unificado con lote normal */}
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-0.5">Acciones</p>
          <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground hover:text-foreground"
              onClick={() => navigate({ to: `/lotes-recepcion/${id}` })}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              Ir al lote
            </Button>
            <div className="w-px h-3.5 bg-border/60 mx-1" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
              <List className="h-3.5 w-3.5" />
              <span>Paquetes en este lote:</span>
              <span className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded-md text-xs">
                {paquetes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Sección Tipeo de Guías */}
        <section className="space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2 px-0.5">
            <ScanLine className="h-3.5 w-3.5" />
            Tipeo de Guías
          </h3>

          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduce el número de guía para marcarlo automáticamente como receptado.
            </p>

            <div className="flex gap-3 items-center">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <ScanLine className="h-5 w-5" />
                </div>
                <Input
                  ref={inputRef}
                  placeholder="Escanear o escribir número de guía..."
                  value={tipiarGuia}
                  onChange={(e) => setTipiarGuia(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConsultarGuia()}
                  className="text-lg h-12 pl-11 bg-background border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all shadow-sm"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleConsultarGuia}
                disabled={consultando}
                className="h-12 px-6 shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {consultando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {consultando ? 'Procesando...' : 'Receptar'}
              </Button>
            </div>

            {marcarReceptadoMutation.isPending && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/30 border border-dashed border-border animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Procesando envío...</span>
              </div>
            )}
          </div>
        </section>

        {/* Resultado del Tipeo */}
        {mostrarResultado && (
          <section className="space-y-3">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2 px-0.5">
              Resultado del Tipeo
            </h3>

            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-primary/5 border-b border-primary/10 px-6 py-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                  Tipo de paquete
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <div className="p-8 sm:p-10 space-y-6">
                <div className="space-y-3">
                  {consultaResultado === 'sin_etiqueta' ? (
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                      <p className="text-4xl sm:text-5xl font-bold tracking-tight text-muted-foreground italic">Sin etiqueta</p>
                    </div>
                  ) : (consultaResultado as GuiaListaEtiquetadaConsultaDTO).variasListas ? (
                    <div className="space-y-3">
                      <p className="text-3xl sm:text-4xl font-bold text-foreground">
                        En listas: {((consultaResultado as GuiaListaEtiquetadaConsultaDTO).etiquetas ?? []).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {((consultaResultado as GuiaListaEtiquetadaConsultaDTO).etiquetas ?? []).map((etq) => (
                        <span
                          key={etq}
                          className="inline-flex items-center rounded-xl bg-primary/15 border-2 border-primary/30 px-5 py-3 text-3xl sm:text-4xl font-bold text-primary shadow-sm"
                        >
                          {etq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(consultaResultado !== 'sin_etiqueta' && (consultaResultado as GuiaListaEtiquetadaConsultaDTO).instruccion) && (
                  <div className="p-5 sm:p-6 rounded-xl bg-amber-500/10 border border-amber-500/25 flex gap-4 items-start">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-700 dark:text-amber-300 text-sm font-bold">!</span>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Instrucción</p>
                      <p className="text-xl sm:text-2xl font-semibold text-amber-900 dark:text-amber-100">
                        {(consultaResultado as GuiaListaEtiquetadaConsultaDTO).instruccion}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </DetailPageLayout>
  )
}
