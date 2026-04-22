import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDespachos, useDeleteDespacho, useDespacho, useMarcarDespachado, useMarcarDespachadoBatch } from '@/hooks/useDespachos'
import { useAgencia } from '@/hooks/useAgencias'
import { useDistribuidor } from '@/hooks/useDistribuidores'
import { despachoService } from '@/lib/api/despacho.service'
import { agenciaService } from '@/lib/api/agencia.service'
import { distribuidorService } from '@/lib/api/distribuidor.service'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogContentPresets,
} from '@/components/ui/dialog'
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
  Loader2,
} from 'lucide-react'
import { imprimirDespacho, imprimirManifiestosMultiples, generarPDFDespacho } from '@/utils/imprimirDespacho'
import { imprimirEtiquetaSaca, imprimirEtiquetasSacas, imprimirEtiquetasZebraSacas, imprimirEtiquetaZebraSaca, imprimirEtiquetasMultiplesDespachos, imprimirEtiquetasZebraMultiplesDespachos } from '@/utils/imprimirEtiquetaSaca'
import type { Saca } from '@/types/saca'
import type { Despacho } from '@/types/despacho'
import type { Agencia } from '@/types/agencia'
import type { Distribuidor } from '@/types/distribuidor'
import { Badge } from '@/components/ui/badge'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { useAuthStore } from '@/stores/authStore'
import ImprimirDespachoDialog, { type TipoImpresion } from '@/components/despachos/ImprimirDespachoDialog'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { usePlantillaWhatsAppDespacho } from '@/hooks/usePlantillaWhatsAppDespacho'
import { reemplazarVariables, construirVariablesDesdeDespacho } from '@/utils/plantillaWhatsApp'
import { copyTextToClipboard } from '@/utils/clipboard'
import { useListFilters } from '@/hooks/useListFilters'
import { formatearFechaCorta } from '@/utils/fechas'
import { getApiErrorMessage, getInteragencyRestrictionMessage } from '@/lib/api/errors'
import {
  showProcessError,
  showProcessStart,
  showProcessSuccess,
} from '@/hooks/mutationFeedback'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter, DateRangeFilter } from '@/components/filters'

interface DespachosFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  filtroTipoDestino: 'all' | 'agencia' | 'directo'
  fechaDesde: string
  fechaHasta: string
}

const DESPACHOS_FILTERS_DEFAULTS: DespachosFiltersState = {
  page: 0,
  size: 20,
  search: '',
  filtroTipoDestino: 'all',
  fechaDesde: '',
  fechaHasta: '',
}

const TIPO_DESTINO_LABEL: Record<DespachosFiltersState['filtroTipoDestino'], string> = {
  all: 'Todos los destinos',
  agencia: 'Con agencia',
  directo: 'Directo',
}

