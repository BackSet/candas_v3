import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDespachos, useDeleteDespacho, useDespacho, useMarcarDespachado, useMarcarDespachadoBatch } from '@/hooks/useDespachos'
import { useAgencia } from '@/hooks/useAgencias'
import { useDistribuidor } from '@/hooks/useDistribuidores'
import { useQuery } from '@tanstack/react-query'
import { despachoService } from '@/lib/api/despacho.service'
import { agenciaService } from '@/lib/api/agencia.service'
import { distribuidorService } from '@/lib/api/distribuidor.service'
import { Button } from '@/components/ui/button'
import { DatePickerForm } from '@/components/ui/date-time-picker'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Printer,
  MessageSquare,
  Copy,
  Check,
  MoreHorizontal,
  Truck,
  PackageCheck,
  FileText,
  Tag,
  Tags,
} from 'lucide-react'
import { imprimirDespacho, imprimirManifiestosMultiples, generarPDFDespacho } from '@/utils/imprimirDespacho'
import { imprimirEtiquetaSaca, imprimirEtiquetasSacas, imprimirEtiquetasZebraSacas, imprimirEtiquetaZebraSaca, imprimirEtiquetasMultiplesDespachos, imprimirEtiquetasZebraMultiplesDespachos } from '@/utils/imprimirEtiquetaSaca'
import { Checkbox } from '@/components/ui/checkbox'
import type { Saca } from '@/types/saca'
import type { Despacho } from '@/types/despacho'
import type { Agencia } from '@/types/agencia'
import type { Distribuidor } from '@/types/distribuidor'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { useFiltersStore } from '@/stores/filtersStore'
import { useAuthStore } from '@/stores/authStore'
import ImprimirDespachoDialog, { type TipoImpresion } from '@/components/despachos/ImprimirDespachoDialog'
import { ListToolbar } from '@/components/list/ListToolbar'
import { LoadingState } from '@/components/states'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'

const LIST_KEY = 'despachos' as const

function DespachoRowActions({
  despacho,
  onVer,
  onEditar,
  onMensaje,
  onMarcarDespachado,
  onImprimir,
  onEliminar,
}: {
  despacho: Despacho
  onVer: () => void
  onEditar: () => void
  onMensaje: () => void
  onMarcarDespachado: () => void
  onImprimir: () => void
  onEliminar: () => void
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.DESPACHOS.VER, PERMISSIONS.DESPACHOS.EDITAR, PERMISSIONS.DESPACHOS.IMPRIMIR, PERMISSIONS.DESPACHOS.ELIMINAR]}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Ver detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMensaje}>
              <MessageSquare className="h-3.5 w-3.5 mr-2" /> Generar mensaje
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMarcarDespachado}>
              <PackageCheck className="h-3.5 w-3.5 mr-2" /> Marcar despachado
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.IMPRIMIR}>
            <DropdownMenuItem onClick={onImprimir}>
              <Printer className="h-3.5 w-3.5 mr-2" /> Imprimir...
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.ELIMINAR}>
            <DropdownMenuItem
              onClick={onEliminar}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

