import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDespacho, useCreateDespacho, useUpdateDespacho, useSacasDespacho } from '@/hooks/useDespachos'
import { usePaquete } from '@/hooks/usePaquetes'
import { paqueteService } from '@/lib/api/paquete.service'
import { destinatarioDirectoService } from '@/lib/api/destinatario-directo.service'
import { useAgencias, useAgencia, useSearchAgencias, useCreateAgencia } from '@/hooks/useAgencias'
import { useDistribuidores } from '@/hooks/useDistribuidores'
import { usePaquetes } from '@/hooks/usePaquetes'
import { useDestinatarioDirecto, useDestinatariosDirectos } from '@/hooks/useDestinatariosDirectos'
import type { Despacho } from '@/types/despacho'
import { TamanoSaca } from '@/types/saca'
import { calcularTamanoSugerido } from '@/utils/saca'
import { calcularProvinciaOCantonMasComun } from '@/utils/provinciaCanton'
import { formatearTamanoSaca } from '@/utils/ensacado'
import type { Paquete } from '@/types/paquete'
import { Trash2, Plus, Copy, Loader2, Sparkles, Truck, ArrowLeft, Check, User, ArrowRight, Save, List as ListIcon, Package, SplitSquareVertical, Zap, Link2, RotateCcw } from 'lucide-react'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Controller } from 'react-hook-form'
import { useDespachoForm, type DespachoFormData } from '@/hooks/useDespachoForm'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { SectionTitle } from '@/components/ui/section-title'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { useSacasManager, type SacaFormData } from '@/hooks/useSacasManager'
import { useDistribuidorManager } from '@/hooks/useDistribuidorManager'
import { useDestinatarioDirectoManager } from '@/hooks/useDestinatarioDirectoManager'
import AgregarCadenitaFormDialog from '@/components/despacho/AgregarCadenitaFormDialog'
import PaqueteRapidoFormDialog from '@/components/despacho/PaqueteRapidoFormDialog'
import { Separator } from '@/components/ui/separator'
import { ErrorState, LoadingState } from '@/components/states'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { useDraftStore } from '@/stores/draftStore'
import { CopyActionButton } from '@/components/ui/copy-action-button'
import { generarCodigo10Digitos } from '@/schemas/destinatario-directo'
import type { TelefonoFormItem } from '@/schemas/agencia'
import { AssignedAgencyNotice } from '@/components/agency/AssignedAgencyNotice'

const DESPACHO_DRAFT_KEY = 'despacho-new'

interface DespachoDraftData {
  pasoActual: number
  tipoEnvio: 'agencia' | 'directo'
  destinatarioOrigenDirecto?: 'existente' | 'desde_paquete'
  idPaqueteOrigenDestinatario?: string
  desdePaqueteNombre?: string
  desdePaqueteTelefono?: string
  desdePaqueteDireccion?: string
  desdePaqueteCanton?: string
  desdePaqueteCodigo?: string
  sacas: SacaFormData[]
  formValues: Partial<DespachoFormData>
}

