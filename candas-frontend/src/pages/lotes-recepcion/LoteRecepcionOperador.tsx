import AgregarAtencionDialog from '@/components/lotes-recepcion/AgregarAtencionDialog'
import CambiarTipoMasivoDialog from '@/components/lotes-recepcion/CambiarTipoMasivoDialog'
import { PaqueteCompactListItem } from '@/components/lotes-recepcion/PaqueteCompactListItem'
import { LoadingState } from '@/components/states'
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import { SelectionActionBar } from '@/components/list/SelectionActionBar'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import { usePaquetesLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { useUpdatePaquete } from '@/hooks/usePaquetes'
import { loteRecepcionService } from '@/lib/api/lote-recepcion.service'
import { paqueteService } from '@/lib/api/paquete.service'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { TipoDestino, TipoPaquete, type Paquete } from '@/types/paquete'
import { formatDireccionPaquete, formatPesoKg } from '@/utils/paqueteDisplay'
import { guiaEfectiva } from '@/utils/paqueteGuia'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { MobileScannerPanel } from '@/components/ensacado/MobileScannerPanel'
import {
    AlertCircle,
    Box,
    CheckCircle2,
    ClipboardPaste,
    Link as LinkIcon,
    List as ListIcon,
    Loader2,
    MapPin,
    QrCode,
    ScanLine,
    Scissors,
    X,
    Keyboard,
    Camera
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

interface ScannedPackage {
    id: string
    guia: string
    timestamp: Date
    destinoType: 'DOMICILIO' | 'AGENCIA'
    observacion?: string
    tipoPaquete?: TipoPaquete | null
    ref?: string
    clienteDestino?: {
        nombre?: string
        direccion?: string
        provincia?: string
        canton?: string
        pais?: string
        telefono?: string
    }
}

export interface LoteRecepcionOperadorProps {
    embedded?: boolean
}

function hasDespacho(p: Paquete): boolean {
    return p.idDespacho != null && p.idDespacho > 0
}

function buildClienteDestinoFromPaquete(p: Paquete): ScannedPackage['clienteDestino'] {
    const nombre = p.nombreClienteDestinatario?.trim()
    let direccion = (p.direccionDestinatarioCompleta || p.direccionDestinatario)?.trim() ?? ''
    const provincia = p.provinciaDestinatario?.trim()
    const canton = p.cantonDestinatario?.trim()
    const pais = p.paisDestinatario?.trim()
    const telefono = p.telefonoDestinatario?.trim()
    const sufijoUbicacion = [provincia, canton, pais].filter(Boolean).join(', ')
    if (sufijoUbicacion && direccion.endsWith(sufijoUbicacion)) {
        direccion = direccion.slice(0, -sufijoUbicacion.length).replace(/,?\s*$/, '').trim()
    } else {
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

type ModoClasificacion = 'DOMICILIO' | 'CLEMENTINA' | 'SEPARAR' | 'CADENITA'

export default function LoteRecepcionOperador({ embedded = false }: LoteRecepcionOperadorProps = {}) {
    const { id } = useParams({ strict: false })
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement>(null)

    // Data Fetching
    const { data: paquetes, isLoading } = usePaquetesLoteRecepcion(id ? Number(id) : undefined)

    const [listFilter, setListFilter] = useState<'PENDIENTES' | 'PROCESADOS'>('PENDIENTES')
    const [listTipoTab, setListTipoTab] = useState<'CLEMENTINA' | 'SEPARAR' | 'CADENITA' | 'OTROS'>('OTROS')

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

    // Contadores por pestaña de tipo
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
            return p.idPaquetePadre == null && p.tipoPaquete !== TipoPaquete.CLEMENTINA && p.tipoPaquete !== TipoPaquete.SEPARAR && p.tipoPaquete !== TipoPaquete.CADENITA
        })
    }, [paquetesParaLista, listTipoTab])

    const sortedPaquetes = useMemo(() => {
        if (!paquetesPorTipoTab.length) return []

        const baseList = paquetesPorTipoTab.filter(p => {
            if (listFilter === 'PENDIENTES') return !hasDespacho(p)
            if (listFilter === 'PROCESADOS') return hasDespacho(p)
            return true
        })

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

    // State principal
    const [activeTab, setActiveTab] = useState<'operacion' | 'lista'>('operacion')
    const [scanMode, setScanMode] = useState<ModoClasificacion>('DOMICILIO')
    const [modoCaptura, setModoCaptura] = useState<'LECTOR' | 'CAMARA'>('LECTOR')
    const [inputValue, setInputValue] = useState('')
    const [lastScanned, setLastScanned] = useState<ScannedPackage | null>(null)
    const [selectedPackageIds, setSelectedPackageIds] = useState<Set<number>>(new Set())
    const [showCambiarTipoDialog, setShowCambiarTipoDialog] = useState(false)

    // Cola de paquetes tipiados por modo
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

    const [pendingTypeConfirm, setPendingTypeConfirm] = useState<{ paquete: Paquete; mode: ModoClasificacion } | null>(null)

    // Pegar lista de guías
    interface PasteListResult {
        total: number
        agregados: number
        yaEstaban: string[]
        noEncontrados: string[]
        conflictosOtroModo: { guia: string; otroModo: ModoClasificacion }[]
        otrosErrores: string[]
        modo: ModoClasificacion
    }
    const [showPasteListDialog, setShowPasteListDialog] = useState(false)
    const [pasteListText, setPasteListText] = useState('')
    const [pasteListProcessing, setPasteListProcessing] = useState(false)
    const [pasteListResult, setPasteListResult] = useState<PasteListResult | null>(null)

    const pasteListGuias = useMemo(() => {
        if (!pasteListText) return [] as string[]
        const tokens = pasteListText
            .split(/[\n,;\s\t]+/)
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
        return Array.from(new Set(tokens))
    }, [pasteListText])

    const resetPasteListDialog = () => {
        setPasteListText('')
        setPasteListResult(null)
        setPasteListProcessing(false)
    }

    // Cámara/ZXing escáner
    const scanner = useBarcodeScanner({
        onResult: (guia) => {
            if (guia) {
                void processPackage(guia)
            }
        },
        cooldownMs: 2200,
        paused: !id || showPasteListDialog || showAgregarAtencionDialog || !!pendingTypeConfirm || activeTab !== 'operacion'
    })

    // Efecto para encender/apagar cámara según selección
    useEffect(() => {
        if (modoCaptura === 'CAMARA' && activeTab === 'operacion' && !showPasteListDialog) {
            void scanner.start()
        } else {
            scanner.stop()
        }
        return () => {
            scanner.stop()
        }
    }, [modoCaptura, activeTab, showPasteListDialog])

    // Autofocus constante para Tipiadora/Lector físico
    useEffect(() => {
        if (modoCaptura !== 'LECTOR' || activeTab !== 'operacion' || showPasteListDialog || showAgregarAtencionDialog || !!pendingTypeConfirm) {
            return
        }

        const handleFocus = () => {
            setTimeout(() => {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    inputRef.current?.focus()
                }
            }, 100)
        }

        inputRef.current?.focus()

        window.addEventListener('focus', handleFocus)
        return () => {
            window.removeEventListener('focus', handleFocus)
        }
    }, [modoCaptura, activeTab, showPasteListDialog, showAgregarAtencionDialog, pendingTypeConfirm])

    const processPackage = async (guiaInput: string) => {
        const guia = guiaInput.trim().toUpperCase()
        if (!guia) return

        try {
            const paquete = await paqueteService.findByNumeroGuia(guia)
            if (!paquete?.idPaquete) {
                notify.error(`Guía no encontrada: ${guia}`)
                setInputValue('')
                return
            }

            const mode = scanMode
            const otherModes = (['DOMICILIO', 'CLEMENTINA', 'SEPARAR', 'CADENITA'] as const).filter(m => m !== mode)
            const alreadyInMode = otherModes.find(m => typedPackagesByMode[m].some(p => p.idPaquete === paquete.idPaquete))

            if (alreadyInMode) {
                notify.error(`La guía ${guia} ya está en la cola de ${alreadyInMode.charAt(0) + alreadyInMode.slice(1).toLowerCase()}.`)
                setInputValue('')
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
                tipoPaquete: mode as TipoPaquete,
                ref: paquete.ref?.trim() || undefined,
                clienteDestino: buildClienteDestinoFromPaquete(paquete),
                observacion: paquete.observaciones?.trim() || undefined
            }

            const alreadyInCurrentMode = typedPackagesByMode[mode].some(p => p.idPaquete === paquete.idPaquete)
            if (alreadyInCurrentMode) {
                notify.info(`Ya tipiado en ${scanMode.charAt(0) + scanMode.slice(1).toLowerCase()}`)
                setLastScanned(lastScannedPayloadClass)
                setInputValue('')
                return
            }

            addToTypedQueue(mode, paquete)
            notify.success(`Guía ${guia} agregada`)
            setLastScanned(lastScannedPayloadClass)
            setInputValue('')
        } catch (err) {
            console.error(err)
            notify.error(`Error procesando guía ${guia}`)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            void processPackage(inputValue)
        }
    }

    const processPasteList = async () => {
        if (pasteListGuias.length === 0) return
        setPasteListProcessing(true)
        setPasteListResult(null)

        const result: PasteListResult = {
            total: pasteListGuias.length,
            agregados: 0,
            yaEstaban: [],
            noEncontrados: [],
            conflictosOtroModo: [],
            otrosErrores: [],
            modo: scanMode,
        }

        const otherModesForCurrent = (['DOMICILIO', 'CLEMENTINA', 'SEPARAR', 'CADENITA'] as const).filter(m => m !== scanMode)
        const nuevosPorModo: Paquete[] = []

        const queue = [...pasteListGuias]
        let ultimoPaqueteOk: Paquete | null = null

        const CONCURRENCY = 6
        const worker = async () => {
            while (queue.length > 0) {
                const guia = queue.shift()
                if (!guia) break
                try {
                    const paquete = await paqueteService.findByNumeroGuia(guia)
                    if (!paquete?.idPaquete) {
                        result.noEncontrados.push(guia)
                        continue
                    }
                    const id = paquete.idPaquete

                    const alreadyInOther = otherModesForCurrent.find(m => typedPackagesByMode[m].some(p => p.idPaquete === id))
                    if (alreadyInOther) {
                        result.conflictosOtroModo.push({ guia: paquete.numeroGuia ?? guia, otroModo: alreadyInOther })
                        continue
                    }

                    const yaEstabaActual = typedPackagesByMode[scanMode].some(p => p.idPaquete === id) || nuevosPorModo.some(p => p.idPaquete === id)
                    if (yaEstabaActual) {
                        result.yaEstaban.push(paquete.numeroGuia ?? guia)
                        continue
                    }

                    nuevosPorModo.push(paquete)
                    ultimoPaqueteOk = paquete
                    result.agregados++
                } catch {
                    result.otrosErrores.push(guia)
                }
            }
        }

        const workers = Array.from({ length: CONCURRENCY }, () => worker())
        await Promise.all(workers)

        if (nuevosPorModo.length > 0) {
            setTypedPackagesByMode(prev => {
                const existing = prev[scanMode].filter(p => !nuevosPorModo.some(n => n.idPaquete === p.idPaquete))
                return { ...prev, [scanMode]: [...nuevosPorModo, ...existing] }
            })

            if (ultimoPaqueteOk) {
                const pkg: Paquete = ultimoPaqueteOk
                setLastScanned({
                    id: String(pkg.idPaquete),
                    guia: pkg.numeroGuia ?? '',
                    timestamp: new Date(),
                    destinoType: scanMode === 'DOMICILIO' ? 'DOMICILIO' : 'AGENCIA',
                    tipoPaquete: scanMode as TipoPaquete,
                    ref: pkg.ref?.trim() || undefined,
                    clienteDestino: buildClienteDestinoFromPaquete(pkg),
                    observacion: pkg.observaciones?.trim() || undefined
                })
            }
        }

        setPasteListProcessing(false)
        setPasteListResult(result)
        if (result.agregados > 0) {
            notify.success(`${result.agregados} guía(s) agregadas a ${scanMode}`)
        }
    }

    const [puttingInLoteMode, setPuttingInLoteMode] = useState<ModoClasificacion | null>(null)

    const handlePonerEnLote = async (mode: ModoClasificacion) => {
        const list = typedPackagesByMode[mode]
        if (list.length === 0) return
        const ids = list.map(p => p.idPaquete!).filter((id): id is number => id != null)
        const loteId = id ? Number(id) : undefined
        setPuttingInLoteMode(mode)
        try {
            if (loteId && ids.length > 0) {
                await loteRecepcionService.agregarPaquetes(loteId, ids)
            }

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
            notify.success(`${list.length} paquete(s) clasificados en el lote`)
        } catch (err) {
            console.error(err)
            notify.error('Error al clasificar paquetes en el lote')
        } finally {
            setPuttingInLoteMode(null)
        }
    }

    const toggleSelectPackage = (packageId: number, checked: boolean) => {
        setSelectedPackageIds((prev) => {
            const next = new Set(prev)
            if (checked) next.add(packageId)
            else next.delete(packageId)
            return next
        })
    }

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = sortedPaquetes.map(p => p.idPaquete!).filter(Boolean)
            setSelectedPackageIds(new Set(allIds))
        } else {
            setSelectedPackageIds(new Set())
        }
    }

    const typedPackagesForCurrentMode = useMemo(() => {
        return typedPackagesByMode[scanMode] ?? []
    }, [scanMode, typedPackagesByMode])

    const tabsContent = (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'operacion' | 'lista')} className={embedded ? 'w-full' : 'w-[400px]'}>
            <TabsList className="grid w-full grid-cols-2 bg-muted text-muted-foreground">
                <TabsTrigger value="operacion" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <QrCode className="w-4 h-4 mr-2" /> Tipiadora
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
            {/* PESTAÑA OPERACIÓN */}
            {activeTab === 'operacion' && (
                <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6", embedded ? "min-h-[520px]" : "h-[calc(100vh-140px)]")}>
                    
                    {/* Left Column: Tipeo & Cámara (col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        
                        <Card className="border border-border shadow-sm bg-card overflow-hidden shrink-0">
                            {/* Header: Modo Clasificación + Modo de Entrada */}
                            <div className="p-3 bg-muted/40 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                                <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as ModoClasificacion)} className="w-full sm:w-auto">
                                    <TabsList className="w-full grid grid-cols-4 h-9 bg-muted">
                                        <TabsTrigger value="DOMICILIO" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
                                            Domicilio ({typedPackagesByMode.DOMICILIO.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="CLEMENTINA" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs">
                                            Clementina ({typedPackagesByMode.CLEMENTINA.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="SEPARAR" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs">
                                            Separar ({typedPackagesByMode.SEPARAR.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="CADENITA" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs">
                                            Cadenita ({typedPackagesByMode.CADENITA.length})
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <SegmentedToggle
                                    value={modoCaptura}
                                    onChange={(v) => setModoCaptura(v as 'LECTOR' | 'CAMARA')}
                                    options={[
                                        { value: 'LECTOR', label: <span className="flex items-center gap-1.5"><Keyboard className="h-3.5 w-3.5" /> Lector</span> },
                                        { value: 'CAMARA', label: <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Cámara</span> }
                                    ]}
                                    className="h-8"
                                />
                            </div>

                            <CardContent className="p-5 space-y-4">
                                {modoCaptura === 'LECTOR' ? (
                                    <div className="relative">
                                        <ScanLine className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground/50 animate-pulse" />
                                        <Input
                                            ref={inputRef}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className={cn(
                                                "h-20 pl-20 text-3xl font-mono tracking-widest uppercase border-2 focus:ring-4 focus:ring-offset-2 placeholder:text-muted-foreground/40 bg-background transition-colors duration-200",
                                                scanMode === 'DOMICILIO' && "border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-blue-900/50 dark:focus:border-blue-400",
                                                scanMode === 'CLEMENTINA' && "border-orange-200 focus:border-orange-500 focus:ring-orange-500/20 dark:border-orange-900/50 dark:focus:orange-400",
                                                scanMode === 'SEPARAR' && "border-red-200 focus:border-red-500 focus:ring-red-500/20 dark:border-red-900/50 dark:focus:border-red-400",
                                                scanMode === 'CADENITA' && "border-violet-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-violet-900/50 dark:focus:border-violet-400",
                                            )}
                                            placeholder="ESCANEAR GUÍA..."
                                            autoComplete="off"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold bg-muted px-3 py-1.5 rounded-md border border-border">
                                            <span>AUTO-FOCUS</span>
                                        </div>
                                    </div>
                                ) : (
                                    <MobileScannerPanel
                                        videoRef={scanner.videoRef}
                                        permission={scanner.permission}
                                        isScanning={scanner.isScanning}
                                        paused={scanner.paused}
                                        error={scanner.error}
                                        devices={scanner.devices}
                                        selectedDeviceId={scanner.selectedDeviceId}
                                        onSelectDevice={scanner.selectDevice}
                                        onStart={() => void scanner.start()}
                                        onManualSubmit={(guia) => void processPackage(guia)}
                                    />
                                )}

                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <p className="text-xs text-muted-foreground">
                                        ¿Quieres cargar varias guías a la vez?{' '}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                resetPasteListDialog()
                                                setShowPasteListDialog(true)
                                            }}
                                            className="text-primary font-medium hover:underline focus:outline-none"
                                        >
                                            Pega una lista de guías aquí.
                                        </button>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Visión del Paquete Escaneado (Feedback) */}
                        <div className="flex-1 min-h-[220px]">
                            {lastScanned ? (
                                <Card className={cn(
                                    "h-full border-l-[8px] shadow-sm flex flex-col justify-center bg-card transition-all duration-300 border-border",
                                    lastScanned.tipoPaquete === 'DOMICILIO' && "border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10",
                                    lastScanned.tipoPaquete === 'CLEMENTINA' && "border-l-orange-500 bg-orange-500/5 dark:bg-orange-500/10",
                                    lastScanned.tipoPaquete === 'SEPARAR' && "border-l-red-500 bg-red-500/5 dark:bg-red-500/10",
                                    lastScanned.tipoPaquete === 'CADENITA' && "border-l-violet-500 bg-violet-500/5 dark:bg-violet-500/10"
                                )}>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                                            <div className="p-3 bg-background rounded-full shadow-sm border border-border shrink-0">
                                                {lastScanned.tipoPaquete === 'DOMICILIO' && <MapPin className="h-8 w-8 text-blue-500" />}
                                                {lastScanned.tipoPaquete === 'CLEMENTINA' && <Box className="h-8 w-8 text-orange-500" />}
                                                {lastScanned.tipoPaquete === 'SEPARAR' && <Scissors className="h-8 w-8 text-red-500" />}
                                                {lastScanned.tipoPaquete === 'CADENITA' && <LinkIcon className="h-8 w-8 text-violet-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-3xl font-black tracking-tight text-foreground font-mono leading-none truncate">
                                                    {lastScanned.guia}
                                                </h2>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Badge className={cn(
                                                        "text-xs px-2 py-0.5 font-bold uppercase border shadow-none",
                                                        lastScanned.tipoPaquete === 'DOMICILIO' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                                        lastScanned.tipoPaquete === 'CLEMENTINA' && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                                                        lastScanned.tipoPaquete === 'SEPARAR' && "bg-red-500/10 text-red-600 border-red-500/20",
                                                        lastScanned.tipoPaquete === 'CADENITA' && "bg-violet-500/10 text-violet-600 border-violet-500/20"
                                                    )}>
                                                        {lastScanned.tipoPaquete === 'CADENITA' ? 'Cadenita' : lastScanned.tipoPaquete}
                                                    </Badge>
                                                    {lastScanned.ref && (
                                                        <span className="text-xs text-muted-foreground font-mono font-medium">
                                                            Ref: {lastScanned.ref}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Datos del Cliente Destinatario */}
                                        <div className="space-y-2">
                                            {lastScanned.clienteDestino ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                    {lastScanned.clienteDestino.nombre && (
                                                        <div className="md:col-span-2">
                                                            <span className="text-xs font-bold text-muted-foreground uppercase block">Destinatario</span>
                                                            <p className="font-semibold text-foreground">{lastScanned.clienteDestino.nombre}</p>
                                                        </div>
                                                    )}
                                                    {lastScanned.clienteDestino.direccion && (
                                                        <div className="md:col-span-2">
                                                            <span className="text-xs font-bold text-muted-foreground uppercase block">Dirección</span>
                                                            <p className="text-foreground leading-snug">{lastScanned.clienteDestino.direccion}</p>
                                                        </div>
                                                    )}
                                                    {lastScanned.clienteDestino.canton && (
                                                        <div>
                                                            <span className="text-xs font-bold text-muted-foreground uppercase block">Cantón / Ciudad</span>
                                                            <p className="text-foreground">{lastScanned.clienteDestino.canton}</p>
                                                        </div>
                                                    )}
                                                    {lastScanned.clienteDestino.telefono && (
                                                        <div>
                                                            <span className="text-xs font-bold text-muted-foreground uppercase block">Teléfono</span>
                                                            <p className="text-foreground font-mono">{lastScanned.clienteDestino.telefono}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">Este paquete no tiene información de contacto de destino.</p>
                                            )}

                                            {lastScanned.observacion && (
                                                <div className="rounded-lg border border-warning-content/20 bg-warning/10 p-3 mt-3">
                                                    <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-warning-foreground flex items-center gap-1">
                                                        <AlertCircle className="h-3.5 w-3.5" /> Observaciones
                                                    </span>
                                                    <p className="text-xs font-medium text-foreground">{lastScanned.observacion}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-full border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/10 p-8">
                                    <ScanLine className="h-14 w-14 opacity-20" />
                                    <div className="text-center">
                                        <span className="text-lg font-semibold opacity-60 block">Listo para la lectura</span>
                                        <span className="text-xs text-muted-foreground/60 block mt-1">Escanea un código de barras para clasificar el paquete</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Cola de Tipeo / Historial (col-span-4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
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
                                    const count = typedPackagesForCurrentMode.length
                                    const isPutting = puttingInLoteMode === scanMode
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
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">En cola</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => clearTypedQueue(scanMode)}
                                                    disabled={count === 0}
                                                >
                                                    Limpiar
                                                </Button>
                                            </div>

                                            {typedPackagesForCurrentMode.length > 0 ? (
                                                <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-background p-1 space-y-1">
                                                    {typedPackagesForCurrentMode.map((p, idx) => (
                                                        <PaqueteCompactListItem
                                                            key={p.idPaquete}
                                                            paquete={p}
                                                            index={idx + 1}
                                                            action={
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded-full"
                                                                    onClick={() => p.idPaquete != null && removeFromTypedQueue(scanMode, p.idPaquete)}
                                                                    title="Quitar de la cola"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm italic gap-2 text-center p-4">
                                                    <ScanLine className="h-8 w-8 opacity-20" />
                                                    <span>Sin paquetes en cola. Escanea o escribe guías.</span>
                                                </div>
                                            )}

                                            <div className="mt-auto pt-2 pb-4">
                                                <Button
                                                    size="lg"
                                                    className={cn(
                                                        "w-full font-bold shadow-sm h-11",
                                                        scanMode === 'DOMICILIO' && "bg-blue-600 hover:bg-blue-700 text-white",
                                                        scanMode === 'CLEMENTINA' && "bg-orange-600 hover:bg-orange-700 text-white",
                                                        scanMode === 'SEPARAR' && "bg-red-600 hover:bg-red-700 text-white",
                                                        scanMode === 'CADENITA' && "bg-violet-600 hover:bg-violet-700 text-white"
                                                    )}
                                                    onClick={() => handlePonerEnLote(scanMode)}
                                                    disabled={count === 0 || isPutting}
                                                >
                                                    {isPutting ? (
                                                        <>Procesando...</>
                                                    ) : (
                                                        <span className="flex items-center justify-center gap-1.5">
                                                            {scanMode === 'DOMICILIO' && <MapPin className="h-4 w-4" />}
                                                            {scanMode === 'CLEMENTINA' && <Box className="h-4 w-4" />}
                                                            {scanMode === 'SEPARAR' && <Scissors className="h-4 w-4" />}
                                                            {scanMode === 'CADENITA' && <LinkIcon className="h-4 w-4" />}
                                                            Guardar clasificados ({count})
                                                        </span>
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    )
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* PESTAÑA LISTA */}
            {activeTab === 'lista' && (
                <Card className={cn(embedded ? "min-h-[520px]" : "h-[calc(100vh-140px)]", "flex flex-col bg-card border border-border shadow-sm")}>
                    <CardHeader className="border-b border-border px-4 py-3 bg-muted/30 space-y-3 shrink-0">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <SegmentedToggle
                                    value={listTipoTab}
                                    onChange={(tipo) => {
                                        setListTipoTab(tipo)
                                        setSelectedPackageIds(new Set())
                                    }}
                                    options={[
                                        { value: 'OTROS', label: `Comunes (${countsPorTipoTab.OTROS})` },
                                        { value: 'CLEMENTINA', label: `Clementina (${countsPorTipoTab.CLEMENTINA})` },
                                        { value: 'SEPARAR', label: `Separar (${countsPorTipoTab.SEPARAR})` },
                                        { value: 'CADENITA', label: `Cadenita (${countsPorTipoTab.CADENITA})` },
                                    ]}
                                    className="h-8"
                                />

                                <Separator orientation="vertical" className="hidden sm:block h-6" />

                                <SegmentedToggle
                                    value={listFilter}
                                    onChange={(value) => {
                                        if (value === 'PROCESADOS') {
                                            setSelectedPackageIds(new Set())
                                        }
                                        setListFilter(value)
                                    }}
                                    options={[
                                        { value: 'PENDIENTES', label: 'Pendientes' },
                                        { value: 'PROCESADOS', label: 'Trabajados' },
                                    ]}
                                    className="h-8"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3 shrink-0">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {sortedPaquetes.length} paquetes
                                </span>
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-8 text-xs">
                                    Actualizar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-auto bg-background min-h-0">
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
                                    <TableHead className="w-[200px]">Paquete</TableHead>
                                    <TableHead className="w-[280px]">Destino</TableHead>
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
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableCell colSpan={colCount} className="bg-muted/30 text-xs font-semibold text-muted-foreground py-2 px-4 border-y border-border/40">
                                                                {refLabel ? `Referencia: ${refLabel}` : 'Sin referencia'}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    <TableRow
                                                        data-state={listFilter === 'PENDIENTES' && selectedPackageIds.has(pkg.idPaquete!) ? "selected" : undefined}
                                                        className={cn(
                                                            "transition-colors hover:bg-muted/25 group",
                                                            hasDespacho(pkg) ? "opacity-75 bg-muted/5" : ""
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
                                                                <span className="flex items-baseline gap-2">
                                                                    <span className="font-mono font-semibold text-sm">{guiaEfectiva(pkg) || '-'}</span>
                                                                    {formatPesoKg(pkg) && <span className="text-xs text-muted-foreground font-medium tabular-nums">{formatPesoKg(pkg)}</span>}
                                                                </span>
                                                                {pkg.ref && <span className="text-xs text-muted-foreground font-mono">Ref: {pkg.ref}</span>}
                                                                {pkg.idPaquetePadre != null && (
                                                                    <Badge variant="outline" className="w-fit text-[9px] px-1.5 py-0 h-4.5 border-orange-200 text-orange-700 bg-orange-50 font-semibold select-none">
                                                                        Hijo de {pkg.numeroGuiaPaquetePadre}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-top py-3 max-w-[300px]">
                                                            <div className="flex flex-col gap-0.5 text-sm">
                                                                <span className="font-semibold text-foreground truncate">
                                                                    {pkg.tipoDestino === 'AGENCIA'
                                                                        ? (pkg.nombreAgenciaDestino || '—')
                                                                        : (pkg.nombreClienteDestinatario || '—')}
                                                                </span>
                                                                {pkg.tipoDestino !== 'AGENCIA' && pkg.telefonoDestinatario && (
                                                                    <p className="text-xs font-mono text-muted-foreground">Tel: {pkg.telefonoDestinatario}</p>
                                                                )}
                                                                {(() => {
                                                                    const direccion = formatDireccionPaquete(pkg, { fallback: 'Sin destino' })
                                                                    return (
                                                                        <p className="text-xs text-muted-foreground leading-snug break-words" title={direccion}>
                                                                            {direccion}
                                                                        </p>
                                                                    )
                                                                })()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-top py-3">
                                                            {hasDespacho(pkg) ? (
                                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-semibold shadow-none select-none">
                                                                    Despachado
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 font-semibold shadow-none select-none">
                                                                    Pendiente
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="align-top py-3 max-w-[240px]">
                                                            <span className="text-xs text-muted-foreground whitespace-pre-wrap break-words block" title={pkg.observaciones}>
                                                                {pkg.observaciones || '—'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="align-top py-3 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                onClick={() => {
                                                                    setPaqueteParaAtencion(pkg)
                                                                    setShowAgregarAtencionDialog(true)
                                                                }}
                                                                title="Poner en atención"
                                                            >
                                                                <ScanLine className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                </Fragment>
                                            )
                                        })
                                    })()
                                )}
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={listFilter === 'PENDIENTES' ? 6 : 5} className="p-0 border-0">
                                        <div ref={observerTarget} className="h-4 w-full" />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>

                    <SelectionActionBar
                        count={listFilter === 'PENDIENTES' ? selectedPackageIds.size : 0}
                        onClear={() => setSelectedPackageIds(new Set())}
                        itemLabel="paquete"
                    >
                        <Button size="sm" variant="outline" onClick={() => setShowCambiarTipoDialog(true)} className="h-8 rounded-full text-xs font-semibold px-4">
                            <Box className="h-3.5 w-3.5 mr-1.5" />
                            Cambiar clasificación
                        </Button>
                    </SelectionActionBar>
                </Card>
            )}

            {/* Diálogo Pegar lista de guías */}
            <Dialog
                open={showPasteListDialog}
                onOpenChange={(open) => {
                    setShowPasteListDialog(open)
                    if (!open) setTimeout(() => resetPasteListDialog(), 200)
                }}
            >
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2.5 rounded-xl shrink-0",
                                scanMode === 'DOMICILIO' && "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
                                scanMode === 'CLEMENTINA' && "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
                                scanMode === 'SEPARAR' && "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
                                scanMode === 'CADENITA' && "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
                            )}>
                                <ClipboardPaste className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-lg">
                                    Pegar lista de guías
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        · Modo {scanMode.charAt(0) + scanMode.slice(1).toLowerCase()}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-xs mt-1">
                                    Pega las guías separadas por saltos de línea para agregarlas a la cola de {scanMode.charAt(0) + scanMode.slice(1).toLowerCase()}.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="paste-list-textarea" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Guías a procesar
                                </Label>
                                <span className="text-xs text-muted-foreground tabular-nums font-semibold">
                                    {pasteListGuias.length} detectadas
                                </span>
                            </div>
                            <Textarea
                                id="paste-list-textarea"
                                value={pasteListText}
                                onChange={(e) => {
                                    setPasteListText(e.target.value)
                                    if (pasteListResult) setPasteListResult(null)
                                }}
                                placeholder={'Ej:\nGUIA-001\nGUIA-002\nGUIA-003\n...'}
                                rows={8}
                                className="font-mono text-sm resize-y min-h-[160px]"
                                disabled={pasteListProcessing}
                            />
                        </div>

                        {pasteListResult && (
                            <div className="rounded-lg border border-border bg-card overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-semibold text-foreground">Resultados del procesamiento</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                        <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-950/20 dark:bg-emerald-950/10 py-2">
                                            <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Agregados</div>
                                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{pasteListResult.agregados}</div>
                                        </div>
                                        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-950/20 dark:bg-amber-950/10 py-2">
                                            <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Ya estaban</div>
                                            <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{pasteListResult.yaEstaban.length}</div>
                                        </div>
                                        <div className="rounded-md border border-rose-200 bg-rose-50 dark:border-rose-950/20 dark:bg-rose-950/10 py-2">
                                            <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">No encontrados</div>
                                            <div className="text-lg font-bold text-rose-700 dark:text-rose-300">{pasteListResult.noEncontrados.length}</div>
                                        </div>
                                        <div className="rounded-md border border-border bg-muted/40 py-2">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground">Otros</div>
                                            <div className="text-lg font-bold text-foreground">{pasteListResult.conflictosOtroModo.length + pasteListResult.otrosErrores.length}</div>
                                        </div>
                                    </div>

                                    {pasteListResult.noEncontrados.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">No encontradas ({pasteListResult.noEncontrados.length})</span>
                                            <div className="rounded-md border border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/5 p-2 font-mono text-[10px] max-h-24 overflow-y-auto break-all">
                                                {pasteListResult.noEncontrados.join(', ')}
                                            </div>
                                        </div>
                                    )}

                                    {pasteListResult.conflictosOtroModo.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 block">En otra cola ({pasteListResult.conflictosOtroModo.length})</span>
                                            <div className="rounded-md border border-orange-100 dark:border-orange-950/30 bg-orange-50/50 dark:bg-orange-950/5 p-2 font-mono text-[10px] max-h-24 overflow-y-auto space-y-0.5">
                                                {pasteListResult.conflictosOtroModo.map((c, i) => (
                                                    <div key={`conflict-paste-${i}`}>
                                                        {c.guia} <span className="text-orange-600/80">→ {c.otroModo}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-border shrink-0 font-sans">
                        {pasteListResult ? (
                            <div className="flex gap-2 w-full justify-end">
                                <Button type="button" variant="outline" onClick={resetPasteListDialog}>
                                    Pegar otra lista
                                </Button>
                                <Button type="button" onClick={() => setShowPasteListDialog(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2 w-full justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowPasteListDialog(false)} disabled={pasteListProcessing}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={processPasteList}
                                    disabled={pasteListProcessing || pasteListGuias.length === 0}
                                    className="min-w-[140px]"
                                >
                                    {pasteListProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardPaste className="h-4 w-4 mr-1.5" />
                                            Procesar
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
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

            {/* Diálogo Cambiar clasificación masivo */}
            {showCambiarTipoDialog && selectedPackageIds.size > 0 && id && (
                <CambiarTipoMasivoDialog
                    open={showCambiarTipoDialog}
                    onOpenChange={setShowCambiarTipoDialog}
                    paquetes={paquetes?.filter(p => p.idPaquete != null && selectedPackageIds.has(p.idPaquete)) || []}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id ? Number(id) : undefined] })
                        setSelectedPackageIds(new Set())
                    }}
                />
            )}

            {/* Diálogo elegir Padre/Hijo para atención (CLEMENTINA) */}
            <Dialog open={showClementinaChoiceDialog} onOpenChange={(open) => { setShowClementinaChoiceDialog(open); if (!open) setClementinaChoiceData(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Registrar atención para</DialogTitle>
                        <DialogDescription>
                            Elige si registrar la atención para el padre o para el hijo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="justify-start h-auto py-2.5"
                            onClick={() => {
                                if (!clementinaChoiceData) return
                                setPaqueteParaAtencion(clementinaChoiceData.parent)
                                setShowClementinaChoiceDialog(false)
                                setClementinaChoiceData(null)
                                setShowAgregarAtencionDialog(true)
                            }}
                        >
                            <span className="font-mono text-xs font-semibold mr-1.5">Padre:</span>
                            {clementinaChoiceData?.parent?.numeroGuia || `#${clementinaChoiceData?.parent?.idPaquete}`}
                        </Button>
                        {clementinaChoiceData?.child ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-start h-auto py-2.5"
                                onClick={() => {
                                    if (!clementinaChoiceData) return
                                    setPaqueteParaAtencion(clementinaChoiceData.child!)
                                    setShowClementinaChoiceDialog(false)
                                    setClementinaChoiceData(null)
                                    setShowAgregarAtencionDialog(true)
                                }}
                            >
                                <span className="font-mono text-xs font-semibold mr-1.5">Hijo:</span>
                                {clementinaChoiceData.child.numeroGuia || `#${clementinaChoiceData.child.idPaquete}`}
                            </Button>
                        ) : clementinaChoiceData?.children && clementinaChoiceData.children.length > 0 ? (
                            <div className="space-y-1 pt-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase block px-1">Seleccionar Hijo</span>
                                {clementinaChoiceData.children.map((hijo) => (
                                    <Button
                                        key={hijo.idPaquete}
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start h-auto py-2 text-xs"
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

            {/* Diálogo confirmación si el paquete escaneado ya tiene tipo */}
            <Dialog open={!!pendingTypeConfirm} onOpenChange={(open) => { if (!open) setPendingTypeConfirm(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Paquete con clasificación previa</DialogTitle>
                        <DialogDescription>
                            {pendingTypeConfirm && (
                                <>
                                    Este paquete ya cuenta con una clasificación como <strong>{pendingTypeConfirm.paquete.tipoPaquete || pendingTypeConfirm.paquete.tipoDestino}</strong>.
                                    ¿Deseas clasificarlo como <strong>{pendingTypeConfirm.mode.charAt(0) + pendingTypeConfirm.mode.slice(1).toLowerCase()}</strong>?
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 font-sans">
                        <Button type="button" variant="outline" onClick={() => setPendingTypeConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (!pendingTypeConfirm) return
                                const { paquete, mode } = pendingTypeConfirm
                                addToTypedQueue(mode, paquete)
                                notify.success(`Paquete ${paquete.numeroGuia || paquete.idPaquete} agregado a ${mode}`)
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
        </>
    )

    if (isLoading) {
        return <LoadingState label="Cargando operador de lote..." />
    }

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
        <div className="space-y-4">
            {tabsContent}
            {mainContent}
        </div>
    )
}