export default function DespachosList() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: agenciaUsuario } = useAgencia(user?.idAgencia)
  const nombreAgenciaOrigen = agenciaUsuario?.nombre ?? undefined

  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '', filtroTipoDestino = 'all' } = { ...stored } as { page?: number; size?: number; search?: string; filtroTipoDestino?: 'all' | 'agencia' | 'directo' }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const setFiltroTipoDestino = (v: 'all' | 'agencia' | 'directo') => setFiltersAction(LIST_KEY, { filtroTipoDestino: v, page: 0 })
  const [despachoAEliminar, setDespachoAEliminar] = useState<number | null>(null)
  const [despachoAImprimir, setDespachoAImprimir] = useState<number | null>(null)
  const [tipoImpresion, setTipoImpresion] = useState<TipoImpresion>('etiqueta')
  const [sacaSeleccionada, setSacaSeleccionada] = useState<number | null>(null)
  const [sacaConLeyenda, setSacaConLeyenda] = useState<number | null>(null)

  // Estado para impresión múltiple
  const [mostrarDialogoMultiples, setMostrarDialogoMultiples] = useState(false)
  const [despachosSeleccionados, setDespachosSeleccionados] = useState<Set<number>>(new Set())

  // Estado para mensaje de despacho
  const [despachoParaMensaje, setDespachoParaMensaje] = useState<number | null>(null)
  const [mensajeGenerado, setMensajeGenerado] = useState<string>('')
  const [copiado, setCopiado] = useState(false)
  const [telefonoDestino, setTelefonoDestino] = useState<string | null>(null)
  const [telefonoCopiado, setTelefonoCopiado] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [despachoAMarcarDespachado, setDespachoAMarcarDespachado] = useState<number | null>(null)
  const [mostrarDialogoMarcarDespachadoBatch, setMostrarDialogoMarcarDespachadoBatch] = useState(false)

  // Resetear página cuando cambie la fecha seleccionada o la búsqueda
  useEffect(() => {
    setPage(0)
  }, [fechaSeleccionada, busqueda, filtroTipoDestino])

  const { data, isLoading, error } = useDespachos(
    page,
    size,
    filtroTipoDestino,
    fechaSeleccionada ?? undefined,
    fechaSeleccionada ?? undefined
  )
  const deleteMutation = useDeleteDespacho()
  const marcarDespachadoMutation = useMarcarDespachado()
  const marcarDespachadoBatchMutation = useMarcarDespachadoBatch()

  // Cargar datos del despacho para impresión
  const { data: despachoCompleto } = useDespacho(despachoAImprimir ?? undefined)
  const sacas = despachoCompleto?.sacas || []
  const { data: agencia } = useAgencia(despachoCompleto?.idAgencia)
  const { data: distribuidor } = useDistribuidor(despachoCompleto?.idDistribuidor)

  const handleDelete = async () => {
    if (despachoAEliminar) {
      try {
        await deleteMutation.mutateAsync(despachoAEliminar)
        setDespachoAEliminar(null)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  const resetDialogoImpresion = () => {
    setDespachoAImprimir(null)
    setTipoImpresion('etiqueta')
    setSacaSeleccionada(null)
    setSacaConLeyenda(null)
  }

  const esUltimaSacaDelDespacho = (idSaca?: number): boolean => {
    if (!idSaca || !sacas || sacas.length === 0) return false
    const sacasOrdenadas = [...sacas].sort(
      (a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0)
    )
    const ultimaSaca = sacasOrdenadas[sacasOrdenadas.length - 1]
    if (!ultimaSaca) return false

    if (ultimaSaca.idSaca != null) {
      return ultimaSaca.idSaca === idSaca
    }

    const sacaSeleccionadaDetalle = sacasOrdenadas.find((s) => s.idSaca === idSaca)
    return (
      !!sacaSeleccionadaDetalle &&
      (sacaSeleccionadaDetalle.numeroOrden || 0) ===
        (ultimaSaca.numeroOrden || 0)
    )
  }

  const handleImprimir = async (
    tipoOverride?: TipoImpresion,
    sacaOverride?: number | null
  ) => {
    if (!despachoCompleto) return

    const tipoActual = tipoOverride ?? tipoImpresion
    const sacaActual =
      sacaOverride !== undefined ? sacaOverride : sacaSeleccionada

    const requiereSaca =
      tipoActual === 'etiqueta' || tipoActual === 'etiqueta-zebra'
    const requiereSacas =
      tipoActual === 'etiqueta' ||
      tipoActual === 'etiqueta-zebra' ||
      tipoActual === 'todas' ||
      tipoActual === 'todas-zebra'

    if (requiereSacas && (!sacas || sacas.length === 0)) {
      toast.info(
        'Este despacho no tiene sacas para imprimir etiquetas. Puedes imprimir el documento.'
      )
      return
    }

    if (requiereSaca && !sacaActual) {
      toast.error('Selecciona una saca para continuar con la impresión.')
      return
    }

    if (tipoActual === 'documento') {
      await imprimirDespacho(
        despachoCompleto,
        agencia,
        distribuidor,
        nombreAgenciaOrigen
      )
      resetDialogoImpresion()
      return
    }

    if (tipoActual === 'todas') {
      const sacasOrdenadas = [...sacas].sort(
        (a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0)
      )
      let indiceLeyenda: number | undefined
      if (sacaConLeyenda !== null) {
        const indice = sacasOrdenadas.findIndex(
          (s) => s.idSaca === sacaConLeyenda
        )
        indiceLeyenda = indice >= 0 ? indice : undefined
      }
      await imprimirEtiquetasSacas(
        sacas,
        despachoCompleto,
        agencia,
        distribuidor,
        indiceLeyenda,
        nombreAgenciaOrigen
      )
      resetDialogoImpresion()
      return
    }

    if (tipoActual === 'todas-zebra') {
      const sacasOrdenadas = [...sacas].sort(
        (a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0)
      )
      let indiceLeyenda: number | undefined
      if (sacaConLeyenda !== null) {
        const indice = sacasOrdenadas.findIndex(
          (s) => s.idSaca === sacaConLeyenda
        )
        indiceLeyenda = indice >= 0 ? indice : undefined
      }
      await imprimirEtiquetasZebraSacas(
        sacas,
        despachoCompleto,
        agencia,
        distribuidor,
        indiceLeyenda,
        nombreAgenciaOrigen
      )
      resetDialogoImpresion()
      return
    }

    if (tipoActual === 'etiqueta') {
      const saca = sacas?.find((s) => s.idSaca === sacaActual)
      if (saca) {
        const mostrarLeyendaManifiesto = esUltimaSacaDelDespacho(saca.idSaca)
        await imprimirEtiquetaSaca(
          saca,
          despachoCompleto,
          agencia,
          distribuidor,
          sacas?.length,
          nombreAgenciaOrigen,
          mostrarLeyendaManifiesto
        )
      }
      resetDialogoImpresion()
      return
    }

    if (tipoActual === 'etiqueta-zebra') {
      const saca = sacas?.find((s) => s.idSaca === sacaActual)
      if (saca) {
        const mostrarLeyendaManifiesto = esUltimaSacaDelDespacho(saca.idSaca)
        await imprimirEtiquetaZebraSaca(
          saca,
          despachoCompleto,
          agencia,
          distribuidor,
          sacas?.length,
          nombreAgenciaOrigen,
          mostrarLeyendaManifiesto
        )
      }
      resetDialogoImpresion()
    }
  }

  // Función auxiliar para cargar datos de un despacho
  const cargarDatosDespacho = async (idDespacho: number): Promise<{
    despacho: Despacho
    agencia?: Agencia
    distribuidor?: Distribuidor
  } | null> => {
    try {
      const despacho = await despachoService.findById(idDespacho)
      if (!despacho) return null

      let agencia: Agencia | undefined
      let distribuidor: Distribuidor | undefined

      if (despacho.idAgencia) {
        agencia = await agenciaService.findById(despacho.idAgencia)
      }

      if (despacho.idDistribuidor) {
        distribuidor = await distribuidorService.findById(despacho.idDistribuidor)
      }

      return { despacho, agencia, distribuidor }
    } catch (error) {
      // Error silencioso
      return null
    }
  }

  const handleImprimirMultiplesEtiquetas = async (formato: 'normal' | 'zebra') => {
    if (despachosSeleccionados.size === 0) {
      toast.error('Debes seleccionar al menos un despacho')
      return
    }

    const etiquetas: Array<{
      sacas: Saca[]
      despacho: Despacho
      agencia?: Agencia
      distribuidor?: Distribuidor
      indiceSacaConLeyenda?: number
    }> = []

    for (const idDespacho of despachosSeleccionados) {
      const datos = await cargarDatosDespacho(idDespacho)
      if (!datos) continue

      const sacasDesp = datos.despacho.sacas || []
      if (sacasDesp.length === 0) continue

      const sacasOrdenadas = [...sacasDesp].sort((a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0))
      const indiceLeyenda = sacasOrdenadas.length - 1

      etiquetas.push({
        sacas: sacasDesp,
        despacho: datos.despacho,
        agencia: datos.agencia,
        distribuidor: datos.distribuidor,
        indiceSacaConLeyenda: indiceLeyenda,
      })
    }

    if (etiquetas.length === 0) {
      toast.error('No hay etiquetas para imprimir en los despachos seleccionados')
      return
    }

    if (formato === 'zebra') {
      await imprimirEtiquetasZebraMultiplesDespachos(etiquetas, nombreAgenciaOrigen)
    } else {
      await imprimirEtiquetasMultiplesDespachos(etiquetas, nombreAgenciaOrigen)
    }
  }

  // Función para imprimir todos los documentos de todos los despachos seleccionados
  const handleImprimirTodosDocumentos = async () => {
    if (despachosSeleccionados.size === 0) {
      toast.error('Debes seleccionar al menos un despacho')
      return
    }

    const manifiestos: Array<{
      despacho: Despacho
      agencia?: Agencia
      distribuidor?: Distribuidor
    }> = []

    // Cargar datos de todos los despachos seleccionados
    for (const idDespacho of despachosSeleccionados) {
      const datos = await cargarDatosDespacho(idDespacho)
      if (!datos) continue

      manifiestos.push({
        despacho: datos.despacho,
        agencia: datos.agencia,
        distribuidor: datos.distribuidor
      })
    }

    if (manifiestos.length === 0) {
      toast.error('No hay documentos para imprimir en los despachos seleccionados')
      return
    }

    await imprimirManifiestosMultiples(manifiestos, nombreAgenciaOrigen)
  }

  // Búsqueda en el backend cuando hay una búsqueda activa
  const { data: despachosBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['despachos', 'search', busqueda],
    queryFn: () => despachoService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  // Usar resultados de búsqueda del backend si hay búsqueda activa; si no, usar listado paginado (ya filtrado por fecha y tipo en backend)
  const despachosFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      const list = despachosBusqueda || []
      if (filtroTipoDestino === 'agencia') return list.filter(d => d.idAgencia != null)
      if (filtroTipoDestino === 'directo') return list.filter(d => d.despachoDirecto?.destinatarioDirecto != null)
      return list
    }
    return data?.content || []
  }, [busqueda, despachosBusqueda, data?.content, filtroTipoDestino])

  // Funciones para manejar selección múltiple
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const todosLosIds = new Set(despachosFiltrados.map(d => d.idDespacho!))
      setDespachosSeleccionados(todosLosIds)
    } else {
      setDespachosSeleccionados(new Set())
    }
  }

  const handleSelectDespacho = (idDespacho: number, checked: boolean) => {
    const nuevosSeleccionados = new Set(despachosSeleccionados)
    if (checked) {
      nuevosSeleccionados.add(idDespacho)
    } else {
      nuevosSeleccionados.delete(idDespacho)
    }
    setDespachosSeleccionados(nuevosSeleccionados)
  }

  const todosSeleccionados = despachosFiltrados.length > 0 &&
    despachosFiltrados.every(d => despachosSeleccionados.has(d.idDespacho!))

  // Función para generar el mensaje del despacho
  const generarMensajeDespacho = async (idDespacho: number) => {
    try {
      const despacho = await despachoService.findById(idDespacho)

      let agencia: Agencia | null = null
      if (despacho.idAgencia) {
        agencia = await agenciaService.findById(despacho.idAgencia)
      }

      let distribuidor: Distribuidor | null = null
      if (despacho.idDistribuidor) {
        distribuidor = await distribuidorService.findById(despacho.idDistribuidor)
      }

      const sacas = despacho.sacas || []
      const totalSacas = sacas.length
      const totalPaquetes = sacas.reduce((sum, saca) => {
        return sum + (saca.idPaquetes?.length || 0)
      }, 0)

      let mensaje = ''
      mensaje += '*DESPACHO ENVIADO*\n'
      mensaje += '━━━━━━━━━━━━━━━━━━━━\n\n'

      mensaje += `*Manifiesto:* ${despacho.numeroManifiesto || `ID: ${despacho.idDespacho}`}\n`
      if (despacho.fechaDespacho) {
        mensaje += `*Fecha:* ${new Date(despacho.fechaDespacho).toLocaleDateString('es-ES')}\n`
      }
      mensaje += '\n'

      if (despacho.idAgencia && agencia) {
        mensaje += `*Destino:* ${agencia.nombre}${agencia.canton ? ` - ${agencia.canton}` : ''}\n`
        if (agencia.nombrePersonal) {
          mensaje += `*Encargado:* ${agencia.nombrePersonal}\n`
        }
      } else if (despacho.despachoDirecto?.destinatarioDirecto) {
        const destinatario = despacho.despachoDirecto.destinatarioDirecto
        mensaje += `*Destinatario:* ${destinatario.nombreDestinatario}\n`
      }

      if (distribuidor?.nombre || despacho.numeroGuiaAgenciaDistribucion) {
        mensaje += '\n'
        if (distribuidor?.nombre) {
          mensaje += `*Distribuidor:* ${distribuidor.nombre}\n`
        }
        if (despacho.numeroGuiaAgenciaDistribucion) {
          mensaje += `*Guía:* ${despacho.numeroGuiaAgenciaDistribucion}\n`
        }
      }

      mensaje += '\n'
      mensaje += '*RESUMEN*\n'
      mensaje += `• ${totalSacas} ${totalSacas === 1 ? 'Saca' : 'Sacas'}\n`
      mensaje += `• ${totalPaquetes} ${totalPaquetes === 1 ? 'Paquete' : 'Paquetes'}\n\n`

      if (sacas.length > 0) {
        mensaje += '*DETALLE*\n'
        const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0))
        sacasOrdenadas.forEach((saca, index) => {
          const numPaquetes = saca.idPaquetes?.length || 0
          mensaje += `${index + 1}. Saca #${saca.numeroOrden || 'N/A'} (${numPaquetes} paq)\n`
        })
        mensaje += '\n'
      }

      mensaje += '*IMPORTANTE:*\n'
      mensaje += `Al recibir la carga, por favor verifique que el número de paquetes recibidos corresponda con los ${totalPaquetes} paquetes enviados según este manifiesto.\n\n`

      mensaje += '*NOTA:* El documento PDF del despacho está disponible para descarga.\n\n'

      mensaje += '*¡Gracias por su confianza!*'
      return mensaje
    } catch (error) {
      return 'Error al generar el mensaje del despacho.'
    }
  }

  // Función para abrir el diálogo de mensaje
  const handleAbrirMensaje = async (idDespacho: number) => {
    setDespachoParaMensaje(idDespacho)
    setMensajeGenerado('') // Limpiar previo
    setCopiado(false)
    setTelefonoCopiado(false)
    const mensaje = await generarMensajeDespacho(idDespacho)
    setMensajeGenerado(mensaje)

    try {
      const despacho = await despachoService.findById(idDespacho)
      if (despacho.idAgencia) {
        // Buscar teléfono de la agencia
        const agencia = await agenciaService.findById(despacho.idAgencia)
        if (agencia?.telefonos && agencia.telefonos.length > 0) {
          const telefonoPrincipal = agencia.telefonos.find(t => t.principal) || agencia.telefonos[0]
          setTelefonoDestino(telefonoPrincipal?.numero || null)
        } else {
          setTelefonoDestino(null)
        }
      } else if (despacho.despachoDirecto?.destinatarioDirecto) {
        // Buscar teléfono del destinatario directo
        const destinatario = despacho.despachoDirecto.destinatarioDirecto
        setTelefonoDestino(destinatario.telefonoDestinatario || null)
      } else {
        setTelefonoDestino(null)
      }
    } catch (error) {
      setTelefonoDestino(null)
    }
  }

  const copiarMensaje = async () => {
    try {
      await navigator.clipboard.writeText(mensajeGenerado)
      setCopiado(true)
      toast.success('Mensaje copiado al portapapeles')
      setTimeout(() => setCopiado(false), 2000)
    } catch (error) {
      toast.error('Error al copiar el mensaje')
    }
  }

  const copiarTelefono = async () => {
    if (!telefonoDestino) return
    try {
      await navigator.clipboard.writeText(telefonoDestino)
      setTelefonoCopiado(true)
      toast.success('Teléfono copiado al portapapeles')
      setTimeout(() => setTelefonoCopiado(false), 2000)
    } catch (error) {
      toast.error('Error al copiar el teléfono')
    }
  }

  // Función para descargar PDF del despacho
  const descargarPDFDespacho = async () => {
    if (!despachoParaMensaje) return

    try {
      toast.info('Generando PDF...')
      const despacho = await despachoService.findById(despachoParaMensaje)

      let agencia: Agencia | null = null
      if (despacho.idAgencia) {
        agencia = await agenciaService.findById(despacho.idAgencia)
      }

      let distribuidor: Distribuidor | null = null
      if (despacho.idDistribuidor) {
        distribuidor = await distribuidorService.findById(despacho.idDistribuidor)
      }

      await generarPDFDespacho(despacho, agencia || undefined, distribuidor || undefined, nombreAgenciaOrigen)

      toast.success('PDF descargado exitosamente')
    } catch (error: unknown) {
      console.error('Error al generar PDF:', error)
      const msg = error instanceof Error ? error.message : 'Error al generar el PDF del despacho'
      toast.error(msg)
    }
  }

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  return (
    <StandardPageLayout
      title="Despachos"
      icon={<Truck className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {despachosSeleccionados.size > 0 && (
            <>
              <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.IMPRIMIR}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarDialogoMultiples(true)}
                  className="h-8 shadow-sm text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Imprimir ({despachosSeleccionados.size})
                </Button>
              </ProtectedByPermission>
              <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.EDITAR}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarDialogoMarcarDespachadoBatch(true)}
                  className="h-8 shadow-sm text-xs"
                >
                  <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
                  Marcar despachado ({despachosSeleccionados.size})
                </Button>
              </ProtectedByPermission>
            </>
          )}
          <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.CREAR}>
            <Button onClick={() => navigate({ to: '/despachos/new' })} size="sm" className="h-8 shadow-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nuevo
            </Button>
          </ProtectedByPermission>
        </div>
      }
    >
      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar manifiesto..."
        filters={
          <>
            <Select value={filtroTipoDestino} onValueChange={(v) => setFiltroTipoDestino(v as 'all' | 'agencia' | 'directo')}>
              <SelectTrigger className="w-[200px] h-9 text-xs">
                <SelectValue placeholder="Destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los despachos</SelectItem>
                <SelectItem value="agencia">Con agencia</SelectItem>
                <SelectItem value="directo">Con destinatario directo</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-40">
              <DatePickerForm
                value={fechaSeleccionada ?? ''}
                onChange={(v) => setFechaSeleccionada(v || null)}
                inline
                className={cn("h-9 text-xs px-2", !fechaSeleccionada && "text-muted-foreground")}
              />
            </div>
          </>
        }
      />

      {/* Results Info Bar (when filtered) */}
      {(busqueda.trim().length > 0 || fechaSeleccionada) && (
        <div className="text-xs text-muted-foreground text-center animate-in fade-in bg-muted/20 py-2 border-b border-border/40">
          {fechaSeleccionada && (
            <span>
              Filtro fecha: {new Date(fechaSeleccionada).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} •
            </span>
          )}
          <span className="ml-1">
            Resultados: <strong>{despachosFiltrados.length}</strong>
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Main Content - Notion Table View */}
        <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          {(isLoading || loadingBusqueda) ? (
            <LoadingState label="Cargando despachos..." />
          ) : error ? (
            <ErrorState title="Error al cargar los despachos" />
          ) : (
            <div className="flex-1 min-h-0 relative w-full overflow-auto">
              <Table className="notion-table">
                <TableHeader className="bg-muted/40 border-b border-border">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-8 pl-3 h-9">
                      <Checkbox
                        checked={todosSeleccionados}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos"
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead className="min-w-[120px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Manifiesto</TableHead>
                    <TableHead className="min-w-[150px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Destino</TableHead>
                    <TableHead className="min-w-[150px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Logística</TableHead>
                    <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Contenido</TableHead>
                    <TableHead className="text-right h-9 pr-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despachosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64">
                        <EmptyState
                          title="No se encontraron despachos"
                          description={
                            busqueda || fechaSeleccionada
                              ? "No hay resultados para los filtros seleccionados"
                              : "No hay despachos registrados"
                          }
                          icon={<Truck className="h-10 w-10 text-muted-foreground/50" />}
                          action={
                            !busqueda && !fechaSeleccionada && (
                              <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.CREAR}>
                                <Button onClick={() => navigate({ to: '/despachos/new' })} variant="outline" size="sm">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Crear Despacho
                                </Button>
                              </ProtectedByPermission>
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    despachosFiltrados.map((despacho) => {
                      // Calcular desglose de sacas y paquetes
                      const sacas = despacho.sacas || []
                      const totalSacas = sacas.length
                      const totalPaquetes = sacas.reduce((sum, s) => sum + (s.idPaquetes?.length ?? 0), 0)

                      return (
                        <TableRow key={despacho.idDespacho} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-10">
                          <TableCell className="pl-3 py-2">
                            <Checkbox
                              checked={despachosSeleccionados.has(despacho.idDespacho!)}
                              onCheckedChange={(checked) =>
                                handleSelectDespacho(despacho.idDespacho!, checked as boolean)
                              }
                              className="translate-y-[2px]"
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-mono text-xs font-medium text-foreground", despacho.numeroManifiesto ? "" : "text-muted-foreground")}>
                                  {despacho.numeroManifiesto || `#${despacho.idDespacho}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                {despacho.fechaDespacho ? new Date(despacho.fechaDespacho).toLocaleDateString('es-ES') : '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {despacho.nombreAgencia ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                  <span className="truncate max-w-[170px]" title={despacho.nombreAgencia}>
                                    {despacho.nombreAgencia}
                                  </span>
                                </div>
                                {despacho.cantonAgencia && (
                                  <span className="text-[10px] text-muted-foreground">{despacho.cantonAgencia}</span>
                                )}
                              </div>
                            ) : despacho.despachoDirecto?.destinatarioDirecto ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-info">
                                  <span>Directo</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                                  {despacho.despachoDirecto.destinatarioDirecto.nombreDestinatario}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                              {despacho.nombreDistribuidor && (
                                <div className="flex items-center gap-1.5">
                                  <span>{despacho.nombreDistribuidor}</span>
                                </div>
                              )}
                              {despacho.numeroGuiaAgenciaDistribucion && (
                                <div className="flex items-center gap-1 font-mono text-[10px]">
                                  <span>Guía: {despacho.numeroGuiaAgenciaDistribucion}</span>
                                </div>
                              )}
                              {!despacho.nombreDistribuidor && !despacho.numeroGuiaAgenciaDistribucion && (
                                <span className="opacity-50">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{totalSacas}</span> {totalSacas === 1 ? 'saca' : 'sacas'}
                              {totalPaquetes > 0 && (
                                <span className="text-muted-foreground/90">({totalPaquetes} {totalPaquetes === 1 ? 'paquete' : 'paquetes'})</span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2 pr-4">
                            <DespachoRowActions
                              despacho={despacho}
                              onVer={() => navigate({ to: `/despachos/${despacho.idDespacho}` })}
                              onEditar={() => navigate({ to: `/despachos/${despacho.idDespacho}/edit` })}
                              onMensaje={() => handleAbrirMensaje(despacho.idDespacho!)}
                              onMarcarDespachado={() => setDespachoAMarcarDespachado(despacho.idDespacho!)}
                              onImprimir={() => setDespachoAImprimir(despacho.idDespacho!)}
                              onEliminar={() => setDespachoAEliminar(despacho.idDespacho!)}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!isLoading && !loadingBusqueda && busqueda.trim().length === 0 && (
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={data?.totalElements}
            size={size}
            onPageChange={setPage}
            className="shrink-0"
          />
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={!!despachoAEliminar} onOpenChange={(open) => !open && setDespachoAEliminar(null)}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar este despacho? Esta acción no se puede deshacer.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDespachoAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ... Other existing dialogs preserved ... */}
      <Dialog open={!!despachoAMarcarDespachado} onOpenChange={(open) => !open && setDespachoAMarcarDespachado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Despachado</DialogTitle>
            <DialogDescription>
              Esta acción cambiará el estado de los paquetes ENSACADO o ASIGNADO_SACA a DESPACHADO.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDespachoAMarcarDespachado(null)}>Cancelar</Button>
            <Button onClick={() => despachoAMarcarDespachado && marcarDespachadoMutation.mutate(despachoAMarcarDespachado, { onSuccess: () => setDespachoAMarcarDespachado(null) })} disabled={marcarDespachadoMutation.isPending}>
              {marcarDespachadoMutation.isPending ? 'Marcando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogoMarcarDespachadoBatch} onOpenChange={(open) => !open && setMostrarDialogoMarcarDespachadoBatch(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como despachado</DialogTitle>
            <DialogDescription>
              Se marcarán como DESPACHADO los paquetes (ENSACADO o ASIGNADO_SACA) de los {despachosSeleccionados.size} despacho(s) seleccionado(s). ¿Continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogoMarcarDespachadoBatch(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                marcarDespachadoBatchMutation.mutate(Array.from(despachosSeleccionados), {
                  onSuccess: () => {
                    setMostrarDialogoMarcarDespachadoBatch(false)
                    setDespachosSeleccionados(new Set())
                  },
                })
              }}
              disabled={marcarDespachadoBatchMutation.isPending}
            >
              {marcarDespachadoBatchMutation.isPending ? 'Marcando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImprimirDespachoDialog
        open={!!despachoAImprimir}
        onOpenChange={(open) => {
          if (!open) {
            resetDialogoImpresion()
          }
        }}
        tipoImpresion={tipoImpresion}
        onTipoImpresionChange={setTipoImpresion}
        sacaSeleccionada={sacaSeleccionada}
        onSacaSeleccionadaChange={setSacaSeleccionada}
        sacas={sacas}
        onPrint={() => void handleImprimir()}
        onQuickPrint={(tipo) => {
          void handleImprimir(tipo)
        }}
        onCancel={resetDialogoImpresion}
      />

      {/* Mensaje Dialog */}
      <Dialog open={!!despachoParaMensaje} onOpenChange={(open) => !open && setDespachoParaMensaje(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <MessageSquare className="h-5 w-5 text-info" />
              Mensaje de Despacho
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="relative group">
              <Textarea
                value={mensajeGenerado}
                onChange={(e) => setMensajeGenerado(e.target.value)}
                placeholder="Generando mensaje..."
                className="min-h-[300px] font-mono text-sm bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/20 resize-y p-4 leading-relaxed"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wider bg-background/80 backdrop-blur-sm border shadow-sm">Editable</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Puedes editar el mensaje antes de copiarlo o enviarlo por WhatsApp.</p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copiarMensaje}
                className={cn(
                  "h-9 border-border/60 hover:border-info/30 hover:bg-info/10 transition-all",
                  copiado && "bg-success/10 text-success border-success/20"
                )}
              >
                {copiado ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiado ? 'Copiado' : 'Copiar Texto'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={descargarPDFDespacho}
                className="h-9 border-border/60 hover:border-primary/30 hover:bg-primary/10 transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>

              {telefonoDestino && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copiarTelefono}
                  className={cn(
                    "h-9 border-border/60 hover:border-info/30 hover:bg-info/10 transition-all font-mono",
                    telefonoCopiado && "bg-success/10 text-success border-success/20 font-medium"
                  )}
                >
                  {telefonoCopiado ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {telefonoCopiado ? 'Copiado' : telefonoDestino}
                </Button>
              )}

              {telefonoDestino && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const cleanTel = telefonoDestino.replace(/\D/g, '');
                    const finalTel = cleanTel.startsWith('593') ? cleanTel : `593${cleanTel.startsWith('0') ? cleanTel.substring(1) : cleanTel}`;
                    window.open(`https://wa.me/${finalTel}?text=${encodeURIComponent(mensajeGenerado)}`, '_blank');
                  }}
                  className="h-9 bg-success text-success-foreground hover:bg-success/90 ml-auto"
                >
                  <Truck className="h-4 w-4 mr-2" /> Enviar WhatsApp
                </Button>
              )}
            </div>
          </div>

          <div className="bg-muted/30 px-6 py-4 flex justify-between items-center border-t">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">MV Services Logistics System</p>
            <Button variant="ghost" size="sm" onClick={() => setDespachoParaMensaje(null)} className="h-8 text-xs">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multiples Dialog */}
      <Dialog open={mostrarDialogoMultiples} onOpenChange={setMostrarDialogoMultiples}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Imprimir Selección</DialogTitle>
            <DialogDescription>
              {despachosSeleccionados.size} despachos seleccionados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Acciones rápidas</p>
              <Badge variant="secondary" className="text-[10px]">
                1 clic
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-3 min-w-0 whitespace-normal flex flex-col items-start gap-1 text-left"
                onClick={handleImprimirTodosDocumentos}
              >
                <span className="w-full flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Documento
                </span>
                <span className="w-full text-[11px] text-muted-foreground leading-tight whitespace-normal break-words">
                  Imprime documentos de todos los despachos seleccionados
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-3 min-w-0 whitespace-normal flex flex-col items-start gap-1 text-left"
                onClick={() => handleImprimirMultiplesEtiquetas('normal')}
              >
                <span className="w-full flex items-center gap-2 text-sm font-medium">
                  <Tags className="h-4 w-4" />
                  Todas etiquetas
                </span>
                <span className="w-full text-[11px] text-muted-foreground leading-tight whitespace-normal break-words">
                  Formato normal para todos los despachos seleccionados
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-3 min-w-0 whitespace-normal flex flex-col items-start gap-1 text-left"
                onClick={() => handleImprimirMultiplesEtiquetas('zebra')}
              >
                <span className="w-full flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4" />
                  Todas Zebra
                </span>
                <span className="w-full text-[11px] text-muted-foreground leading-tight whitespace-normal break-words">
                  Formato Zebra para todos los despachos seleccionados
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </StandardPageLayout>
  )
}
