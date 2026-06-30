import { AssignedAgencyNotice } from '@/components/agency/AssignedAgencyNotice'
import AgregarCadenitaFormDialog from '@/components/despacho/AgregarCadenitaFormDialog'
import { DespachoSacasStep } from '@/components/despacho/DespachoSacasStep'
import PaqueteRapidoFormDialog from '@/components/despacho/PaqueteRapidoFormDialog'
import { ResumenDestinoDespacho } from '@/components/despacho/ResumenDestinoDespacho'
import { FormPageLayout } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Combobox,type ComboboxOption } from '@/components/ui/combobox'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from '@/components/ui/dialog'
import { FormError } from '@/components/ui/form-error'
import { HelpTip } from '@/components/ui/help-tip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionTitle } from '@/components/ui/section-title'
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs,TabsContent,TabsList,TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAgencia,useAgencias,useCreateAgencia,useSearchAgencias } from '@/hooks/useAgencias'
import { useDespachoForm,type DespachoFormData } from '@/hooks/useDespachoForm'
import { useCreateDespacho,useDespacho,useSacasDespacho,useUpdateDespacho } from '@/hooks/useDespachos'
import { useDestinatarioDirectoManager } from '@/hooks/useDestinatarioDirectoManager'
import { useDestinatarioDirecto,useDestinatariosDirectosAll } from '@/hooks/useDestinatariosDirectos'
import { useDistribuidores } from '@/hooks/useDistribuidores'
import { useDistribuidorManager } from '@/hooks/useDistribuidorManager'
import { usePaquetes } from '@/hooks/usePaquetes'
import { useSacasManager,type SacaFormData } from '@/hooks/useSacasManager'
import { useScannerKeyboardCapture } from '@/hooks/useScannerKeyboardCapture'
import { destinatarioDirectoService } from '@/lib/api/destinatario-directo.service'
import { paqueteService } from '@/lib/api/paquete.service'
import { notify } from '@/lib/notify'
import type { TelefonoFormItem } from '@/schemas/agencia'
import { generarCodigo10Digitos } from '@/schemas/destinatario-directo'
import { useDraftStore } from '@/stores/draftStore'
import type { Despacho } from '@/types/despacho'
import type { Paquete } from '@/types/paquete'
import { TamanoSaca } from '@/types/saca'
import { construirDespachoPayload,resumenDespacho,validarDespachoParaCrear } from '@/utils/despachoPayload'
import { formatearTamanoSaca } from '@/utils/ensacado'
import { calcularProvinciaOCantonMasComun } from '@/utils/provinciaCanton'
import { calcularTamanoSugerido,capacidadMaximaKg } from '@/utils/saca'
import { parsearPatron,repartirEnNSacas as repartirPaquetesEnNSacas,repartirPorPatron,repartirTodoEnUnaSaca } from '@/utils/sacaDistribution'
import { useNavigate,useParams } from '@tanstack/react-router'
import { ArrowLeft,ArrowRight,Check,Loader2,MapPin,Package,Plus,RotateCcw,Sparkles,SplitSquareVertical,Trash2,Truck,User } from 'lucide-react'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import { Controller,type FieldValues,type UseFormReturn } from 'react-hook-form'

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
    refetch: refetchDespacho,
  } = useDespacho(id ? Number(id) : undefined)
  const { data: agenciasData } = useAgencias({ page: 0, size: 100 })
  const { data: distribuidoresData } = useDistribuidores({ page: 0, size: 100 })
  const { data: paquetesData } = usePaquetes({ page: 0, size: 1000 })
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
        codigoPresinto: s.codigoPresinto ?? '',
      }))
    } else if (despacho?.sacas && despacho.sacas.length > 0) {
      return despacho.sacas.map(s => ({
        tamano: s.tamano,
        idPaquetes: s.idPaquetes || [],
        codigoPresinto: s.codigoPresinto ?? '',
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
        codigoPresinto: s.codigoPresinto ?? '',
      }))
      setSacas(nuevasSacas)
      return
    }
    if (despacho?.sacas && despacho.sacas.length > 0) {
      const nuevasSacas: SacaFormData[] = despacho.sacas.map(s => ({
        tamano: s.tamano,
        idPaquetes: s.idPaquetes || [],
        codigoPresinto: s.codigoPresinto ?? '',
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
      if (fv.idAgencia) setValue('idAgencia', fv.idAgencia)
      if (fv.idDistribuidor) setValue('idDistribuidor', fv.idDistribuidor)
      if (fv.numeroGuiaAgenciaDistribucion) setValue('numeroGuiaAgenciaDistribucion', fv.numeroGuiaAgenciaDistribucion)
      if (fv.idDestinatarioDirecto) setValue('idDestinatarioDirecto', fv.idDestinatarioDirecto)
    }
    const totalPaquetes = d.sacas?.reduce((acc, s) => acc + s.idPaquetes.length, 0) ?? 0
    notify.info(`Se restauró un borrador guardado hace ${minutesAgo < 1 ? 'menos de 1' : minutesAgo} min (${d.sacas?.length ?? 0} sacas, ${totalPaquetes} paquetes)`, {
      duration: 6000,
      action: { label: 'Descartar', onClick: handleDiscardDraft },
    })
  }, [isEdit])

  // Auto-guardar borrador cuando el estado cambie (solo para nuevo despacho)
  const formValues = watch()
  useEffect(() => {
    if (isEdit || !draftRestored.current) return
    const haySacas = sacas.length > 0
    const hayDatos = formValues.observaciones || formValues.idAgencia || formValues.idDestinatarioDirecto || formValues.idDistribuidor
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
        idAgencia: formValues.idAgencia,
        idDistribuidor: formValues.idDistribuidor,
        numeroGuiaAgenciaDistribucion: formValues.numeroGuiaAgenciaDistribucion,
        idDestinatarioDirecto: formValues.idDestinatarioDirecto,
      },
    }
    saveDraft(DESPACHO_DRAFT_KEY, draftData as unknown as Record<string, unknown>)
  }, [isEdit, pasoActual, tipoEnvio, destinatarioOrigenDirecto, idPaqueteOrigenDestinatario, desdePaqueteNombre, desdePaqueteTelefono, desdePaqueteDireccion, desdePaqueteCanton, desdePaqueteCodigo, sacas, formValues.observaciones, formValues.idAgencia, formValues.idDestinatarioDirecto, formValues.idDistribuidor, formValues.numeroGuiaAgenciaDistribucion, formValues.fechaDespacho, saveDraft])

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

  // MVP 1: Cola global de paquetes tipeados en el paso "Gestionar Sacas" (aún sin distribuir en sacas).
  const [colaGlobal, setColaGlobal] = useState<Paquete[]>([])
  const [colaInput, setColaInput] = useState('')
  const [procesandoCola, setProcesandoCola] = useState(false)
  const [colaFeedback, setColaFeedback] = useState<{ guia: string; status: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [showColaPaste, setShowColaPaste] = useState(false)
  const [colaPasteText, setColaPasteText] = useState('')
  const [procesandoColaPaste, setProcesandoColaPaste] = useState(false)
  const [colaPasteResult, setColaPasteResult] = useState<{ agregados: number; yaAgregados: string[]; noEncontrados: string[]; invalidos: string[] } | null>(null)
  const colaInputRef = useRef<HTMLInputElement>(null)
  const colaGlobalRef = useRef<Paquete[]>([])
  const sacasRef = useRef<SacaFormData[]>([])
  const colaPendienteRef = useRef<string[]>([])
  const colaPendienteKeysRef = useRef<Set<string>>(new Set())
  const procesandoColaRef = useRef(false)
  const showColaPasteRef = useRef(false)
  const [permitirNoRegistrados, setPermitirNoRegistrados] = useState(false)
  const subPasoSacasRef = useRef<'capturar' | 'distribuir' | 'revisar'>(isEdit ? 'revisar' : 'capturar')
  const pasoActualRef = useRef(pasoActual)

  useEffect(() => {
    pasoActualRef.current = pasoActual
  }, [pasoActual])

  useEffect(() => {
    colaGlobalRef.current = colaGlobal
  }, [colaGlobal])

  useEffect(() => {
    sacasRef.current = sacas
  }, [sacas])

  useEffect(() => {
    showColaPasteRef.current = showColaPaste
  }, [showColaPaste])

  const handleSetShowColaPaste = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowColaPaste(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      showColaPasteRef.current = next
      return next
    })
  }

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
  }, [despacho, isEdit, setDestinatarioSeleccionado, setValue])

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
      notify.error('El nombre de la agencia es obligatorio')
      return
    }

    const telefonosValidos = nuevaAgenciaTelefonos.filter((t) => t.numero.trim() !== '')
    if (telefonosValidos.length === 0) {
      notify.error('Debe ingresar al menos un número de teléfono')
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

  const { data: todosDestinatariosDirectos } = useDestinatariosDirectosAll()
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

  const paquetesPorId = useMemo(() => {
    const paquetesMap = new Map<number, Paquete>()
    todosLosPaquetes.forEach((paquete) => {
      if (paquete.idPaquete != null) paquetesMap.set(paquete.idPaquete, paquete)
    })
    return paquetesMap
  }, [todosLosPaquetes])

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
      catch { try { p = await paqueteService.findByNumeroGuia(guia.trim()) } catch { p = undefined } }
    }
    return p ?? null
  }

  // --- MVP 1: Cola global de paquetes tipeados (paso "Gestionar Sacas") ---
  const estaEnColaGlobal = useCallback(
    (idPaquete: number) => colaGlobalRef.current.some(p => p.idPaquete === idPaquete),
    []
  )
  const estaEnAlgunaSaca = useCallback(
    (idPaquete: number) => sacasRef.current.some(s => s.idPaquetes.includes(idPaquete)),
    []
  )

  /**
   * Enfoca el input de captura de forma resiliente: reintenta unas pocas veces (el panel puede
   * no estar montado aún al cambiar de subpaso) y aborta si ya no procede o si el usuario está
   * en otro campo editable, para no robarle el foco mientras escribe.
   */
  const focusColaInput = () => {
    let intentos = 0
    const intentar = () => {
      if (pasoActualRef.current !== 2 || subPasoSacasRef.current !== 'capturar' || showColaPasteRef.current) return
      const input = colaInputRef.current
      if (input) {
        const activo = document.activeElement as HTMLElement | null
        const enOtroEditable =
          !!activo &&
          activo !== input &&
          (activo.tagName === 'INPUT' || activo.tagName === 'TEXTAREA' || activo.tagName === 'SELECT' || activo.isContentEditable)
        if (enOtroEditable) return
        input.focus()
        if (document.activeElement === input) return
      }
      if (intentos++ < 2) setTimeout(intentar, 50)
    }
    requestAnimationFrame(intentar)
  }

  /**
   * Busca una guía y la agrega a la cola global si es válida y no está duplicada
   * (ni en la cola ni en una saca). Devuelve el resultado para feedback/resumen.
   */
  const agregarGuiaAColaGlobal = async (
    guia: string
  ): Promise<{ status: 'success' | 'error' | 'warning'; code: 'agregada' | 'vacia' | 'no_encontrada' | 'despachada' | 'en_saca' | 'en_cola'; message: string }> => {
    const guiaTrim = guia.trim()
    if (!guiaTrim) return { status: 'error', code: 'vacia', message: 'Guía vacía' }
    let p = await buscarPaquetePorGuia(guiaTrim)
    if (!p || p.idPaquete == null) {
      if (!permitirNoRegistrados) {
        return { status: 'error', code: 'no_encontrada', message: 'No se encontró la guía' }
      }
      try {
        const creados = await paqueteService.createSimplificadoBatch([{ numeroGuia: guiaTrim }])
        if (creados && creados.length > 0) {
          p = creados[0]
        }
      } catch (err) {
        return { status: 'error', code: 'no_encontrada', message: 'No se pudo crear el paquete' }
      }
      if (!p || p.idPaquete == null) {
        return { status: 'error', code: 'no_encontrada', message: 'Guía no válida tras creación' }
      }
    }
    if (p.estado === 'DESPACHADO') return { status: 'error', code: 'despachada', message: 'Ya fue despachada' }
    if (estaEnAlgunaSaca(p.idPaquete)) return { status: 'warning', code: 'en_saca', message: 'Ya está en una saca' }
    if (estaEnColaGlobal(p.idPaquete)) return { status: 'warning', code: 'en_cola', message: 'Ya está en la cola' }
    setColaGlobal(prev => {
      if (prev.some(item => item.idPaquete === p.idPaquete)) return prev
      const next = [p, ...prev]
      colaGlobalRef.current = next
      return next
    })
    setPaquetesAgregados(prev => {
      const m = new Map(prev)
      m.set(p.idPaquete!, p)
      return m
    })
    return { status: 'success', code: 'agregada', message: 'Agregada a la cola' }
  }

  const procesarColaPendiente = async () => {
    if (procesandoColaRef.current) return
    procesandoColaRef.current = true
    setProcesandoCola(true)
    try {
      while (colaPendienteRef.current.length > 0) {
        const guia = colaPendienteRef.current.shift()
        if (!guia) continue
        const guiaKey = guia.trim().toUpperCase()
        try {
          const res = await agregarGuiaAColaGlobal(guia)
          setColaFeedback({ guia, status: res.status, message: res.message })
          if (res.status !== 'success') {
            notify[res.status === 'error' ? 'error' : 'warning'](`${guia}: ${res.message}`)
          }
        } finally {
          colaPendienteKeysRef.current.delete(guiaKey)
          focusColaInput()
        }
      }
    } finally {
      procesandoColaRef.current = false
      setProcesandoCola(false)
      focusColaInput()
    }
  }

  const encolarGuiaIndividual = (guia: string) => {
    const guiaTrim = guia.trim()
    if (!guiaTrim) return
    const guiaKey = guiaTrim.toUpperCase()
    if (colaPendienteKeysRef.current.has(guiaKey)) {
      setColaFeedback({ guia: guiaTrim, status: 'warning', message: 'Ya esta pendiente de procesamiento' })
      focusColaInput()
      return
    }
    colaPendienteRef.current.push(guiaTrim)
    colaPendienteKeysRef.current.add(guiaKey)
    void procesarColaPendiente()
  }

  const handleColaSubmit = (e?: React.FormEvent, valueOverride?: string) => {
    e?.preventDefault()
    const guia = (valueOverride ?? colaInput).trim()
    if (!guia) return
    setColaInput('')
    focusColaInput()
    encolarGuiaIndividual(guia)
  }

  const handleEliminarDeColaGlobal = (idPaquete: number) => {
    setColaGlobal(prev => {
      const next = prev.filter(p => p.idPaquete !== idPaquete)
      colaGlobalRef.current = next
      return next
    })
  }

  const handleLimpiarColaGlobal = () => {
    colaGlobalRef.current = []
    setColaGlobal([])
  }

  const handleProcesarColaPaste = async (textOverride?: string) => {
    const fuente = textOverride ?? colaPasteText
    const guias = fuente
      .split(/[\n,;\t]/)
      .map(g => g.trim())
      .filter(g => g.length > 0)
    if (guias.length === 0 || procesandoColaPaste) return
    setProcesandoColaPaste(true)
    const resumen = { agregados: 0, yaAgregados: [] as string[], noEncontrados: [] as string[], invalidos: [] as string[] }
    const guiasVistas = new Set<string>()
    try {
      // Procesar secuencialmente para respetar dedupe contra lo recién agregado
      for (const guia of guias) {
        const guiaKey = guia.trim().toUpperCase()
        if (guiasVistas.has(guiaKey)) {
          resumen.yaAgregados.push(guia)
          continue
        }
        guiasVistas.add(guiaKey)
        const res = await agregarGuiaAColaGlobal(guia)
        if (res.status === 'success') resumen.agregados++
        else if (res.status === 'warning') resumen.yaAgregados.push(guia)
        else if (res.code === 'no_encontrada') resumen.noEncontrados.push(guia)
        else resumen.invalidos.push(guia)
      }
      setColaPasteResult(resumen)
      setColaPasteText('')
      notify.success(`${resumen.agregados} guía(s) agregada(s) a la cola`)
    } finally {
      setProcesandoColaPaste(false)
      focusColaInput()
    }
  }

  // --- MVP 2: Distribución de la cola global hacia sacas ---
  // Sub-flujo guiado del paso 2: Capturar → Distribuir → Revisar. En edición arranca en "revisar".
  const [subPasoSacas, setSubPasoSacas] = useState<'capturar' | 'distribuir' | 'revisar'>(isEdit ? 'revisar' : 'capturar')
  const [nSacasInput, setNSacasInput] = useState('')
  const [patronInput, setPatronInput] = useState('')

  const handleSetSubPasoSacas = (value: 'capturar' | 'distribuir' | 'revisar') => {
    subPasoSacasRef.current = value
    setSubPasoSacas(value)
  }

  useEffect(() => {
    subPasoSacasRef.current = subPasoSacas
  }, [subPasoSacas])

  // Modo "captura continua" con tipiadora: solo activo en el subpaso de captura del paso 2 y sin pegado en bloque.
  const capturaScannerActiva = pasoActual === 2 && subPasoSacas === 'capturar' && !showColaPaste
  useScannerKeyboardCapture({
    active: capturaScannerActiva,
    inputRef: colaInputRef,
    onGuia: encolarGuiaIndividual,
    focusInput: focusColaInput,
  })

  // Recuperar el foco al entrar al subpaso de captura, volver a él o cerrar el pegado en bloque.
  useEffect(() => {
    if (capturaScannerActiva) focusColaInput()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturaScannerActiva])

  /** Paquetes a distribuir en orden de tipiado: primero los ya en sacas (orden de saca), luego la cola (más antiguo primero). */
  const paquetesDistribuibles = useMemo(() => {
    const result: Paquete[] = []
    for (const s of sacas) {
      for (const idP of s.idPaquetes) {
        const p = paquetesAgregados.get(idP) ?? todosLosPaquetes.find(x => x.idPaquete === idP)
        if (p) result.push(p)
      }
    }
    // La cola se muestra con el más reciente arriba; al distribuir se respeta el orden de tipiado (más antiguo primero)
    for (const p of [...colaGlobal].reverse()) result.push(p)
    return result
  }, [sacas, colaGlobal, paquetesAgregados, todosLosPaquetes])

  /** Aplica una nueva distribución de sacas; si ya había sacas con paquetes, pide confirmación. Devuelve true si se aplicó. */
  const aplicarDistribucion = (nuevasSacas: SacaFormData[]): boolean => {
    if (nuevasSacas.length === 0) {
      notify.error('No hay paquetes para distribuir')
      return false
    }
    if (paquetesEnSacas.length > 0 && !window.confirm('Esto reemplazará la distribución actual de sacas y redistribuirá todos los paquetes. ¿Continuar?')) {
      return false
    }
    sacasRef.current = nuevasSacas
    setSacas(nuevasSacas)
    colaGlobalRef.current = []
    setColaGlobal([])
    handleSetSubPasoSacas('revisar')
    return true
  }

  const handleTodoEnUnaSaca = () => {
    const nuevas = repartirTodoEnUnaSaca(paquetesDistribuibles)
    if (aplicarDistribucion(nuevas)) {
      notify.success(`1 saca con ${paquetesDistribuibles.length} paquete(s)`)
    }
  }

  const handleCrearNSacas = () => {
    const n = parseInt(nSacasInput.trim(), 10)
    if (Number.isNaN(n) || n < 1) {
      notify.error('Indica un número de sacas válido (≥ 1)')
      return
    }
    if (n > paquetesDistribuibles.length) {
      notify.error(`No puedes crear más sacas (${n}) que paquetes (${paquetesDistribuibles.length})`)
      return
    }
    const nuevas = repartirPaquetesEnNSacas(paquetesDistribuibles, n)
    if (aplicarDistribucion(nuevas)) {
      setNSacasInput('')
      notify.success(`${nuevas.length} saca(s) creadas`)
    }
  }

  const handleAplicarPatron = () => {
    const { grupos, error } = parsearPatron(patronInput)
    if (error) {
      notify.error(error)
      return
    }
    const { sacas: nuevas, sobrantes, faltantes } = repartirPorPatron(paquetesDistribuibles, grupos)
    if (aplicarDistribucion(nuevas)) {
      setPatronInput('')
      if (faltantes > 0) {
        notify.warning(`El patrón pide ${grupos.reduce((a, b) => a + b, 0)} pero solo hay ${paquetesDistribuibles.length} paquete(s); se crearon ${nuevas.length} saca(s).`)
      } else if (sobrantes > 0) {
        notify.warning(`${sobrantes} paquete(s) sobrante(s) se agruparon en una última saca.`)
      } else {
        notify.success(`${nuevas.length} saca(s) creadas`)
      }
    }
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
          notify.info(`Se ha seleccionado automáticamente la agencia en ${agenciaCoincidente.canton ?? cantonPredominante}`, {
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
          notify.info(`Se ha seleccionado automáticamente el cliente de ${clienteCoincidente.canton ?? cantonPredominante}`, {
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
      const ubicacion = [agencia.canton, agencia.provincia]
        .filter((p): p is string => !!p && p.trim().length > 0)
        .join(' • ')
      return {
        value: agencia.idAgencia!,
        label: `${agencia.nombre}${agencia.codigo ? ` (${agencia.codigo})` : ''}`,
        description: ubicacion || undefined,
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
      const ubicacion = [d.canton, d.provincia]
        .filter((p): p is string => !!p && p.trim().length > 0)
        .join(' • ')
      const partesDescripcion = [d.telefonoDestinatario, ubicacion].filter(Boolean)
      return {
        value: d.idDestinatarioDirecto!,
        label: d.nombreDestinatario,
        description: partesDescripcion.join(' • ') || undefined,
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

  const detalleSacasResumen = useMemo(() => {
    return sacas.map((saca, index) => {
      const paquetes = saca.idPaquetes.map((idPaquete) => {
        const paquete = paquetesAgregados.get(idPaquete) || paquetesPorId.get(idPaquete)
        return {
          idPaquete,
          numeroGuia: paquete?.numeroGuia || `#${idPaquete}`,
          pesoKg: Number(paquete?.pesoKilos || 0),
        }
      })
      const pesoKg = paquetes.reduce((acc, paquete) => acc + paquete.pesoKg, 0)
      const capacidadKg = capacidadMaximaKg(saca.tamano)

      return {
        numeroOrden: index + 1,
        tamano: saca.tamano,
        tamanoLabel: formatearTamanoSaca(saca.tamano),
        capacidadKg,
        pesoKg,
        totalPaquetes: saca.idPaquetes.length,
        paquetes,
      }
    })
  }, [sacas, paquetesAgregados, paquetesPorId])

  const pesoTotalEstimado = useMemo(
    () => detalleSacasResumen.reduce((acc, saca) => acc + saca.pesoKg, 0),
    [detalleSacasResumen]
  )

  const telefonoAgenciaResumen =
    agenciaSeleccionada?.telefonos?.find((t) => t.principal)?.numero ??
    agenciaSeleccionada?.telefonos?.[0]?.numero

  const resumenDestinoData = {
    tipoLabel: tipoEnvio === 'agencia' ? 'Agencia' : 'Destinatario directo',
    nombre: tipoEnvio === 'agencia' ? agenciaSeleccionada?.nombre : destinatarioResumen.nombreDestinatario,
    nombreEmpresa: tipoEnvio === 'directo' ? destinatarioResumen.nombreEmpresa : undefined,
    codigoDestino: tipoEnvio === 'agencia' ? agenciaSeleccionada?.codigo : destinatarioResumen.codigo,
    telefono: tipoEnvio === 'agencia' ? telefonoAgenciaResumen : destinatarioResumen.telefonoDestinatario,
    direccion: tipoEnvio === 'agencia' ? agenciaSeleccionada?.direccion : destinatarioResumen.direccionDestinatario,
    ubicacion: tipoEnvio === 'agencia' ? agenciaSeleccionada?.canton : destinatarioResumen.canton,
    pesoTotalKg: pesoTotalEstimado,
    totalSacas: sacas.length,
    totalPaquetes: sacas.reduce((acc, s) => acc + s.idPaquetes.length, 0),
    sacasDetalle: detalleSacasResumen,
    sacasPorTamano: [TamanoSaca.INDIVIDUAL, TamanoSaca.PEQUENO, TamanoSaca.MEDIANO, TamanoSaca.GRANDE]
      .map((t) => ({ label: formatearTamanoSaca(t), count: sacas.filter((s) => s.tamano === t).length }))
      .filter((x) => x.count > 0),
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
          } catch {
            continue
          }
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
      notify.error('Ingresa al menos una guía por línea')
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
    if (noEncontrados.length) notify.error(`${noEncontrados.length} guía(s) no encontrada(s)`)
    if (enEstadoInvalido.length) notify.warning(`${enEstadoInvalido.length} ya despachada(s)`)
    if (encontrados.length) notify.success(`${encontrados.length} paquete(s) listo(s). Indica la distribución (ej: 1,4,5).`)
    setProcesandoListadoAgrupacion(false)
  }

  const handleAplicarListadoAgrupacion = () => {
    if (!listadoProcesadoPaquetes?.length) return
    const totalDist = agrupacionGroups.reduce((a, b) => a + b, 0)
    if (totalDist !== listadoProcesadoPaquetes.length) {
      notify.error(`La suma de la distribución (${totalDist}) debe coincidir con el total de paquetes (${listadoProcesadoPaquetes.length})`)
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
    notify.success('Sacas creadas. Revisa el paso 2.')
  }

  const handleProcesarListado = async () => {
    if (!listadoPaquetes.trim() || sacaSeleccionadaParaPaquetes === null) {
      notify.error('Ingresa al menos un número de guía')
      return
    }
    const numerosGuia = listadoPaquetes.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (numerosGuia.length === 0) return

    setProcesandoListado(true)
    setResultadoProcesamiento(null)

    let encontrados = 0, yaAgregados = 0
    const noEncontrados: string[] = [], enEstadoInvalido: string[] = []
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

  const handleCambiarTamanoSaca = (index: number, tamano: TamanoSaca) => {
    const ms = [...sacas]; ms[index].tamano = tamano; setSacas(ms)
  }

  const handleCambiarPresintoSaca = (index: number, value: string) => {
    const ms = [...sacas]; ms[index] = { ...ms[index], codigoPresinto: value }; setSacas(ms)
  }

  const handleGenerarPresintoSaca = (index: number) => {
    const ms = [...sacas]; ms[index] = { ...ms[index], codigoPresinto: String(Math.floor(1000000000 + Math.random() * 9000000000)) }; setSacas(ms)
  }

  const onSubmit = async (data: DespachoFormData) => {
    const idPaqueteRef = idPaqueteOrigenDestinatario ? Number(idPaqueteOrigenDestinatario) : undefined
    const validationError = validarDespachoParaCrear({
      sacas,
      destino: {
        tipoEnvio,
        idAgencia: data.idAgencia,
        destinatarioOrigen: destinatarioOrigenDirecto,
        idDestinatarioDirecto: data.idDestinatarioDirecto,
        idPaqueteOrigenDestinatario: idPaqueteRef,
      },
    })
    if (validationError) {
      notify.error(validationError); return
    }

    try {
      let idDestinatarioDirectoPayload = tipoEnvio === 'directo' ? data.idDestinatarioDirecto : undefined
      if (tipoEnvio === 'directo' && destinatarioOrigenDirecto === 'desde_paquete') {
        if (!desdePaqueteNombre.trim()) {
          notify.error('El paquete seleccionado no tiene nombre de destinatario válido')
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

      const despachoData: Despacho = construirDespachoPayload({
        fechaDespacho: data.fechaDespacho,
        usuarioRegistro: data.usuarioRegistro,
        observaciones: data.observaciones,
        destino: {
          tipoEnvio,
          idAgencia: data.idAgencia,
          destinatarioOrigen: destinatarioOrigenDirecto,
          idDestinatarioDirecto: idDestinatarioDirectoPayload,
        },
        idDistribuidor: data.idDistribuidor,
        numeroGuiaAgenciaDistribucion: data.numeroGuiaAgenciaDistribucion,
        sacas,
      })

      if (isEdit) await updateMutation.mutateAsync({ id: Number(id), dto: despachoData })
      else {
        const res = await createMutation.mutateAsync(despachoData)
        clearDraft(DESPACHO_DRAFT_KEY)
        notify.success(`Despacho creado: ${res.numeroManifiesto}`)
      }
      navigate({ to: '/despachos' })
    } catch (e) {
      // Error manejado por el hook
    }
  }

  const stepper = (
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
          <span className="font-medium text-foreground">{resumenDespacho(sacas).totalSacas} sacas</span>
          <span> · </span>
          <span className="font-medium text-foreground">{resumenDespacho(sacas).totalPaquetes} paquetes</span>
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
  )

  const isSaving = createMutation.isPending || updateMutation.isPending
  const showSaveButton = pasoActual === 4
  const hayBorrador = !isEdit && !!getDraft(DESPACHO_DRAFT_KEY)

  return (
    <>
    <FormPageLayout
      title={isEdit ? 'Editar Despacho' : 'Nuevo Despacho'}
      subtitle={isEdit ? 'Modifica la información del despacho' : 'Completa los pasos para crear el despacho'}
      icon={<Truck className="h-4 w-4" />}
      backUrl="/despachos"
      formId="despacho-form"
      isLoading={isEdit && loadingDespacho}
      loadError={isErrorDespacho ? errorDespacho : undefined}
      onRetry={() => void refetchDespacho()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="xl"
      subheader={stepper}
      draftMode={!isEdit}
      draftToastMessage="Guardamos este despacho como borrador. Vuelve a entrar a 'Nuevo despacho' para continuar editándolo."
      primaryAction={{
        label: isEdit ? 'Actualizar Despacho' : 'Crear Despacho',
        loadingLabel: 'Guardando...',
        hidden: !showSaveButton,
      }}
      secondaryActions={
        hayBorrador ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDiscardDraft}
            className="text-muted-foreground hover:text-destructive"
            title="Descartar borrador y empezar de cero"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Descartar borrador
          </Button>
        ) : null
      }
    >
        <form id="despacho-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* PASO 1: INFO BÁSICA */}
          {pasoActual === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-6">
                <SectionTitle
                  title="Información del Despacho"
                  variant="form"
                  icon={<Truck className="h-4 w-4 text-muted-foreground" />}
                  description="Datos generales del despacho. Podrás añadir sacas y el destino en los siguientes pasos."
                />
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
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      Observaciones
                      <HelpTip>Notas internas del despacho (instrucciones, incidencias). No se imprimen en la etiqueta.</HelpTip>
                    </Label>
                    <Textarea {...register('observaciones')} rows={2} placeholder="Notas adicionales del despacho..." className="resize-none" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El presinto de seguridad se registra en cada saca (paso 2), donde se coloca el sello al ensacar.
                  </p>
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
            <DespachoSacasStep
              sacas={sacas}
              subPaso={subPasoSacas}
              setSubPaso={handleSetSubPasoSacas}
              capture={{
                colaInput,
                setColaInput,
                procesandoCola,
                handleColaSubmit,
                showColaPaste,
                setShowColaPaste: handleSetShowColaPaste,
                colaPasteText,
                setColaPasteText,
                procesandoColaPaste,
                handleProcesarColaPaste,
                onPasteGuias: (text) => handleProcesarColaPaste(text),
                colaFeedback,
                colaPasteResult,
                setColaPasteResult,
                colaInputRef,
                permitirNoRegistrados,
                setPermitirNoRegistrados,
              }}
              distribution={{
                paquetesDistribuiblesCount: paquetesDistribuibles.length,
                paquetesEnSacasCount: paquetesEnSacas.length,
                sacasCount: sacas.length,
                handleTodoEnUnaSaca,
                nSacasInput,
                setNSacasInput,
                handleCrearNSacas,
                patronInput,
                setPatronInput,
                handleAplicarPatron,
                onCadenita: () => setShowAgregarCadenitaDialog(true),
                onAgregarSaca: handleAgregarSaca,
                onCargaMasiva: () => setShowListadoAgrupacionDialog(true),
              }}
              colaGlobal={colaGlobal}
              onLimpiarCola={handleLimpiarColaGlobal}
              onEliminarDeColaGlobal={handleEliminarDeColaGlobal}
              onEliminarPaqueteDeSaca={handleEliminarPaqueteDeSaca}
              onMoverPaqueteASaca={handleMoverPaqueteASaca}
              onTamanoChange={handleCambiarTamanoSaca}
              onPresintoChange={handleCambiarPresintoSaca}
              onGenerarPresinto={handleGenerarPresintoSaca}
              onAgregarPaquetes={handleSeleccionarPaquetes}
              onPaqueteRapido={(index) => { setSacaSeleccionadaParaPaquetes(index); setShowPaqueteRapidoDialog(true) }}
              onEliminarSaca={handleEliminarSaca}
              onSiguiente={() => setPasoActual(3)}
              onAnterior={() => setPasoActual(1)}
            />
          )}

          {/* PASO 3: DESTINO */}
          {pasoActual === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-6">
                <SectionTitle
                  title="Destino del Despacho"
                  variant="form"
                  icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                  description="¿A dónde va el despacho? Elige enviarlo a una agencia/sucursal o directamente a un cliente final."
                />
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
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      Agencia destino
                      <HelpTip>Sucursal que recibirá el despacho. Si no existe, créala con el botón “+”.</HelpTip>
                    </Label>
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
                      <Button type="button" variant="outline" className="h-9 w-9 p-0 rounded-md" onClick={() => setShowCrearAgenciaDialog(true)} title="Crear nueva agencia">
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
                      <Label className="flex items-center gap-1.5 text-sm font-medium">
                        Origen del destinatario
                        <HelpTip>“Existente” usa un destinatario ya registrado. “Desde paquete” crea el destinatario tomando los datos de una de las guías del despacho.</HelpTip>
                      </Label>
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
                <SectionTitle
                  title="Confirmar despacho"
                  variant="form"
                  icon={<Check className="h-4 w-4 text-muted-foreground" />}
                  description="Revisa el resumen y, si aplica, indica el transportista. Al confirmar se creará el despacho."
                />

                <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Logística (opcional)</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium">
                        Distribuidor
                        <HelpTip>Empresa o transportista que llevará el despacho hasta su destino. Opcional.</HelpTip>
                      </Label>
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
                        <Button type="button" variant="outline" onClick={() => setCrearNuevoDistribuidor(true)} title="Crear nuevo distribuidor">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium">
                        Guía Agencia Distribución
                        <HelpTip>Número de guía/tracking que asigna el transportista externo a este despacho. Úsalo para rastrearlo con ellos.</HelpTip>
                      </Label>
                      <Input {...register('numeroGuiaAgenciaDistribucion')} placeholder="Número de guía..." />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm bg-primary/5 border-primary/10">
                  <SectionTitle
                    title="Resumen"
                    variant="form"
                    as="h3"
                    description="Verifica los datos y copia la información del destinatario para registrarla en la plataforma del courier."
                  />

                  <ResumenDestinoDespacho data={resumenDestinoData} />

                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setPasoActual(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
              </div>
            </div>
          )}
        </form>
    </FormPageLayout>

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
                    {resultadoProcesamiento.enEstadoInvalido.length > 0 && <p className="text-warning-foreground">Despachados: {resultadoProcesamiento.enEstadoInvalido.length}</p>}
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
                      <div key={idx} className={`flex animate-in fade-in items-center justify-between rounded border p-2 text-sm duration-200 ${item.status === 'success' ? 'border-success/30 bg-success/10' :
                        item.status === 'error' ? 'border-error/30 bg-error/10' :
                          'border-warning/30 bg-warning/15'
                        }`}>
                        <div className="flex flex-col">
                          <span className="font-mono font-medium">{item.guia}</span>
                          <span className="text-[10px] text-muted-foreground">{item.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <span className={`font-medium ${item.status === 'success' ? 'text-success' :
                          item.status === 'error' ? 'text-error' :
                            'text-warning-foreground'
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
    </>
  )
}