// Componente para mostrar un paquete que se está cargando
function PaqueteListItem({
  paqueteId,
  index,
  sacas,
  onMover,
  onEliminar
}: {
  paqueteId: number
  index: number
  sacas: SacaFormData[]
  onMover: (paqueteId: number, sacaOrigenIndex: number, sacaDestinoIndex: number) => void
  onEliminar: (sacaIndex: number, paqueteId: number) => void
}) {
  const { data: paquete, isLoading } = usePaquete(paqueteId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm animate-pulse">
        <div className="flex-1">
          <span className="text-muted-foreground">Cargando paquete #{paqueteId}...</span>
        </div>
      </div>
    )
  }

  if (!paquete) {
    return (
      <div className="flex items-center justify-between p-2 bg-error/10 rounded-md text-sm border border-error/20">
        <div className="flex-1">
          <span className="text-error font-medium">Paquete #{paqueteId} no encontrado</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-error hover:text-error hover:bg-error/10"
          onClick={() => onEliminar(index, paqueteId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  const direccion = paquete.direccionDestinatarioCompleta || paquete.direccionDestinatario || ''
  const observaciones = paquete.observaciones?.trim() || ''
  const hayDireccionUObs = !!direccion || !!observaciones

  return (
    <div className="flex items-start justify-between gap-2 p-2 bg-muted/30 hover:bg-muted/50 transition-colors rounded-md text-sm group border border-transparent hover:border-border/50">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-foreground">{paquete.numeroGuia || `#${paqueteId}`}</span>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
            {paquete.pesoKilos || '-'} kg
          </Badge>
        </div>
        {hayDireccionUObs && (
          <div className="space-y-0.5 text-xs text-muted-foreground">
            {direccion && (
              <p className="line-clamp-2 break-words" title={direccion}>{direccion}</p>
            )}
            {observaciones && (
              <p className="truncate" title={observaciones}>Obs: {observaciones}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {/* Botón para mover a otra saca */}
        {sacas.length > 1 && (
          <Select
            value=""
            onValueChange={(sacaDestinoIndex) => {
              const destinoIndex = parseInt(sacaDestinoIndex)
              if (destinoIndex !== index) {
                onMover(paqueteId, index, destinoIndex)
              }
            }}
          >
            <SelectTrigger className="h-7 w-24 text-[10px] px-2 h-7">
              <SelectValue placeholder="Mover..." />
            </SelectTrigger>
            <SelectContent>
              {sacas.map((s, idx) => {
                if (idx === index) return null
                return (
                  <SelectItem key={idx} value={idx.toString()}>
                    Saca {idx + 1}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
        {/* Botón para eliminar */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-error"
          onClick={() => onEliminar(index, paqueteId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

/** Recomienda tamaño por peso (si hay en paquetesAgregados) o por cantidad. */
function getTamanoSugeridoParaSaca(idPaquetes: number[], paquetesMap: Map<number, Paquete>): TamanoSaca {
  const paquetes = idPaquetes.map((id) => paquetesMap.get(id)).filter(Boolean) as Paquete[]
  return calcularTamanoSugerido(paquetes, idPaquetes.length)
}

/** Reparte total en N sacas con cantidades lo más iguales posible (ej: 77 en 4 → "20, 19, 19, 19"). */
function repartirEnNSacas(total: number, n: number): string {
  if (n <= 0 || total <= 0) return ''
  const base = Math.floor(total / n)
  const resto = total % n
  const partes: number[] = []
  for (let i = 0; i < n; i++) {
    partes.push(i < resto ? base + 1 : base)
  }
  return partes.join(', ')
}

export default function DespachoForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id
  const { saveDraft, getDraft, clearDraft } = useDraftStore()
  const draftRestored = useRef(false)

  const [pasoActual, setPasoActual] = useState(1)
  const [tipoEnvio, setTipoEnvio] = useState<'agencia' | 'directo'>('agencia')
  const [showPaquetesDialog, setShowPaquetesDialog] = useState(false)
  const [showAgregarCadenitaDialog, setShowAgregarCadenitaDialog] = useState(false)
  const [showPaqueteRapidoDialog, setShowPaqueteRapidoDialog] = useState(false)
  const [sacaSeleccionadaParaPaquetes, setSacaSeleccionadaParaPaquetes] = useState<number | null>(null)
  const [paquetesAgregados, setPaquetesAgregados] = useState<Map<number, Paquete>>(new Map())
  const [destinatarioOrigenDirecto, setDestinatarioOrigenDirecto] = useState<'existente' | 'desde_paquete'>('existente')
  const [idPaqueteOrigenDestinatario, setIdPaqueteOrigenDestinatario] = useState('')
  const [desdePaqueteNombre, setDesdePaqueteNombre] = useState('')
  const [desdePaqueteTelefono, setDesdePaqueteTelefono] = useState('')
  const [desdePaqueteDireccion, setDesdePaqueteDireccion] = useState('')
  const [desdePaqueteCanton, setDesdePaqueteCanton] = useState('')
  const [desdePaqueteCodigo, setDesdePaqueteCodigo] = useState('')

  const {
    data: despacho,
    isLoading: loadingDespacho,
    isError: isErrorDespacho,
    error: errorDespacho,
  } = useDespacho(id ? Number(id) : undefined)
  const { data: agenciasData } = useAgencias(0, 100)
  const { data: distribuidoresData } = useDistribuidores(0, 100)
  const { data: paquetesData } = usePaquetes(0, 1000)
  const { data: sacasDespacho } = useSacasDespacho(id ? Number(id) : undefined)
  const createMutation = useCreateDespacho()
  const updateMutation = useUpdateDespacho()

  const form = useDespachoForm(despacho, isEdit)
  const { setValue, watch, handleSubmit, register, control, formState: { errors } } = form

  const handleDiscardDraft = useCallback(() => {
    clearDraft(DESPACHO_DRAFT_KEY)
    window.location.reload()
  }, [clearDraft])

  const initialSacas: SacaFormData[] = useMemo(() => {
    if (sacasDespacho && sacasDespacho.length > 0) {
      return sacasDespacho.map(s => ({
        tamano: s.tamano,
        idPaquetes: s.idPaquetes || [],
      }))
    } else if (despacho?.sacas && despacho.sacas.length > 0) {
      return despacho.sacas.map(s => ({
        tamano: s.tamano,
        idPaquetes: s.idPaquetes || [],
      }))
    }
    return []
  }, [sacasDespacho, despacho?.sacas])

  const sacasManager = useSacasManager(initialSacas)
  const { sacas, setSacas } = sacasManager

  useEffect(() => {
    if (!isEdit) return
    if (sacasDespacho && sacasDespacho.length > 0) {
      const nuevasSacas: SacaFormData[] = sacasDespacho.map(s => ({
        tamano: s.tamano,
        idPaquetes: s.idPaquetes || [],
      }))
      setSacas(nuevasSacas)
      return
    }
    if (despacho?.sacas && despacho.sacas.length > 0) {
      const nuevasSacas: SacaFormData[] = despacho.sacas.map(s => ({
        tamano: s.tamano,
        idPaquetes: s.idPaquetes || [],
      }))
      setSacas(nuevasSacas)
    }
  }, [sacasDespacho, despacho?.sacas, isEdit, setSacas])

  // Restaurar borrador al montar (solo para nuevo despacho)
  useEffect(() => {
    if (isEdit || draftRestored.current) return
    draftRestored.current = true
    const draft = getDraft(DESPACHO_DRAFT_KEY)
    if (!draft) return
    const d = draft.data as unknown as DespachoDraftData
    const minutesAgo = Math.round((Date.now() - draft.savedAt) / 60000)
    if (d.pasoActual) setPasoActual(d.pasoActual)
    if (d.tipoEnvio) setTipoEnvio(d.tipoEnvio)
    if (d.destinatarioOrigenDirecto) setDestinatarioOrigenDirecto(d.destinatarioOrigenDirecto)
    if (d.idPaqueteOrigenDestinatario) setIdPaqueteOrigenDestinatario(d.idPaqueteOrigenDestinatario)
    if (d.desdePaqueteNombre) setDesdePaqueteNombre(d.desdePaqueteNombre)
    if (d.desdePaqueteTelefono) setDesdePaqueteTelefono(d.desdePaqueteTelefono)
    if (d.desdePaqueteDireccion) setDesdePaqueteDireccion(d.desdePaqueteDireccion)
    if (d.desdePaqueteCanton) setDesdePaqueteCanton(d.desdePaqueteCanton)
    if (d.desdePaqueteCodigo) setDesdePaqueteCodigo(d.desdePaqueteCodigo)
    if (d.sacas?.length) setSacas(d.sacas)
    if (d.formValues) {
      const fv = d.formValues
      if (fv.fechaDespacho) setValue('fechaDespacho', fv.fechaDespacho)
      if (fv.observaciones) setValue('observaciones', fv.observaciones)
      if (fv.codigoPresinto) setValue('codigoPresinto', fv.codigoPresinto)
      if (fv.idAgencia) setValue('idAgencia', fv.idAgencia)
      if (fv.idDistribuidor) setValue('idDistribuidor', fv.idDistribuidor)
      if (fv.numeroGuiaAgenciaDistribucion) setValue('numeroGuiaAgenciaDistribucion', fv.numeroGuiaAgenciaDistribucion)
      if (fv.idDestinatarioDirecto) setValue('idDestinatarioDirecto', fv.idDestinatarioDirecto)
    }
    const totalPaquetes = d.sacas?.reduce((acc, s) => acc + s.idPaquetes.length, 0) ?? 0
    toast.info(`Se restauró un borrador guardado hace ${minutesAgo < 1 ? 'menos de 1' : minutesAgo} min (${d.sacas?.length ?? 0} sacas, ${totalPaquetes} paquetes)`, {
      duration: 6000,
      action: { label: 'Descartar', onClick: handleDiscardDraft },
    })
  }, [isEdit])

  // Auto-guardar borrador cuando el estado cambie (solo para nuevo despacho)
  const formValues = watch()
  useEffect(() => {
    if (isEdit || !draftRestored.current) return
    const haySacas = sacas.length > 0
    const hayDatos = formValues.observaciones || formValues.codigoPresinto || formValues.idAgencia || formValues.idDestinatarioDirecto || formValues.idDistribuidor
    if (!haySacas && !hayDatos && pasoActual === 1) return
    const draftData: DespachoDraftData = {
      pasoActual,
      tipoEnvio,
      destinatarioOrigenDirecto,
      idPaqueteOrigenDestinatario,
      desdePaqueteNombre,
      desdePaqueteTelefono,
      desdePaqueteDireccion,
      desdePaqueteCanton,
      desdePaqueteCodigo,
      sacas,
      formValues: {
        fechaDespacho: formValues.fechaDespacho,
        observaciones: formValues.observaciones,
        codigoPresinto: formValues.codigoPresinto,
        idAgencia: formValues.idAgencia,
        idDistribuidor: formValues.idDistribuidor,
        numeroGuiaAgenciaDistribucion: formValues.numeroGuiaAgenciaDistribucion,
        idDestinatarioDirecto: formValues.idDestinatarioDirecto,
      },
    }
    saveDraft(DESPACHO_DRAFT_KEY, draftData as unknown as Record<string, unknown>)
  }, [isEdit, pasoActual, tipoEnvio, destinatarioOrigenDirecto, idPaqueteOrigenDestinatario, desdePaqueteNombre, desdePaqueteTelefono, desdePaqueteDireccion, desdePaqueteCanton, desdePaqueteCodigo, sacas, formValues.observaciones, formValues.codigoPresinto, formValues.idAgencia, formValues.idDestinatarioDirecto, formValues.idDistribuidor, formValues.numeroGuiaAgenciaDistribucion, formValues.fechaDespacho, saveDraft])

  const cantidadesPaquetesStr = useMemo(() =>
    sacas.map(s => s.idPaquetes.length).join(','),
    [sacas]
  )

  useEffect(() => {
    const nuevasSacas = sacas.map(saca => {
      const tamanoSugerido = getTamanoSugeridoParaSaca(saca.idPaquetes, paquetesAgregados)
      if (saca.idPaquetes.length > 0 && saca.tamano !== tamanoSugerido) {
        return { ...saca, tamano: tamanoSugerido }
      }
      return saca
    })

    const hayCambios = nuevasSacas.some((nuevaSaca, index) =>
      nuevaSaca.tamano !== sacas[index].tamano
    )

    if (hayCambios) {
      setSacas(nuevasSacas)
    }
  }, [cantidadesPaquetesStr, paquetesAgregados])

  const [listadoPaquetes, setListadoPaquetes] = useState('')
  const [procesandoListado, setProcesandoListado] = useState(false)
  const [showListadoAgrupacionDialog, setShowListadoAgrupacionDialog] = useState(false)
  const [listadoCompletoGuias, setListadoCompletoGuias] = useState('')
  const [listadoProcesadoPaquetes, setListadoProcesadoPaquetes] = useState<Paquete[] | null>(null)
  const [distribucionAgrupacion, setDistribucionAgrupacion] = useState('')
  const [tamanosSacasAgrupacion, setTamanosSacasAgrupacion] = useState<TamanoSaca[]>([])
  const [procesandoListadoAgrupacion, setProcesandoListadoAgrupacion] = useState(false)
  const [resultadoProcesamiento, setResultadoProcesamiento] = useState<{
    encontrados: number
    noEncontrados: string[]
    yaAgregados: number
    enEstadoInvalido: string[]
  } | null>(null)
  const [repartirNAgrupacion, setRepartirNAgrupacion] = useState('')

  // Estado para escaneo individual
  const [scanQuery, setScanQuery] = useState('')
  const [scanHistory, setScanHistory] = useState<Array<{ guia: string, status: 'success' | 'error' | 'warning', message: string, timestamp: Date }>>([])
  const [procesandoScan, setProcesandoScan] = useState(false)

  const agrupacionGroups = useMemo(
    () => distribucionAgrupacion.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0),
    [distribucionAgrupacion]
  )
  useEffect(() => {
    if (agrupacionGroups.length === 0 || !listadoProcesadoPaquetes?.length) {
      if (agrupacionGroups.length === 0) setTamanosSacasAgrupacion([])
      return
    }
    if (agrupacionGroups.length !== tamanosSacasAgrupacion.length) {
      let idx = 0
      const recommended = agrupacionGroups.map((qty) => {
        const paqs = listadoProcesadoPaquetes.slice(idx, idx + qty)
        idx += qty
        return calcularTamanoSugerido(paqs, qty)
      })
      setTamanosSacasAgrupacion(recommended)
    }
  }, [agrupacionGroups.length, agrupacionGroups.join(','), listadoProcesadoPaquetes, tamanosSacasAgrupacion.length])

  useEffect(() => {
    if (despacho && isEdit) {
      if (despacho.idAgencia) {
        setTipoEnvio('agencia')
      } else if (despacho.idDestinatarioDirecto || despacho.despachoDirecto) {
        setTipoEnvio('directo')
        setDestinatarioOrigenDirecto('existente')
        if (despacho.despachoDirecto?.destinatarioDirecto) {
          const destinatario = despacho.despachoDirecto.destinatarioDirecto
          setDestinatarioSeleccionado(destinatario)
          setValue('idDestinatarioDirecto', destinatario.idDestinatarioDirecto)
        } else if (despacho.idDestinatarioDirecto) {
          setValue('idDestinatarioDirecto', despacho.idDestinatarioDirecto)
        }
      }
    }
  }, [despacho, isEdit, setValue])

  const distribuidorManager = useDistribuidorManager((idDistribuidor) => {
    setValue('idDistribuidor', idDistribuidor)
  })
  const {
    nuevoDistribuidorNombre, setNuevoDistribuidorNombre,
    nuevoDistribuidorCodigo, setNuevoDistribuidorCodigo,
    nuevoDistribuidorEmail, setNuevoDistribuidorEmail,
    crearNuevoDistribuidor, setCrearNuevoDistribuidor,
    handleCrearDistribuidor: handleCrearDistribuidorFromHook,
  } = distribuidorManager

  const destinatarioManager = useDestinatarioDirectoManager((destinatario) => {
    setValue('idDestinatarioDirecto', destinatario.idDestinatarioDirecto)
    setDestinatarioSeleccionado(destinatario)
  })
  const createAgenciaMutation = useCreateAgencia()
  const [showCrearAgenciaDialog, setShowCrearAgenciaDialog] = useState(false)
  const [nuevaAgenciaNombre, setNuevaAgenciaNombre] = useState('')
  const [nuevaAgenciaCodigo, setNuevaAgenciaCodigo] = useState('')
  const [nuevaAgenciaEmail, setNuevaAgenciaEmail] = useState('')
  const [nuevaAgenciaCanton, setNuevaAgenciaCanton] = useState('')
  const [nuevaAgenciaNombrePersonal, setNuevaAgenciaNombrePersonal] = useState('')
  const [nuevaAgenciaDireccion, setNuevaAgenciaDireccion] = useState('')
  const [nuevaAgenciaHorarioAtencion, setNuevaAgenciaHorarioAtencion] = useState('')
  const [nuevaAgenciaActiva, setNuevaAgenciaActiva] = useState(true)
  const [nuevaAgenciaTelefonos, setNuevaAgenciaTelefonos] = useState<TelefonoFormItem[]>([
    { numero: '', principal: true },
  ])

  const {
    busqueda: busquedaDestinatarioDirecto, setBusqueda: setBusquedaDestinatarioDirecto,
    resultados: destinatariosDirectosResultados,
    destinatarioSeleccionado: destinatarioDirectoSeleccionado, setDestinatarioSeleccionado,
    nuevoClienteNombre, setNuevoClienteNombre,
    nuevoClienteTelefono, setNuevoClienteTelefono,
    nuevoClienteDireccion, setNuevoClienteDireccion,
    nuevoClienteCanton, setNuevoClienteCanton,
    nuevoClienteCodigo, setNuevoClienteCodigo,
    nuevoClienteNombreEmpresa, setNuevoClienteNombreEmpresa,
    nuevoClienteActivo, setNuevoClienteActivo,
    generarCodigo,
    handleCrearCliente,
  } = destinatarioManager

  const handleAgregarTelefonoAgencia = () => {
    setNuevaAgenciaTelefonos((prev) => [...prev, { numero: '', principal: false }])
  }

  const handleEliminarTelefonoAgencia = (index: number) => {
    setNuevaAgenciaTelefonos((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((_, i) => i !== index)
      if (prev[index]?.principal && next.length > 0) {
        next[0].principal = true
      }
      return next
    })
  }

  const handleCambiarPrincipalAgencia = (index: number) => {
    setNuevaAgenciaTelefonos((prev) =>
      prev.map((telefono, i) => ({ ...telefono, principal: i === index }))
    )
  }

  const handleActualizarTelefonoAgencia = (index: number, numero: string) => {
    setNuevaAgenciaTelefonos((prev) =>
      prev.map((telefono, i) => (i === index ? { ...telefono, numero } : telefono))
    )
  }

  const resetCrearAgenciaDialog = () => {
    setNuevaAgenciaNombre('')
    setNuevaAgenciaCodigo('')
    setNuevaAgenciaEmail('')
    setNuevaAgenciaCanton('')
    setNuevaAgenciaNombrePersonal('')
    setNuevaAgenciaDireccion('')
    setNuevaAgenciaHorarioAtencion('')
    setNuevaAgenciaActiva(true)
    setNuevaAgenciaTelefonos([{ numero: '', principal: true }])
  }

  const handleCrearAgenciaRapida = async () => {
    const nombre = nuevaAgenciaNombre.trim()
    if (!nombre) {
      toast.error('El nombre de la agencia es obligatorio')
      return
    }

    const telefonosValidos = nuevaAgenciaTelefonos.filter((t) => t.numero.trim() !== '')
    if (telefonosValidos.length === 0) {
      toast.error('Debe ingresar al menos un número de teléfono')
      return
    }

    if (!telefonosValidos.some((t) => t.principal)) {
      telefonosValidos[0].principal = true
    }

    try {
      const creada = await createAgenciaMutation.mutateAsync({
        nombre,
        codigo: nuevaAgenciaCodigo.trim() || undefined,
        email: nuevaAgenciaEmail.trim() || undefined,
        canton: nuevaAgenciaCanton.trim() || undefined,
        nombrePersonal: nuevaAgenciaNombrePersonal.trim() || undefined,
        direccion: nuevaAgenciaDireccion.trim() || undefined,
        horarioAtencion: nuevaAgenciaHorarioAtencion.trim() || undefined,
        activa: nuevaAgenciaActiva,
        telefonos: telefonosValidos.map((telefono) => ({
          numero: telefono.numero.trim(),
          principal: telefono.principal,
        })),
      })

      if (creada?.idAgencia != null) {
        setValue('idAgencia', creada.idAgencia)
        setTipoEnvio('agencia')
      }
      setShowCrearAgenciaDialog(false)
      resetCrearAgenciaDialog()
    } catch {
      // Error gestionado por el hook.
    }
  }

  const { data: todosDestinatariosDirectos } = useDestinatariosDirectos()
  const idAgencia = watch('idAgencia')
  const idDestinatarioDirecto = watch('idDestinatarioDirecto')
  const idDistribuidor = watch('idDistribuidor')
  const { data: agenciaSeleccionada } = useAgencia(idAgencia)
  const [busquedaAgencia, setBusquedaAgencia] = useState('')
  const { data: agenciasResultados } = useSearchAgencias(busquedaAgencia)

  const paquetesDisponibles = paquetesData?.content.filter(p => p.estado !== 'DESPACHADO') || []

  const idsPaquetesEnSacas = useMemo(() => {
    const ids = new Set<number>()
    if (sacasDespacho && sacasDespacho.length > 0) sacasDespacho.forEach(saca => saca.idPaquetes?.forEach(id => ids.add(id)))
    else if (despacho?.sacas && despacho.sacas.length > 0) despacho.sacas.forEach(saca => saca.idPaquetes?.forEach(id => ids.add(id)))
    else if (sacas.length > 0) sacas.forEach(saca => saca.idPaquetes.forEach(id => ids.add(id)))
    return Array.from(ids)
  }, [sacasDespacho, despacho?.sacas, sacas])

  const paquetesDeSacas = useMemo(() => {
    const paquetesMap = new Map<number, Paquete>()
    idsPaquetesEnSacas.forEach(idPaquete => {
      const p = paquetesData?.content.find(p => p.idPaquete === idPaquete) ||
        paquetesDisponibles.find(p => p.idPaquete === idPaquete) ||
        paquetesAgregados.get(idPaquete)
      if (p) paquetesMap.set(idPaquete, p)
    })
    return paquetesMap
  }, [idsPaquetesEnSacas, paquetesDisponibles, paquetesAgregados, paquetesData?.content])

  const todosLosPaquetes = useMemo(() => {
    const paquetesMap = new Map<number, Paquete>()
    paquetesDisponibles.forEach(p => { if (p.idPaquete) paquetesMap.set(p.idPaquete, p) })
    paquetesAgregados.forEach((p, id) => { paquetesMap.set(id, p) })
    paquetesDeSacas.forEach((p, id) => { paquetesMap.set(id, p) })
    return Array.from(paquetesMap.values())
  }, [paquetesDisponibles, paquetesAgregados, paquetesDeSacas])

  const paquetesEnSacas = useMemo(() => {
    const ids = new Set<number>()
    sacas.forEach(saca => saca.idPaquetes.forEach(id => ids.add(id)))
    return todosLosPaquetes.filter(p => p.idPaquete && ids.has(p.idPaquete))
  }, [sacas, todosLosPaquetes])

  const selectedPackagesForDestinatario = useMemo(
    () => paquetesEnSacas.filter((p): p is Paquete & { idPaquete: number } => p.idPaquete != null),
    [paquetesEnSacas]
  )

  const paquetesReferenciaDestinatarioOpciones = useMemo<ComboboxOption<Paquete>[]>(() => {
    return selectedPackagesForDestinatario.map((p) => {
      const nombre = (p.nombreClienteDestinatario ?? 'Sin nombre').trim()
      const telefono = (p.telefonoDestinatario ?? '').trim()
      const telefonoSoloDigitos = telefono.replace(/\D/g, '')
      const direccion = [p.direccionDestinatarioCompleta, p.provinciaDestinatario].filter(Boolean).join(' · ')
      return {
        value: p.idPaquete,
        label: `${nombre} | ${telefono}`.trim() || `Paquete #${p.idPaquete}`,
        description: [telefonoSoloDigitos, direccion].filter(Boolean).join(' ').toLowerCase() || undefined,
        data: p,
      }
    })
  }, [selectedPackagesForDestinatario])

  const paqueteOrigenDestinatario = useMemo(() => {
    if (!idPaqueteOrigenDestinatario) return null
    return selectedPackagesForDestinatario.find((p) => p.idPaquete === Number(idPaqueteOrigenDestinatario)) ?? null
  }, [idPaqueteOrigenDestinatario, selectedPackagesForDestinatario])

  useEffect(() => {
    if (!paqueteOrigenDestinatario) {
      setDesdePaqueteNombre('')
      setDesdePaqueteTelefono('')
      setDesdePaqueteDireccion('')
      setDesdePaqueteCanton('')
      setDesdePaqueteCodigo('')
      return
    }
    const paquete = paqueteOrigenDestinatario
    setDesdePaqueteNombre((paquete.nombreClienteDestinatario ?? '').trim())
    setDesdePaqueteTelefono((paquete.telefonoDestinatario ?? '').trim())
    setDesdePaqueteDireccion((paquete.direccionDestinatarioCompleta ?? paquete.direccionDestinatario ?? '').trim())
    setDesdePaqueteCanton((paquete.cantonDestinatario ?? paquete.provinciaDestinatario ?? '').trim())
    setDesdePaqueteCodigo(generarCodigo10Digitos())
  }, [paqueteOrigenDestinatario])

  const buscarPaquetePorGuia = async (guia: string): Promise<Paquete | null> => {
    const guiaNorm = guia.trim().toUpperCase()
    let p = paquetesDisponibles.find(x =>
      x.numeroGuia?.trim().toUpperCase() === guiaNorm || x.idPaquete?.toString() === guiaNorm
    ) || todosLosPaquetes.find(x =>
      x.numeroGuia?.trim().toUpperCase() === guiaNorm || x.idPaquete?.toString() === guiaNorm
    )
    if (!p && guiaNorm.length >= 4) {
      try { p = await paqueteService.findByNumeroGuia(guiaNorm) }
      catch { try { p = await paqueteService.findByNumeroGuia(guia.trim()) } catch { } }
    }
    return p ?? null
  }

  const provinciaOCantonPredominante = useMemo(() => {
    if (pasoActual !== 3 || paquetesEnSacas.length === 0) return { provincia: null, canton: null }
    return calcularProvinciaOCantonMasComun(paquetesEnSacas)
  }, [pasoActual, paquetesEnSacas])

  // Efecto para auto-seleccionar agencia o destinatario basado en el cantón predominante de los paquetes
  useEffect(() => {
    const cantonPredominante = provinciaOCantonPredominante.canton ?? provinciaOCantonPredominante.provincia
    if (pasoActual === 3 && cantonPredominante) {
      const valorBuscar = cantonPredominante.toUpperCase()

      if (tipoEnvio === 'agencia' && !idAgencia && agenciasData) {
        const agenciaCoincidente = agenciasData.content.find(
          (a) => a.canton?.toUpperCase() === valorBuscar && a.activa
        )
        if (agenciaCoincidente) {
          setValue('idAgencia', agenciaCoincidente.idAgencia)
          toast.info(`Se ha seleccionado automáticamente la agencia en ${agenciaCoincidente.canton ?? cantonPredominante}`, {
            duration: 3000,
            icon: <Sparkles className="h-4 w-4 text-primary" />
          })
        }
      } else if (tipoEnvio === 'directo' && destinatarioOrigenDirecto === 'existente' && !idDestinatarioDirecto && todosDestinatariosDirectos) {
        const clienteCoincidente = todosDestinatariosDirectos.find(
          (d) => d.canton?.toUpperCase() === valorBuscar && d.activo !== false
        )
        if (clienteCoincidente) {
          setValue('idDestinatarioDirecto', clienteCoincidente.idDestinatarioDirecto)
          toast.info(`Se ha seleccionado automáticamente el cliente de ${clienteCoincidente.canton ?? cantonPredominante}`, {
            duration: 3000,
            icon: <Sparkles className="h-4 w-4 text-primary" />
          })
        }
      }
    }
  }, [pasoActual, provinciaOCantonPredominante, tipoEnvio, destinatarioOrigenDirecto, idAgencia, idDestinatarioDirecto, agenciasData, todosDestinatariosDirectos, setValue])

  const agenciasOpciones = useMemo<ComboboxOption[]>(() => {
    const agencias = busquedaAgencia.length > 0 ? (agenciasResultados || []) : (agenciasData?.content || [])
    return agencias.filter(a => a.activa).map(agencia => {
      const match = (provinciaOCantonPredominante.provincia && agencia.canton?.toUpperCase() === provinciaOCantonPredominante.provincia.toUpperCase()) ||
        (provinciaOCantonPredominante.canton && agencia.canton?.toUpperCase() === provinciaOCantonPredominante.canton.toUpperCase())
      return {
        value: agencia.idAgencia!,
        label: `${agencia.nombre}${agencia.codigo ? ` (${agencia.codigo})` : ''}`,
        description: agencia.canton || undefined,
        highlighted: !!match,
        data: agencia,
      }
    })
  }, [busquedaAgencia, agenciasResultados, agenciasData, provinciaOCantonPredominante])

  const destinatariosOpciones = useMemo<ComboboxOption[]>(() => {
    const destinatarios = busquedaDestinatarioDirecto.length > 0 ? (destinatariosDirectosResultados || []) : (todosDestinatariosDirectos || [])
    return destinatarios.filter(d => d.activo !== false).map(d => {
      const match =
        (provinciaOCantonPredominante.canton && d.canton?.toUpperCase() === provinciaOCantonPredominante.canton.toUpperCase()) ||
        (provinciaOCantonPredominante.provincia && d.canton?.toUpperCase() === provinciaOCantonPredominante.provincia.toUpperCase())
      return {
        value: d.idDestinatarioDirecto!,
        label: d.nombreDestinatario,
        description: `${d.telefonoDestinatario}${d.canton ? ` • ${d.canton}` : ''}`,
        highlighted: !!match,
        data: d
      }
    })
  }, [busquedaDestinatarioDirecto, destinatariosDirectosResultados, todosDestinatariosDirectos, provinciaOCantonPredominante])

  const { data: destinatarioDirectoData } = useDestinatarioDirecto(idDestinatarioDirecto)
  const destinatarioResumen = destinatarioOrigenDirecto === 'desde_paquete'
    ? {
      nombreDestinatario: desdePaqueteNombre,
      telefonoDestinatario: desdePaqueteTelefono,
      direccionDestinatario: desdePaqueteDireccion,
      canton: desdePaqueteCanton,
      codigo: desdePaqueteCodigo,
      nombreEmpresa: undefined as string | undefined,
    }
    : {
      nombreDestinatario: (destinatarioDirectoData || destinatarioDirectoSeleccionado)?.nombreDestinatario,
      telefonoDestinatario: (destinatarioDirectoData || destinatarioDirectoSeleccionado)?.telefonoDestinatario,
      direccionDestinatario: (destinatarioDirectoData || destinatarioDirectoSeleccionado)?.direccionDestinatario,
      canton: (destinatarioDirectoData || destinatarioDirectoSeleccionado)?.canton,
      codigo: (destinatarioDirectoData || destinatarioDirectoSeleccionado)?.codigo,
      nombreEmpresa: (destinatarioDirectoData || destinatarioDirectoSeleccionado)?.nombreEmpresa,
    }

  const paquetesFaltantes = useMemo(() => idsPaquetesEnSacas.filter(id => !paquetesDeSacas.has(id)), [idsPaquetesEnSacas, paquetesDeSacas])

  useEffect(() => {
    if (isEdit && paquetesFaltantes.length > 0 && paquetesData) {
      const cargarPaquetes = async () => {
        const nuevos = new Map<number, Paquete>()
        for (const id of paquetesFaltantes) {
          try {
            const p = await paqueteService.findById(id)
            nuevos.set(id, p)
          } catch (e) { }
        }
        if (nuevos.size > 0) {
          setPaquetesAgregados(prev => {
            const m = new Map(prev)
            nuevos.forEach((p, id) => m.set(id, p))
            return m
          })
        }
      }
      cargarPaquetes()
    }
  }, [isEdit, paquetesFaltantes, paquetesData])

  const handleAgregarSaca = () => setSacas([...sacas, { tamano: TamanoSaca.PEQUENO, idPaquetes: [] }])
  const handleEliminarSaca = (index: number) => setSacas(sacas.filter((_, i) => i !== index))

  const handlePaquetesCadenitaEncontrados = (paquetes: Paquete[]) => {
    const ids = paquetes.map(p => p.idPaquete!).filter(Boolean)
    const tamano = calcularTamanoSugerido(paquetes, paquetes.length)
    const nuevaSaca: SacaFormData = {
      tamano,
      idPaquetes: ids
    }
    setSacas([...sacas, nuevaSaca])
    
    setPaquetesAgregados(prev => {
      const m = new Map(prev)
      paquetes.forEach(p => { if (p.idPaquete) m.set(p.idPaquete, p) })
      return m
    })
  }

  const handlePaqueteRapidoCreado = (paquete: Paquete) => {
    setPaquetesAgregados(prev => {
      const m = new Map(prev)
      if (paquete.idPaquete) m.set(paquete.idPaquete, paquete)
      return m
    })

    if (sacaSeleccionadaParaPaquetes !== null) {
      const nuevasSacas = [...sacas]
      if (paquete.idPaquete && !nuevasSacas[sacaSeleccionadaParaPaquetes].idPaquetes.includes(paquete.idPaquete)) {
        nuevasSacas[sacaSeleccionadaParaPaquetes].idPaquetes.push(paquete.idPaquete)
        
        // Recalcular tamaño sugerido
        const paquetesEnSaca = nuevasSacas[sacaSeleccionadaParaPaquetes].idPaquetes
          .map(id => paquetesAgregados.get(id) || (id === paquete.idPaquete ? paquete : undefined))
          .filter(Boolean) as Paquete[]
          
        nuevasSacas[sacaSeleccionadaParaPaquetes].tamano = calcularTamanoSugerido(paquetesEnSaca, paquetesEnSaca.length)
        setSacas(nuevasSacas)
      }
    }
    setSacaSeleccionadaParaPaquetes(null)
  }

  const handleSeleccionarPaquetes = (index: number) => {
    setSacaSeleccionadaParaPaquetes(index)
    setShowPaquetesDialog(true)
    setListadoPaquetes('')
    setResultadoProcesamiento(null)
  }

  const handleGuardarPaquetes = () => {
    setShowPaquetesDialog(false)
    setSacaSeleccionadaParaPaquetes(null)
    setListadoPaquetes('')
    setResultadoProcesamiento(null)
  }

  const handleProcesarListadoAgrupacion = async () => {
    const guias = listadoCompletoGuias.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (guias.length === 0) {
      toast.error('Ingresa al menos una guía por línea')
      return
    }
    setProcesandoListadoAgrupacion(true)
    setListadoProcesadoPaquetes(null)
    const encontrados: Paquete[] = []
    const noEncontrados: string[] = []
    const enEstadoInvalido: string[] = []
    for (const guia of guias) {
      const p = await buscarPaquetePorGuia(guia)
      if (p) {
        if (p.estado === 'DESPACHADO') enEstadoInvalido.push(guia)
        else encontrados.push(p)
      } else noEncontrados.push(guia)
    }
    setListadoProcesadoPaquetes(encontrados)
    if (noEncontrados.length) toast.error(`${noEncontrados.length} guía(s) no encontrada(s)`)
    if (enEstadoInvalido.length) toast.warning(`${enEstadoInvalido.length} ya despachada(s)`)
    if (encontrados.length) toast.success(`${encontrados.length} paquete(s) listo(s). Indica la distribución (ej: 1,4,5).`)
    setProcesandoListadoAgrupacion(false)
  }

  const handleAplicarListadoAgrupacion = () => {
    if (!listadoProcesadoPaquetes?.length) return
    const totalDist = agrupacionGroups.reduce((a, b) => a + b, 0)
    if (totalDist !== listadoProcesadoPaquetes.length) {
      toast.error(`La suma de la distribución (${totalDist}) debe coincidir con el total de paquetes (${listadoProcesadoPaquetes.length})`)
      return
    }
    const idsOrden = listadoProcesadoPaquetes.map(p => p.idPaquete!).filter((id): id is number => id != null)
    let idx = 0
    const nuevasSacas: SacaFormData[] = agrupacionGroups.map((qty, i) => {
      const idPaquetes = idsOrden.slice(idx, idx + qty)
      idx += qty
      const tamano = tamanosSacasAgrupacion[i] ?? TamanoSaca.GRANDE
      return { tamano, idPaquetes }
    })
    setSacas(nuevasSacas)
    setPaquetesAgregados(prev => {
      const m = new Map(prev)
      listadoProcesadoPaquetes.forEach(p => { if (p.idPaquete) m.set(p.idPaquete, p) })
      return m
    })
    setShowListadoAgrupacionDialog(false)
    setListadoCompletoGuias('')
    setListadoProcesadoPaquetes(null)
    setDistribucionAgrupacion('')
    setTamanosSacasAgrupacion([])
    toast.success('Sacas creadas. Revisa el paso 2.')
  }

  const handleProcesarListado = async () => {
    if (!listadoPaquetes.trim() || sacaSeleccionadaParaPaquetes === null) {
      toast.error('Ingresa al menos un número de guía')
      return
    }
    const numerosGuia = listadoPaquetes.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (numerosGuia.length === 0) return

    setProcesandoListado(true)
    setResultadoProcesamiento(null)

    let encontrados = 0, yaAgregados = 0
    let noEncontrados: string[] = [], enEstadoInvalido: string[] = []
    const nuevasSacas = [...sacas]
    const mapParaSugerido = new Map(paquetesAgregados)

    for (const guia of numerosGuia) {
      const p = await buscarPaquetePorGuia(guia)

      if (p) {
        if (p.estado === 'DESPACHADO') {
          enEstadoInvalido.push(guia)
          continue
        }

        // Si está en otra saca del mismo despacho, moverlo
        const enOtra = nuevasSacas.findIndex((s, idx) => idx !== sacaSeleccionadaParaPaquetes && s.idPaquetes.includes(p!.idPaquete!))
        if (enOtra !== -1) nuevasSacas[enOtra].idPaquetes = nuevasSacas[enOtra].idPaquetes.filter(id => id !== p!.idPaquete)

        // Asegurar que esté en paquetesAgregados
        if (!paquetesAgregados.has(p!.idPaquete!)) {
          setPaquetesAgregados(prev => {
            const n = new Map(prev)
            n.set(p!.idPaquete!, p!)
            return n
          })
        }

        // Agregar a la saca actual
        if (!nuevasSacas[sacaSeleccionadaParaPaquetes!].idPaquetes.includes(p!.idPaquete!)) {
          nuevasSacas[sacaSeleccionadaParaPaquetes!].idPaquetes.push(p!.idPaquete!)
          mapParaSugerido.set(p!.idPaquete!, p!)
          encontrados++
        } else {
          yaAgregados++
        }
      } else {
        noEncontrados.push(guia)
      }
    }

    if (sacaSeleccionadaParaPaquetes !== null) {
      nuevasSacas[sacaSeleccionadaParaPaquetes].tamano = getTamanoSugeridoParaSaca(
        nuevasSacas[sacaSeleccionadaParaPaquetes].idPaquetes,
        mapParaSugerido
      )
    }
    setSacas(nuevasSacas)
    setResultadoProcesamiento({ encontrados, noEncontrados, yaAgregados, enEstadoInvalido })
    setProcesandoListado(false)
    setListadoPaquetes('')
  }

  const handleScanIndividual = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!scanQuery.trim() || sacaSeleccionadaParaPaquetes === null) return

    const guia = scanQuery.trim()
    setProcesandoScan(true)

    try {
      const p = await buscarPaquetePorGuia(guia)
      const nuevoHistory = [...scanHistory]

      if (!p) {
        nuevoHistory.unshift({ guia, status: 'error', message: 'No encontrado', timestamp: new Date() })
        // Play sound error optional
      } else if (p.estado === 'DESPACHADO') {
        nuevoHistory.unshift({ guia, status: 'error', message: 'Ya despachado', timestamp: new Date() })
      } else {
        const nuevasSacas = [...sacas]
        const enOtra = nuevasSacas.findIndex((s, idx) => idx !== sacaSeleccionadaParaPaquetes && s.idPaquetes.includes(p!.idPaquete!))
        let msgExtra = ''

        if (enOtra !== -1) {
          nuevasSacas[enOtra].idPaquetes = nuevasSacas[enOtra].idPaquetes.filter(id => id !== p!.idPaquete)
          nuevasSacas[enOtra].tamano = getTamanoSugeridoParaSaca(nuevasSacas[enOtra].idPaquetes, paquetesAgregados)
          msgExtra = `(Movido de Saca ${enOtra + 1})`
        }

        setPaquetesAgregados(prev => {
          const m = new Map(prev)
          m.set(p!.idPaquete!, p!)
          return m
        })

        if (nuevasSacas[sacaSeleccionadaParaPaquetes].idPaquetes.includes(p.idPaquete!)) {
          nuevoHistory.unshift({ guia, status: 'warning', message: 'Ya está en esta saca', timestamp: new Date() })
        } else {
          nuevasSacas[sacaSeleccionadaParaPaquetes].idPaquetes.push(p.idPaquete!)
          nuevasSacas[sacaSeleccionadaParaPaquetes].tamano = getTamanoSugeridoParaSaca(nuevasSacas[sacaSeleccionadaParaPaquetes].idPaquetes, paquetesAgregados)
          setSacas(nuevasSacas)
          nuevoHistory.unshift({ guia, status: 'success', message: `Agregado ${msgExtra}`, timestamp: new Date() })
        }
      }

      setScanHistory(nuevoHistory.slice(0, 50)) // Keep last 50
      setScanQuery('')
    } finally {
      setProcesandoScan(false)
    }
  }

  const handleEliminarPaqueteDeSaca = (sacaIndex: number, paqueteId: number) => {
    const nuevasSacas = [...sacas]
    nuevasSacas[sacaIndex].idPaquetes = nuevasSacas[sacaIndex].idPaquetes.filter(id => id !== paqueteId)
    nuevasSacas[sacaIndex].tamano = getTamanoSugeridoParaSaca(nuevasSacas[sacaIndex].idPaquetes, paquetesAgregados)
    setSacas(nuevasSacas)
  }

  const handleMoverPaqueteASaca = (paqueteId: number, sacaOrigenIndex: number, sacaDestinoIndex: number) => {
    const nuevasSacas = [...sacas]
    nuevasSacas[sacaOrigenIndex].idPaquetes = nuevasSacas[sacaOrigenIndex].idPaquetes.filter(id => id !== paqueteId)
    if (!nuevasSacas[sacaDestinoIndex].idPaquetes.includes(paqueteId)) {
      nuevasSacas[sacaDestinoIndex].idPaquetes.push(paqueteId)
    }
    nuevasSacas[sacaOrigenIndex].tamano = getTamanoSugeridoParaSaca(nuevasSacas[sacaOrigenIndex].idPaquetes, paquetesAgregados)
    nuevasSacas[sacaDestinoIndex].tamano = getTamanoSugeridoParaSaca(nuevasSacas[sacaDestinoIndex].idPaquetes, paquetesAgregados)
    setSacas(nuevasSacas)
  }

  const onSubmit = async (data: DespachoFormData) => {
    if (sacas.length === 0) {
      toast.error('Debe haber al menos una saca'); return
    }
    for (let i = 0; i < sacas.length; i++) {
      if (sacas[i].idPaquetes.length === 0) {
        toast.error(`La saca ${i + 1} debe tener al menos un paquete`); return
      }
    }
    if (tipoEnvio === 'agencia' && !data.idAgencia) {
      toast.error('Selecciona una agencia'); return
    }
    if (tipoEnvio === 'directo' && destinatarioOrigenDirecto === 'existente' && !data.idDestinatarioDirecto) {
      toast.error('Selecciona un destinatario'); return
    }
    if (tipoEnvio === 'directo' && destinatarioOrigenDirecto === 'desde_paquete' && !idPaqueteOrigenDestinatario) {
      toast.error('Selecciona un paquete de referencia para el destinatario')
      return
    }

    try {
      let idDestinatarioDirectoPayload = tipoEnvio === 'directo' ? data.idDestinatarioDirecto : undefined
      if (tipoEnvio === 'directo' && destinatarioOrigenDirecto === 'desde_paquete') {
        if (!desdePaqueteNombre.trim()) {
          toast.error('El paquete seleccionado no tiene nombre de destinatario válido')
          return
        }
        const nuevoDestinatario = await destinatarioDirectoService.create({
          nombreDestinatario: desdePaqueteNombre.trim(),
          telefonoDestinatario: desdePaqueteTelefono.trim() || '—',
          direccionDestinatario: desdePaqueteDireccion.trim() || undefined,
          canton: desdePaqueteCanton.trim() || undefined,
          codigo: desdePaqueteCodigo.trim() || undefined,
          activo: true,
        })
        idDestinatarioDirectoPayload = nuevoDestinatario.idDestinatarioDirecto
        if (idDestinatarioDirectoPayload) {
          setValue('idDestinatarioDirecto', idDestinatarioDirectoPayload)
        }
        setDestinatarioSeleccionado(nuevoDestinatario)
      }

      const despachoData: Despacho = {
        fechaDespacho: new Date(data.fechaDespacho).toISOString(),
        usuarioRegistro: data.usuarioRegistro,
        observaciones: data.observaciones || undefined,
        codigoPresinto: data.codigoPresinto?.trim() || undefined,
        idAgencia: tipoEnvio === 'agencia' ? data.idAgencia : undefined,
        idDistribuidor: data.idDistribuidor,
        numeroGuiaAgenciaDistribucion: data.numeroGuiaAgenciaDistribucion || undefined,
        idDestinatarioDirecto: idDestinatarioDirectoPayload,
        idPaqueteOrigenDestinatario: undefined,
        sacas: sacas.map(s => ({ tamano: s.tamano, idPaquetes: s.idPaquetes })),
      }

      if (isEdit) await updateMutation.mutateAsync({ id: Number(id), dto: despachoData })
      else {
        const res = await createMutation.mutateAsync(despachoData)
        clearDraft(DESPACHO_DRAFT_KEY)
        toast.success(`Despacho creado: ${res.numeroManifiesto}`)
      }
      navigate({ to: '/despachos' })
    } catch (e) {
      // Error manejado por el hook
    }
  }

  if (isEdit && loadingDespacho) return <LoadingState label="Cargando..." className="min-h-[50vh]" />
  if (isEdit && isErrorDespacho) {
    return (
      <ErrorState
        title="No se pudo cargar el despacho"
        description={(errorDespacho as Error | undefined)?.message ?? 'Intenta nuevamente en unos segundos.'}
        className="min-h-[50vh]"
      />
    )
  }

  return (
    <StandardPageLayout
      width="md"
      title={isEdit ? 'Editar Despacho' : 'Nuevo Despacho'}
      subtitle={isEdit ? 'Modifica la información del despacho' : 'Completa los pasos para crear el despacho'}
      icon={<Truck className="h-4 w-4" />}
      className="min-h-0 bg-background font-sans"
      spacing="8"
      actions={
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {!isEdit && getDraft(DESPACHO_DRAFT_KEY) && (
            <Button variant="ghost" size="sm" onClick={handleDiscardDraft} className="text-muted-foreground hover:text-destructive" title="Descartar borrador y empezar de cero">
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar borrador
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/despachos' })} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Stepper con etiquetas */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-0 sm:justify-between">
            {[
              { step: 1, label: 'Información' },
              { step: 2, label: 'Sacas' },
              { step: 3, label: 'Destino' },
              { step: 4, label: 'Confirmar' },
            ].map(({ step, label }, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === pasoActual ? 'bg-primary text-primary-foreground' :
                      step < pasoActual ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {step < pasoActual ? <Check className="h-4 w-4" /> : step}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium hidden sm:block ${step === pasoActual ? 'text-foreground' : step < pasoActual ? 'text-primary' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {i < 3 && <div className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 rounded-full hidden sm:block ${step < pasoActual ? 'bg-primary/20' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          {/* Resumen contextual */}
          {pasoActual >= 2 && (
            <div className="text-center py-2 px-3 rounded-md bg-muted/50 border border-border/50 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{sacas.length} sacas</span>
              <span> · </span>
              <span className="font-medium text-foreground">{sacas.reduce((acc, s) => acc + s.idPaquetes.length, 0)} paquetes</span>
              {pasoActual === 4 && (tipoEnvio === 'agencia' && agenciaSeleccionada) && (
                <>
                  <span> · </span>
                  <span>Destino: {agenciaSeleccionada.nombre}</span>
                </>
              )}
              {pasoActual === 4 && tipoEnvio === 'directo' && (
                <>
                  <span> · </span>
                  <span>
                    Destino: {destinatarioOrigenDirecto === 'existente'
                      ? ((destinatarioDirectoData || destinatarioDirectoSeleccionado)?.nombreDestinatario ?? 'Cliente directo')
                      : (desdePaqueteNombre || 'Cliente desde paquete')}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* PASO 1: INFO BÁSICA */}
          {pasoActual === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-6">
                <SectionTitle title="Información del Despacho" variant="form" />
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Datos del despacho</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fechaDespacho" className="text-sm font-medium">Fecha y hora</Label>
                      <Controller
                        name="fechaDespacho"
                        control={control}
                        render={({ field }) => (
                          <DateTimePickerForm
                            id="fechaDespacho"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormError message={errors.fechaDespacho?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Usuario</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input {...register('usuarioRegistro')} readOnly disabled className="pl-10 bg-muted/50" />
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Observaciones</Label>
                    <Textarea {...register('observaciones')} rows={2} placeholder="Notas adicionales del despacho..." className="resize-none" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigoPresinto" className="text-sm font-medium">Código de presinto de seguridad</Label>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        id="codigoPresinto"
                        {...register('codigoPresinto')}
                        placeholder="Escribir o generar"
                        className="font-mono flex-1 min-w-[200px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setValue('codigoPresinto', String(Math.floor(1000000000 + Math.random() * 9000000000)))}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Generar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => setPasoActual(2)}>
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: SACAS */}
          {pasoActual === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
                <SectionTitle title="Gestionar Sacas" variant="form" className="border-0 pb-0 mb-0" />
                {sacas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={handleAgregarSaca}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar saca
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowListadoAgrupacionDialog(true)} title="Pega un listado completo de guías y distribúyelas en sacas">
                      <ListIcon className="h-4 w-4 mr-2" /> Carga masiva
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowAgregarCadenitaDialog(true)} title="Agregar guías hijas tipo CADENITA en una nueva saca">
                      <Link2 className="h-4 w-4 mr-2" /> Cadenita
                    </Button>
                  </div>
                )}
              </div>

              {sacas.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold text-foreground text-center">¿Cómo quieres cargar los paquetes?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setShowListadoAgrupacionDialog(true)}
                      className="group rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 p-5 flex flex-col items-center text-center gap-3 transition-colors transition-shadow duration-150 hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <ListIcon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">Carga masiva</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">Pega un listado de guías y distribúyelas automáticamente en sacas</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAgregarSaca}
                      className="group rounded-xl border-2 border-border hover:border-primary/30 bg-card hover:bg-muted/30 p-5 flex flex-col items-center text-center gap-3 transition-colors transition-shadow duration-150 hover:shadow-md"
                    >
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Package className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">Saca manual</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">Crea una saca vacía y agrega paquetes uno a uno escaneando</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAgregarCadenitaDialog(true)}
                      className="group rounded-xl border-2 border-border hover:border-primary/30 bg-card hover:bg-muted/30 p-5 flex flex-col items-center text-center gap-3 transition-colors transition-shadow duration-150 hover:shadow-md"
                    >
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Link2 className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">Cadenita</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">Ingresa la guía padre y se agrupan automáticamente las guías hijas</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sacas.map((saca, index) => (
                    <div key={index} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
                      <div className="p-3 sm:p-4 bg-muted/30 flex items-center justify-between border-b border-border/50 flex-wrap gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="bg-background font-semibold">Saca {index + 1}</Badge>
                          <Select value={saca.tamano} onValueChange={(v: TamanoSaca) => {
                            const ms = [...sacas]; ms[index].tamano = v; setSacas(ms)
                          }}>
                            <SelectTrigger className="h-9 w-36 text-sm bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                              <SelectItem value="PEQUENO">Pequeño</SelectItem>
                              <SelectItem value="MEDIANO">Mediano</SelectItem>
                              <SelectItem value="GRANDE">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-error shrink-0" onClick={() => handleEliminarSaca(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{saca.idPaquetes.length} paquetes</span>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleSeleccionarPaquetes(index)}>
                              <Plus className="h-4 w-4 mr-1.5" /> Agregar paquetes
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => { setSacaSeleccionadaParaPaquetes(index); setShowPaqueteRapidoDialog(true) }} title="Crear paquete SEPARAR rápido">
                              <Zap className="h-4 w-4 mr-1.5" /> Paquete Rápido
                            </Button>
                          </div>
                        </div>

                        {saca.idPaquetes.length > 0 && (
                          <div className="space-y-2 overflow-x-hidden">
                            {saca.idPaquetes.map(pid => (
                              <PaqueteListItem
                                key={pid}
                                paqueteId={pid}
                                index={index}
                                sacas={sacas}
                                onMover={handleMoverPaqueteASaca}
                                onEliminar={handleEliminarPaqueteDeSaca}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setPasoActual(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <Button type="button" onClick={() => setPasoActual(3)} className="sm:ml-auto">
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3: DESTINO */}
          {pasoActual === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-6">
                <SectionTitle title="Destino del Despacho" variant="form" />
                <AssignedAgencyNotice />

                {(provinciaOCantonPredominante.canton || provinciaOCantonPredominante.provincia) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm flex items-start gap-2 text-primary">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>Sugerencia: La mayoría de paquetes van a <strong>{provinciaOCantonPredominante.canton ?? provinciaOCantonPredominante.provincia}</strong>.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button type="button"
                    onClick={() => {
                      setTipoEnvio('agencia')
                      setDestinatarioOrigenDirecto('existente')
                      setValue('idDestinatarioDirecto', undefined)
                      setDestinatarioSeleccionado(null)
                      setIdPaqueteOrigenDestinatario('')
                      setDesdePaqueteNombre('')
                      setDesdePaqueteTelefono('')
                      setDesdePaqueteDireccion('')
                      setDesdePaqueteCanton('')
                      setDesdePaqueteCodigo('')
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-colors duration-150 flex flex-col items-center justify-center gap-2 ${tipoEnvio === 'agencia' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                  >
                    <Truck className={`h-8 w-8 ${tipoEnvio === 'agencia' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-semibold">Agencia</span>
                    <span className="text-xs text-muted-foreground">Envío a sucursal</span>
                  </button>
                  <button type="button"
                    onClick={() => {
                      setTipoEnvio('directo')
                      setValue('idAgencia', undefined)
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-colors duration-150 flex flex-col items-center justify-center gap-2 ${tipoEnvio === 'directo' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                  >
                    <User className={`h-8 w-8 ${tipoEnvio === 'directo' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-semibold">Cliente Directo</span>
                    <span className="text-xs text-muted-foreground">Envío a cliente final</span>
                  </button>
                </div>

                {tipoEnvio === 'agencia' ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Agencia destino</Label>
                    <div className="flex gap-2 items-end flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Combobox
                          options={agenciasOpciones}
                          value={idAgencia || null}
                          onValueChange={(v) => setValue('idAgencia', v ? Number(v) : undefined)}
                          placeholder="Buscar agencia..."
                          onSearchChange={setBusquedaAgencia}
                          searchValue={busquedaAgencia}
                        />
                      </div>
                      <Button type="button" variant="outline" className="h-9 w-9 p-0 rounded-md" onClick={() => setShowCrearAgenciaDialog(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {agenciaSeleccionada && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border text-sm space-y-1">
                        <p className="font-medium">{agenciaSeleccionada.nombre}</p>
                        <p className="text-muted-foreground">{agenciaSeleccionada.direccion}</p>
                        <p className="text-muted-foreground">{agenciaSeleccionada.canton}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Origen del destinatario</Label>
                      <Select
                        value={destinatarioOrigenDirecto}
                        onValueChange={(value) => {
                          const origen = value as 'existente' | 'desde_paquete'
                          setDestinatarioOrigenDirecto(origen)
                          setValue('idDestinatarioDirecto', undefined)
                          setDestinatarioSeleccionado(null)
                          setIdPaqueteOrigenDestinatario('')
                          if (origen === 'existente') {
                            setDesdePaqueteNombre('')
                            setDesdePaqueteTelefono('')
                            setDesdePaqueteDireccion('')
                            setDesdePaqueteCanton('')
                            setDesdePaqueteCodigo('')
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="existente">Destinatario existente</SelectItem>
                          <SelectItem value="desde_paquete">Desde datos de un paquete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {destinatarioOrigenDirecto === 'existente' ? (
                      <div className="flex gap-2 items-end flex-wrap">
                        <div className="flex-1 min-w-[200px] space-y-2">
                          <Label className="text-sm font-medium">Buscar destinatario</Label>
                          <Combobox
                            options={destinatariosOpciones}
                            value={idDestinatarioDirecto || null}
                            onValueChange={(v) => {
                              setValue('idDestinatarioDirecto', v ? Number(v) : undefined)
                              if (v) {
                                const d = destinatariosDirectosResultados?.find(x => x.idDestinatarioDirecto === v) || todosDestinatariosDirectos?.find(x => x.idDestinatarioDirecto === v)
                                if (d) setDestinatarioSeleccionado(d)
                              } else setDestinatarioSeleccionado(null)
                            }}
                            placeholder="Nombre, teléfono..."
                            onSearchChange={setBusquedaDestinatarioDirecto}
                            searchValue={busquedaDestinatarioDirecto}
                          />
                        </div>
                        <Button type="button" variant="outline" className="h-9 w-9 p-0 rounded-md" onClick={() => destinatarioManager.setShowCrearClienteDialog(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Paquete de referencia</Label>
                          <Combobox
                            options={paquetesReferenciaDestinatarioOpciones}
                            value={idPaqueteOrigenDestinatario ? Number(idPaqueteOrigenDestinatario) : null}
                            onValueChange={(v) => setIdPaqueteOrigenDestinatario(v ? String(v) : '')}
                            placeholder="Buscar por nombre, teléfono o dirección..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Nombre</Label>
                            <Input value={desdePaqueteNombre} onChange={(e) => setDesdePaqueteNombre(e.target.value)} placeholder="Nombre del destinatario" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Teléfono</Label>
                            <Input value={desdePaqueteTelefono} onChange={(e) => setDesdePaqueteTelefono(e.target.value)} placeholder="Teléfono" />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs font-medium">Dirección</Label>
                            <Input value={desdePaqueteDireccion} onChange={(e) => setDesdePaqueteDireccion(e.target.value)} placeholder="Dirección" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Cantón</Label>
                            <Input value={desdePaqueteCanton} onChange={(e) => setDesdePaqueteCanton(e.target.value)} placeholder="Cantón" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Código</Label>
                            <Input value={desdePaqueteCodigo} onChange={(e) => setDesdePaqueteCodigo(e.target.value)} placeholder="Código interno" className="font-mono" />
                          </div>
                        </div>
                      </div>
                    )}
                    {(destinatarioOrigenDirecto === 'existente' && (destinatarioDirectoData || destinatarioDirectoSeleccionado)) && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border text-sm space-y-1">
                        <p className="font-medium">{(destinatarioDirectoData || destinatarioDirectoSeleccionado)?.nombreDestinatario}</p>
                        <p className="text-muted-foreground">{(destinatarioDirectoData || destinatarioDirectoSeleccionado)?.telefonoDestinatario}</p>
                        <p className="text-muted-foreground">{(destinatarioDirectoData || destinatarioDirectoSeleccionado)?.direccionDestinatario}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setPasoActual(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <Button type="button" onClick={() => setPasoActual(4)} className="sm:ml-auto">
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 4: CONFIRMACIÓN Y DISTRIBUIDOR */}
          {pasoActual === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <section className="space-y-6">
                <SectionTitle title="Distribución y Finalización" variant="form" />

                <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Logística (opcional)</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Distribuidor</Label>
                      <div className="flex flex-wrap gap-2">
                        <Select value={idDistribuidor?.toString() || ''} onValueChange={(v) => setValue('idDistribuidor', Number(v))}>
                          <SelectTrigger className="flex-1 min-w-[200px]">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {distribuidoresData?.content.filter(d => d.activa).map(d => (
                              <SelectItem key={d.idDistribuidor} value={d.idDistribuidor!.toString()}>{d.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={() => setCrearNuevoDistribuidor(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Guía Agencia Distribución</Label>
                      <Input {...register('numeroGuiaAgenciaDistribucion')} placeholder="Número de guía..." />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm bg-primary/5 border-primary/10">
                  <SectionTitle title="Resumen" variant="form" as="h3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Sacas</span>
                      <p className="text-2xl font-bold">{sacas.length}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Paquetes</span>
                      <p className="text-2xl font-bold">{sacas.reduce((acc, s) => acc + s.idPaquetes.length, 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Peso Total Est.</span>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-semibold select-all">
                          {sacas.reduce((acc, s) => acc + s.idPaquetes.reduce((sum, pid) => {
                            const p = paquetesAgregados.get(pid) || todosLosPaquetes.find(x => x.idPaquete === pid);
                            return sum + (p?.pesoKilos || 0)
                          }, 0), 0).toFixed(2)} kg
                        </p>
                        <CopyActionButton
                          textToCopy={`${sacas.reduce((acc, s) => acc + s.idPaquetes.reduce((sum, pid) => {
                            const p = paquetesAgregados.get(pid) || todosLosPaquetes.find(x => x.idPaquete === pid);
                            return sum + (p?.pesoKilos || 0)
                          }, 0), 0).toFixed(2)} kg`}
                          successMessage="Peso copiado"
                          errorMessage="No se pudo copiar el peso"
                          title="Copiar peso"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </CopyActionButton>
                      </div>
                    </div>
                  </div>

                  {/* Total de sacas por tamaño */}
                  <div className="mb-6">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">Sacas por tamaño</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Individual</span>
                        <p className="text-lg font-semibold">{sacas.filter(s => s.tamano === TamanoSaca.INDIVIDUAL).length}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Pequeño</span>
                        <p className="text-lg font-semibold">{sacas.filter(s => s.tamano === TamanoSaca.PEQUENO).length}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Mediano</span>
                        <p className="text-lg font-semibold">{sacas.filter(s => s.tamano === TamanoSaca.MEDIANO).length}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Grande</span>
                        <p className="text-lg font-semibold">{sacas.filter(s => s.tamano === TamanoSaca.GRANDE).length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información de destino */}
                  {(tipoEnvio === 'agencia' && agenciaSeleccionada) || (tipoEnvio === 'directo' && !!destinatarioResumen.nombreDestinatario) ? (
                    <div className="pt-4 border-t border-primary/20">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                        {tipoEnvio === 'agencia' ? 'Agencia' : 'Destinatario Directo'}
                      </span>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-muted-foreground">Nombre:</span>
                          <p className="text-sm font-medium">
                            {tipoEnvio === 'agencia'
                              ? agenciaSeleccionada?.nombre
                              : destinatarioResumen.nombreDestinatario}
                          </p>
                          {tipoEnvio === 'agencia' && agenciaSeleccionada?.codigo && (
                            <div className="mt-2">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Código</span>
                              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 shadow-sm">
                                <span className="font-mono text-base font-semibold text-foreground select-all tabular-nums">
                                  {agenciaSeleccionada.codigo}
                                </span>
                                <CopyActionButton
                                  textToCopy={agenciaSeleccionada.codigo}
                                  successMessage="Código copiado"
                                  errorMessage="No se pudo copiar el código"
                                  title="Copiar código"
                                  className="h-8 shrink-0 gap-1.5"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Copiar
                                </CopyActionButton>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Teléfono:</span>
                          <p className="text-sm font-medium">
                            {tipoEnvio === 'agencia'
                              ? (agenciaSeleccionada?.telefonos?.find(t => t.principal)?.numero || agenciaSeleccionada?.telefonos?.[0]?.numero || 'N/A')
                              : destinatarioResumen.telefonoDestinatario || 'N/A'}
                          </p>
                        </div>
                        {tipoEnvio === 'directo' && (destinatarioResumen.codigo || destinatarioResumen.nombreEmpresa) && (
                          <>
                            {destinatarioResumen.codigo && (
                              <div className="mt-2">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Código</span>
                                <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 shadow-sm">
                                  <span className="font-mono text-base font-semibold text-foreground select-all tabular-nums">
                                    {destinatarioResumen.codigo}
                                  </span>
                                  <CopyActionButton
                                    textToCopy={destinatarioResumen.codigo ?? ''}
                                    successMessage="Código copiado"
                                    errorMessage="No se pudo copiar el código"
                                    title="Copiar código"
                                    className="h-8 shrink-0 gap-1.5"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copiar
                                  </CopyActionButton>
                                </div>
                              </div>
                            )}
                            {destinatarioResumen.nombreEmpresa && (
                              <div>
                                <span className="text-xs text-muted-foreground">Nombre empresa:</span>
                                <p className="text-sm text-muted-foreground">{destinatarioResumen.nombreEmpresa}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setPasoActual(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 sm:ml-auto">
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEdit ? 'Actualizar Despacho' : 'Crear Despacho'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* DIALOGOS */}
      <Dialog open={showListadoAgrupacionDialog} onOpenChange={(v) => {
        setShowListadoAgrupacionDialog(v)
        if (!v) {
          setListadoCompletoGuias('')
          setListadoProcesadoPaquetes(null)
          setDistribucionAgrupacion('')
          setTamanosSacasAgrupacion([])
          setRepartirNAgrupacion('')
        }
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listado de guías y distribución</DialogTitle>
            <DialogDescription>
              Pega el listado de guías (una por línea), indica la distribución en sacas y aplica.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Listado completo de guías</Label>
              <Textarea
                value={listadoCompletoGuias}
                onChange={(e) => setListadoCompletoGuias(e.target.value)}
                placeholder="Una guía por línea..."
                className="font-mono min-h-[120px] resize-y"
              />
              <Button
                type="button"
                onClick={handleProcesarListadoAgrupacion}
                disabled={!listadoCompletoGuias.trim() || procesandoListadoAgrupacion}
              >
                {procesandoListadoAgrupacion ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Procesar
              </Button>
            </div>
            {listadoProcesadoPaquetes !== null && (
              <>
                <p className="text-sm text-muted-foreground">
                  <strong>{listadoProcesadoPaquetes.length}</strong> paquete(s) encontrado(s).
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Acciones rápidas</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDistribucionAgrupacion(String(listadoProcesadoPaquetes.length))}
                      className="h-9 gap-1.5 font-medium"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Todo en 1 saca
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Repartir en</span>
                      <Input
                        type="number"
                        min={1}
                        max={listadoProcesadoPaquetes.length}
                        placeholder="N"
                        value={repartirNAgrupacion}
                        onChange={(e) => setRepartirNAgrupacion(e.target.value)}
                        className="w-16 h-9 font-mono text-center"
                        aria-label="Número de sacas"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">sacas</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const n = parseInt(repartirNAgrupacion.trim(), 10)
                          if (!Number.isNaN(n) && n >= 1 && n <= listadoProcesadoPaquetes.length) {
                            setDistribucionAgrupacion(repartirEnNSacas(listadoProcesadoPaquetes.length, n))
                            setRepartirNAgrupacion('')
                          }
                        }}
                        className="h-9 font-medium gap-1.5"
                      >
                        <SplitSquareVertical className="h-4 w-4 text-muted-foreground" />
                        Repartir
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Distribución (ej: 1,4,5)</Label>
                  <Input
                    value={distribucionAgrupacion}
                    onChange={(e) => setDistribucionAgrupacion(e.target.value)}
                    placeholder="1,4,5"
                    className="font-mono"
                  />
                  {agrupacionGroups.length > 0 && agrupacionGroups.reduce((a, b) => a + b, 0) === listadoProcesadoPaquetes.length && (
                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/50 rounded-lg">
                      {agrupacionGroups.map((qty, i) => {
                        const tamano = tamanosSacasAgrupacion[i] ?? TamanoSaca.GRANDE
                        return (
                          <div key={i} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Saca {i + 1}</span>
                            <span className="text-sm font-mono font-bold">{qty} pqts</span>
                            <Select value={tamano} onValueChange={(v: TamanoSaca) => {
                              setTamanosSacasAgrupacion(prev => {
                                const next = [...prev]
                                while (next.length <= i) next.push(TamanoSaca.GRANDE)
                                next[i] = v
                                return next
                              })
                            }}>
                              <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue>{formatearTamanoSaca(tamano)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={TamanoSaca.INDIVIDUAL}>{formatearTamanoSaca(TamanoSaca.INDIVIDUAL)}</SelectItem>
                                <SelectItem value={TamanoSaca.PEQUENO}>{formatearTamanoSaca(TamanoSaca.PEQUENO)}</SelectItem>
                                <SelectItem value={TamanoSaca.MEDIANO}>{formatearTamanoSaca(TamanoSaca.MEDIANO)}</SelectItem>
                                <SelectItem value={TamanoSaca.GRANDE}>{formatearTamanoSaca(TamanoSaca.GRANDE)}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    onClick={handleAplicarListadoAgrupacion}
                    disabled={agrupacionGroups.reduce((a, b) => a + b, 0) !== listadoProcesadoPaquetes.length}
                  >
                    Aplicar
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaquetesDialog} onOpenChange={(v) => { setShowPaquetesDialog(v); if (!v) { setListadoPaquetes(''); setScanHistory([]) } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{sacaSeleccionadaParaPaquetes !== null ? `Agregar paquetes a Saca ${sacaSeleccionadaParaPaquetes + 1}` : 'Agregar Paquetes a Saca'}</DialogTitle>
            <DialogDescription>Escanea o pega números de guía.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col py-2">
            <Tabs defaultValue="lista" className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="lista">Lista / Masivo</TabsTrigger>
                <TabsTrigger value="individual">Individual / Escáner</TabsTrigger>
              </TabsList>

              <TabsContent value="lista" className="flex-1 flex flex-col space-y-4 mt-0">
                <Textarea
                  value={listadoPaquetes}
                  onChange={e => setListadoPaquetes(e.target.value)}
                  placeholder="Pega aquí los números de guía (uno por línea)..."
                  className="font-mono flex-1 resize-none h-[300px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={handleProcesarListado} disabled={!listadoPaquetes.trim() || procesandoListado}>
                    {procesandoListado ? 'Procesando...' : 'Procesar Lista'}
                  </Button>
                </div>
                {resultadoProcesamiento && (
                  <div className="text-sm bg-muted/50 p-3 rounded space-y-1">
                    {resultadoProcesamiento.encontrados > 0 && <p className="text-green-600">Agregados: {resultadoProcesamiento.encontrados}</p>}
                    {resultadoProcesamiento.noEncontrados.length > 0 && <p className="text-error">No encontrados: {resultadoProcesamiento.noEncontrados.length}</p>}
                    {resultadoProcesamiento.yaAgregados > 0 && <p className="text-blue-600">Ya en saca: {resultadoProcesamiento.yaAgregados}</p>}
                    {resultadoProcesamiento.enEstadoInvalido.length > 0 && <p className="text-yellow-600">Despachados: {resultadoProcesamiento.enEstadoInvalido.length}</p>}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="individual" className="flex-1 flex flex-col mt-0 h-[400px]">
                <div className="space-y-4 flex-1 flex flex-col">
                  <form onSubmit={handleScanIndividual} className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Escanea o escribe guía..."
                      value={scanQuery}
                      onChange={e => setScanQuery(e.target.value)}
                      className="flex-1 font-mono text-lg"
                    />
                    <Button type="submit" disabled={!scanQuery.trim() || procesandoScan}>
                      {procesandoScan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </form>

                  <div className="flex-1 overflow-y-auto border rounded-md bg-muted/20 p-2 space-y-2">
                    {scanHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <p className="text-sm">El historial de escaneo aparecerá aquí</p>
                      </div>
                    )}
                    {scanHistory.map((item, idx) => (
                      <div key={idx} className={`p-2 rounded text-sm flex items-center justify-between animate-in fade-in duration-200 ${item.status === 'success' ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50' :
                        item.status === 'error' ? 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50' :
                          'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50'
                        }`}>
                        <div className="flex flex-col">
                          <span className="font-mono font-medium">{item.guia}</span>
                          <span className="text-[10px] text-muted-foreground">{item.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <span className={`font-medium ${item.status === 'success' ? 'text-green-700 dark:text-green-400' :
                          item.status === 'error' ? 'text-red-700 dark:text-red-400' :
                            'text-yellow-700 dark:text-yellow-400'
                          }`}>
                          {item.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPaquetesDialog(false); setListadoPaquetes(''); setScanHistory([]) }}>Cancelar</Button>
            <Button onClick={handleGuardarPaquetes}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={crearNuevoDistribuidor} onOpenChange={setCrearNuevoDistribuidor}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Distribuidor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={nuevoDistribuidorNombre} onChange={e => setNuevoDistribuidorNombre(e.target.value)} /></div>
            <div className="space-y-2"><Label>Código</Label><Input value={nuevoDistribuidorCodigo} onChange={e => setNuevoDistribuidorCodigo(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrearNuevoDistribuidor(false)}>Cancelar</Button>
            <Button onClick={handleCrearDistribuidorFromHook}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={destinatarioManager.showCrearClienteDialog} onOpenChange={destinatarioManager.setShowCrearClienteDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Nuevo Destinatario</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <section className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nombre completo <span className="text-destructive">*</span></Label>
                  <Input value={nuevoClienteNombre} onChange={e => setNuevoClienteNombre(e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Teléfono <span className="text-destructive">*</span></Label>
                  <Input value={nuevoClienteTelefono} onChange={e => setNuevoClienteTelefono(e.target.value)} placeholder="Ej: 0912345678" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Código</Label>
                  <div className="flex gap-2">
                    <Input value={nuevoClienteCodigo} onChange={e => setNuevoClienteCodigo(e.target.value)} className="font-mono" />
                    <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={generarCodigo}>
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Generar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado</Label>
                  <Select value={nuevoClienteActivo ? 'true' : 'false'} onValueChange={(value) => setNuevoClienteActivo(value === 'true')}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cantón</Label>
                  <Input value={nuevoClienteCanton} onChange={e => setNuevoClienteCanton(e.target.value)} placeholder="Ej: Quito" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Nombre empresa</Label>
                  <Input value={nuevoClienteNombreEmpresa} onChange={e => setNuevoClienteNombreEmpresa(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Dirección</Label>
                  <Textarea value={nuevoClienteDireccion} onChange={e => setNuevoClienteDireccion(e.target.value)} placeholder="Calle principal, secundaria, número de casa..." className="min-h-[80px] resize-none" />
                </div>
              </div>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => destinatarioManager.setShowCrearClienteDialog(false)}>Cancelar</Button>
            <Button onClick={handleCrearCliente}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCrearAgenciaDialog} onOpenChange={setShowCrearAgenciaDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Nueva Agencia</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <section className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nombre Agencia <span className="text-destructive">*</span></Label>
                  <Input value={nuevaAgenciaNombre} onChange={e => setNuevaAgenciaNombre(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Código</Label>
                  <div className="flex gap-2">
                    <Input value={nuevaAgenciaCodigo} onChange={e => setNuevaAgenciaCodigo(e.target.value)} className="font-mono" />
                    <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={() => setNuevaAgenciaCodigo(generarCodigo10Digitos())}>
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Generar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={nuevaAgenciaEmail} onChange={e => setNuevaAgenciaEmail(e.target.value)} type="email" placeholder="correo@agencia.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado</Label>
                  <Select value={nuevaAgenciaActiva ? 'true' : 'false'} onValueChange={(value) => setNuevaAgenciaActiva(value === 'true')}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activa</SelectItem>
                      <SelectItem value="false">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cantón</Label>
                  <Input value={nuevaAgenciaCanton} onChange={e => setNuevaAgenciaCanton(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Nombre personal contacto</Label>
                  <Input value={nuevaAgenciaNombrePersonal} onChange={e => setNuevaAgenciaNombrePersonal(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Dirección</Label>
                  <Textarea value={nuevaAgenciaDireccion} onChange={e => setNuevaAgenciaDireccion(e.target.value)} placeholder="Dirección completa..." className="min-h-[80px] resize-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Horario de atención</Label>
                  <Textarea value={nuevaAgenciaHorarioAtencion} onChange={e => setNuevaAgenciaHorarioAtencion(e.target.value)} placeholder="Lunes a Viernes: 9:00 - 18:00..." className="min-h-[80px] resize-none" />
                </div>
              </div>
            </section>
            <section className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
              <Label className="text-sm font-medium">Contacto telefónico</Label>
              {nuevaAgenciaTelefonos.map((telefono, index) => (
                <div key={`tel-agencia-rapida-${index}`} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Número de teléfono"
                      value={telefono.numero}
                      onChange={(e) => handleActualizarTelefonoAgencia(index, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={telefono.principal ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCambiarPrincipalAgencia(index)}
                    className={telefono.principal ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  >
                    {telefono.principal ? 'Principal' : 'Hacer Principal'}
                  </Button>
                  {nuevaAgenciaTelefonos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleEliminarTelefonoAgencia(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAgregarTelefonoAgencia} className="w-full border-dashed">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Agregar otro teléfono
              </Button>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrearAgenciaDialog(false)}>Cancelar</Button>
            <Button onClick={handleCrearAgenciaRapida} disabled={createAgenciaMutation.isPending}>
              {createAgenciaMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AgregarCadenitaFormDialog
        open={showAgregarCadenitaDialog}
        onOpenChange={setShowAgregarCadenitaDialog}
        onPaquetesEncontrados={handlePaquetesCadenitaEncontrados}
      />
      
      <PaqueteRapidoFormDialog
        open={showPaqueteRapidoDialog}
        onOpenChange={(v) => { setShowPaqueteRapidoDialog(v); if (!v) setSacaSeleccionadaParaPaquetes(null) }}
        onPaqueteCreado={handlePaqueteRapidoCreado}
      />
    </StandardPageLayout>
  )
}
