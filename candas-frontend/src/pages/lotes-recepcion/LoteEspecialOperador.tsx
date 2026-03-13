import { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLoteRecepcion, usePaquetesLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { loteRecepcionService } from '@/lib/api/lote-recepcion.service'
import { useAgencias, useCreateAgencia } from '@/hooks/useAgencias'
import { useDistribuidores } from '@/hooks/useDistribuidores'
import { useDestinatariosDirectos } from '@/hooks/useDestinatariosDirectos'
import { useDestinatarioDirectoManager } from '@/hooks/useDestinatarioDirectoManager'
import { useAuthStore } from '@/stores/authStore'
import { useDraftStore } from '@/stores/draftStore'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { paqueteService } from '@/lib/api/paquete.service'
import { despachoService } from '@/lib/api/despacho.service'
import { destinatarioDirectoService } from '@/lib/api/destinatario-directo.service'
import { TamanoSaca } from '@/types/saca'
import { calcularTamanoSugerido } from '@/utils/saca'
import { formatearTamanoSaca } from '@/utils/ensacado'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScanLine, Loader2, List as ListIcon, FileText, X, Box, Truck, MapPin, QrCode, CheckCircle2, Download, FileDown, FileSpreadsheet, Printer, Edit, ChevronDown, Trash2, Upload, ChevronsUpDown, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/states'
import { PERMISSIONS } from '@/types/permissions'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import type { GuiaListaEtiquetadaConsultaDTO } from '@/types/listas-etiquetadas'
import type { Paquete } from '@/types/paquete'
import { filtrarPaquetesPorTipo, descargarPDFLoteEspecial } from '@/utils/generarPdfLoteEspecial'
import { imprimirLoteEspecial } from '@/utils/imprimirPdfLoteEspecial'
import { generarExcelLoteRecepcion } from '@/utils/generarExcelLoteRecepcion'
import AgregarAtencionDialog from '@/components/lotes-recepcion/AgregarAtencionDialog'
import CrearDespachoMasivoDialog from '@/components/despachos/CrearDespachoMasivoDialog'
import { getApiErrorMessage } from '@/lib/api/errors'
import { hasDespacho, buildClienteDestinoFromPaquete, SIN_ETIQUETA_KEY, VARIAS_LISTAS_KEY } from './loteEspecialOperadorUtils'
import { generarCodigo10Digitos } from '@/schemas/destinatario-directo'
import type { TelefonoFormItem } from '@/schemas/agencia'

export interface LoteEspecialOperadorProps {
  embedded?: boolean
  onImportar?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

interface LoteEspecialDraftData {
  operacionModo: 'DESPACHO' | 'TIPEO'
  colaEspecial: Array<{ numeroGuia: string; resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null }>
  selectedPackageIdsOrder: number[]
}

export default function LoteEspecialOperador({ embedded = false, onImportar, onEdit, onDelete }: LoteEspecialOperadorProps) {
  const { id: idParam } = useParams({ strict: false })
  const id = idParam ? Number(idParam) : undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const { saveDraft, getDraft, clearDraft } = useDraftStore()
  const draftRestored = useRef(false)
  const draftKey = `lote-especial-${id ?? 'unknown'}`

  const { data: lote, isLoading } = useLoteRecepcion(id)
  const { data: paquetes = [] } = usePaquetesLoteRecepcion(id)
  const { data: agenciasResponse } = useAgencias(0, 100)
  const { data: distribuidoresResponse } = useDistribuidores(0, 100)
  const { data: destinatariosDirectos = [] } = useDestinatariosDirectos()
  const user = useAuthStore((s) => s.user)

  const destinatarioManager = useDestinatarioDirectoManager((destinatario) => {
    if (destinatario?.idDestinatarioDirecto) {
      setBulkIdDestino(String(destinatario.idDestinatarioDirecto))
      queryClient.invalidateQueries({ queryKey: ['destinatarios-directos'] })
    }
  })
  const {
    showCrearClienteDialog,
    setShowCrearClienteDialog,
    nuevoClienteNombre,
    setNuevoClienteNombre,
    nuevoClienteTelefono,
    setNuevoClienteTelefono,
    nuevoClienteDireccion,
    setNuevoClienteDireccion,
    nuevoClienteCanton,
    setNuevoClienteCanton,
    nuevoClienteCodigo,
    setNuevoClienteCodigo,
    nuevoClienteNombreEmpresa,
    setNuevoClienteNombreEmpresa,
    nuevoClienteActivo,
    setNuevoClienteActivo,
    generarCodigo,
    handleCrearCliente,
  } = destinatarioManager
  const createAgenciaMutation = useCreateAgencia()
  const [showCrearAgenciaDialog, setShowCrearAgenciaDialog] = useState(false)
  const [nuevaAgenciaNombre, setNuevaAgenciaNombre] = useState('')
  const [nuevaAgenciaCanton, setNuevaAgenciaCanton] = useState('')
  const [nuevaAgenciaDireccion, setNuevaAgenciaDireccion] = useState('')
  const [nuevaAgenciaCodigo, setNuevaAgenciaCodigo] = useState('')
  const [nuevaAgenciaTelefonos, setNuevaAgenciaTelefonos] = useState<TelefonoFormItem[]>([
    { numero: '', principal: true },
  ])
  const [nuevaAgenciaEmail, setNuevaAgenciaEmail] = useState('')
  const [nuevaAgenciaNombrePersonal, setNuevaAgenciaNombrePersonal] = useState('')
  const [nuevaAgenciaHorarioAtencion, setNuevaAgenciaHorarioAtencion] = useState('')
  const [nuevaAgenciaActiva, setNuevaAgenciaActiva] = useState(true)

  const handleCrearAgencia = async () => {
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
        canton: nuevaAgenciaCanton.trim() || undefined,
        direccion: nuevaAgenciaDireccion.trim() || undefined,
        codigo: nuevaAgenciaCodigo.trim() || undefined,
        email: nuevaAgenciaEmail.trim() || undefined,
        nombrePersonal: nuevaAgenciaNombrePersonal.trim() || undefined,
        horarioAtencion: nuevaAgenciaHorarioAtencion.trim() || undefined,
        activa: nuevaAgenciaActiva,
        telefonos: telefonosValidos.map((telefono) => ({
          numero: telefono.numero.trim(),
          principal: telefono.principal,
        })),
      })
      if (creada?.idAgencia != null) {
        setBulkTipoDestino('AGENCIA')
        setBulkIdDestino(String(creada.idAgencia))
      }
      setShowCrearAgenciaDialog(false)
      setNuevaAgenciaNombre('')
      setNuevaAgenciaCanton('')
      setNuevaAgenciaDireccion('')
      setNuevaAgenciaCodigo('')
      setNuevaAgenciaEmail('')
      setNuevaAgenciaNombrePersonal('')
      setNuevaAgenciaHorarioAtencion('')
      setNuevaAgenciaActiva(true)
      setNuevaAgenciaTelefonos([{ numero: '', principal: true }])
    } catch {
      // El toast de error ya se maneja en el hook.
    }
  }

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

  const agencias = agenciasResponse?.content ?? []
  const distribuidores = distribuidoresResponse?.content ?? []

  const [activeTab, setActiveTab] = useState<'operacion' | 'lista'>('operacion')
  /** Submodo en Operación: Despacho (añadir a despacho) o Tipeo (consultar + cola → Guardar en lote). */
  const [operacionModo, setOperacionModo] = useState<'DESPACHO' | 'TIPEO'>('TIPEO')
  const [tipiarGuia, setTipiarGuia] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [lastScannedGuia, setLastScannedGuia] = useState<string | null>(null)
  const [lastConsultaResultado, setLastConsultaResultado] = useState<GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null>(null)
  /** Cola de guías tipiadas (modo Tipeo): no se marcan receptado hasta "Guardar en el lote". */
  const [colaEspecial, setColaEspecial] = useState<Array<{ numeroGuia: string; resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null }>>([])
  const [guardandoEnLote, setGuardandoEnLote] = useState(false)

  /** Modo Despacho: paquetes seleccionados para crear despacho. */
  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<number>>(new Set())
  const [selectedPackageIdsOrder, setSelectedPackageIdsOrder] = useState<number[]>([])
  const [scannedPackagesForDespacho, setScannedPackagesForDespacho] = useState<Paquete[]>([])
  /** Último escaneo para feedback en modo Despacho (guía + datos paquete). */
  const [lastScannedDespacho, setLastScannedDespacho] = useState<{
    guia: string
    ref?: string
    clienteDestino?: ReturnType<typeof buildClienteDestinoFromPaquete>
    observacion?: string
  } | null>(null)

  /** Diálogo Crear Despacho Masivo */
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [sacaDistribution, setSacaDistribution] = useState('')
  const [tamanosSacasBulk, setTamanosSacasBulk] = useState<TamanoSaca[]>([])
  const [bulkTipoDestino, setBulkTipoDestino] = useState<'AGENCIA' | 'DIRECTO'>('AGENCIA')
  const [bulkIdDestino, setBulkIdDestino] = useState<string>('')
  const [bulkDestinatarioOrigen, setBulkDestinatarioOrigen] = useState<'EXISTENTE' | 'DESDE_PAQUETE'>('EXISTENTE')
  const [bulkIdPaqueteOrigenDestinatario, setBulkIdPaqueteOrigenDestinatario] = useState<string>('')
  const [bulkDesdePaqueteNombre, setBulkDesdePaqueteNombre] = useState('')
  const [bulkDesdePaqueteTelefono, setBulkDesdePaqueteTelefono] = useState('')
  const [bulkDesdePaqueteDireccion, setBulkDesdePaqueteDireccion] = useState('')
  const [bulkDesdePaqueteCanton, setBulkDesdePaqueteCanton] = useState('')
  const [bulkDesdePaqueteCodigo, setBulkDesdePaqueteCodigo] = useState('')
  const [bulkIdDistribuidor, setBulkIdDistribuidor] = useState<string>('')
  const [bulkNumeroGuia, setBulkNumeroGuia] = useState('')
  const [bulkObservaciones, setBulkObservaciones] = useState('')
  const [bulkCodigoPresinto, setBulkCodigoPresinto] = useState('')
  const [bulkFechaDespacho, setBulkFechaDespacho] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  // Restaurar borrador al montar
  useEffect(() => {
    if (draftRestored.current || id == null) return
    draftRestored.current = true
    const draft = getDraft(draftKey)
    if (!draft) return
    const d = draft.data as unknown as LoteEspecialDraftData
    if (d.operacionModo) setOperacionModo(d.operacionModo)
    if (d.colaEspecial?.length) {
      setColaEspecial(d.colaEspecial)
      toast.info(`Se restauró la cola de tipeo con ${d.colaEspecial.length} guía(s)`, { duration: 4000 })
    }
    if (d.selectedPackageIdsOrder?.length) {
      const ids = d.selectedPackageIdsOrder
      setSelectedPackageIdsOrder(ids)
      setSelectedPackageIds(new Set(ids))
      toast.info(`Se restauraron ${ids.length} paquete(s) seleccionados para despacho`, { duration: 4000 })
    }
  }, [id])

  // Auto-guardar borrador cuando el estado cambie
  useEffect(() => {
    if (!draftRestored.current || id == null) return
    const hayDatos = colaEspecial.length > 0 || selectedPackageIdsOrder.length > 0
    if (!hayDatos) {
      clearDraft(draftKey)
      return
    }
    const draftData: LoteEspecialDraftData = {
      operacionModo,
      colaEspecial,
      selectedPackageIdsOrder,
    }
    saveDraft(draftKey, draftData as unknown as Record<string, unknown>)
  }, [id, operacionModo, colaEspecial, selectedPackageIdsOrder, saveDraft, clearDraft, draftKey])

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
      toast.error(getApiErrorMessage(err, 'Error al marcar'))
    },
  })

  const handleConsultarGuia = async () => {
    const n = tipiarGuia.trim().toUpperCase()
    if (!n || id == null) return
    setConsultando(true)
    setLastConsultaResultado(null)
    setLastScannedGuia(n)
    try {
      const res = await listasEtiquetadasService.consultarGuia(n)
      const resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null = res ?? 'sin_etiqueta'
      setLastConsultaResultado(resultado)
      setColaEspecial((prev) => {
        const yaEnCola = prev.some((x) => x.numeroGuia === n)
        if (yaEnCola) {
          toast.info('Ya en cola')
          return [{ numeroGuia: n, resultado }, ...prev.filter((x) => x.numeroGuia !== n)]
        }
        return [{ numeroGuia: n, resultado }, ...prev]
      })
      toast.success('Añadido a la cola')
    } catch {
      setLastConsultaResultado('sin_etiqueta')
      setColaEspecial((prev) => {
        const yaEnCola = prev.some((x) => x.numeroGuia === n)
        const resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null = 'sin_etiqueta'
        if (yaEnCola) {
          toast.info('Ya en cola')
          return [{ numeroGuia: n, resultado }, ...prev.filter((x) => x.numeroGuia !== n)]
        }
        return [{ numeroGuia: n, resultado }, ...prev]
      })
      toast.success('Añadido a la cola (sin etiqueta)')
    } finally {
      setConsultando(false)
    }
  }

  const guardarEnLote = async () => {
    if (colaEspecial.length === 0 || id == null) return
    setGuardandoEnLote(true)
    const count = colaEspecial.length
    try {
      for (const item of colaEspecial) {
        await listasEtiquetadasService.marcarReceptado(item.numeroGuia, id)
      }
      setColaEspecial([])
      clearDraft(draftKey)
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', id] })
      toast.success(`${count} paquete(s) guardado(s) en el lote`)
      inputRef.current?.focus()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al guardar'))
    } finally {
      setGuardandoEnLote(false)
    }
  }

  const quitarDeCola = (numeroGuia: string) => {
    setColaEspecial((prev) => prev.filter((x) => x.numeroGuia !== numeroGuia))
  }

  /** Paquetes para despacho en orden tipiado (para lista y para Combobox "Paquete de referencia"). */
  const selectedPackagesForDestinatario = useMemo(() => {
    return selectedPackageIdsOrder
      .map((id) => paquetes.find((p) => p.idPaquete === id) ?? scannedPackagesForDespacho.find((p) => p.idPaquete === id))
      .filter((p): p is Paquete => p != null)
  }, [paquetes, selectedPackageIdsOrder, scannedPackagesForDespacho])

  const bulkGroups = useMemo(
    () =>
      sacaDistribution
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0),
    [sacaDistribution]
  )
  useEffect(() => {
    if (bulkGroups.length === 0) {
      setTamanosSacasBulk([])
      return
    }
    if (bulkGroups.length !== tamanosSacasBulk.length) {
      let idx = 0
      const recommended = bulkGroups.map((qty) => {
        const paqs = selectedPackagesForDestinatario.slice(idx, idx + qty)
        idx += qty
        return calcularTamanoSugerido(paqs, qty)
      })
      setTamanosSacasBulk(recommended)
    }
  }, [bulkGroups.length, bulkGroups.join(','), selectedPackagesForDestinatario, tamanosSacasBulk.length])

  const paquetesRefOpciones = useMemo<ComboboxOption<Paquete>[]>(() => {
    return selectedPackagesForDestinatario.map((p) => {
      const nombre = (p.nombreClienteDestinatario ?? 'Sin nombre').trim()
      const telefono = (p.telefonoDestinatario ?? '').trim()
      const telefonoSoloDigitos = telefono.replace(/\D/g, '')
      const direccion = [p.direccionDestinatarioCompleta, p.provinciaDestinatario].filter(Boolean).join(' · ')
      return {
        value: p.idPaquete!,
        label: `${nombre} | ${telefono}`.trim() || 'Sin datos',
        description: [telefonoSoloDigitos, direccion].filter(Boolean).join(' ').toLowerCase() || undefined,
        data: p,
      }
    })
  }, [selectedPackagesForDestinatario])

  const paqueteOrigenDestinatario = useMemo(() => {
    if (!bulkIdPaqueteOrigenDestinatario) return null
    return selectedPackagesForDestinatario.find((p) => p.idPaquete === Number(bulkIdPaqueteOrigenDestinatario)) ?? null
  }, [bulkIdPaqueteOrigenDestinatario, selectedPackagesForDestinatario])

  useEffect(() => {
    if (!paqueteOrigenDestinatario) {
      setBulkDesdePaqueteNombre('')
      setBulkDesdePaqueteTelefono('')
      setBulkDesdePaqueteDireccion('')
      setBulkDesdePaqueteCanton('')
      setBulkDesdePaqueteCodigo('')
      return
    }
    const p = paqueteOrigenDestinatario
    setBulkDesdePaqueteNombre((p.nombreClienteDestinatario ?? '').trim())
    setBulkDesdePaqueteTelefono((p.telefonoDestinatario ?? '').trim())
    setBulkDesdePaqueteDireccion((p.direccionDestinatarioCompleta ?? p.direccionDestinatario ?? '').trim())
    setBulkDesdePaqueteCanton((p.cantonDestinatario ?? p.provinciaDestinatario ?? '').trim())
    setBulkDesdePaqueteCodigo(generarCodigo10Digitos())
  }, [paqueteOrigenDestinatario])

  const pesoTotalBulk = useMemo(() => {
    return selectedPackagesForDestinatario.reduce((acc, p) => acc + (p.pesoKilos ?? 0), 0)
  }, [selectedPackagesForDestinatario])

  const codigoDestinoBulk = useMemo(() => {
    if (bulkTipoDestino === 'AGENCIA' && bulkIdDestino) {
      return agencias.find((a) => String(a.idAgencia) === bulkIdDestino)?.codigo ?? null
    }
    if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE' && bulkIdDestino) {
      return destinatariosDirectos.find((d) => String(d.idDestinatarioDirecto) === bulkIdDestino)?.codigo ?? null
    }
    if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE') {
      return bulkDesdePaqueteCodigo || null
    }
    return null
  }, [bulkTipoDestino, bulkIdDestino, bulkDestinatarioOrigen, bulkDesdePaqueteCodigo, agencias, destinatariosDirectos])

  const destinoResumenBulk = useMemo(() => {
    if (bulkTipoDestino === 'AGENCIA' && bulkIdDestino) {
      const a = agencias.find((ag) => String(ag.idAgencia) === bulkIdDestino)
      return a ? `Agencia: ${a.nombre}` : ''
    }
    if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE' && bulkIdDestino) {
      const d = destinatariosDirectos.find((dd) => String(dd.idDestinatarioDirecto) === bulkIdDestino)
      return d ? `Directo: ${d.nombreDestinatario ?? d.nombreEmpresa ?? `#${d.idDestinatarioDirecto}`}` : ''
    }
    if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE' && bulkIdPaqueteOrigenDestinatario) {
      const p = selectedPackagesForDestinatario.find((pp) => pp.idPaquete === Number(bulkIdPaqueteOrigenDestinatario))
      const nombre = p?.nombreClienteDestinatario?.trim() || p?.telefonoDestinatario?.trim() || 'Paquete'
      return `Desde paquete: ${nombre}`
    }
    return ''
  }, [bulkTipoDestino, bulkIdDestino, bulkDestinatarioOrigen, bulkIdPaqueteOrigenDestinatario, agencias, destinatariosDirectos, selectedPackagesForDestinatario])

  const quitarDeDespacho = (idPaquete: number) => {
    setSelectedPackageIds((prev) => {
      const next = new Set(prev)
      next.delete(idPaquete)
      return next
    })
    setSelectedPackageIdsOrder((prev) => prev.filter((x) => x !== idPaquete))
    setScannedPackagesForDespacho((prev) => prev.filter((p) => p.idPaquete !== idPaquete))
  }

  const handleOperacionSubmit = async () => {
    const n = tipiarGuia.trim().toUpperCase()
    if (!n || id == null) return
    if (operacionModo === 'DESPACHO') {
      setConsultando(true)
      setLastScannedDespacho(null)
      try {
        const paquete = await paqueteService.findByNumeroGuia(n)
        if (!paquete || !paquete.idPaquete) {
          toast.error(`Paquete ${n} no encontrado`)
          return
        }
        const idP = paquete.idPaquete
        if (selectedPackageIds.has(idP)) {
          toast.info('Ya tipiado en despacho')
          setLastScannedDespacho({
            guia: paquete.numeroGuia ?? n,
            ref: paquete.ref?.trim(),
            clienteDestino: buildClienteDestinoFromPaquete(paquete),
            observacion: paquete.observaciones?.trim(),
          })
          setTipiarGuia('')
          return
        }
        setSelectedPackageIds((prev) => new Set(prev).add(idP))
        setSelectedPackageIdsOrder((prev) => [idP, ...prev])
        setScannedPackagesForDespacho((prev) => [paquete, ...prev.filter((p) => p.idPaquete !== idP)])
        setLastScannedDespacho({
          guia: paquete.numeroGuia ?? n,
          ref: paquete.ref?.trim(),
          clienteDestino: buildClienteDestinoFromPaquete(paquete),
          observacion: paquete.observaciones?.trim(),
        })
        toast.success('Agregado a despacho')
        setTipiarGuia('')
      } catch {
        toast.error('Error al buscar paquete')
      } finally {
        setConsultando(false)
      }
      return
    }
    handleConsultarGuia()
  }

  const handleBulkCreateDespacho = () => {
    setSacaDistribution('')
    setBulkObservaciones('')
    setBulkDestinatarioOrigen('EXISTENTE')
    setBulkIdPaqueteOrigenDestinatario('')
    setBulkIdDestino('')
    const d = new Date()
    setBulkFechaDespacho(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    )
    setIsBulkDialogOpen(true)
  }

  const executeBulkDespacho = async () => {
    const groups = sacaDistribution
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)
    if (groups.length === 0) {
      toast.error("Ingrese una distribución válida (ej: '5, 5')")
      return
    }
    const totalInGroups = groups.reduce((a, b) => a + b, 0)
    if (totalInGroups !== selectedPackageIdsOrder.length) {
      toast.error(
        `La suma de los grupos (${totalInGroups}) no coincide con los paquetes seleccionados (${selectedPackageIdsOrder.length})`
      )
      return
    }
    const destinoValido =
      bulkTipoDestino === 'AGENCIA'
        ? !!bulkIdDestino
        : bulkDestinatarioOrigen === 'EXISTENTE'
          ? !!bulkIdDestino
          : !!bulkIdPaqueteOrigenDestinatario
    if (!destinoValido || !bulkIdDistribuidor) {
      toast.error(
        bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE'
          ? 'Seleccione el paquete de referencia para el destinatario y el Distribuidor'
          : 'Seleccione Destino (Agencia o Destinatario directo) y Distribuidor en el diálogo'
      )
      return
    }
    setBulkSubmitting(true)
    try {
    let idDestinatarioDirectoPayload: number | undefined
    if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE') {
      idDestinatarioDirectoPayload = Number(bulkIdDestino)
    } else if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE' && bulkIdPaqueteOrigenDestinatario) {
      if (!bulkDesdePaqueteNombre.trim()) {
        toast.error('El paquete seleccionado no tiene nombre de destinatario válido')
        return
      }
      const nuevoDest = await destinatarioDirectoService.create({
        nombreDestinatario: bulkDesdePaqueteNombre.trim(),
        telefonoDestinatario: bulkDesdePaqueteTelefono.trim() || '—',
        direccionDestinatario: bulkDesdePaqueteDireccion.trim() || undefined,
        canton: bulkDesdePaqueteCanton.trim() || undefined,
        codigo: bulkDesdePaqueteCodigo.trim() || undefined,
      })
      idDestinatarioDirectoPayload = nuevoDest.idDestinatarioDirecto!
      queryClient.invalidateQueries({ queryKey: ['destinatarios-directos'] })
    }
      const selectedIdsArray = selectedPackageIdsOrder
      if (id && selectedIdsArray.length > 0) {
        await loteRecepcionService.agregarPaquetes(Number(id), selectedIdsArray)
      }
      let idx = 0
      const sacasPayload = groups.map((qty, i) => {
        const idPaquetes = selectedPackageIdsOrder.slice(idx, idx + qty)
        idx += qty
        const tamano = tamanosSacasBulk[i] ?? TamanoSaca.GRANDE
        return { tamano, idPaquetes }
      })
      const fechaDespachoValue = bulkFechaDespacho
        ? bulkFechaDespacho.length === 16
          ? `${bulkFechaDespacho}:00`
          : bulkFechaDespacho
        : new Date().toISOString().slice(0, 19).replace('Z', '')
      const createPayload = {
        fechaDespacho: fechaDespachoValue,
        usuarioRegistro: user?.nombreCompleto ?? 'OPERARIO',
        observaciones: bulkObservaciones.trim() || undefined,
        codigoPresinto: bulkCodigoPresinto.trim() || undefined,
        idAgencia: bulkTipoDestino === 'AGENCIA' ? Number(bulkIdDestino) : undefined,
        idDestinatarioDirecto: idDestinatarioDirectoPayload,
        idPaqueteOrigenDestinatario: undefined,
        idDistribuidor: Number(bulkIdDistribuidor),
        numeroGuiaAgenciaDistribucion: bulkNumeroGuia.trim() || undefined,
        sacas: sacasPayload,
      }
      await despachoService.create(createPayload)
      toast.success('Despacho masivo completado exitosamente')
      setIsBulkDialogOpen(false)
      setSelectedPackageIds(new Set())
      setSelectedPackageIdsOrder([])
      setScannedPackagesForDespacho([])
      setLastScannedDespacho(null)
      setBulkCodigoPresinto('')
      setBulkDesdePaqueteNombre('')
      setBulkDesdePaqueteTelefono('')
      setBulkDesdePaqueteDireccion('')
      setBulkDesdePaqueteCanton('')
      setBulkDesdePaqueteCodigo('')
      clearDraft(draftKey)
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', id] })
    } catch (err) {
      console.error(err)
      toast.error('Error durante el proceso masivo')
    } finally {
      setBulkSubmitting(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'operacion') {
      inputRef.current?.focus()
    }
  }, [activeTab])

  const [listFilter, setListFilter] = useState<'PENDIENTES' | 'DESPACHADOS'>('PENDIENTES')
  const [showDialogImprimir, setShowDialogImprimir] = useState(false)
  const [tipoImpresion, setTipoImpresion] = useState('TODOS')
  const [imprimiendo, setImprimiendo] = useState(false)
  const [asignarEtiquetaPaquete, setAsignarEtiquetaPaquete] = useState<Paquete | null>(null)
  const [asignarEtiquetaValor, setAsignarEtiquetaValor] = useState('')
  const [paqueteParaAtencion, setPaqueteParaAtencion] = useState<Paquete | null>(null)
  const [showAgregarAtencionDialog, setShowAgregarAtencionDialog] = useState(false)

  const { data: etiquetasExistentes = [] } = useQuery({
    queryKey: ['listas-etiquetadas', 'etiquetas'],
    queryFn: () => listasEtiquetadasService.getAllEtiquetas(),
  })

  const tabsEtiquetas = useMemo(() => {
    const refs = new Set<string>()
    paquetes.forEach((p) => {
      const r = p.ref?.trim()
      if (r && r !== VARIAS_LISTAS_KEY) refs.add(r)
    })
    const list = Array.from(refs).sort()
    return [...list, VARIAS_LISTAS_KEY, SIN_ETIQUETA_KEY]
  }, [paquetes])

  const elegirEtiquetaMutation = useMutation({
    mutationFn: ({ numeroGuia, etiqueta }: { numeroGuia: string; etiqueta: string }) =>
      listasEtiquetadasService.elegirEtiqueta(numeroGuia, etiqueta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
      setAsignarEtiquetaPaquete(null)
      setAsignarEtiquetaValor('')
      toast.success('Etiqueta asignada')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Error'))
    },
  })

  const sortedPaquetes = useMemo(() => {
    const filtered = paquetes.filter((p) => {
      if (listFilter === 'PENDIENTES') return !hasDespacho(p)
      return hasDespacho(p)
    })
    const refKey = (p: Paquete) => (p.ref || '').trim().toLowerCase() || '\uFFFF'
    return [...filtered].sort((a, b) => {
      const cmpRef = refKey(a).localeCompare(refKey(b))
      if (cmpRef !== 0) return cmpRef
      const guiaA = (a.numeroGuia ?? '').toLowerCase()
      const guiaB = (b.numeroGuia ?? '').toLowerCase()
      if (guiaA !== guiaB) return guiaA.localeCompare(guiaB)
      return (a.idPaquete ?? 0) - (b.idPaquete ?? 0)
    })
  }, [paquetes, listFilter])

  const toggleSelectPackage = (id: number, checked: boolean) => {
    if (checked) {
      if (selectedPackageIds.has(id)) return
      setSelectedPackageIds((prev) => new Set(prev).add(id))
      setSelectedPackageIdsOrder((prev) => [...prev, id])
    } else {
      setSelectedPackageIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setSelectedPackageIdsOrder((prev) => prev.filter((x) => x !== id))
      setScannedPackagesForDespacho((prev) => prev.filter((p) => p.idPaquete !== id))
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = sortedPaquetes.map((p) => p.idPaquete!).filter((id): id is number => id !== undefined)
      setSelectedPackageIds(new Set(allIds))
      setSelectedPackageIdsOrder(allIds)
    } else {
      setSelectedPackageIds(new Set())
      setSelectedPackageIdsOrder([])
      setScannedPackagesForDespacho([])
    }
  }

  const handleExportExcel = (tipo: string) => {
    if (!lote || !paquetes.length) {
      toast.error('No hay paquetes para exportar')
      return
    }
    try {
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipo || 'TODOS')
      if (!filtrados.length) {
        toast.warning('No hay paquetes para el filtro seleccionado')
        return
      }
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      generarExcelLoteRecepcion(filtrados, fecha, hora, lote.numeroRecepcion ?? String(id), true)
      const label = tipo === 'TODOS' || !tipo ? 'Todos' : tipo === 'SIN_ETIQUETA' ? 'Sin Etiqueta' : tipo
      toast.success(`Excel exportado (${label})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar Excel')
    }
  }

  const handleExportPdf = async (tipo: string) => {
    if (!lote) return
    try {
      toast.info('Generando PDF...')
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipo)
      await descargarPDFLoteEspecial(filtrados, lote.numeroRecepcion ?? String(id), tipo || 'TODOS')
      toast.success('PDF descargado exitosamente')
    } catch (err) {
      console.error('Error al generar PDF:', err)
      toast.error(err instanceof Error ? err.message : 'Error al generar el PDF')
    }
  }

  const handleImprimir = async (tipoOverride?: string) => {
    if (!lote) return
    const tipo = tipoOverride ?? tipoImpresion
    setImprimiendo(true)
    try {
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipo)
      await imprimirLoteEspecial(filtrados, lote.numeroRecepcion ?? String(id), tipo || 'TODOS')
      setShowDialogImprimir(false)
      toast.success('Ventana de impresión abierta')
    } catch (err) {
      console.error('Error al imprimir:', err)
      toast.error(err instanceof Error ? err.message : 'Error al abrir la impresión')
    } finally {
      setImprimiendo(false)
    }
  }

  const handleAsignarEtiqueta = () => {
    if (!asignarEtiquetaPaquete || !asignarEtiquetaValor.trim()) return
    elegirEtiquetaMutation.mutate({
      numeroGuia: asignarEtiquetaPaquete.numeroGuia ?? '',
      etiqueta: asignarEtiquetaValor.trim().toUpperCase(),
    })
  }

  if (id == null) {
    return null
  }

  if (isLoading || !lote) {
    return <LoadingState label="Cargando lote especial..." />
  }

  if (lote.tipoLote !== 'ESPECIAL') {
    return null
  }

  const mostrarResultado = lastConsultaResultado !== null && !marcarReceptadoMutation.isPending
  const showFeedbackDespacho = lastScannedDespacho != null
  const showFeedbackTipeo = lastScannedGuia != null && lastConsultaResultado !== null

  return (
    <div className={cn("space-y-4", !embedded && "min-h-screen p-4")}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
            Lote especial — {lote.numeroRecepcion || `#${lote.idLoteRecepcion}`}
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/lotes-recepcion' })}>
            Volver
          </Button>
        </div>
      )}

      {/* Toolbar superior: Importar (si embedded), Exportar (Excel + PDF), Imprimir; opcionalmente Editar/Eliminar cuando embedded */}
      <div className="space-y-1.5 mb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-0.5">Acciones</p>
        <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto text-sm">
          {embedded && onImportar != null && (
            <>
              <Button variant="ghost" size="sm" onClick={onImportar} className="h-7 text-muted-foreground hover:text-foreground">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Importar
              </Button>
              <div className="w-px h-3.5 bg-border/60 mx-1" />
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exportar
                <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Exportar</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExportExcel('TODOS')} className="gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Excel (Todos)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel('SIN_ETIQUETA')}>
                Excel - Sin Etiqueta
              </DropdownMenuItem>
              {tabsEtiquetas
                .filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY)
                .map((etq) => (
                  <DropdownMenuItem key={`excel-${etq}`} onClick={() => handleExportExcel(etq)}>
                    Excel - {etq}
                  </DropdownMenuItem>
                ))}
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => handleExportPdf('TODOS')} className="gap-2">
                <FileDown className="h-4 w-4 text-red-600" />
                <span>PDF - Todos</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPdf('SIN_ETIQUETA')}>
                PDF - Sin Etiqueta
              </DropdownMenuItem>
              {tabsEtiquetas
                .filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY)
                .map((etq) => (
                  <DropdownMenuItem key={`pdf-${etq}`} onClick={() => handleExportPdf(etq)}>
                    PDF - {etq}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Imprimir
                <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleImprimir('TODOS')} className="gap-2" disabled={imprimiendo}>
                <Printer className="h-3.5 w-3.5" />
                Imprimir todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDialogImprimir(true)} className="gap-2">
                <Printer className="h-3.5 w-3.5" />
                Imprimir por etiqueta...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {embedded && (onEdit != null || onDelete != null) && (
            <>
              <div className="flex-1" />
              {onEdit != null && (
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-muted-foreground hover:text-foreground">
                  <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar
                </Button>
              )}
              {onDelete != null && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Eliminar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'operacion' | 'lista')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted text-muted-foreground">
          <TabsTrigger value="operacion" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ScanLine className="w-4 h-4 mr-2" /> Operación
          </TabsTrigger>
          <TabsTrigger value="lista" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ListIcon className="w-4 h-4 mr-2" />
            Lista ({paquetes.length})
          </TabsTrigger>
        </TabsList>

      <TabsContent value="operacion" className="mt-4">
        <div className={cn('grid grid-cols-12 gap-6', embedded ? 'min-h-[520px]' : 'min-h-[480px]')}>
          {/* Columna izquierda (8): selector modo + input + feedback */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <Card className="border border-border shadow-sm bg-card overflow-hidden shrink-0">
              <div className="p-2 bg-muted/50 border-b border-border">
                <Tabs value={operacionModo} onValueChange={(v) => setOperacionModo(v as 'DESPACHO' | 'TIPEO')} className="w-full">
                  <TabsList className="w-full grid grid-cols-2 h-10 bg-muted">
                    <TabsTrigger value="DESPACHO" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                      <Truck className="w-4 h-4 mr-2" /> Despacho ({selectedPackageIds.size})
                    </TabsTrigger>
                    <TabsTrigger value="TIPEO" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <QrCode className="w-4 h-4 mr-2" /> Tipeo ({colaEspecial.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardContent className="p-8">
                <div className="relative">
                  <ScanLine className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    value={tipiarGuia}
                    onChange={(e) => setTipiarGuia(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleOperacionSubmit()}
                    className={cn(
                      'h-24 pl-24 text-4xl font-mono tracking-widest uppercase border-2 focus:ring-4 focus:ring-offset-2 placeholder:text-muted-foreground/60 bg-background',
                      operacionModo === 'DESPACHO' &&
                        'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-emerald-800 dark:focus:border-emerald-400',
                      operacionModo === 'TIPEO' &&
                        'border-primary/30 focus:border-primary focus:ring-primary/20'
                    )}
                    placeholder="ESCANEAR..."
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted px-4 py-2 rounded-full border border-border">
                    <QrCode className="h-4 w-4" />
                    <span>ENTER</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Área de feedback */}
            <div className="flex-1 min-h-0">
              {operacionModo === 'DESPACHO' && showFeedbackDespacho && lastScannedDespacho ? (
                <Card className="h-full border-l-[8px] border-l-emerald-500 bg-emerald-500/5 border border-border shadow-sm flex flex-col justify-center animate-in fade-in duration-200">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-6 border-b border-border/50 pb-6">
                      <div className="p-4 bg-background rounded-full shadow-sm border border-border shrink-0">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-5xl font-black tracking-tight text-foreground font-mono leading-none">
                          {lastScannedDespacho.guia}
                        </h2>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-lg px-3 py-1 font-bold uppercase bg-emerald-100 text-emerald-700 border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Agregado a despacho
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      {lastScannedDespacho.ref && (
                        <div className="space-y-1">
                          <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Referencia</span>
                          <p className="text-lg font-medium text-foreground font-mono">{lastScannedDespacho.ref}</p>
                        </div>
                      )}
                      {lastScannedDespacho.clienteDestino && (
                        <div className="space-y-2">
                          <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Dirección</span>
                          {lastScannedDespacho.clienteDestino.direccion && (
                            <p className="text-lg font-medium text-foreground leading-relaxed break-words">{lastScannedDespacho.clienteDestino.direccion}</p>
                          )}
                          {(lastScannedDespacho.clienteDestino.pais ?? lastScannedDespacho.clienteDestino.provincia ?? lastScannedDespacho.clienteDestino.canton) && (
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm pt-1 border-t border-border/50">
                              {lastScannedDespacho.clienteDestino.pais && <span><span className="text-muted-foreground font-medium">País:</span> {lastScannedDespacho.clienteDestino.pais}</span>}
                              {lastScannedDespacho.clienteDestino.provincia && <span><span className="text-muted-foreground font-medium">Provincia:</span> {lastScannedDespacho.clienteDestino.provincia}</span>}
                              {lastScannedDespacho.clienteDestino.canton && <span><span className="text-muted-foreground font-medium">Cantón:</span> {lastScannedDespacho.clienteDestino.canton}</span>}
                            </div>
                          )}
                        </div>
                      )}
                      {lastScannedDespacho.observacion && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                          <span className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold tracking-wider block mb-1">Observaciones</span>
                          <p className="text-lg font-medium text-amber-900 dark:text-amber-100">{lastScannedDespacho.observacion}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : operacionModo === 'TIPEO' && showFeedbackTipeo && lastScannedGuia ? (
                <Card className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in duration-200">
                  <div className="bg-primary/5 border-b border-primary/10 px-6 py-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">Resultado — {lastScannedGuia}</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <CardContent className="p-8 space-y-6">
                    {lastConsultaResultado === 'sin_etiqueta' ? (
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight text-muted-foreground italic">Sin etiqueta</p>
                      </div>
                    ) : (lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).variasListas ? (
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">
                        En listas: {((lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).etiquetas ?? []).join(', ')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {((lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).etiquetas ?? []).map((etq) => (
                          <span key={etq} className="inline-flex items-center rounded-xl bg-primary/15 border-2 border-primary/30 px-5 py-3 text-2xl sm:text-3xl font-bold text-primary">
                            {etq}
                          </span>
                        ))}
                      </div>
                    )}
                    {lastConsultaResultado !== 'sin_etiqueta' && (lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).instruccion && (
                      <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex gap-4 items-start">
                        <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-700 dark:text-amber-300 text-sm font-bold">!</span>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Instrucción</p>
                          <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                            {(lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).instruccion}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full min-h-[160px] border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/10">
                  <ScanLine className="h-16 w-16 opacity-20" />
                  <span className="text-xl font-medium opacity-60">Listo para escanear</span>
                </div>
              )}
            </div>

            {guardandoEnLote && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Guardando en el lote...</span>
              </div>
            )}
          </div>

          {/* Columna derecha (4): panel Despacho o Tipeo */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {operacionModo === 'DESPACHO' ? (
              <Card className="border border-border shadow-sm bg-card flex flex-col overflow-hidden flex-1 min-h-[400px]">
                <CardHeader className="pb-3 border-b border-border bg-muted/30 pt-4 px-4">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <Truck className="h-4 w-4 text-emerald-500" />
                    Paquetes para despacho
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-4 px-4 space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-foreground text-emerald-600 dark:text-emerald-400">{selectedPackageIds.size}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600/70 dark:text-emerald-400/70 tracking-wider">Seleccionados</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSelectedPackageIds(new Set())
                        setSelectedPackageIdsOrder([])
                        setScannedPackagesForDespacho([])
                      }}
                      disabled={selectedPackageIds.size === 0}
                    >
                      Limpiar
                    </Button>
                  </div>
                  {selectedPackagesForDestinatario.length > 0 ? (
                    <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-background p-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 font-medium">Paquetes tipiados (orden de despacho)</p>
                      {selectedPackagesForDestinatario.map((p, idx) => (
                        <div key={p.idPaquete} className="text-xs font-mono text-foreground py-2 px-2 border-b border-border/50 last:border-0 hover:bg-muted/50 flex items-center gap-2 group">
                          <span className="text-muted-foreground w-6 text-right shrink-0">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block truncate">{p.numeroGuia ?? `#${p.idPaquete}`}</span>
                            {p.ref && <span className="text-[10px] text-muted-foreground truncate block">Ref: {p.ref}</span>}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => p.idPaquete != null && quitarDeDespacho(p.idPaquete)}
                            title="Quitar del despacho"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic text-center px-2">
                      Sin paquetes seleccionados. Escanea o elige desde la Lista.
                    </div>
                  )}
                  <div className="mt-auto pt-2 pb-4 space-y-2">
                    <Button
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                      onClick={handleBulkCreateDespacho}
                      disabled={selectedPackageIds.size === 0}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Crear Despacho
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-border bg-card shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Paquetes en cola</span>
                    <span
                      className={cn(
                        'text-xs font-mono px-1.5 py-0.5 rounded-md font-semibold',
                        colaEspecial.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {colaEspecial.length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setColaEspecial([])}
                    disabled={guardandoEnLote || colaEspecial.length === 0}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Limpiar
                  </Button>
                </div>
                <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                  {colaEspecial.length > 0 ? (
                    <ul className="divide-y divide-border/50 flex-1 overflow-y-auto min-h-0">
                      {colaEspecial.map((item, idx) => (
                        <li key={item.numeroGuia} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground font-mono w-6 text-right">{colaEspecial.length - idx}</span>
                            <div className="min-w-0">
                              <p className="font-mono font-medium text-foreground truncate">{item.numeroGuia}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {item.resultado === 'sin_etiqueta' || item.resultado == null
                                  ? 'Sin etiqueta'
                                  : item.resultado.variasListas
                                    ? `En listas: ${(item.resultado.etiquetas ?? []).join(', ')}`
                                    : (item.resultado.etiquetas ?? []).join(', ')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => quitarDeCola(item.numeroGuia)}
                            disabled={guardandoEnLote}
                            aria-label="Quitar de la cola"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Sin paquetes en cola.</p>
                      <p className="text-xs text-muted-foreground">Escanea guías para añadirlos.</p>
                    </div>
                  )}
                  <div className="p-4 border-t border-border bg-muted/10 shrink-0">
                    <Button className="w-full" size="sm" onClick={guardarEnLote} disabled={guardandoEnLote || colaEspecial.length === 0}>
                      {guardandoEnLote ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                      Guardar en el lote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="lista" className="mt-4">
        <div className="relative">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-muted rounded-md p-1">
            <button
              type="button"
              onClick={() => setListFilter('PENDIENTES')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150',
                listFilter === 'PENDIENTES'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setListFilter('DESPACHADOS')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150',
                listFilter === 'DESPACHADOS'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Despachados
            </button>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {sortedPaquetes.length} paquetes
          </span>
        </div>
        <Card className="border border-border">
          <CardContent className="p-0">
            {sortedPaquetes.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <ListIcon className="h-10 w-10 mx-auto opacity-50 mb-2" />
                <p>No hay paquetes en esta vista</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                    <TableRow className="hover:bg-muted/50">
                      {listFilter === 'PENDIENTES' && (
                        <TableHead className="w-[40px] pl-4">
                          <Checkbox
                            checked={sortedPaquetes.length > 0 && selectedPackageIds.size === sortedPaquetes.length}
                            onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[140px]">Guía</TableHead>
                      <TableHead className="min-w-[100px]">Ref / Etiqueta</TableHead>
                      {listFilter === 'DESPACHADOS' && (
                        <TableHead className="min-w-[200px]">Destinatario / Agencia del despacho</TableHead>
                      )}
                      <TableHead className="max-w-[200px]">Observaciones</TableHead>
                      <TableHead className="w-[100px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const getRefLabel = (p: Paquete) => (p.ref || '').trim() || null
                      const colCount = 5
                      return sortedPaquetes.map((p, i) => {
                        const refLabel = getRefLabel(p)
                        const prevRefLabel = i > 0 ? getRefLabel(sortedPaquetes[i - 1]!) : null
                        const showGroupHeader = refLabel !== prevRefLabel
                        return (
                          <Fragment key={p.idPaquete ?? p.numeroGuia ?? i}>
                            {showGroupHeader && (
                              <TableRow>
                                <TableCell colSpan={colCount} className="bg-muted/50 text-xs font-medium text-muted-foreground py-2 px-4">
                                  {refLabel ? `Referencia: ${refLabel}` : 'Sin referencia'}
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow className={cn("transition-colors hover:bg-muted/30", hasDespacho(p) && 'opacity-75 bg-muted/10')}>
                              {listFilter === 'PENDIENTES' && (
                                <TableCell className="pl-4">
                                  <Checkbox
                                    checked={p.idPaquete ? selectedPackageIds.has(p.idPaquete) : false}
                                    onCheckedChange={(checked) => p.idPaquete && toggleSelectPackage(p.idPaquete, !!checked)}
                                  />
                                </TableCell>
                              )}
                              <TableCell className="font-mono text-sm">{p.numeroGuia ?? '-'}</TableCell>
                              <TableCell>
                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                  {p.ref?.trim() || '—'}
                                </span>
                              </TableCell>
                              {listFilter === 'DESPACHADOS' && (
                                <TableCell className="text-sm">
                                  {p.nombreAgenciaDespacho ? (
                                    <div>
                                      <span className="font-medium">{p.nombreAgenciaDespacho}</span>
                                      {p.cantonAgenciaDespacho && (
                                        <span className="text-muted-foreground block text-xs">{p.cantonAgenciaDespacho}</span>
                                      )}
                                    </div>
                                  ) : p.nombreDestinatarioDirectoDespacho ? (
                                    <div>
                                      <span className="font-medium">{p.nombreDestinatarioDirectoDespacho}</span>
                                      {p.direccionDestinatarioDirectoDespacho && (
                                        <span className="text-muted-foreground block text-xs leading-snug break-words">{p.direccionDestinatarioDirectoDespacho}</span>
                                      )}
                                    </div>
                                  ) : (
                                    '—'
                                  )}
                                </TableCell>
                              )}
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={p.observaciones ?? undefined}>
                                {p.observaciones?.trim() || '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  {(!p.ref?.trim() || p.ref === VARIAS_LISTAS_KEY) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        setAsignarEtiquetaPaquete(p)
                                        setAsignarEtiquetaValor('')
                                      }}
                                      title="Asignar etiqueta"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setPaqueteParaAtencion(p)
                                      setShowAgregarAtencionDialog(true)
                                    }}
                                    title="Poner en atención"
                                  >
                                    <ScanLine className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        )
                      })
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        {listFilter === 'PENDIENTES' && selectedPackageIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-popover border border-border text-popover-foreground px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in duration-200 z-50 ring-1 ring-border/50">
            <span className="font-medium text-sm">{selectedPackageIds.size} seleccionados</span>
            <Button size="sm" variant="secondary" onClick={handleBulkCreateDespacho} className="h-8 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors shadow-sm">
              <Truck className="h-3 w-3 mr-2" />
              Crear Despacho
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-muted hover:text-destructive" onClick={() => { setSelectedPackageIds(new Set()); setSelectedPackageIdsOrder([]); setScannedPackagesForDespacho([]) }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        </div>
      </TabsContent>

      {/* Diálogo Crear Despacho Masivo */}
      <CrearDespachoMasivoDialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        packageCount={selectedPackageIds.size}
        pesoTotalBulk={pesoTotalBulk}
        codigoDestinoBulk={codigoDestinoBulk}
        destinoResumen={destinoResumenBulk}
        userNombreCompleto={user?.nombreCompleto}
        bulkTipoDestino={bulkTipoDestino}
        setBulkTipoDestino={setBulkTipoDestino}
        bulkDestinatarioOrigen={bulkDestinatarioOrigen}
        setBulkDestinatarioOrigen={setBulkDestinatarioOrigen}
        bulkIdDestino={bulkIdDestino}
        setBulkIdDestino={setBulkIdDestino}
        bulkIdPaqueteOrigenDestinatario={bulkIdPaqueteOrigenDestinatario}
        setBulkIdPaqueteOrigenDestinatario={setBulkIdPaqueteOrigenDestinatario}
        bulkDesdePaqueteNombre={bulkDesdePaqueteNombre}
        setBulkDesdePaqueteNombre={setBulkDesdePaqueteNombre}
        bulkDesdePaqueteTelefono={bulkDesdePaqueteTelefono}
        setBulkDesdePaqueteTelefono={setBulkDesdePaqueteTelefono}
        bulkDesdePaqueteDireccion={bulkDesdePaqueteDireccion}
        setBulkDesdePaqueteDireccion={setBulkDesdePaqueteDireccion}
        bulkDesdePaqueteCanton={bulkDesdePaqueteCanton}
        setBulkDesdePaqueteCanton={setBulkDesdePaqueteCanton}
        bulkDesdePaqueteCodigo={bulkDesdePaqueteCodigo}
        bulkIdDistribuidor={bulkIdDistribuidor}
        setBulkIdDistribuidor={setBulkIdDistribuidor}
        bulkNumeroGuia={bulkNumeroGuia}
        setBulkNumeroGuia={setBulkNumeroGuia}
        bulkObservaciones={bulkObservaciones}
        setBulkObservaciones={setBulkObservaciones}
        bulkCodigoPresinto={bulkCodigoPresinto}
        setBulkCodigoPresinto={setBulkCodigoPresinto}
        bulkFechaDespacho={bulkFechaDespacho}
        setBulkFechaDespacho={setBulkFechaDespacho}
        sacaDistribution={sacaDistribution}
        setSacaDistribution={setSacaDistribution}
        tamanosSacasBulk={tamanosSacasBulk}
        setTamanosSacasBulk={setTamanosSacasBulk}
        agencias={agencias
          .filter((a): a is typeof a & { idAgencia: number } => a.idAgencia != null)
          .map((a) => ({ idAgencia: a.idAgencia, nombre: a.nombre, canton: a.canton }))}
        destinatariosDirectos={destinatariosDirectos
          .filter((d): d is typeof d & { idDestinatarioDirecto: number } => d.idDestinatarioDirecto != null)
          .map((d) => ({
            idDestinatarioDirecto: d.idDestinatarioDirecto,
            nombreDestinatario: d.nombreDestinatario,
            nombreEmpresa: d.nombreEmpresa,
            canton: d.canton,
            activo: d.activo,
          }))}
        distribuidores={distribuidores
          .filter((d): d is typeof d & { idDistribuidor: number } => d.idDistribuidor != null)
          .map((d) => ({ idDistribuidor: d.idDistribuidor, nombre: d.nombre }))}
        paquetesRefOpciones={paquetesRefOpciones}
        onOpenCrearDestinatario={() => setShowCrearClienteDialog(true)}
        onOpenCrearAgencia={() => setShowCrearAgenciaDialog(true)}
        onConfirm={executeBulkDespacho}
        confirmDisabled={
          bulkSubmitting ||
          !bulkIdDistribuidor ||
          sacaDistribution.split(',').reduce((a, b) => a + (parseInt(b.trim(), 10) || 0), 0) !== selectedPackageIds.size ||
          (bulkTipoDestino === 'AGENCIA' && !bulkIdDestino) ||
          (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE' && !bulkIdDestino) ||
          (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE' && (!bulkIdPaqueteOrigenDestinatario || !bulkDesdePaqueteCodigo))
        }
      />

      {/* Diálogo: Nuevo destinatario directo (desde Crear Despacho Masivo) */}
      <Dialog open={showCrearClienteDialog} onOpenChange={setShowCrearClienteDialog}>
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
                  <Select
                    value={nuevoClienteActivo ? 'true' : 'false'}
                    onValueChange={(value) => setNuevoClienteActivo(value === 'true')}
                  >
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
            <Button variant="outline" onClick={() => setShowCrearClienteDialog(false)}>Cancelar</Button>
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
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={nuevaAgenciaEmail} onChange={e => setNuevaAgenciaEmail(e.target.value)} placeholder="correo@agencia.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado</Label>
                  <Select
                    value={nuevaAgenciaActiva ? 'true' : 'false'}
                    onValueChange={(value) => setNuevaAgenciaActiva(value === 'true')}
                  >
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
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Contacto telefónico</Label>
                  <div className="space-y-2">
                    {nuevaAgenciaTelefonos.map((telefono, index) => (
                      <div key={`tel-agencia-lote-especial-${index}`} className="flex gap-2 items-center">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAgregarTelefonoAgencia}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Agregar otro teléfono
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrearAgenciaDialog(false)}>Cancelar</Button>
            <Button onClick={handleCrearAgencia} disabled={createAgenciaMutation.isPending}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialogImprimir} onOpenChange={setShowDialogImprimir}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Imprimir Lote Especial
            </DialogTitle>
            <DialogDescription>
              Selecciona qué sección del lote deseas imprimir en PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sección a imprimir</Label>
              <Select value={tipoImpresion} onValueChange={setTipoImpresion}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los paquetes</SelectItem>
                  <SelectItem value="SIN_ETIQUETA">Sin etiqueta</SelectItem>
                  {tabsEtiquetas
                    .filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY)
                    .map((etq) => (
                      <SelectItem key={etq} value={etq}>
                        {etq}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialogImprimir(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleImprimir()} disabled={imprimiendo} className="gap-2">
              {imprimiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Imprimir PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!asignarEtiquetaPaquete} onOpenChange={(open) => !open && setAsignarEtiquetaPaquete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Asignar etiqueta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Guía Seleccionada</p>
              <p className="font-mono font-semibold text-primary">{asignarEtiquetaPaquete?.numeroGuia}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nueva Etiqueta</Label>
              <Input
                placeholder="Ej: MIA, GEO..."
                value={asignarEtiquetaValor}
                onChange={(e) => setAsignarEtiquetaValor(e.target.value)}
                list={`asignar-etiquetas-list-${id}`}
                className="h-11 shadow-sm"
              />
              <datalist id={`asignar-etiquetas-list-${id}`}>
                {etiquetasExistentes.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
              <p className="text-[10px] text-muted-foreground italic">
                Sugerencia: Puedes usar etiquetas existentes o crear una nueva.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsignarEtiquetaPaquete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAsignarEtiqueta}
              disabled={!asignarEtiquetaValor.trim() || elegirEtiquetaMutation.isPending}
              className="gap-2"
            >
              {elegirEtiquetaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Asignar Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showAgregarAtencionDialog && paqueteParaAtencion && (
        <AgregarAtencionDialog
          open={showAgregarAtencionDialog}
          onOpenChange={(open) => {
            setShowAgregarAtencionDialog(open)
            if (!open) setPaqueteParaAtencion(null)
          }}
          paquete={paqueteParaAtencion}
          onSuccess={() => {
            setPaqueteParaAtencion(null)
            queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
          }}
        />
      )}
      </Tabs>
    </div>
  )
}
