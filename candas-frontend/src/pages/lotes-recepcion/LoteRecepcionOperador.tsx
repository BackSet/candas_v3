import { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ArrowLeft,
    Box,
    QrCode,
    ScanLine,
    Truck,
    MapPin,
    FileText,
    List as ListIcon,
    CheckCircle2,
    Link as LinkIcon,
    Scissors,
    Sparkles,
    X,
    Clock,
    MoreHorizontal,
    ChevronsUpDown,
    Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { usePaquetesLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { loteRecepcionService } from '@/lib/api/lote-recepcion.service'
import { useUpdatePaquete } from '@/hooks/usePaquetes'
import AgregarAtencionDialog from '@/components/lotes-recepcion/AgregarAtencionDialog'
import CambiarTipoMasivoDialog from '@/components/lotes-recepcion/CambiarTipoMasivoDialog'
import { useAgencias } from '@/hooks/useAgencias'
import { useDistribuidores } from '@/hooks/useDistribuidores'
import { useDestinatariosDirectos } from '@/hooks/useDestinatariosDirectos'
import { useDestinatarioDirectoManager } from '@/hooks/useDestinatarioDirectoManager'
import { LoadingState } from '@/components/states'
import { TipoPaquete, TipoDestino, type Paquete } from '@/types/paquete'
import { paqueteService } from '@/lib/api/paquete.service'
import { sacaService } from '@/lib/api/saca.service'
import { despachoService } from '@/lib/api/despacho.service'
import { destinatarioDirectoService } from '@/lib/api/destinatario-directo.service'
import { TamanoSaca } from '@/types/saca'
import { calcularTamanoSugerido } from '@/utils/saca'
import { formatearTamanoSaca } from '@/utils/ensacado'
import { guiaEfectiva } from '@/utils/paqueteGuia'
import { calcularProvinciaOCantonMasComun } from '@/utils/provinciaCanton'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { useAuthStore } from '@/stores/authStore'
import { Textarea } from '@/components/ui/textarea'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import { PERMISSIONS } from '@/types/permissions'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import CrearDespachoMasivoDialog from '@/components/despachos/CrearDespachoMasivoDialog'
import { useDespachoMasivoSession, useUpdateDespachoMasivoSession } from '@/hooks/useDespachoMasivoSession'
import type { DespachoMasivoSessionPayload, DespachoMasivoSessionPaqueteItem } from '@/types/despacho-masivo-session'

// Types for local state (Mock for "Despacho" scanning session)
interface ScannedPackage {
    id: string
    guia: string
    timestamp: Date
    destinoType: 'DOMICILIO' | 'AGENCIA' | 'DESPACHO'
    destinoNombre?: string
    observacion?: string
    despachoId?: string
    sacaId?: string
    tipoPaquete?: TipoPaquete | null
    /** Referencia del paquete (ref) si existe */
    ref?: string
    /** Datos del cliente destino para visualización al tipiar */
    clienteDestino?: {
        nombre?: string
        direccion?: string
        provincia?: string
        canton?: string
        pais?: string
        telefono?: string
    }
}

interface SacaState {
    id: number
    numero: string
    paquetes: number
    peso: number
}

interface DespachoState {
    idDespacho?: number
    numero: string
    tipoDestino: TipoDestino | 'DISTRIBUIDOR' // Custom for this view
    idDestino?: string
    idDistribuidor?: string
    pesoTotal: number
    sacas: SacaState[]
    activeSacaId?: number
    isOpen: boolean
}

export interface LoteRecepcionOperadorProps {
    /** Cuando true, no renderiza header ni página completa; solo contenido para incrustar en LoteRecepcionDetail */
    embedded?: boolean
}

/** True solo si el paquete tiene un despacho asociado (saca con despacho en backend). */
function hasDespacho(p: Paquete): boolean {
    return p.idDespacho != null && p.idDespacho > 0
}

/** Extrae datos del cliente destino del paquete para mostrar al tipiar. Quita de la dirección el sufijo ", Provincia, Cantón, País" para mostrarlo solo en la parte inferior. */
function buildClienteDestinoFromPaquete(p: Paquete): ScannedPackage['clienteDestino'] {
    const nombre = p.nombreClienteDestinatario?.trim()
    let direccion = (p.direccionDestinatarioCompleta || p.direccionDestinatario)?.trim() ?? ''
    const provincia = p.provinciaDestinatario?.trim()
    const canton = p.cantonDestinatario?.trim()
    const pais = p.paisDestinatario?.trim()
    const telefono = p.telefonoDestinatario?.trim()
    // Quitar de la dirección el sufijo ", Provincia, Cantón, País" (p. ej. ", Quito, Pichincha, Ecuador")
    const sufijoUbicacion = [provincia, canton, pais].filter(Boolean).join(', ')
    if (sufijoUbicacion && direccion.endsWith(sufijoUbicacion)) {
        direccion = direccion.slice(0, -sufijoUbicacion.length).replace(/,?\s*$/, '').trim()
    } else {
        // Si no hay campos separados, quitar igualmente un sufijo con forma ", X, Y, Z" al final
        direccion = direccion.replace(/,(\s*[^,]+,\s*[^,]+,\s*[^,]+)\s*$/, '').trim()
    }
    if (!nombre && !direccion && !provincia && !canton && !pais && !telefono) return undefined
    return {
        nombre: nombre || undefined,
        direccion: direccion || undefined,
        provincia: provincia || undefined,
        canton: canton || undefined,
        pais: pais || undefined,
        telefono: telefono || undefined
    }
}

/** Para la lista: dirección sin el sufijo ", Provincia, Cantón, País" (evita duplicados). */
function getDireccionLimpiaParaLista(p: Paquete): string {
    let dir = (p.direccionDestinatarioCompleta || p.direccionDestinatario)?.trim() ?? ''
    const provincia = p.provinciaDestinatario?.trim()
    const canton = p.cantonDestinatario?.trim()
    const pais = p.paisDestinatario?.trim()
    const sufijo = [provincia, canton, pais].filter(Boolean).join(', ')
    if (sufijo && dir.endsWith(sufijo)) {
        dir = dir.slice(0, -sufijo.length).replace(/,?\s*$/, '').trim()
    } else {
        dir = dir.replace(/,(\s*[^,]+,\s*[^,]+,\s*[^,]+)\s*$/, '').trim()
    }
    return dir
}

/** Clave de ordenación por dirección del paquete (destino) para agrupar en lista. */
function getDireccionSortKey(p: Paquete): string {
    if (p.tipoDestino === 'AGENCIA') {
        const nombre = (p.nombreAgenciaDestino || '').trim()
        const provincia = (p.cantonAgenciaDestino || '').trim()
        return `${nombre} ${provincia}`.trim() || 'Sin destino'
    }
    if (p.tipoDestino === 'DOMICILIO') {
        if (p.direccionDestinatarioCompleta) return p.direccionDestinatarioCompleta.trim()
        const provincia = (p.provinciaDestinatario || '').trim()
        const dir = (p.direccionDestinatario || '').trim()
        return `${provincia} ${dir}`.trim() || 'Sin destino'
    }
    return 'Sin destino'
}

/** Convierte un Paquete a ítem serializable para sesión (cola de despacho y paquetesByMode). */
function paqueteToSessionItem(p: Paquete): DespachoMasivoSessionPaqueteItem {
    return {
        numeroGuia: p.numeroGuia,
        nombreClienteDestinatario: p.nombreClienteDestinatario,
        ref: p.ref,
        direccionDestinatarioCompleta: p.direccionDestinatarioCompleta,
        provinciaDestinatario: p.provinciaDestinatario,
        cantonDestinatario: p.cantonDestinatario,
        paisDestinatario: p.paisDestinatario,
        observaciones: p.observaciones,
        pesoKilos: p.pesoKilos,
    }
}

export default function LoteRecepcionOperador({ embedded = false }: LoteRecepcionOperadorProps = {}) {
    const { id } = useParams({ strict: false })
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Data Fetching
    const { data: paquetes, isLoading } = usePaquetesLoteRecepcion(id ? Number(id) : undefined)
    const { data: agenciasResponse } = useAgencias(0, 100)
    const { data: distribuidoresResponse } = useDistribuidores(0, 100)

    const agencias = agenciasResponse?.content || []
    const distribuidores = distribuidoresResponse?.content || []
            const { data: session } = useDespachoMasivoSession({ refetchInterval: false })
    const updateDespachoMasivoSession = useUpdateDespachoMasivoSession()
    const { data: destinatariosDirectos = [] } = useDestinatariosDirectos()
    const updatePaqueteMutation = useUpdatePaquete()

    const [listFilter, setListFilter] = useState<'PENDIENTES' | 'PROCESADOS'>('PENDIENTES')
    const [listTipoTab, setListTipoTab] = useState<'CLEMENTINA' | 'SEPARAR' | 'CADENITA' | 'OTROS'>('OTROS')

    // Atención paquete: al poner tipo "Pendiente revisión" se abre registro de atención; si es CLEMENTINA se elige padre o hijo
    const [showAgregarAtencionDialog, setShowAgregarAtencionDialog] = useState(false)
    const [paqueteParaAtencion, setPaqueteParaAtencion] = useState<Paquete | null>(null)
    const [showClementinaChoiceDialog, setShowClementinaChoiceDialog] = useState(false)
    const [clementinaChoiceData, setClementinaChoiceData] = useState<{ parent: Paquete; child?: Paquete; children?: Paquete[] } | null>(null)

    // Mapa idPaquetePadre -> hijos[] (misma lógica que vista normal para CLEMENTINA)
    const mapaClementinaHijos = useMemo(() => {
        const mapa = new Map<number, Paquete[]>()
        if (!paquetes?.length) return mapa
        paquetes
            .filter(p => p.idPaquetePadre != null)
            .forEach(p => {
                const idPadre = p.idPaquetePadre!
                if (!mapa.has(idPadre)) mapa.set(idPadre, [])
                mapa.get(idPadre)!.push(p)
            })
        return mapa
    }, [paquetes])

    // Lista efectiva: CLEMENTINA padres expandidos a hijos cuando existen; hijos no como filas sueltas
    const paquetesParaLista = useMemo(() => {
        if (!paquetes) return []
        const result: Paquete[] = []
        for (const p of paquetes) {
            if (p.idPaquetePadre != null) continue
            if (p.tipoPaquete === TipoPaquete.CLEMENTINA && p.idPaquete) {
                const hijos = mapaClementinaHijos.get(p.idPaquete)
                if (hijos?.length) {
                    result.push(...hijos)
                    continue
                }
                result.push(p)
            } else {
                result.push(p)
            }
        }
        return result
    }, [paquetes, mapaClementinaHijos])

    // Contadores por pestaña de tipo (para labels)
    const countsPorTipoTab = useMemo(() => {
        const c = { CLEMENTINA: 0, SEPARAR: 0, CADENITA: 0, OTROS: 0 }
        for (const p of paquetesParaLista) {
            if (p.tipoPaquete === TipoPaquete.CLEMENTINA || p.idPaquetePadre != null) c.CLEMENTINA++
            else if (p.tipoPaquete === TipoPaquete.SEPARAR) c.SEPARAR++
            else if (p.tipoPaquete === TipoPaquete.CADENITA) c.CADENITA++
            else c.OTROS++
        }
        return c
    }, [paquetesParaLista])

    // Filtrar por pestaña de tipo (Clementina, Separar, Cadenita, Otros)
    const paquetesPorTipoTab = useMemo(() => {
        if (!paquetesParaLista.length) return []
        return paquetesParaLista.filter(p => {
            if (listTipoTab === 'CLEMENTINA') return p.tipoPaquete === TipoPaquete.CLEMENTINA || p.idPaquetePadre != null
            if (listTipoTab === 'SEPARAR') return p.tipoPaquete === TipoPaquete.SEPARAR
            if (listTipoTab === 'CADENITA') return p.tipoPaquete === TipoPaquete.CADENITA
            // OTROS: sin tipo de los tres anteriores y no hijo de Clementina
            return p.idPaquetePadre == null && p.tipoPaquete !== TipoPaquete.CLEMENTINA && p.tipoPaquete !== TipoPaquete.SEPARAR && p.tipoPaquete !== TipoPaquete.CADENITA
        })
    }, [paquetesParaLista, listTipoTab])

    const sortedPaquetes = useMemo(() => {
        if (!paquetesPorTipoTab.length) return []

        // 1. Filter by Pendientes/Trabajados
        const baseList = paquetesPorTipoTab.filter(p => {
            if (listFilter === 'PENDIENTES') return !hasDespacho(p)
            if (listFilter === 'PROCESADOS') return hasDespacho(p)
            return true
        })

        // 2. Sort by referencia (ref) first, then by dirección (destino); sin ref al final
        const refKey = (p: Paquete) => (p.ref || '').trim().toLowerCase() || '\uFFFF'
        return [...baseList].sort((a, b) => {
            const refA = refKey(a)
            const refB = refKey(b)
            const cmpRef = refA.localeCompare(refB)
            if (cmpRef !== 0) return cmpRef
            const dirA = getDireccionSortKey(a).toLowerCase()
            const dirB = getDireccionSortKey(b).toLowerCase()
            return dirA.localeCompare(dirB)
        })
    }, [paquetesPorTipoTab, listFilter])

    // Infinite Scroll
    const { visibleItems, observerTarget } = useInfiniteList(sortedPaquetes, { initialItems: 50, itemsPerBatch: 50 })

    // State
    const [activeTab, setActiveTab] = useState<'despacho' | 'lista'>('despacho')
    const [scanMode, setScanMode] = useState<'DESPACHO' | 'DOMICILIO' | 'CLEMENTINA' | 'SEPARAR' | 'CADENITA'>('DESPACHO')
    const [inputValue, setInputValue] = useState('')
    const [lastScanned, setLastScanned] = useState<ScannedPackage | null>(null)
    const [selectedPackageIds, setSelectedPackageIds] = useState<Set<number>>(new Set())
    /** Orden tipiado para despacho: lista en el orden en que se escanearon (o orden de tabla si "Seleccionar todo"). */
    const [selectedPackageIdsOrder, setSelectedPackageIdsOrder] = useState<number[]>([])
    /** Paquetes escaneados para despacho (pueden no estar en paquetes del lote); permite listar siempre los tipiados. */
    const [scannedPackagesForDespacho, setScannedPackagesForDespacho] = useState<Paquete[]>([])

    type ModoClasificacion = 'DOMICILIO' | 'CLEMENTINA' | 'SEPARAR' | 'CADENITA'
    /** Cola de paquetes tipiados por modo: se guarda el paquete completo para poder listar aunque no esté en paquetes del lote. Nuevo tipiado al inicio. */
    const [typedPackagesByMode, setTypedPackagesByMode] = useState<Record<ModoClasificacion, Paquete[]>>({
        DOMICILIO: [],
        CLEMENTINA: [],
        SEPARAR: [],
        CADENITA: []
    })

    const addToTypedQueue = (mode: ModoClasificacion, paquete: Paquete) => {
        const id = paquete.idPaquete!
        setTypedPackagesByMode(prev => {
            const list = prev[mode].filter(p => p.idPaquete !== id)
            return { ...prev, [mode]: [paquete, ...list] }
        })
    }
    const removeFromTypedQueue = (mode: ModoClasificacion, id: number) => {
        setTypedPackagesByMode(prev => ({ ...prev, [mode]: prev[mode].filter(p => p.idPaquete !== id) }))
    }
    const clearTypedQueue = (mode: ModoClasificacion) => {
        setTypedPackagesByMode(prev => ({ ...prev, [mode]: [] }))
    }

    /** Diálogo de confirmación cuando el paquete escaneado ya tiene tipo asignado (el operario decide si añadir igual). */
    const [pendingTypeConfirm, setPendingTypeConfirm] = useState<{ paquete: Paquete; mode: ModoClasificacion } | null>(null)

    // Bulk Dispatch Dialog State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [sacaDistribution, setSacaDistribution] = useState('')
    const [tamanosSacasBulk, setTamanosSacasBulk] = useState<TamanoSaca[]>([])
    const [bulkTipoDestino, setBulkTipoDestino] = useState<'AGENCIA' | 'DIRECTO'>('AGENCIA')
    const [bulkIdDestino, setBulkIdDestino] = useState<string>('')
    const [bulkDestinatarioOrigen, setBulkDestinatarioOrigen] = useState<'EXISTENTE' | 'DESDE_PAQUETE'>('EXISTENTE')
    const [bulkIdPaqueteOrigenDestinatario, setBulkIdPaqueteOrigenDestinatario] = useState<string>('')
    /** Datos editables del destinatario cuando origen es DESDE_PAQUETE (se rellenan al seleccionar el paquete) */
    const [bulkDesdePaqueteNombre, setBulkDesdePaqueteNombre] = useState('')
    const [bulkDesdePaqueteTelefono, setBulkDesdePaqueteTelefono] = useState('')
    const [bulkDesdePaqueteDireccion, setBulkDesdePaqueteDireccion] = useState('')
    const [bulkDesdePaqueteCanton, setBulkDesdePaqueteCanton] = useState('')
    const [bulkIdDistribuidor, setBulkIdDistribuidor] = useState<string>('')
    const [bulkNumeroGuia, setBulkNumeroGuia] = useState('')
    const [bulkObservaciones, setBulkObservaciones] = useState('')
    const [bulkCodigoPresinto, setBulkCodigoPresinto] = useState('')
    const [bulkFechaDespacho, setBulkFechaDespacho] = useState<string>(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    })
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
        handleCrearCliente,
    } = destinatarioManager

    // Mock Session State (Simulates "Despacho" progress in this session)
    const [sessionPackets, setSessionPackets] = useState<ScannedPackage[]>([])
    const [currentDespacho, setCurrentDespacho] = useState<DespachoState>({
        idDespacho: undefined,
        numero: 'NUEVO',
        tipoDestino: TipoDestino.AGENCIA,
        pesoTotal: 0,
        sacas: [],
        activeSacaId: undefined,
        isOpen: true
    })

    // Refs
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hasRehydratedForLoteRef = useRef(false)
    // Handlers for Selection (orden tipiado: selectedPackageIdsOrder es la fuente para distribución de sacas)
    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = sortedPaquetes.map(p => p.idPaquete!).filter((id): id is number => id !== undefined)
            setSelectedPackageIds(new Set(allIds))
            setSelectedPackageIdsOrder(allIds)
        } else {
            setSelectedPackageIds(new Set())
            setSelectedPackageIdsOrder([])
            setScannedPackagesForDespacho([])
        }
    }

    const openAtencionFlowForPaquete = (pkg: Paquete) => {
        if (pkg.idPaquetePadre != null) {
            const parent = paquetes?.find(p => p.idPaquete === pkg.idPaquetePadre)
            if (parent) {
                setClementinaChoiceData({ parent, child: pkg })
                setShowClementinaChoiceDialog(true)
            } else {
                setPaqueteParaAtencion(pkg)
                setShowAgregarAtencionDialog(true)
            }
        } else if (pkg.tipoPaquete === TipoPaquete.CLEMENTINA && pkg.idPaquete && mapaClementinaHijos.get(pkg.idPaquete)?.length) {
            const children = mapaClementinaHijos.get(pkg.idPaquete)!
            setClementinaChoiceData({ parent: pkg, children })
            setShowClementinaChoiceDialog(true)
        } else {
            setPaqueteParaAtencion(pkg)
            setShowAgregarAtencionDialog(true)
        }
    }

    const toggleSelectPackage = (id: number, checked: boolean) => {
        if (checked) {
            if (selectedPackageIds.has(id)) return
            setSelectedPackageIds(prev => new Set(prev).add(id))
            setSelectedPackageIdsOrder(prev => [...prev, id])
        } else {
            setSelectedPackageIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
            setSelectedPackageIdsOrder(prev => prev.filter(x => x !== id))
            setScannedPackagesForDespacho(prev => prev.filter(p => p.idPaquete !== id))
        }
    }

    const handleBulkCreateDespacho = () => {
        setSacaDistribution('')
        setBulkObservaciones('')
        setBulkDestinatarioOrigen('EXISTENTE')
        setBulkIdDestino('')
        setBulkIdPaqueteOrigenDestinatario('')
        const d = new Date()
        setBulkFechaDespacho(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
        setIsBulkDialogOpen(true)
    }

    const [showCambiarTipoDialog, setShowCambiarTipoDialog] = useState(false)

    // Paquetes seleccionados para elegir "paquete de referencia" (orden tipiado)
    /** Lista de paquetes para despacho en orden tipiado; resuelve desde paquetes del lote o desde escaneados. */
    const selectedPackagesForDestinatario = useMemo(() => {
        return selectedPackageIdsOrder
            .map(id => paquetes?.find(p => p.idPaquete === id) ?? scannedPackagesForDespacho.find(p => p.idPaquete === id))
            .filter((p): p is Paquete => p != null)
    }, [paquetes, selectedPackageIdsOrder, scannedPackagesForDespacho])

    /** Cantón/provincia predominante de los paquetes del despacho (para auto-selección de destino en diálogo masivo). */
    const provinciaOCantonBulk = useMemo(() => {
        if (selectedPackagesForDestinatario.length === 0) return { provincia: null as string | null, canton: null as string | null }
        return calcularProvinciaOCantonMasComun(selectedPackagesForDestinatario)
    }, [selectedPackagesForDestinatario])

    /** Peso total (kg) de los paquetes seleccionados para el despacho masivo. */
    const pesoTotalBulk = useMemo(() => {
        return selectedPackagesForDestinatario.reduce((acc, p) => acc + (p.pesoKilos ?? 0), 0)
    }, [selectedPackagesForDestinatario])

    /** IDs de paquetes seleccionados ordenados por referencia y dirección, para guardar en el lote. */
    const idsOrdenadosPorReferenciaParaLote = useMemo(() => {
        const refKey = (p: Paquete) => (p.ref || '').trim().toLowerCase() || '\uFFFF'
        return [...selectedPackagesForDestinatario]
            .sort((a, b) => {
                const cmpRef = refKey(a).localeCompare(refKey(b))
                if (cmpRef !== 0) return cmpRef
                return getDireccionSortKey(a).toLowerCase().localeCompare(getDireccionSortKey(b).toLowerCase())
            })
            .map(p => p.idPaquete!)
            .filter((id): id is number => id != null)
    }, [selectedPackagesForDestinatario])

    /** Código del destino seleccionado (agencia o destinatario directo) para mostrar en el diálogo. */
    const codigoDestinoBulk = useMemo(() => {
        if (bulkTipoDestino === 'AGENCIA' && bulkIdDestino) {
            return agencias.find(a => String(a.idAgencia) === bulkIdDestino)?.codigo ?? null
        }
        if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE' && bulkIdDestino) {
            return destinatariosDirectos.find(d => String(d.idDestinatarioDirecto) === bulkIdDestino)?.codigo ?? null
        }
        return null
    }, [bulkTipoDestino, bulkIdDestino, bulkDestinatarioOrigen, agencias, destinatariosDirectos])

    /** Texto resumido del destino para la barra del diálogo (Agencia: X, Directo: Y, Desde paquete: Z, o vacío). */
    const destinoResumenBulk = useMemo(() => {
        if (bulkTipoDestino === 'AGENCIA' && bulkIdDestino) {
            const a = agencias.find(ag => String(ag.idAgencia) === bulkIdDestino)
            return a ? `Agencia: ${a.nombre}` : ''
        }
        if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE' && bulkIdDestino) {
            const d = destinatariosDirectos.find(dd => String(dd.idDestinatarioDirecto) === bulkIdDestino)
            return d ? `Directo: ${d.nombreDestinatario ?? d.nombreEmpresa ?? `#${d.idDestinatarioDirecto}`}` : ''
        }
        if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE' && bulkIdPaqueteOrigenDestinatario) {
            const p = selectedPackagesForDestinatario.find(pp => pp.idPaquete === Number(bulkIdPaqueteOrigenDestinatario))
            const nombre = p?.nombreClienteDestinatario?.trim() || p?.telefonoDestinatario?.trim() || 'Paquete'
            return `Desde paquete: ${nombre}`
        }
        return ''
    }, [bulkTipoDestino, bulkIdDestino, bulkDestinatarioOrigen, bulkIdPaqueteOrigenDestinatario, agencias, destinatariosDirectos, selectedPackagesForDestinatario])

    // Auto-seleccionar agencia o destinatario directo por cantón predominante
    useEffect(() => {
        const cantonPredominante = provinciaOCantonBulk.canton ?? provinciaOCantonBulk.provincia
        if (!isBulkDialogOpen || !cantonPredominante || bulkIdDestino) return
        const valorBuscar = cantonPredominante.toUpperCase()
        if (bulkTipoDestino === 'AGENCIA') {
            const agenciaCoincidente = agencias.find((a) => a.canton?.toUpperCase() === valorBuscar)
            if (agenciaCoincidente?.idAgencia) {
                setBulkIdDestino(String(agenciaCoincidente.idAgencia))
                toast.info(`Se ha seleccionado automáticamente la agencia en ${agenciaCoincidente.canton ?? cantonPredominante}`, {
                    duration: 3000,
                    icon: <Sparkles className="h-4 w-4 text-primary" />
                })
            }
        } else if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE') {
            const destCoincidente = destinatariosDirectos.find((d) => d.canton?.toUpperCase() === valorBuscar && d.activo !== false)
            if (destCoincidente?.idDestinatarioDirecto) {
                setBulkIdDestino(String(destCoincidente.idDestinatarioDirecto))
                toast.info(`Se ha seleccionado automáticamente el destinatario de ${destCoincidente.canton ?? cantonPredominante}`, {
                    duration: 3000,
                    icon: <Sparkles className="h-4 w-4 text-primary" />
                })
            }
        }
    }, [isBulkDialogOpen, provinciaOCantonBulk, bulkTipoDestino, bulkDestinatarioOrigen, bulkIdDestino, agencias, destinatariosDirectos])

    // Sincronizar tamaños de sacas bulk cuando cambia la distribución (recomendación por peso o cantidad)
    const bulkGroups = useMemo(() =>
        sacaDistribution.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0),
        [sacaDistribution]
    )
    useEffect(() => {
        if (bulkGroups.length === 0) {
            setTamanosSacasBulk([])
            return
        }
        if (bulkGroups.length !== tamanosSacasBulk.length) {
            let idx = 0
            const recommended = bulkGroups.map(qty => {
                const paqs = selectedPackagesForDestinatario.slice(idx, idx + qty)
                idx += qty
                return calcularTamanoSugerido(paqs, qty)
            })
            setTamanosSacasBulk(recommended)
        }
    }, [bulkGroups.length, bulkGroups.join(','), selectedPackagesForDestinatario, tamanosSacasBulk.length])

    // Reset rehydrate flag al cambiar de lote para permitir rehidratar en el nuevo lote
    useEffect(() => {
        hasRehydratedForLoteRef.current = false
    }, [id])

    // PUSH: persistir cola de despacho y paquetes por pestaña en sesión (debounce 500 ms)
    useEffect(() => {
        const payload: DespachoMasivoSessionPayload = {
            idLote: id ? Number(id) : undefined,
            tipoLote: 'NORMAL',
            packageCount: selectedPackagesForDestinatario.length,
            pesoTotalBulk: selectedPackagesForDestinatario.reduce((a, p) => a + (p.pesoKilos ?? 0), 0),
            paquetes: selectedPackagesForDestinatario.map((p) => paqueteToSessionItem(p)),
            paquetesByMode: {
                DOMICILIO: typedPackagesByMode.DOMICILIO.map((p) => paqueteToSessionItem(p)),
                CLEMENTINA: typedPackagesByMode.CLEMENTINA.map((p) => paqueteToSessionItem(p)),
                SEPARAR: typedPackagesByMode.SEPARAR.map((p) => paqueteToSessionItem(p)),
                CADENITA: typedPackagesByMode.CADENITA.map((p) => paqueteToSessionItem(p)),
            },
        }
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            updateDespachoMasivoSession.mutate(payload)
            debounceTimerRef.current = null
        }, 500)
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
                debounceTimerRef.current = null
            }
        }
    }, [id, selectedPackagesForDestinatario, typedPackagesByMode, updateDespachoMasivoSession])

    // REHYDRATE: una sola vez por lote al cargar sesión (cola despacho + paquetes por pestaña)
    useEffect(() => {
        const payload = session?.payload
        const loteIdNum = id != null ? Number(id) : undefined
        if (!payload || payload.idLote !== loteIdNum || payload.tipoLote !== 'NORMAL') return
        if (hasRehydratedForLoteRef.current) return
        hasRehydratedForLoteRef.current = true

        let cancelled = false
        const allPaquetes = [...(paquetes ?? []), ...scannedPackagesForDespacho]

        if (payload.paquetes?.length) {
            const missingGuias: string[] = []
            const idsFromSession: number[] = []
            const resolvedInOrder: Paquete[] = []
            for (const item of payload.paquetes) {
                const guia = item.numeroGuia?.trim()
                if (!guia) continue
                const paq = allPaquetes.find((p) => (p.numeroGuia ?? '').trim() === guia)
                if (paq?.idPaquete != null) {
                    idsFromSession.push(paq.idPaquete)
                    resolvedInOrder.push(paq)
                } else {
                    missingGuias.push(guia)
                }
            }
            if (missingGuias.length > 0) {
                const orderFromPayload = payload.paquetes
                    .map((p: { numeroGuia?: string }) => p.numeroGuia?.trim())
                    .filter(Boolean) as string[]
                const paquetesRef = paquetes ?? []
                Promise.all(missingGuias.map((g) => paqueteService.findByNumeroGuia(g))).then((results) => {
                    if (cancelled) return
                    const fetched = results.filter((p): p is Paquete => p != null && p.idPaquete != null)
                    if (fetched.length === 0) return
                    const combined = [...fetched, ...scannedPackagesForDespacho.filter((p) => !fetched.some((f) => f.idPaquete === p.idPaquete))]
                    const all = [...paquetesRef, ...combined]
                    const ids: number[] = []
                    for (const guia of orderFromPayload) {
                        const paq = all.find((p) => (p.numeroGuia ?? '').trim() === guia)
                        if (paq?.idPaquete != null) ids.push(paq.idPaquete)
                    }
                    setScannedPackagesForDespacho(combined)
                    setSelectedPackageIds(new Set(ids))
                    setSelectedPackageIdsOrder(ids)
                }).catch(() => { })
            } else if (idsFromSession.length > 0) {
                const paquetesList = paquetes ?? []
                const scanned = resolvedInOrder.filter((p) => !paquetesList.some((q) => q.idPaquete === p.idPaquete))
                setScannedPackagesForDespacho(scanned)
                setSelectedPackageIds(new Set(idsFromSession))
                setSelectedPackageIdsOrder(idsFromSession)
            }
        }

        if (payload.paquetesByMode) {
            const modes: Array<'DOMICILIO' | 'CLEMENTINA' | 'SEPARAR' | 'CADENITA'> = ['DOMICILIO', 'CLEMENTINA', 'SEPARAR', 'CADENITA']
            const hasAnyInSession = modes.some((m) => (payload.paquetesByMode![m]?.length ?? 0) > 0)
            if (hasAnyInSession) {
                const resolveMode = async (mode: 'DOMICILIO' | 'CLEMENTINA' | 'SEPARAR' | 'CADENITA') => {
                    const items = payload.paquetesByMode![mode] ?? []
                    if (items.length === 0) return []
                    const resolved: Paquete[] = []
                    for (const item of items) {
                        const guia = item.numeroGuia?.trim()
                        if (!guia) continue
                        const existing = allPaquetes.find((p) => (p.numeroGuia ?? '').trim() === guia)
                        if (existing) {
                            resolved.push(existing)
                        } else {
                            try {
                                const p = await paqueteService.findByNumeroGuia(guia)
                                if (p?.idPaquete) resolved.push(p)
                            } catch {
                                // omitir guía no encontrada
                            }
                        }
                    }
                    return resolved
                }
                Promise.all(modes.map(resolveMode)).then((results) => {
                    if (cancelled) return
                    setTypedPackagesByMode((prev) => ({
                        ...prev,
                        DOMICILIO: results[0],
                        CLEMENTINA: results[1],
                        SEPARAR: results[2],
                        CADENITA: results[3],
                    }))
                }).catch(() => { })
            }
            // Si la sesión tiene paquetesByMode pero todas las listas vacías, no sobrescribir estado actual
        }

        return () => {
            cancelled = true
        }
    }, [session, id, paquetes, scannedPackagesForDespacho])

    // Opciones para Combobox "Paquete de referencia": label + description incluyen todo lo buscable (nombre, teléfono normalizado, dirección)
    const paquetesRefOpciones = useMemo<ComboboxOption<Paquete>[]>(() => {
        return selectedPackagesForDestinatario.map(p => {
            const nombre = (p.nombreClienteDestinatario ?? 'Sin nombre').trim()
            const telefono = (p.telefonoDestinatario ?? '').trim()
            const telefonoSoloDigitos = telefono.replace(/\D/g, '')
            const direccion = [p.direccionDestinatarioCompleta, p.provinciaDestinatario].filter(Boolean).join(' · ')
            return {
                value: p.idPaquete!,
                label: `${nombre} | ${telefono}`.trim() || 'Sin datos',
                description: [telefonoSoloDigitos, direccion].filter(Boolean).join(' ').toLowerCase() || undefined,
                data: p
            }
        })
    }, [selectedPackagesForDestinatario])

    // Rellenar datos editables del destinatario cuando se selecciona un paquete de referencia (DESDE_PAQUETE)
    const paqueteOrigenDestinatario = useMemo(() => {
        if (!bulkIdPaqueteOrigenDestinatario) return null
        return selectedPackagesForDestinatario.find(p => p.idPaquete === Number(bulkIdPaqueteOrigenDestinatario)) ?? null
    }, [bulkIdPaqueteOrigenDestinatario, selectedPackagesForDestinatario])

    useEffect(() => {
        if (!paqueteOrigenDestinatario) {
            setBulkDesdePaqueteNombre('')
            setBulkDesdePaqueteTelefono('')
            setBulkDesdePaqueteDireccion('')
            setBulkDesdePaqueteCanton('')
            return
        }
        const p = paqueteOrigenDestinatario
        setBulkDesdePaqueteNombre((p.nombreClienteDestinatario ?? '').trim())
        setBulkDesdePaqueteTelefono((p.telefonoDestinatario ?? '').trim())
        setBulkDesdePaqueteDireccion((p.direccionDestinatarioCompleta ?? p.direccionDestinatario ?? '').trim())
        setBulkDesdePaqueteCanton((p.cantonDestinatario ?? p.provinciaDestinatario ?? '').trim())
    }, [paqueteOrigenDestinatario])

    // Paquetes seleccionados para cambiar tipo (barra flotante)
    const selectedPaquetesForTipo = useMemo(() => {
        if (!paquetes?.length) return []
        return paquetes.filter((p): p is Paquete => p.idPaquete != null && selectedPackageIds.has(p.idPaquete))
    }, [paquetes, selectedPackageIds])

    // Paquetes en la cola del modo actual (lista guardada al tipiar; nuevo tipiado al inicio)
    const typedPackagesForCurrentMode = useMemo(() => {
        if (scanMode === 'DESPACHO') return []
        return typedPackagesByMode[scanMode as ModoClasificacion] ?? []
    }, [scanMode, typedPackagesByMode])

    const [puttingInLoteMode, setPuttingInLoteMode] = useState<ModoClasificacion | null>(null)

    const handlePonerEnLote = async (mode: ModoClasificacion) => {
        const list = typedPackagesByMode[mode]
        if (list.length === 0) return
        const ids = list.map(p => p.idPaquete!).filter((id): id is number => id != null)
        const loteId = id ? Number(id) : undefined
        setPuttingInLoteMode(mode)
        try {
            // 1. Asociar los paquetes al lote de recepción (independientemente del modo)
            if (loteId && ids.length > 0) {
                await loteRecepcionService.agregarPaquetes(loteId, ids)
            }

            // 2. Aplicar el tipo/destino correspondiente
            if (mode === 'DOMICILIO') {
                for (const p of list) {
                    if (!p.idPaquete) continue
                    await paqueteService.update(p.idPaquete, {
                        ...p,
                        tipoDestino: TipoDestino.DOMICILIO,
                        idDestinatarioDirecto: undefined
                    } as Paquete)
                }
            } else {
                const tipo = mode === 'CLEMENTINA' ? TipoPaquete.CLEMENTINA : mode === 'SEPARAR' ? TipoPaquete.SEPARAR : TipoPaquete.CADENITA
                await paqueteService.cambiarTipoMasivo(ids, tipo)
            }

            clearTypedQueue(mode)
            queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', loteId] })
            queryClient.invalidateQueries({ queryKey: ['lote-recepcion', loteId] })
            toast.success(`${list.length} paquete(s) guardados en el lote (${mode})`)
        } catch (err) {
            console.error(err)
            toast.error('Error al guardar en el lote')
        } finally {
            setPuttingInLoteMode(null)
        }
    }

    const executeBulkDespacho = async () => {
        // 1. Parse distribution
        const groups = sacaDistribution.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0)

        if (groups.length === 0) {
            toast.error("Ingrese una distribución válida (ej: '5, 5')")
            return
        }

        // 2. Validate sum (usar orden tipiado para distribución)
        const totalInGroups = groups.reduce((a, b) => a + b, 0)
        if (totalInGroups !== selectedPackageIdsOrder.length) {
            toast.error(`La suma de los grupos (${totalInGroups}) no coincide con los paquetes seleccionados (${selectedPackageIdsOrder.length})`)
            return
        }

        try {
            toast.info("Iniciando creación masiva...")

            // Orden de ingreso (reverse del estado UI: más reciente primero → primero escaneado primero)
            const ordenParaSacas = [...selectedPackageIdsOrder].reverse()

            // Asociar los paquetes al lote actual antes de crear el despacho (orden por referencia)
            if (id && selectedPackageIdsOrder.length > 0) {
                await loteRecepcionService.agregarPaquetes(Number(id), idsOrdenadosPorReferenciaParaLote)
            }

            // 3. Ensure Despacho (sacas con orden de ingreso)
            let despachoId = currentDespacho.idDespacho
            let newDespacho: Awaited<ReturnType<typeof despachoService.create>> | null = null
            let createdNewDespacho = false

            if (!despachoId) {
                const destinoValido = bulkTipoDestino === 'AGENCIA'
                    ? !!bulkIdDestino
                    : bulkDestinatarioOrigen === 'EXISTENTE'
                        ? !!bulkIdDestino
                        : !!bulkIdPaqueteOrigenDestinatario
                if (!destinoValido || !bulkIdDistribuidor) {
                    toast.error(
                        bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE'
                            ? "Seleccione el paquete de referencia para el destinatario y el Distribuidor"
                            : "Seleccione Destino (Agencia o Destinatario directo) y Distribuidor en el diálogo"
                    )
                    return
                }

                let idDestinatarioDirectoPayload: number | undefined
                let idPaqueteOrigenDestinatarioPayload: number | undefined

                if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE') {
                    idDestinatarioDirectoPayload = Number(bulkIdDestino)
                } else if (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE' && bulkIdPaqueteOrigenDestinatario) {
                    const paq = selectedPackagesForDestinatario.find(p => p.idPaquete === Number(bulkIdPaqueteOrigenDestinatario))
                    const nombreOk = (bulkDesdePaqueteNombre.trim() || '') === (paq?.nombreClienteDestinatario ?? '').trim()
                    const telefonoOk = (bulkDesdePaqueteTelefono.trim() || '') === (paq?.telefonoDestinatario ?? '').trim()
                    const direccionOk = (bulkDesdePaqueteDireccion.trim() || '') === ((paq?.direccionDestinatarioCompleta ?? paq?.direccionDestinatario ?? '').trim())
                    const cantonOk = (bulkDesdePaqueteCanton.trim() || '') === ((paq?.cantonDestinatario ?? paq?.provinciaDestinatario ?? '').trim())
                    const datosEditados = !nombreOk || !telefonoOk || !direccionOk || !cantonOk

                    if (datosEditados && bulkDesdePaqueteNombre.trim()) {
                        const nuevoDest = await destinatarioDirectoService.create({
                            nombreDestinatario: bulkDesdePaqueteNombre.trim(),
                            telefonoDestinatario: bulkDesdePaqueteTelefono.trim() || '—',
                            direccionDestinatario: bulkDesdePaqueteDireccion.trim() || undefined,
                            canton: bulkDesdePaqueteCanton.trim() || undefined,
                        })
                        idDestinatarioDirectoPayload = nuevoDest.idDestinatarioDirecto!
                        queryClient.invalidateQueries({ queryKey: ['destinatarios-directos'] })
                    } else {
                        idPaqueteOrigenDestinatarioPayload = Number(bulkIdPaqueteOrigenDestinatario)
                    }
                }

                // Construir sacas desde la distribución: el backend exige al menos una saca con idPaquetes
                let idx = 0
                const sacasPayload = groups.map((qty, i) => {
                    const idPaquetes = ordenParaSacas.slice(idx, idx + qty)
                    idx += qty
                    const tamano = tamanosSacasBulk[i] ?? TamanoSaca.GRANDE
                    return { tamano, idPaquetes }
                })

                const fechaDespachoValue = bulkFechaDespacho
                    ? (bulkFechaDespacho.length === 16 ? `${bulkFechaDespacho}:00` : bulkFechaDespacho)
                    : new Date().toISOString().slice(0, 19).replace('Z', '')
                const createPayload = {
                    fechaDespacho: fechaDespachoValue,
                    usuarioRegistro: user?.nombreCompleto ?? 'OPERARIO',
                    observaciones: bulkObservaciones.trim() || undefined,
                    codigoPresinto: bulkCodigoPresinto.trim() || undefined,
                    idAgencia: bulkTipoDestino === 'AGENCIA' ? Number(bulkIdDestino) : undefined,
                    idDestinatarioDirecto: idDestinatarioDirectoPayload,
                    idPaqueteOrigenDestinatario: idPaqueteOrigenDestinatarioPayload,
                    idDistribuidor: Number(bulkIdDistribuidor),
                    numeroGuiaAgenciaDistribucion: bulkNumeroGuia.trim() || undefined,
                    sacas: sacasPayload,
                }
                newDespacho = await despachoService.create(createPayload)
                createdNewDespacho = true
                despachoId = newDespacho.idDespacho
                setCurrentDespacho(prev => ({ ...prev, idDespacho: despachoId, numero: newDespacho!.numeroManifiesto || 'PENDIENTE' }))
            }

            let newSacasState: SacaState[] = []
            if (newDespacho?.sacas?.length) {
                newSacasState = newDespacho.sacas.map(s => ({
                    id: s.idSaca!,
                    numero: s.codigoQr || `SACA-${s.idSaca}`,
                    paquetes: s.idPaquetes?.length ?? 0,
                    peso: 0
                }))
            } else if (despachoId && !createdNewDespacho) {
                // Despacho ya existía: crear sacas y asignar paquetes vía API
                let currentIndex = 0
                for (let i = 0; i < groups.length; i++) {
                    const qty = groups[i]
                    const sacaPaquetesIds = ordenParaSacas.slice(currentIndex, currentIndex + qty)
                    const tamano = tamanosSacasBulk[i] ?? TamanoSaca.GRANDE
                    const saca = await sacaService.create({
                        idDespacho: despachoId,
                        tamano,
                        codigoQr: `SACA-BULK-${Date.now()}-${i}`
                    })
                    await sacaService.agregarPaquetes(saca.idSaca!, sacaPaquetesIds)
                    newSacasState.push({
                        id: saca.idSaca!,
                        numero: saca.codigoQr || `SACA-${saca.idSaca}`,
                        paquetes: qty,
                        peso: 0
                    })
                    currentIndex += qty
                    toast.success(`Saca ${i + 1}/${groups.length} creada con ${qty} paquetes`)
                }
            }

            toast.success("Despacho masivo completado exitosamente")
            setCurrentDespacho(prev => ({
                ...prev,
                sacas: [...prev.sacas, ...newSacasState]
            }))

            setIsBulkDialogOpen(false)
            setSelectedPackageIds(new Set())
            setSelectedPackageIdsOrder([])
            setScannedPackagesForDespacho([])
            setBulkCodigoPresinto('')
            setBulkDesdePaqueteNombre('')
            setBulkDesdePaqueteTelefono('')
            setBulkDesdePaqueteDireccion('')
            setBulkDesdePaqueteCanton('')
            if (id) {
                queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', Number(id)] })
            }

        } catch (error: unknown) {
            console.error(error)
            toast.error("Error durante el proceso masivo")
        }
    }

    // Focus input
    useEffect(() => {
        if (activeTab === 'despacho') {
            inputRef.current?.focus()
        }
    }, [activeTab, lastScanned, scanMode, currentDespacho.activeSacaId])

    // Real API implementation
    const processPackage = async (guia: string) => {
        if (!guia.trim()) return

        try {
            // 1. Search Package
            const paquete = await paqueteService.findByNumeroGuia(guia)
            if (!paquete || !paquete.idPaquete) {
                toast.error(`Paquete ${guia} no encontrado`)
                return
            }

            // 2. Modo Despacho: añadir paquete a la selección (orden tipiado; nuevo al inicio)
            if (scanMode === 'DESPACHO') {
                const id = paquete.idPaquete!
                const lastScannedPayload = {
                    id: String(paquete.idPaquete),
                    guia: paquete.numeroGuia || guia,
                    timestamp: new Date(),
                    destinoType: 'DESPACHO' as const,
                    despachoId: undefined,
                    ref: paquete.ref?.trim() || undefined,
                    clienteDestino: buildClienteDestinoFromPaquete(paquete),
                    observacion: paquete.observaciones?.trim() || undefined
                }
                if (selectedPackageIds.has(id)) {
                    toast.info('Ya tipiado en despacho')
                    setLastScanned(lastScannedPayload)
                    setInputValue('')
                    return
                }
                setScannedPackagesForDespacho(prev => [paquete, ...prev.filter(p => p.idPaquete !== id)])
                setSelectedPackageIds(prev => new Set(prev).add(id))
                setSelectedPackageIdsOrder(prev => [id, ...prev.filter(x => x !== id)])
                toast.success(`Paquete ${paquete.numeroGuia || guia} añadido al despacho`)
                setLastScanned(lastScannedPayload)
            } else {
                // 3. Classification Mode: validar una guía solo en una cola, avisar si tiene tipo
                const mode = scanMode as ModoClasificacion
                const otherModes: ModoClasificacion[] = (['DOMICILIO', 'CLEMENTINA', 'SEPARAR', 'CADENITA'] as const).filter(
                    (m): m is ModoClasificacion => m !== mode
                )
                const alreadyInMode = otherModes.find(m => typedPackagesByMode[m].some(p => p.idPaquete === paquete.idPaquete))
                if (alreadyInMode) {
                    toast.error(`La guía ${paquete.numeroGuia || guia} ya está en la cola de ${alreadyInMode}. Sáquela de esa cola si desea añadirla aquí.`)
                    return
                }
                const tipoP = paquete.tipoPaquete != null ? String(paquete.tipoPaquete).toUpperCase() : ''
                const tipoD = paquete.tipoDestino != null ? String(paquete.tipoDestino).toUpperCase() : ''
                const hasTipo = tipoP !== '' || tipoD !== ''
                const mismoTipoQueModo =
                    (mode === 'DOMICILIO' && tipoD === 'DOMICILIO') ||
                    (mode === 'CLEMENTINA' && tipoP === 'CLEMENTINA') ||
                    (mode === 'SEPARAR' && tipoP === 'SEPARAR') ||
                    (mode === 'CADENITA' && tipoP === 'CADENITA')
                if (hasTipo && !mismoTipoQueModo) {
                    setPendingTypeConfirm({ paquete, mode })
                    return
                }
                const lastScannedPayloadClass: ScannedPackage = {
                    id: String(paquete.idPaquete),
                    guia: paquete.numeroGuia || guia,
                    timestamp: new Date(),
                    destinoType: mode === 'DOMICILIO' ? 'DOMICILIO' : 'AGENCIA',
                    tipoPaquete: scanMode as TipoPaquete | undefined,
                    ref: paquete.ref?.trim() || undefined,
                    clienteDestino: buildClienteDestinoFromPaquete(paquete),
                    observacion: paquete.observaciones?.trim() || undefined
                }
                const alreadyInCurrentMode = typedPackagesByMode[mode].some(p => p.idPaquete === paquete.idPaquete)
                if (alreadyInCurrentMode) {
                    toast.info(`Ya tipiado en ${scanMode.charAt(0) + scanMode.slice(1).toLowerCase()}`)
                    setLastScanned(lastScannedPayloadClass)
                    setInputValue('')
                    return
                }
                addToTypedQueue(mode, paquete)
                toast.success(`Paquete ${paquete.numeroGuia || guia} añadido a ${scanMode}`)
                setLastScanned(lastScannedPayloadClass)
            }
            setInputValue('')
        } catch (error) {
            console.error(error)
            toast.error(`Error procesando paquete ${guia}`)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            processPackage(inputValue)
        }
    }

    if (isLoading) {
        return <LoadingState label="Cargando interfaz de operador..." />
    }

    const tabsContent = (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'despacho' | 'lista')} className={embedded ? 'w-full' : 'w-[400px]'}>
            <TabsList className="grid w-full grid-cols-2 bg-muted text-muted-foreground">
                <TabsTrigger value="despacho" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <Truck className="w-4 h-4 mr-2" /> Operación
                </TabsTrigger>
                <TabsTrigger value="lista" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <ListIcon className="w-4 h-4 mr-2" />
                    Lista ({paquetes?.length || 0})
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )

    const mainContent = (
        <>
            {/* VISTA DESPACHO (OPERACIÓN) */}
            {activeTab === 'despacho' && (
                <div className={cn("grid grid-cols-12 gap-6", embedded ? "min-h-[520px]" : "h-[calc(100vh-140px)]")}>

                    {/* Left Column: Input covering modes */}
                    <div className="col-span-8 flex flex-col gap-6">

                        <Card className="border border-border shadow-sm bg-card overflow-hidden shrink-0">
                            {/* Compact Mode Selector */}
                            <div className="p-2 bg-muted/50 border-b border-border">
                                <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as any)} className="w-full">
                                    <TabsList className="w-full grid grid-cols-5 h-10 bg-muted">
                                        <TabsTrigger value="DESPACHO" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                            <Truck className="w-4 h-4 mr-2" /> Despacho ({selectedPackageIds.size})
                                        </TabsTrigger>
                                        <TabsTrigger value="DOMICILIO" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                            <MapPin className="w-4 h-4 mr-2" /> Domicilio ({typedPackagesByMode.DOMICILIO.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="CLEMENTINA" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                                            <Box className="w-4 h-4 mr-2" /> Clementina ({typedPackagesByMode.CLEMENTINA.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="SEPARAR" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                                            <Scissors className="w-4 h-4 mr-2" /> Separar ({typedPackagesByMode.SEPARAR.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="CADENITA" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                                            <LinkIcon className="w-4 h-4 mr-2" /> Cadenita ({typedPackagesByMode.CADENITA.length})
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <CardContent className="p-8">
                                <div className="relative">
                                    <ScanLine className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground" />
                                    <Input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className={cn(
                                            "h-24 pl-24 text-4xl font-mono tracking-widest uppercase border-2 focus:ring-4 focus:ring-offset-2 placeholder:text-muted-foreground/60 bg-background",
                                            scanMode === 'DESPACHO' && "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-emerald-800 dark:focus:border-emerald-400",
                                            scanMode === 'DOMICILIO' && "border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-blue-800 dark:focus:border-blue-400",
                                            scanMode === 'CLEMENTINA' && "border-orange-200 focus:border-orange-500 focus:ring-orange-500/20 dark:border-orange-800 dark:focus:border-orange-400",
                                            scanMode === 'SEPARAR' && "border-red-200 focus:border-red-500 focus:ring-red-500/20 dark:border-red-800 dark:focus:border-red-400",
                                            scanMode === 'CADENITA' && "border-violet-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-violet-800 dark:focus:border-violet-400",
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

                        {/* Feedback Area Refined */}
                        <div className="flex-1 min-h-0">
                            {lastScanned ? (
                                <Card className={cn(
                                    "h-full border-l-[8px] shadow-sm flex flex-col justify-center bg-card border-border animate-in fade-in duration-200",
                                    lastScanned.destinoType === 'DESPACHO' && "border-l-emerald-500 bg-emerald-500/5",
                                    lastScanned.destinoType === 'DOMICILIO' && "border-l-blue-500 bg-blue-500/5",
                                    (lastScanned.tipoPaquete === 'CLEMENTINA' || lastScanned.tipoPaquete === 'SEPARAR') && "border-l-orange-500 bg-orange-500/5",
                                    lastScanned.tipoPaquete === 'CADENITA' && "border-l-violet-500 bg-violet-500/5"
                                )}>
                                    <CardContent className="p-8 space-y-6">
                                        {/* Header: Icon + Guia + Badge */}
                                        <div className="flex items-center gap-6 border-b border-border/50 pb-6">
                                            <div className="p-4 bg-background rounded-full shadow-sm border border-border shrink-0">
                                                {lastScanned.destinoType === 'DESPACHO' && <CheckCircle2 className="h-12 w-12 text-emerald-500" />}
                                                {lastScanned.destinoType === 'DOMICILIO' && <MapPin className="h-12 w-12 text-blue-500" />}
                                                {lastScanned.tipoPaquete === 'CLEMENTINA' && <Box className="h-12 w-12 text-orange-500" />}
                                                {lastScanned.tipoPaquete === 'SEPARAR' && <Scissors className="h-12 w-12 text-red-500" />}
                                                {lastScanned.tipoPaquete === 'CADENITA' && <LinkIcon className="h-12 w-12 text-violet-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-5xl font-black tracking-tight text-foreground font-mono leading-none">
                                                    {lastScanned.guia}
                                                </h2>
                                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                                    <Badge variant="outline" className={cn(
                                                        "text-lg px-3 py-1 font-bold uppercase",
                                                        lastScanned.destinoType === 'DESPACHO' && "bg-emerald-100 text-emerald-700 border-emerald-500",
                                                        lastScanned.destinoType === 'DOMICILIO' && "bg-blue-100 text-blue-700 border-blue-500",
                                                        (lastScanned.tipoPaquete === 'CLEMENTINA' || lastScanned.tipoPaquete === 'SEPARAR') && "bg-orange-100 text-orange-700 border-orange-500",
                                                        lastScanned.tipoPaquete === 'CADENITA' && "bg-violet-100 text-violet-700 border-violet-500"
                                                    )}>
                                                        {lastScanned.tipoPaquete === 'CADENITA' ? 'Cadenita' : lastScanned.tipoPaquete || (lastScanned.destinoType === 'DESPACHO' ? 'Agregado a Despacho' : 'Domicilio')}
                                                    </Badge>
                                                    {lastScanned.sacaId && (
                                                        <Badge variant="secondary" className="text-lg px-3 py-1 font-mono">
                                                            Saca: {lastScanned.sacaId}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 gap-6">
                                            {lastScanned.ref && (
                                                <div className="space-y-1">
                                                    <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Referencia</span>
                                                    <p className="text-lg font-medium text-foreground font-mono">{lastScanned.ref}</p>
                                                </div>
                                            )}
                                            {lastScanned.clienteDestino && (
                                                <div className="col-span-2 space-y-2">
                                                    <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Dirección</span>
                                                    {lastScanned.clienteDestino.direccion && (
                                                        <p className="text-lg font-medium text-foreground leading-relaxed break-words">{lastScanned.clienteDestino.direccion}</p>
                                                    )}
                                                    {(lastScanned.clienteDestino.pais ?? lastScanned.clienteDestino.provincia ?? lastScanned.clienteDestino.canton) && (
                                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm pt-1 border-t border-border/50">
                                                            {lastScanned.clienteDestino.pais && (
                                                                <span><span className="text-muted-foreground font-medium">País:</span> {lastScanned.clienteDestino.pais}</span>
                                                            )}
                                                            {lastScanned.clienteDestino.provincia && (
                                                                <span><span className="text-muted-foreground font-medium">Provincia:</span> {lastScanned.clienteDestino.provincia}</span>
                                                            )}
                                                            {lastScanned.clienteDestino.canton && (
                                                                <span><span className="text-muted-foreground font-medium">Cantón:</span> {lastScanned.clienteDestino.canton}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {lastScanned.observacion && (
                                                <div className="col-span-2 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                                    <span className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold tracking-wider block mb-1">Observaciones</span>
                                                    <p className="text-lg font-medium text-amber-900 dark:text-amber-100">{lastScanned.observacion}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-full border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/10">
                                    <ScanLine className="h-16 w-16 opacity-20" />
                                    <span className="text-xl font-medium opacity-60">Listo para escanear</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Paquetes para despacho (modo DESPACHO) o Info */}
                    <div className="col-span-4 flex flex-col gap-6">
                        {scanMode === 'DESPACHO' ? (
                            <Card className="h-full border border-border shadow-sm bg-card text-foreground flex flex-col overflow-hidden relative">
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
                                            onClick={() => { setSelectedPackageIds(new Set()); setSelectedPackageIdsOrder([]); setScannedPackagesForDespacho([]) }}
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
                                                        onClick={() => p.idPaquete != null && toggleSelectPackage(p.idPaquete, false)}
                                                        title="Quitar del despacho"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
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
                            <Card className="h-full border border-border shadow-sm bg-card text-foreground flex flex-col overflow-hidden relative">
                                <CardHeader className="pb-3 border-b border-border bg-muted/30 pt-4 px-4">
                                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                                        {scanMode === 'DOMICILIO' && <MapPin className="h-4 w-4 text-blue-500" />}
                                        {scanMode === 'CLEMENTINA' && <Box className="h-4 w-4 text-orange-500" />}
                                        {scanMode === 'SEPARAR' && <Scissors className="h-4 w-4 text-red-500" />}
                                        {scanMode === 'CADENITA' && <LinkIcon className="h-4 w-4 text-violet-500" />}
                                        Paquetes para {scanMode.charAt(0) + scanMode.slice(1).toLowerCase()}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col pt-4 px-4 space-y-4 overflow-hidden">
                                    {(() => {
                                        const mode = scanMode as ModoClasificacion
                                        const count = typedPackagesByMode[mode].length
                                        const isPutting = puttingInLoteMode === mode
                                        return (
                                            <>
                                                <div className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border",
                                                    scanMode === 'DOMICILIO' && "bg-blue-500/5 border-blue-500/10",
                                                    scanMode === 'CLEMENTINA' && "bg-orange-500/5 border-orange-500/10",
                                                    scanMode === 'SEPARAR' && "bg-red-500/5 border-red-500/10",
                                                    scanMode === 'CADENITA' && "bg-violet-500/5 border-violet-500/10"
                                                )}>
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "text-2xl font-bold text-foreground",
                                                            scanMode === 'DOMICILIO' && "text-blue-600 dark:text-blue-400",
                                                            scanMode === 'CLEMENTINA' && "text-orange-600 dark:text-orange-400",
                                                            scanMode === 'SEPARAR' && "text-red-600 dark:text-red-400",
                                                            scanMode === 'CADENITA' && "text-violet-600 dark:text-violet-400"
                                                        )}>{count}</span>
                                                        <span className={cn(
                                                            "text-[10px] uppercase font-bold tracking-wider",
                                                            scanMode === 'DOMICILIO' && "text-blue-600/70 dark:text-blue-400/70",
                                                            scanMode === 'CLEMENTINA' && "text-orange-600/70 dark:text-orange-400/70",
                                                            scanMode === 'SEPARAR' && "text-red-600/70 dark:text-red-400/70",
                                                            scanMode === 'CADENITA' && "text-violet-600/70 dark:text-violet-400/70"
                                                        )}>En cola</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                                        onClick={() => clearTypedQueue(mode)}
                                                        disabled={count === 0}
                                                    >
                                                        Limpiar
                                                    </Button>
                                                </div>

                                                {typedPackagesForCurrentMode.length > 0 ? (
                                                    <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-background p-1">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 font-medium">Paquetes tipiados</p>
                                                        {typedPackagesForCurrentMode.map((p, idx) => (
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
                                                                    onClick={() => p.idPaquete != null && removeFromTypedQueue(mode, p.idPaquete)}
                                                                    title="Quitar de la cola"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
                                                        Sin paquetes en cola. Escanea guías para añadirlos.
                                                    </div>
                                                )}

                                                <div className="mt-auto pt-2 pb-4">
                                                    <Button
                                                        size="lg"
                                                        className={cn(
                                                            "w-full font-bold shadow-sm",
                                                            scanMode === 'DOMICILIO' && "bg-blue-600 hover:bg-blue-700 text-white",
                                                            scanMode === 'CLEMENTINA' && "bg-orange-600 hover:bg-orange-700 text-white",
                                                            scanMode === 'SEPARAR' && "bg-red-600 hover:bg-red-700 text-white",
                                                            scanMode === 'CADENITA' && "bg-violet-600 hover:bg-violet-700 text-white"
                                                        )}
                                                        onClick={() => handlePonerEnLote(mode)}
                                                        disabled={count === 0 || isPutting}
                                                    >
                                                        {isPutting ? (
                                                            <>Procesando...</>
                                                        ) : (
                                                            <>
                                                                {scanMode === 'DOMICILIO' && <MapPin className="h-4 w-4 mr-2" />}
                                                                {scanMode === 'CLEMENTINA' && <Box className="h-4 w-4 mr-2" />}
                                                                {scanMode === 'SEPARAR' && <Scissors className="h-4 w-4 mr-2" />}
                                                                {scanMode === 'CADENITA' && <LinkIcon className="h-4 w-4 mr-2" />}
                                                                Poner en el lote
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* VISTA LISTA: REAL DATA */}
            {activeTab === 'lista' && (
                <Card className={cn(embedded ? "min-h-[520px]" : "h-[calc(100vh-140px)]", "flex flex-col bg-card border border-border shadow-sm")}>
                    {/* Unified Toolbar */}
                    <CardHeader className="border-b border-border px-4 py-3 bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Type Tabs */}
                                <SegmentedToggle
                                    value={listTipoTab}
                                    onChange={(tipo) => {
                                        setListTipoTab(tipo)
                                        setSelectedPackageIds(new Set())
                                        setSelectedPackageIdsOrder([])
                                        setScannedPackagesForDespacho([])
                                    }}
                                    options={[
                                        { value: 'OTROS', label: `Comunes (${countsPorTipoTab.OTROS})` },
                                        { value: 'CLEMENTINA', label: `Clementina (${countsPorTipoTab.CLEMENTINA})` },
                                        { value: 'SEPARAR', label: `Separar (${countsPorTipoTab.SEPARAR})` },
                                        { value: 'CADENITA', label: `Cadenita (${countsPorTipoTab.CADENITA})` },
                                    ]}
                                />

                                <Separator orientation="vertical" className="h-6" />

                                {/* Status Filter */}
                                <SegmentedToggle
                                    value={listFilter}
                                    onChange={(value) => {
                                        if (value === 'PROCESADOS') {
                                            setSelectedPackageIds(new Set())
                                            setSelectedPackageIdsOrder([])
                                            setScannedPackagesForDespacho([])
                                        }
                                        setListFilter(value)
                                    }}
                                    options={[
                                        { value: 'PENDIENTES', label: 'Pendientes' },
                                        { value: 'PROCESADOS', label: 'Trabajados' },
                                    ]}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium mr-2">
                                    {sortedPaquetes.length} paquetes
                                </span>
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-8 text-xs">
                                    Actualizar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-auto bg-background">
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
                                    <TableHead className="w-[250px]">Paquete</TableHead>
                                    <TableHead className="w-[300px]">Destino</TableHead>
                                    <TableHead className="w-[120px]">Estado</TableHead>
                                    <TableHead>Observaciones</TableHead>
                                    <TableHead className="w-[80px] text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!sortedPaquetes || sortedPaquetes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={listFilter === 'PENDIENTES' ? 6 : 5} className="h-32 text-center text-muted-foreground">
                                            No hay paquetes en esta vista.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (() => {
                                        const colCount = listFilter === 'PENDIENTES' ? 6 : 5
                                        const getRefLabel = (p: Paquete) => (p.ref || '').trim() || null
                                        return visibleItems.map((pkg, i) => {
                                            const refLabel = getRefLabel(pkg)
                                            const prevRefLabel = i > 0 ? getRefLabel(visibleItems[i - 1]!) : null
                                            const showGroupHeader = refLabel !== prevRefLabel
                                            return (
                                                <Fragment key={pkg.idPaquete ?? pkg.numeroGuia ?? i}>
                                                    {showGroupHeader && (
                                                        <TableRow>
                                                            <TableCell colSpan={colCount} className="bg-muted/50 text-xs font-medium text-muted-foreground py-2 px-4">
                                                                {refLabel ? `Referencia: ${refLabel}` : 'Sin referencia'}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    <TableRow
                                                        data-state={listFilter === 'PENDIENTES' && selectedPackageIds.has(pkg.idPaquete!) ? "selected" : undefined}
                                                        className={cn(
                                                            "transition-colors hover:bg-muted/30 group",
                                                            hasDespacho(pkg) ? "opacity-75 bg-muted/10" : ""
                                                        )}
                                                    >
                                                        {listFilter === 'PENDIENTES' && (
                                                            <TableCell className="pl-4">
                                                                <Checkbox
                                                                    checked={pkg.idPaquete ? selectedPackageIds.has(pkg.idPaquete) : false}
                                                                    onCheckedChange={(checked) => pkg.idPaquete && toggleSelectPackage(pkg.idPaquete, !!checked)}
                                                                />
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="align-top py-3">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-mono font-medium text-sm">{guiaEfectiva(pkg) || '-'}</span>
                                                                {pkg.ref && <span className="text-xs text-muted-foreground">Ref: {pkg.ref}</span>}
                                                                {pkg.idPaquetePadre != null && (
                                                                    <Badge variant="outline" className="w-fit text-[10px] px-1 py-0 h-5 border-orange-200 text-orange-700 bg-orange-50">
                                                                        Hijo de {pkg.numeroGuiaPaquetePadre}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-top py-3 max-w-[340px]">
                                                            {(() => {
                                                                const direccionLimpia = pkg.tipoDestino === 'DOMICILIO' ? getDireccionLimpiaParaLista(pkg) : ''
                                                                return (
                                                                    <div className="flex flex-col gap-1.5 text-sm">
                                                                        <span className="font-semibold text-foreground">
                                                                            {pkg.tipoDestino === 'AGENCIA'
                                                                                ? (pkg.nombreAgenciaDestino || '—')
                                                                                : (pkg.nombreClienteDestinatario || '—')}
                                                                        </span>
                                                                        {pkg.tipoDestino === 'AGENCIA' ? (
                                                                            pkg.cantonAgenciaDestino && (
                                                                                <span className="text-xs text-muted-foreground">{pkg.cantonAgenciaDestino}</span>
                                                                            )
                                                                        ) : (
                                                                            <>
                                                                                {pkg.telefonoDestinatario && (
                                                                                    <p className="text-xs font-mono text-muted-foreground">Tel: {pkg.telefonoDestinatario}</p>
                                                                                )}
                                                                                {direccionLimpia && (
                                                                                    <p className="text-xs text-muted-foreground leading-snug break-words">{direccionLimpia}</p>
                                                                                )}
                                                                                {(pkg.paisDestinatario ?? pkg.provinciaDestinatario ?? pkg.cantonDestinatario) && (
                                                                                    <p className="text-xs text-foreground/80 flex flex-wrap gap-x-2 gap-y-0">
                                                                                        {pkg.paisDestinatario && <span>País: {pkg.paisDestinatario}</span>}
                                                                                        {pkg.provinciaDestinatario && <span>Provincia: {pkg.provinciaDestinatario}</span>}
                                                                                        {pkg.cantonDestinatario && <span>Cantón: {pkg.cantonDestinatario}</span>}
                                                                                    </p>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </TableCell>
                                                        <TableCell className="align-top py-3">
                                                            {hasDespacho(pkg) ? (
                                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
                                                                    Despachado
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">
                                                                    Pendiente
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="align-top py-3 max-w-[280px]">
                                                            <span className="text-xs text-muted-foreground whitespace-pre-wrap break-words block" title={pkg.observaciones}>
                                                                {pkg.observaciones || '—'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="align-top py-3 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-xs"
                                                                onClick={() => {
                                                                    setPaqueteParaAtencion(pkg)
                                                                    setShowAgregarAtencionDialog(true)
                                                                }}
                                                                title="Poner en atención"
                                                            >
                                                                <ScanLine className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                </Fragment>
                                            )
                                        })
                                    })()
                                )}
                                {/* Observer Target for Infinite Scroll */}
                                <TableRow>
                                    <TableCell colSpan={listFilter === 'PENDIENTES' ? 6 : 5} className="p-0 border-0">
                                        <div ref={observerTarget} className="h-4 w-full" />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>

                    {/* Floating Action Bar: solo en pestaña Pendientes */}
                    {listFilter === 'PENDIENTES' && selectedPackageIds.size > 0 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-popover border border-border text-popover-foreground px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in duration-200 z-50 ring-1 ring-border/50">
                            <span className="font-medium text-sm">{selectedPackageIds.size} seleccionados</span>
                            <Separator orientation="vertical" className="h-4 bg-border" />
                            <Button size="sm" variant="outline" onClick={() => setShowCambiarTipoDialog(true)} className="h-8 text-xs font-medium">
                                <Box className="h-3 w-3 mr-2" />
                                Cambiar tipo
                            </Button>
                            <Button size="sm" variant="secondary" onClick={handleBulkCreateDespacho} className="h-8 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors shadow-sm">
                                <Truck className="h-3 w-3 mr-2" />
                                Crear Despacho
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-muted hover:text-destructive" onClick={() => { setSelectedPackageIds(new Set()); setSelectedPackageIdsOrder([]); setScannedPackagesForDespacho([]) }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </Card>
            )}

            {/* BULK DESPACHO DIALOG */}
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
                agencias={agencias.filter((a): a is typeof a & { idAgencia: number } => a.idAgencia != null).map((a) => ({
                    idAgencia: a.idAgencia,
                    nombre: a.nombre,
                    canton: a.canton,
                }))}
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
                    .map((d) => ({
                        idDistribuidor: d.idDistribuidor,
                        nombre: d.nombre,
                    }))}
                paquetesRefOpciones={paquetesRefOpciones}
                sugerenciaDestino={provinciaOCantonBulk.canton ?? provinciaOCantonBulk.provincia ?? undefined}
                onOpenCrearDestinatario={() => setShowCrearClienteDialog(true)}
                onConfirm={executeBulkDespacho}
                confirmDisabled={
                    !bulkIdDistribuidor ||
                    sacaDistribution.split(',').reduce((a, b) => a + (parseInt(b.trim(), 10) || 0), 0) !== selectedPackageIds.size ||
                    (bulkTipoDestino === 'AGENCIA' && !bulkIdDestino) ||
                    (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'EXISTENTE' && !bulkIdDestino) ||
                    (bulkTipoDestino === 'DIRECTO' && bulkDestinatarioOrigen === 'DESDE_PAQUETE' && !bulkIdPaqueteOrigenDestinatario)
                }
            />


            {/* Diálogo: Nuevo destinatario directo (desde Crear Despacho Masivo) */}
            <Dialog open={showCrearClienteDialog} onOpenChange={setShowCrearClienteDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nuevo destinatario directo</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label className="text-sm font-medium">Nombre</Label><Input value={nuevoClienteNombre} onChange={e => setNuevoClienteNombre(e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-sm font-medium">Teléfono</Label><Input value={nuevoClienteTelefono} onChange={e => setNuevoClienteTelefono(e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-sm font-medium">Cantón</Label><Input value={nuevoClienteCanton} onChange={e => setNuevoClienteCanton(e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-sm font-medium">Dirección</Label><Textarea value={nuevoClienteDireccion} onChange={e => setNuevoClienteDireccion(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCrearClienteDialog(false)}>Cancelar</Button>
                        <Button onClick={handleCrearCliente}>Crear</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo elegir Padre/Hijo para atención (CLEMENTINA) */}
            <Dialog open={showClementinaChoiceDialog} onOpenChange={(open) => { setShowClementinaChoiceDialog(open); if (!open) setClementinaChoiceData(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Registrar atención para</DialogTitle>
                        <DialogDescription>
                            Este paquete es Clementina. Elige si la solicitud de atención será para el padre o para el hijo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => {
                                if (!clementinaChoiceData) return
                                setPaqueteParaAtencion(clementinaChoiceData.parent)
                                setShowClementinaChoiceDialog(false)
                                setClementinaChoiceData(null)
                                setShowAgregarAtencionDialog(true)
                            }}
                        >
                            <span className="font-mono text-sm">Padre:</span>{' '}
                            {clementinaChoiceData?.parent?.numeroGuia || `#${clementinaChoiceData?.parent?.idPaquete}`}
                        </Button>
                        {clementinaChoiceData?.child ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-start h-auto py-3"
                                onClick={() => {
                                    if (!clementinaChoiceData) return
                                    setPaqueteParaAtencion(clementinaChoiceData.child!)
                                    setShowClementinaChoiceDialog(false)
                                    setClementinaChoiceData(null)
                                    setShowAgregarAtencionDialog(true)
                                }}
                            >
                                <span className="font-mono text-sm">Hijo:</span>{' '}
                                {clementinaChoiceData.child.numeroGuia || `#${clementinaChoiceData.child.idPaquete}`}
                            </Button>
                        ) : clementinaChoiceData?.children && clementinaChoiceData.children.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground font-medium">Hijo:</p>
                                {clementinaChoiceData.children.map((hijo) => (
                                    <Button
                                        key={hijo.idPaquete}
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start h-auto py-2 text-sm"
                                        onClick={() => {
                                            setPaqueteParaAtencion(hijo)
                                            setShowClementinaChoiceDialog(false)
                                            setClementinaChoiceData(null)
                                            setShowAgregarAtencionDialog(true)
                                        }}
                                    >
                                        {hijo.numeroGuia || `#${hijo.idPaquete}`}
                                    </Button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Diálogo: paquete ya tiene tipo — el operario confirma si añadir a la cola igual */}
            <Dialog open={!!pendingTypeConfirm} onOpenChange={(open) => { if (!open) setPendingTypeConfirm(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Paquete con tipo asignado</DialogTitle>
                        <DialogDescription>
                            {pendingTypeConfirm && (
                                <>
                                    Este paquete ya tiene tipo <strong>{pendingTypeConfirm.paquete.tipoPaquete}</strong>.
                                    ¿Añadirlo a <strong>{pendingTypeConfirm.mode.charAt(0) + pendingTypeConfirm.mode.slice(1).toLowerCase()}</strong> de todos modos?
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setPendingTypeConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (!pendingTypeConfirm) return
                                const { paquete, mode } = pendingTypeConfirm
                                addToTypedQueue(mode, paquete)
                                toast.success(`Paquete ${paquete.numeroGuia || paquete.idPaquete} añadido a ${mode}`)
                                setLastScanned({
                                    id: String(paquete.idPaquete),
                                    guia: paquete.numeroGuia ?? '',
                                    timestamp: new Date(),
                                    destinoType: mode === 'DOMICILIO' ? 'DOMICILIO' : 'AGENCIA',
                                    tipoPaquete: mode as TipoPaquete,
                                    ref: paquete.ref?.trim() || undefined,
                                    clienteDestino: buildClienteDestinoFromPaquete(paquete),
                                    observacion: paquete.observaciones?.trim() || undefined
                                })
                                setInputValue('')
                                setPendingTypeConfirm(null)
                            }}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo Agregar a Atención */}
            {showAgregarAtencionDialog && paqueteParaAtencion && id && (
                <AgregarAtencionDialog
                    open={showAgregarAtencionDialog}
                    onOpenChange={(open) => {
                        setShowAgregarAtencionDialog(open)
                        if (!open) setPaqueteParaAtencion(null)
                    }}
                    paquete={paqueteParaAtencion}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id ? Number(id) : undefined] })
                    }}
                />
            )}

            {/* Diálogo Cambiar tipo de paquete (selección múltiple) */}
            {showCambiarTipoDialog && selectedPaquetesForTipo.length > 0 && (
                <CambiarTipoMasivoDialog
                    open={showCambiarTipoDialog}
                    onOpenChange={setShowCambiarTipoDialog}
                    paquetes={selectedPaquetesForTipo}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id ? Number(id) : undefined] })
                        setSelectedPackageIds(new Set())
                        setSelectedPackageIdsOrder([])
                        setScannedPackagesForDespacho([])
                    }}
                />
            )}
        </>
    )

    // Renderizar pestañas (Operación | Lista) + contenido; con contenedor de altura cuando está embebido
    if (embedded) {
        return (
            <div className="flex flex-col gap-4 w-full min-h-[560px]">
                {tabsContent}
                <div className="flex-1 min-h-0 overflow-auto">
                    {mainContent}
                </div>
            </div>
        )
    }
    return (
        <>
            {tabsContent}
            {mainContent}
        </>
    )
}