function DespachoRowActions({
  onVer,
  onEditar,
  onMensaje,
  onMarcarDespachado,
  onImprimir,
  onEliminar,
}: {
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Acciones de fila"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
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
  const activeAgencyId = useAuthStore((s) => s.activeAgencyId)
  const agenciaOrigenId = activeAgencyId ?? user?.idAgencia
  const { data: agenciaUsuario } = useAgencia(agenciaOrigenId ?? undefined)
  const nombreAgenciaOrigen = agenciaUsuario?.nombre ?? undefined

  const filtros = useListFilters<DespachosFiltersState>({
    storageKey: 'despachos',
    defaults: DESPACHOS_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.filtroTipoDestino !== 'all') {
        chips.push({
          key: 'filtroTipoDestino',
          label: `Destino: ${TIPO_DESTINO_LABEL[values.filtroTipoDestino]}`,
          onRemove: () => removeFilter('filtroTipoDestino'),
        })
      }
      if (values.fechaDesde || values.fechaHasta) {
        const desde = values.fechaDesde || '...'
        const hasta = values.fechaHasta || '...'
        chips.push({
          key: 'fechaRango',
          label: `Fecha: ${desde} → ${hasta}`,
          onRemove: () => filtros.setFilters({ fechaDesde: '', fechaHasta: '' }),
        })
      }
      return chips
    },
  })
  const { page, size, search: busqueda, filtroTipoDestino, fechaDesde, fechaHasta } = filtros.values
  const [despachoAEliminar, setDespachoAEliminar] = useState<number | null>(null)
  const [despachoAImprimir, setDespachoAImprimir] = useState<number | null>(null)
  const [tipoImpresion, setTipoImpresion] = useState<TipoImpresion>('etiqueta')
  const [sacaSeleccionada, setSacaSeleccionada] = useState<number | null>(null)
  const [sacaConLeyenda, setSacaConLeyenda] = useState<number | null>(null)

  const [mostrarDialogoMultiples, setMostrarDialogoMultiples] = useState(false)
  const [despachosSeleccionados, setDespachosSeleccionados] = useState<Set<number>>(new Set())

  const [despachoParaMensaje, setDespachoParaMensaje] = useState<number | null>(null)
  const [mensajeGenerado, setMensajeGenerado] = useState<string>('')
  const [copiado, setCopiado] = useState(false)
  const [telefonoDestino, setTelefonoDestino] = useState<string | null>(null)
  const [telefonoCopiado, setTelefonoCopiado] = useState(false)
  const [despachoAMarcarDespachado, setDespachoAMarcarDespachado] = useState<number | null>(null)
  const [mostrarDialogoMarcarDespachadoBatch, setMostrarDialogoMarcarDespachadoBatch] = useState(false)
  const [imprimiendoDespacho, setImprimiendoDespacho] = useState(false)
  const [quickPrintEnCurso, setQuickPrintEnCurso] = useState<TipoImpresion | null>(null)
  const [descargandoPdf, setDescargandoPdf] = useState(false)
  const [imprimiendoMultiples, setImprimiendoMultiples] = useState<'documento' | 'normal' | 'zebra' | null>(null)

  const { data, isLoading, error } = useDespachos({
    page,
    size,
    tipoDestino: filtroTipoDestino,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    search: busqueda || undefined,
  })
  const deleteMutation = useDeleteDespacho()
  const marcarDespachadoMutation = useMarcarDespachado()
  const marcarDespachadoBatchMutation = useMarcarDespachadoBatch()

  const { data: despachoCompleto } = useDespacho(despachoAImprimir ?? undefined)
  const sacas = despachoCompleto?.sacas || []
  const { data: agencia } = useAgencia(despachoCompleto?.idAgencia)
  const { data: distribuidor } = useDistribuidor(despachoCompleto?.idDistribuidor)
  const { data: plantillaData } = usePlantillaWhatsAppDespacho()

  const handleDelete = async () => {
    if (despachoAEliminar) {
      try {
        await deleteMutation.mutateAsync(despachoAEliminar)
        setDespachoAEliminar(null)
      } catch (_error) {
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
      notify.info(
        'Este despacho no tiene sacas para imprimir etiquetas. Puedes imprimir el documento.'
      )
      return
    }

    if (requiereSaca && !sacaActual) {
      notify.error('Selecciona una saca para continuar con la impresión.')
      return
    }

    const toastId = showProcessStart('Preparando impresión...')
    setImprimiendoDespacho(true)
    setQuickPrintEnCurso(tipoOverride ?? null)

    try {
      if (tipoActual === 'documento') {
        await imprimirDespacho(
          despachoCompleto,
          agencia,
          distribuidor,
          nombreAgenciaOrigen
        )
        showProcessSuccess(toastId, 'Documento enviado a impresión.')
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
        showProcessSuccess(toastId, 'Etiquetas enviadas a impresión.')
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
        showProcessSuccess(toastId, 'Etiquetas Zebra enviadas a impresión.')
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
        showProcessSuccess(toastId, 'Etiqueta enviada a impresión.')
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
        showProcessSuccess(toastId, 'Etiqueta Zebra enviada a impresión.')
        resetDialogoImpresion()
      }
    } catch (error: unknown) {
      showProcessError(toastId, error, 'No se pudo completar la impresión.')
    } finally {
      setImprimiendoDespacho(false)
      setQuickPrintEnCurso(null)
    }
  }

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
    } catch (_error) {
      return null
    }
  }

  const handleImprimirMultiplesEtiquetas = async (formato: 'normal' | 'zebra') => {
    if (despachosSeleccionados.size === 0) {
      notify.error('Debes seleccionar al menos un despacho')
      return
    }

    const toastId = showProcessStart(
      formato === 'zebra'
        ? 'Preparando etiquetas Zebra...'
        : 'Preparando etiquetas...'
    )
    setImprimiendoMultiples(formato)

    const etiquetas: Array<{
      sacas: Saca[]
      despacho: Despacho
      agencia?: Agencia
      distribuidor?: Distribuidor
      indiceSacaConLeyenda?: number
    }> = []
    try {
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
        showProcessError(toastId, null, 'No hay etiquetas para imprimir en los despachos seleccionados.')
        return
      }

      if (formato === 'zebra') {
        await imprimirEtiquetasZebraMultiplesDespachos(etiquetas, nombreAgenciaOrigen)
      } else {
        await imprimirEtiquetasMultiplesDespachos(etiquetas, nombreAgenciaOrigen)
      }
      showProcessSuccess(toastId, 'Impresión múltiple enviada correctamente.')
    } catch (error: unknown) {
      showProcessError(toastId, error, 'No se pudo imprimir la selección.')
    } finally {
      setImprimiendoMultiples(null)
    }
  }

  const handleImprimirTodosDocumentos = async () => {
    if (despachosSeleccionados.size === 0) {
      notify.error('Debes seleccionar al menos un despacho')
      return
    }

    const toastId = showProcessStart('Preparando documentos para impresión...')
    setImprimiendoMultiples('documento')

    const manifiestos: Array<{
      despacho: Despacho
      agencia?: Agencia
      distribuidor?: Distribuidor
    }> = []
    try {
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
        showProcessError(toastId, null, 'No hay documentos para imprimir en los despachos seleccionados.')
        return
      }

      await imprimirManifiestosMultiples(manifiestos, nombreAgenciaOrigen)
      showProcessSuccess(toastId, 'Documentos enviados a impresión.')
    } catch (error: unknown) {
      showProcessError(toastId, error, 'No se pudo imprimir los documentos seleccionados.')
    } finally {
      setImprimiendoMultiples(null)
    }
  }

  const despachosFiltrados = data?.content || []

  const handleToggleAll = (rows: Despacho[]) => {
    const allSelected = rows.length > 0 && rows.every((r) => despachosSeleccionados.has(r.idDespacho!))
    if (allSelected) {
      setDespachosSeleccionados(new Set())
    } else {
      setDespachosSeleccionados(new Set(rows.map((r) => r.idDespacho!)))
    }
  }

  const handleToggleOne = (id: string | number) => {
    setDespachosSeleccionados((prev) => {
      const next = new Set(prev)
      const numId = Number(id)
      if (next.has(numId)) next.delete(numId)
      else next.add(numId)
      return next
    })
  }

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

      const plantilla = plantillaData?.plantilla?.trim()
      const variables = construirVariablesDesdeDespacho(despacho, agencia, distribuidor)

      if (plantilla) {
        return reemplazarVariables(plantilla, variables)
      }

      const sacas = despacho.sacas || []
      const totalSacas = sacas.length
      const totalPaquetes = sacas.reduce((sum, saca) => sum + (saca.idPaquetes?.length || 0), 0)
      let mensaje = ''
      mensaje += '*DESPACHO ENVIADO*\n\n'
      mensaje += `*Manifiesto:* ${despacho.numeroManifiesto || `ID: ${despacho.idDespacho}`}\n`
      if (despacho.fechaDespacho) {
        mensaje += `*Fecha:* ${formatearFechaCorta(despacho.fechaDespacho)}\n`
      }
      if (despacho.nombreAgenciaPropietaria) {
        mensaje += `*Agencia propietaria:* ${despacho.nombreAgenciaPropietaria}\n`
      }
      if (despacho.codigoPresinto) {
        mensaje += `*Presinto:* ${despacho.codigoPresinto}\n`
      }
      mensaje += '\n'
      if (despacho.idAgencia && agencia) {
        mensaje += `*Destino:* ${agencia.nombre}${agencia.canton ? ` - ${agencia.canton}` : ''}\n`
        if (agencia.nombrePersonal) mensaje += `*Encargado:* ${agencia.nombrePersonal}\n`
      } else if (despacho.despachoDirecto?.destinatarioDirecto) {
        mensaje += `*Destinatario:* ${despacho.despachoDirecto.destinatarioDirecto.nombreDestinatario}\n`
      }
      if (distribuidor?.nombre || despacho.numeroGuiaAgenciaDistribucion) {
        if (distribuidor?.nombre) mensaje += `*Distribuidor:* ${distribuidor.nombre}\n`
        if (despacho.numeroGuiaAgenciaDistribucion) mensaje += `*Guía:* ${despacho.numeroGuiaAgenciaDistribucion}\n`
      }
      mensaje += '\n*Resumen operativo*\n'
      mensaje += `• ${totalSacas} ${totalSacas === 1 ? 'Saca' : 'Sacas'}\n`
      mensaje += `• ${totalPaquetes} ${totalPaquetes === 1 ? 'Paquete' : 'Paquetes'}\n\n`
      if (sacas.length > 0) {
        mensaje += '*Detalle de sacas*\n'
        const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden ?? 0) - (b.numeroOrden ?? 0))
        sacasOrdenadas.forEach((saca, index) => {
          mensaje += `${index + 1}. Saca #${saca.numeroOrden ?? 'N/A'} (${saca.idPaquetes?.length ?? 0} paq)\n`
        })
        mensaje += '\n'
      }
      mensaje += '*Verificación de recepción:*\n'
      mensaje += `Confirme que la carga recibida coincida con *${totalPaquetes}* paquete(s) reportado(s) en el manifiesto.`
      return mensaje
    } catch {
      return 'Error al generar el mensaje del despacho.'
    }
  }

  const handleAbrirMensaje = async (idDespacho: number) => {
    setDespachoParaMensaje(idDespacho)
    setMensajeGenerado('')
    setCopiado(false)
    setTelefonoCopiado(false)
    const mensaje = await generarMensajeDespacho(idDespacho)
    setMensajeGenerado(mensaje)

    try {
      const despacho = await despachoService.findById(idDespacho)
      if (despacho.idAgencia) {
        const agencia = await agenciaService.findById(despacho.idAgencia)
        if (agencia?.telefonos && agencia.telefonos.length > 0) {
          const telefonoPrincipal = agencia.telefonos.find(t => t.principal) || agencia.telefonos[0]
          setTelefonoDestino(telefonoPrincipal?.numero || null)
        } else {
          setTelefonoDestino(null)
        }
      } else if (despacho.despachoDirecto?.destinatarioDirecto) {
        const destinatario = despacho.despachoDirecto.destinatarioDirecto
        setTelefonoDestino(destinatario.telefonoDestinatario || null)
      } else {
        setTelefonoDestino(null)
      }
    } catch (_error) {
      setTelefonoDestino(null)
    }
  }

  const copiarMensaje = async () => {
    const ok = await copyTextToClipboard(mensajeGenerado)
    if (ok) {
      setCopiado(true)
      notify.success('Mensaje copiado al portapapeles')
      setTimeout(() => setCopiado(false), 2000)
    } else {
      notify.error('No se pudo copiar el mensaje')
    }
  }

  const copiarTelefono = async () => {
    if (!telefonoDestino) return
    const ok = await copyTextToClipboard(telefonoDestino)
    if (ok) {
      setTelefonoCopiado(true)
      notify.success('Teléfono copiado al portapapeles')
      setTimeout(() => setTelefonoCopiado(false), 2000)
    } else {
      notify.error('No se pudo copiar el teléfono')
    }
  }

  const descargarPDFDespacho = async () => {
    if (!despachoParaMensaje) return

    setDescargandoPdf(true)
    const toastId = showProcessStart('Preparando descarga del PDF...')
    try {
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
      showProcessSuccess(toastId, 'Descarga de PDF completada.')
    } catch (error: unknown) {
      showProcessError(toastId, error, 'No se pudo generar el PDF del despacho.')
    } finally {
      setDescargandoPdf(false)
    }
  }

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  const columns = useMemo<DataTableColumn<Despacho>[]>(() => [
    {
      id: 'manifiesto',
      header: 'Manifiesto',
      accessor: (d) => (
        <span
          className={cn(
            'font-mono text-xs font-medium',
            d.numeroManifiesto ? 'text-foreground' : 'text-muted-foreground'
          )}
          title={d.numeroManifiesto ?? `#${d.idDespacho}`}
        >
          {d.numeroManifiesto || `#${d.idDespacho}`}
        </span>
      ),
      sortValue: (d) => d.numeroManifiesto ?? `#${d.idDespacho}`,
      width: '160px',
    },
    {
      id: 'fecha',
      header: 'Fecha',
      accessor: (d) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatearFechaCorta(d.fechaDespacho)}
        </span>
      ),
      sortValue: (d) => (d.fechaDespacho ? new Date(d.fechaDespacho) : null),
      width: '130px',
    },
    {
      id: 'destino',
      header: 'Destino',
      accessor: (d) => {
        if (d.nombreAgencia) {
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-medium text-foreground truncate" title={d.nombreAgencia}>
                {d.nombreAgencia}
              </span>
              {d.cantonAgencia ? (
                <span className="text-[11px] text-muted-foreground truncate">{d.cantonAgencia}</span>
              ) : null}
            </div>
          )
        }
        if (d.despachoDirecto?.destinatarioDirecto) {
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-medium text-info">Directo</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {d.despachoDirecto.destinatarioDirecto.nombreDestinatario}
              </span>
            </div>
          )
        }
        return <span className="text-xs text-muted-foreground italic">—</span>
      },
      sortValue: (d) =>
        d.nombreAgencia ?? d.despachoDirecto?.destinatarioDirecto?.nombreDestinatario ?? '',
    },
    {
      id: 'logistica',
      header: 'Logística',
      accessor: (d) => {
        if (!d.nombreDistribuidor && !d.numeroGuiaAgenciaDistribucion) {
          return <span className="text-xs text-muted-foreground/60">—</span>
        }
        return (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground min-w-0">
            {d.nombreDistribuidor ? (
              <span className="truncate" title={d.nombreDistribuidor}>{d.nombreDistribuidor}</span>
            ) : null}
            {d.numeroGuiaAgenciaDistribucion ? (
              <span className="font-mono text-[11px]">Guía: {d.numeroGuiaAgenciaDistribucion}</span>
            ) : null}
          </div>
        )
      },
      sortValue: (d) => d.nombreDistribuidor ?? '',
    },
    {
      id: 'sacas',
      header: 'Sacas',
      align: 'right',
      width: '90px',
      accessor: (d) => (
        <span className="text-xs font-medium text-foreground tabular-nums">
          {d.sacas?.length ?? 0}
        </span>
      ),
      sortValue: (d) => d.sacas?.length ?? 0,
    },
    {
      id: 'paquetes',
      header: 'Paquetes',
      align: 'right',
      width: '110px',
      accessor: (d) => {
        const total = (d.sacas ?? []).reduce((sum, s) => sum + (s.idPaquetes?.length ?? 0), 0)
        return (
          <span className="text-xs font-medium text-foreground tabular-nums">{total}</span>
        )
      },
      sortValue: (d) => (d.sacas ?? []).reduce((sum, s) => sum + (s.idPaquetes?.length ?? 0), 0),
    },
    {
      id: 'presinto',
      header: 'Presinto',
      defaultHidden: true,
      accessor: (d) =>
        d.codigoPresinto ? (
          <span className="font-mono text-[11px] text-muted-foreground">{d.codigoPresinto}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
      sortValue: (d) => d.codigoPresinto ?? '',
    },
    {
      id: 'usuario',
      header: 'Usuario',
      defaultHidden: true,
      accessor: (d) => (
        <span className="text-xs text-muted-foreground">{d.usuarioRegistro || '—'}</span>
      ),
      sortValue: (d) => d.usuarioRegistro ?? '',
    },
  ], [])

  const isLoadingData = isLoading
  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
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
      filterBar={
        <FilterBar
          searchValue={busqueda}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar manifiesto o código..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={filtroTipoDestino}
            onChange={(v) => filtros.setFilter('filtroTipoDestino', v as DespachosFiltersState['filtroTipoDestino'])}
            options={[
              { value: 'all', label: 'Todos los destinos' },
              { value: 'agencia', label: 'Con agencia' },
              { value: 'directo', label: 'Directo' },
            ]}
            ariaLabel="Tipo de destino"
          />
          <DateRangeFilter
            desde={fechaDesde}
            hasta={fechaHasta}
            onChange={({ desde, hasta }) => filtros.setFilters({ fechaDesde: desde, fechaHasta: hasta })}
          />
        </FilterBar>
      }
      table={
        error && !isLoadingData ? (
          <ErrorState
            title="Error al cargar los despachos"
            description={
              getInteragencyRestrictionMessage(error)
                ?? getApiErrorMessage(error, 'No se pudieron cargar los despachos.')
            }
          />
        ) : (
          <DataTable<Despacho>
            data={despachosFiltrados}
            columns={columns}
            rowKey={(d) => d.idDespacho!}
            storageKey="despachos"
            isLoading={isLoadingData}
            selection={{
              selected: despachosSeleccionados,
              getId: (d) => d.idDespacho!,
              onToggle: handleToggleOne,
              onToggleAll: handleToggleAll,
            }}
            emptyState={
              <EmptyState
                title="No se encontraron despachos"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'No hay despachos registrados'
                }
                icon={<Truck className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.DESPACHOS.CREAR}>
                      <Button onClick={() => navigate({ to: '/despachos/new' })} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Despacho
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(d) => (
              <DespachoRowActions
                onVer={() => navigate({ to: `/despachos/${d.idDespacho}` })}
                onEditar={() => navigate({ to: `/despachos/${d.idDespacho}/edit` })}
                onMensaje={() => handleAbrirMensaje(d.idDespacho!)}
                onMarcarDespachado={() => setDespachoAMarcarDespachado(d.idDespacho!)}
                onImprimir={() => setDespachoAImprimir(d.idDespacho!)}
                onEliminar={() => setDespachoAEliminar(d.idDespacho!)}
              />
            )}
          />
        )
      }
      footer={
        <ListPagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={data?.totalElements}
          size={size}
          onPageChange={(p) => filtros.setFilter('page', p)}
          alwaysShow
          className="border-t-0 pt-0"
        />
      }
    >

      <Dialog open={!!despachoAEliminar} onOpenChange={(open) => !open && setDespachoAEliminar(null)}>
        <DialogContent className={dialogContentPresets.compact}>
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

      <Dialog open={!!despachoAMarcarDespachado} onOpenChange={(open) => !open && setDespachoAMarcarDespachado(null)}>
        <DialogContent className={dialogContentPresets.compact}>
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
        <DialogContent className={dialogContentPresets.compact}>
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
        isPrinting={imprimiendoDespacho}
        quickActionLoading={quickPrintEnCurso}
      />

      <Dialog open={!!despachoParaMensaje} onOpenChange={(open) => !open && setDespachoParaMensaje(null)}>
        <DialogContent className={cn(dialogContentPresets.form, 'max-w-2xl p-0 overflow-hidden')}>
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
                <Badge variant="secondary" className="text-xs font-normal uppercase tracking-wider bg-background/80 backdrop-blur-sm border shadow-sm">Editable</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Puedes editar el mensaje antes de copiarlo o enviarlo por WhatsApp.</p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copiarMensaje}
                className={cn(
                  'h-9 border-border/60 hover:border-info/30 hover:bg-info/10 transition-all',
                  copiado && 'bg-success/10 text-success border-success/20'
                )}
              >
                {copiado ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiado ? 'Copiado' : 'Copiar Texto'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={descargarPDFDespacho}
                disabled={descargandoPdf}
                className="h-9 border-border/60 hover:border-primary/30 hover:bg-primary/10 transition-all"
              >
                {descargandoPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </>
                )}
              </Button>

              {telefonoDestino && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copiarTelefono}
                  className={cn(
                    'h-9 border-border/60 hover:border-info/30 hover:bg-info/10 transition-all font-mono',
                    telefonoCopiado && 'bg-success/10 text-success border-success/20 font-medium'
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
                    const cleanTel = telefonoDestino.replace(/\D/g, '')
                    const finalTel = cleanTel.startsWith('593') ? cleanTel : `593${cleanTel.startsWith('0') ? cleanTel.substring(1) : cleanTel}`
                    window.open(`https://wa.me/${finalTel}?text=${encodeURIComponent(mensajeGenerado)}`, '_blank')
                  }}
                  className="h-9 bg-success text-success-foreground hover:bg-success/90 ml-auto"
                >
                  <Truck className="h-4 w-4 mr-2" /> Enviar WhatsApp
                </Button>
              )}
            </div>
          </div>

          <div className="bg-muted/30 px-6 py-4 flex justify-between items-center border-t">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">MV Services Logistics System</p>
            <Button variant="ghost" size="sm" onClick={() => setDespachoParaMensaje(null)} className="h-8 text-xs">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogoMultiples} onOpenChange={setMostrarDialogoMultiples}>
        <DialogContent className={cn(dialogContentPresets.form, 'max-w-2xl')}>
          <DialogHeader>
            <DialogTitle>Imprimir Selección</DialogTitle>
            <DialogDescription>
              {despachosSeleccionados.size} despachos seleccionados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Acciones rápidas</p>
              <Badge variant="secondary" className="text-xs">
                1 clic
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-3 min-w-0 whitespace-normal flex flex-col items-start gap-1 text-left"
                onClick={handleImprimirTodosDocumentos}
                disabled={imprimiendoMultiples != null}
              >
                <span className="w-full flex items-center gap-2 text-sm font-medium">
                  {imprimiendoMultiples === 'documento' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
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
                disabled={imprimiendoMultiples != null}
              >
                <span className="w-full flex items-center gap-2 text-sm font-medium">
                  {imprimiendoMultiples === 'normal' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Tags className="h-4 w-4" />
                  )}
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
                disabled={imprimiendoMultiples != null}
              >
                <span className="w-full flex items-center gap-2 text-sm font-medium">
                  {imprimiendoMultiples === 'zebra' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Tag className="h-4 w-4" />
                  )}
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
    </ListPageLayout>
  )
}
