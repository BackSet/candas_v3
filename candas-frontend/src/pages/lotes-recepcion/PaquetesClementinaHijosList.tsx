import React, { useState, useMemo, useCallback } from 'react'
import type { Paquete } from '@/types/paquete'
import { TipoDestino } from '@/types/paquete'
import type { GrupoPersonalizadoLocal } from '@/hooks/useGruposPersonalizadosLocal'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Copy, Check, Download, MapPin, Package, Edit, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useGruposPersonalizadosLocal } from '@/hooks/useGruposPersonalizadosLocal'
import { PaqueteTableRow } from '@/components/lotes-recepcion/PaqueteTableRow'
import { clasificarEtiquetaDestino } from '@/utils/clasificarEtiquetaDestino'
import { derivarCiudadCantonDeDireccion } from '@/utils/derivarCiudadCanton'

/** Calcula el máximo de grupos que se pueden formar con la secuencia para N paquetes. */
function maxGruposFromSecuencia(secuencia: string, totalPaquetes: number): number {
  const numeros = secuencia
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n > 0)
  if (numeros.length === 0) return 0
  const suma = numeros.reduce((a, b) => a + b, 0)
  return suma > 0 ? Math.floor(totalPaquetes / suma) : 0
}
import CambiarTipoDestinoDialog from '@/components/lotes-recepcion/CambiarTipoDestinoDialog'
import CambiarTipoDestinoMasivoDialog from '@/components/lotes-recepcion/CambiarTipoDestinoMasivoDialog'
import AgregarAtencionDialog from '@/components/lotes-recepcion/AgregarAtencionDialog'
import ExportarClementinaHijosDialog from '@/components/lotes-recepcion/ExportarClementinaHijosDialog'
import { Badge } from '@/components/ui/badge'
import { useAgencias } from '@/hooks/useAgencias'

interface PaquetesClementinaHijosListProps {
  paquetes: Paquete[]
  loteRecepcionId?: number
  numeroRecepcion?: string
}

interface PaquetesPorGrupoPersonalizado {
  [grupoPersonalizado: string]: Paquete[]
}

interface PaquetesPorTipoDestino {
  [tipoDestino: string]: PaquetesPorGrupoPersonalizado
}

interface PaquetesPorSubRef {
  [subRefKey: string]: PaquetesPorTipoDestino
}

interface PaquetesPorBucket {
  [bucketKey: string]: PaquetesPorSubRef
}

interface PaquetesPorCanton {
  [canton: string]: PaquetesPorBucket
}

interface PaquetesPorCiudad {
  [ciudad: string]: PaquetesPorCanton
}

const SUBREF_UNICO = '__SIN_SUBREF__'

export default function PaquetesClementinaHijosList({
  paquetes,
  loteRecepcionId,
  numeroRecepcion,
}: PaquetesClementinaHijosListProps) {
  const queryClient = useQueryClient()

  // Estado para listas de paquetes por tipo
  const [secuenciasPorTipo, setSecuenciasPorTipo] = useState<Map<string, string>>(new Map())
  const [listasGeneradasPorTipo, setListasGeneradasPorTipo] = useState<Map<string, string[][]>>(new Map())
  const [copiadoPorGrupo, setCopiadoPorGrupo] = useState<Map<string, boolean>>(new Map())

  // Estado para selección de paquetes
  const [paquetesSeleccionados, setPaquetesSeleccionados] = useState<Set<number>>(new Set())

  const [showCambiarTipoDestinoMasivoDialog, setShowCambiarTipoDestinoMasivoDialog] = useState(false)

  // Estado para agregar a atención
  const [showAgregarAtencionDialog, setShowAgregarAtencionDialog] = useState(false)
  const [paqueteParaAtencion, setPaqueteParaAtencion] = useState<Paquete | null>(null)

  // Estado para cambiar tipo de destino
  const [showCambiarTipoDestinoDialog, setShowCambiarTipoDestinoDialog] = useState(false)
  const [paqueteParaCambiarTipoDestino, setPaqueteParaCambiarTipoDestino] = useState<Paquete | null>(null)

  // Estado para exportar
  const [showExportarDialog, setShowExportarDialog] = useState(false)

  // Obtener agencias para el diálogo de exportación
  const { data: agenciasData } = useAgencias(0, 1000)

  // Cargar grupos personalizados desde localStorage
  const { grupos: gruposPersonalizados, refrescarGrupos } = useGruposPersonalizadosLocal(loteRecepcionId)

  // Estado para forzar re-render cuando se crean grupos
  const [gruposVersion, setGruposVersion] = useState(0)

  // Crear mapa de paquetes a grupos personalizados
  const paqueteAGrupoPersonalizado = useMemo(() => {
    const mapa = new Map<number, GrupoPersonalizadoLocal>()
    if (gruposPersonalizados) {
      gruposPersonalizados.forEach(grupo => {
        grupo.idPaquetes.forEach(idPaquete => {
          mapa.set(idPaquete, grupo)
        })
      })
    }
    return mapa
  }, [gruposPersonalizados, gruposVersion])

  // Agrupar por dirección y datos del paquete HIJO (no del padre): ciudad/cantón desde direccionDestinatarioCompleta del hijo, resto de campos también del hijo
  const paquetesAgrupados = useMemo(() => {
    const estructura: PaquetesPorCiudad = {}

    paquetes.forEach((paquete) => {
      // paquete = paquete hijo; toda la agrupación usa solo campos del hijo
      const { ciudad, canton } = derivarCiudadCantonDeDireccion(paquete)
      const tipoDestino = paquete.tipoDestino || 'Sin destino'
      const ref = paquete.ref && paquete.ref.trim() !== '' ? paquete.ref.trim() : 'Sin REF'

      let bucketKey: string
      let subRefKey: string
      if (tipoDestino === TipoDestino.AGENCIA && paquete.idAgenciaDestino) {
        const nombre = paquete.nombreAgenciaDestino?.trim() || `Agencia #${paquete.idAgenciaDestino}`
        bucketKey = `AGENCIA|${paquete.idAgenciaDestino}|${nombre}`
        subRefKey = `REF|${ref}`
      } else if (tipoDestino === TipoDestino.DOMICILIO && paquete.idDestinatarioDirecto) {
        bucketKey = `DESTINATARIO|${paquete.idDestinatarioDirecto}`
        subRefKey = `REF|${ref}`
      } else {
        bucketKey = `REF|${ref}`
        subRefKey = SUBREF_UNICO
      }

      let grupoPersonalizadoKey = 'Sin grupo'
      if (paquete.idPaquete) {
        const grupo = paqueteAGrupoPersonalizado.get(paquete.idPaquete)
        if (grupo) {
          grupoPersonalizadoKey = grupo.nombre
        }
      }

      if (!estructura[ciudad]) estructura[ciudad] = {}
      if (!estructura[ciudad][canton]) estructura[ciudad][canton] = {}
      if (!estructura[ciudad][canton][bucketKey]) estructura[ciudad][canton][bucketKey] = {}
      if (!estructura[ciudad][canton][bucketKey][subRefKey]) estructura[ciudad][canton][bucketKey][subRefKey] = {}
      if (!estructura[ciudad][canton][bucketKey][subRefKey][tipoDestino]) estructura[ciudad][canton][bucketKey][subRefKey][tipoDestino] = {}
      if (!estructura[ciudad][canton][bucketKey][subRefKey][tipoDestino][grupoPersonalizadoKey]) {
        estructura[ciudad][canton][bucketKey][subRefKey][tipoDestino][grupoPersonalizadoKey] = []
      }
      estructura[ciudad][canton][bucketKey][subRefKey][tipoDestino][grupoPersonalizadoKey].push(paquete)
    })

    return estructura
  }, [paquetes, paqueteAGrupoPersonalizado])

  // Función helper para ordenar claves alfabéticamente
  const ordenarClaves = (claves: string[]): string[] => {
    return [...claves].sort((a, b) => a.localeCompare(b))
  }

  // Función helper para formatear dirección del destinatario
  const formatearDireccion = useCallback((paquete: Paquete): string => {
    if (paquete.direccionDestinatarioCompleta) {
      return paquete.direccionDestinatarioCompleta
    }
    const partes = [
      paquete.direccionDestinatario,
      paquete.cantonDestinatario,
      paquete.ciudadDestinatario,
      paquete.paisDestinatario
    ].filter(Boolean)
    return partes.length > 0 ? partes.join(', ') : '-'
  }, [])

  // Función para resaltar patrones (simplificada, sin detección de patrones)
  const resaltarPatron = useCallback((texto: string, tipo: 'direccion' | 'observacion'): React.ReactNode => {
    return texto || '-'
  }, [])

  // Función para generar listas de paquetes según secuencia
  const generarListas = useCallback((paquetes: Paquete[], secuencia: string): string[][] | null => {
    const numeros = secuencia
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n) && n > 0)

    if (numeros.length === 0) {
      return null
    }

    const totalRequerido = numeros.reduce((sum, n) => sum + n, 0)
    if (totalRequerido > paquetes.length) {
      return null
    }

    const grupos: string[][] = []
    let indiceActual = 0

    for (const cantidad of numeros) {
      const grupo: string[] = []
      for (let i = 0; i < cantidad && indiceActual < paquetes.length; i++) {
        const numeroGuia = paquetes[indiceActual].numeroGuia
        if (numeroGuia) {
          grupo.push(numeroGuia)
        }
        indiceActual++
      }
      if (grupo.length > 0) {
        grupos.push(grupo)
      }
    }

    return grupos.length > 0 ? grupos : null
  }, [])

  // Función para manejar cambio de secuencia
  const handleSecuenciaChange = (tipoKey: string, secuencia: string) => {
    setSecuenciasPorTipo(prev => {
      const nuevo = new Map(prev)
      nuevo.set(tipoKey, secuencia)
      return nuevo
    })

    if (!secuencia.trim()) {
      setListasGeneradasPorTipo(prev => {
        const nuevo = new Map(prev)
        nuevo.delete(tipoKey)
        return nuevo
      })
    }
  }

  // Función para generar listas cuando se presiona Enter o se hace blur
  const handleGenerarListas = (tipoKey: string, paquetes: Paquete[], secuencia: string) => {
    if (!secuencia.trim()) {
      setListasGeneradasPorTipo(prev => {
        const nuevo = new Map(prev)
        nuevo.delete(tipoKey)
        return nuevo
      })
      return
    }

    const listas = generarListas(paquetes, secuencia)
    if (listas === null) {
      toast.error('La suma de los números excede el total de paquetes disponibles')
      return
    }

    setListasGeneradasPorTipo(prev => {
      const nuevo = new Map(prev)
      nuevo.set(tipoKey, listas)
      return nuevo
    })
  }

  // Función para copiar lista al portapapeles
  const copiarLista = async (lista: string[], grupoIndex: number, tipoKey: string) => {
    const texto = lista.join('\n')
    const grupoKey = `${tipoKey}-${grupoIndex}`

    try {
      await navigator.clipboard.writeText(texto)
      setCopiadoPorGrupo(prev => {
        const nuevo = new Map(prev)
        nuevo.set(grupoKey, true)
        return nuevo
      })
      toast.success(`Lista de ${lista.length} paquete(s) copiada al portapapeles`)

      setTimeout(() => {
        setCopiadoPorGrupo(prev => {
          const nuevo = new Map(prev)
          nuevo.delete(grupoKey)
          return nuevo
        })
      }, 2000)
    } catch (error) {
      toast.error('Error al copiar la lista')
    }
  }

  // Funciones de selección de paquetes
  const handleTogglePaquete = useCallback((id: number) => {
    setPaquetesSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) {
        nuevo.delete(id)
      } else {
        nuevo.add(id)
      }
      return nuevo
    })
  }, [])

  const handleSeleccionarTodos = useCallback((paquetes: Paquete[]) => {
    const ids = paquetes
      .map(p => p.idPaquete)
      .filter((id): id is number => id !== undefined)
    setPaquetesSeleccionados(prev => {
      const nuevo = new Set(prev)
      ids.forEach(id => nuevo.add(id))
      return nuevo
    })
  }, [])

  const handleDeseleccionarTodos = useCallback(() => {
    setPaquetesSeleccionados(new Set())
  }, [])

  const handleAgregarAtencion = useCallback((paquete: Paquete) => {
    // Siempre usar el paquete hijo para agregar a atención (no el padre)
    setPaqueteParaAtencion(paquete)
    setShowAgregarAtencionDialog(true)
  }, [])

  const handleCambiarTipoDestino = useCallback((paquete: Paquete) => {
    setPaqueteParaCambiarTipoDestino(paquete)
    setShowCambiarTipoDestinoDialog(true)
  }, [])

  const handleCambiarTipoDestinoSuccess = useCallback(() => {
    // Invalidar queries para actualizar la UI después de cambiar el tipo destino
    queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', loteRecepcionId], exact: false })
    queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'], exact: false })
  }, [queryClient, loteRecepcionId])

  // Verificar si todos los paquetes visibles están seleccionados
  const todosSeleccionados = useMemo(() => {
    const idsVisibles = paquetes
      .map(p => p.idPaquete)
      .filter((id): id is number => id !== undefined)
    return idsVisibles.length > 0 && idsVisibles.every(id => paquetesSeleccionados.has(id))
  }, [paquetes, paquetesSeleccionados])

  // Obtener paquetes seleccionados como array
  const paquetesSeleccionadosArray = useMemo(() => {
    return paquetes.filter(p => p.idPaquete && paquetesSeleccionados.has(p.idPaquete))
  }, [paquetes, paquetesSeleccionados])

  // Función para obtener fecha y hora actual
  const obtenerFechaHoraActual = () => {
    const ahora = new Date()
    const año = ahora.getFullYear()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const dia = String(ahora.getDate()).padStart(2, '0')
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    return {
      fecha: `${año}-${mes}-${dia}`,
      hora: `${horas}:${minutos}`
    }
  }

  // Handler para exportar CLEMENTINA hijos (abre el diálogo)
  const handleExportarClementinaHijos = () => {
    if (!paquetes || paquetes.length === 0) {
      toast.error('No hay paquetes para exportar')
      return
    }
    setShowExportarDialog(true)
  }

  const contarPaquetesGrupoPersonalizado = (grupo: PaquetesPorGrupoPersonalizado): number => {
    return Object.values(grupo).reduce((total, paquetes) => total + paquetes.length, 0)
  }

  const contarPaquetesPorTipoDestino = (tiposDestino: PaquetesPorTipoDestino): number => {
    return Object.values(tiposDestino).reduce((total, grupos) =>
      total + contarPaquetesGrupoPersonalizado(grupos), 0)
  }

  const contarPaquetesPorSubRefs = (subRefs: PaquetesPorSubRef): number => {
    return Object.values(subRefs).reduce((total, tiposDestino) =>
      total + contarPaquetesPorTipoDestino(tiposDestino), 0)
  }

  const contarPaquetesPorBucket = (buckets: PaquetesPorBucket): number => {
    return Object.values(buckets).reduce((total, subRefs) => total + contarPaquetesPorSubRefs(subRefs), 0)
  }

  const contarPaquetesCantones = (cantones: PaquetesPorCanton): number => {
    return Object.values(cantones).reduce((total, buckets) => total + contarPaquetesPorBucket(buckets), 0)
  }

  if (paquetes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay paquetes hijos de CLEMENTINA en este lote de recepción
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      {/* Botón de exportación */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportarClementinaHijos}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar CLEMENTINA Hijos
        </Button>
      </div>

      {/* Floating Toolbar for selection */}
      {paquetesSeleccionados.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-background/90 backdrop-blur-md border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 mr-2">
            <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {paquetesSeleccionados.size}
            </div>
            <span className="text-sm font-medium">seleccionados</span>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const first = paquetesSeleccionadosArray[0]
              if (first) {
                setPaqueteParaAtencion(first)
                setShowAgregarAtencionDialog(true)
              }
            }}
            disabled={paquetesSeleccionadosArray.length === 0}
            className="h-8 text-xs shadow-sm hover:bg-muted"
          >
            Agregar a atención
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCambiarTipoDestinoMasivoDialog(true)}
            className="h-8 text-xs shadow-sm hover:bg-muted"
          >
            Cambiar Tipo Destino
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDeseleccionarTodos}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-full"
            title="Deseleccionar todos"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Accordion principal por CIUDAD (misma estructura que paquetes normales: Bucket → SubRef → TipoDestino → GrupoPersonalizado) */}
      <div className="space-y-4">
        {ordenarClaves(Object.keys(paquetesAgrupados)).map((ciudad) => {
          const cantones = paquetesAgrupados[ciudad]
          const totalPaquetesCiudad = contarPaquetesCantones(cantones)

          return (
            <div key={ciudad} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">{ciudad}</h3>
                  <Badge variant="secondary" className="ml-2 text-[10px] h-5">{totalPaquetesCiudad}</Badge>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {ordenarClaves(Object.keys(cantones)).map((canton) => {
                  const buckets = cantones[canton]
                  const totalPaquetesCanton = contarPaquetesPorBucket(buckets)

                  return (
                    <div key={canton} className="border border-border/40 rounded-md bg-background/50 overflow-hidden">
                      <div className="bg-muted/20 px-4 py-3 border-b border-border/30 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="text-sm font-medium">{canton}</span>
                        <span className="text-xs text-muted-foreground ml-1">({totalPaquetesCanton})</span>
                      </div>

                      <div className="p-4 space-y-6">
                        {ordenarClaves(Object.keys(buckets)).map((bucketKey) => {
                          const subRefs = buckets[bucketKey]
                          const totalPaquetesBucket = contarPaquetesPorSubRefs(subRefs)
                          const esAgencia = bucketKey.startsWith('AGENCIA|')
                          const esDestinatario = bucketKey.startsWith('DESTINATARIO|')
                          const partes = bucketKey.split('|')
                          const idAgencia = esAgencia ? partes[1] : null
                          const nombreAgencia = esAgencia ? partes.slice(2).join('|') : null
                          const idDestinatario = esDestinatario ? partes[1] : null
                          const refLabel = !esAgencia && !esDestinatario ? bucketKey.replace(/^REF\|/, '') : null

                          return (
                            <div key={bucketKey} className="border border-border/35 rounded-md bg-background/45 overflow-hidden">
                              <div className="bg-muted/18 px-4 py-2.5 border-b border-border/25 flex items-center gap-2">
                                {esAgencia ? (
                                  <>
                                    <Badge variant="outline" className="text-[10px] h-5 px-2">Agencia</Badge>
                                    <span className="text-xs font-medium">{nombreAgencia}</span>
                                    {idAgencia && (
                                      <Badge variant="secondary" className="text-[10px] h-5 px-2 font-mono">#{idAgencia}</Badge>
                                    )}
                                  </>
                                ) : esDestinatario ? (
                                  <>
                                    <Badge variant="outline" className="text-[10px] h-5 px-2">Destinatario</Badge>
                                    {idDestinatario && (
                                      <Badge variant="secondary" className="text-[10px] h-5 px-2 font-mono">#{idDestinatario}</Badge>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] h-5 px-2 font-mono">{refLabel}</Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-1">({totalPaquetesBucket})</span>
                              </div>

                              <div className="p-4 space-y-6">
                                {ordenarClaves(Object.keys(subRefs)).map((subRefKey) => {
                                  const tiposDestino = subRefs[subRefKey]
                                  const refTxt = subRefKey.replace(/^REF\|/, '')
                                  const mostrarRef = subRefKey !== SUBREF_UNICO && refTxt

                                  return (
                                    <div key={subRefKey} className="border border-border/25 rounded-md bg-background/30 overflow-hidden">
                                      {mostrarRef && (
                                        <div className="bg-muted/15 px-3 py-2 border-b border-border/20 flex items-center gap-2">
                                          <Badge variant="outline" className="text-[10px] h-5 px-2 font-mono">{refTxt}</Badge>
                                        </div>
                                      )}
                                      <div className="p-3 space-y-4">
                                        {ordenarClaves(Object.keys(tiposDestino)).map((tipoDestino) => {
                                          const gruposPersonalizados = tiposDestino[tipoDestino]
                                          const totalPaquetesTipoDestino = Object.values(gruposPersonalizados).reduce((s, arr) => s + arr.length, 0)

                                          return (
                                            <div key={tipoDestino} className="border border-border/30 rounded-md bg-background/40 overflow-hidden">
                                              <div className="bg-muted/15 px-4 py-2.5 border-b border-border/20 flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] h-5 px-2">{tipoDestino}</Badge>
                                                <span className="text-xs text-muted-foreground">({totalPaquetesTipoDestino})</span>
                                              </div>

                                              <div className="p-3 space-y-4">
                                                {ordenarClaves(Object.keys(gruposPersonalizados)).sort((a, b) => {
                                                  if (a === 'Sin grupo') return 1
                                                  if (b === 'Sin grupo') return -1
                                                  const numA = parseInt(a.replace('Grupo ', '')) || 0
                                                  const numB = parseInt(b.replace('Grupo ', '')) || 0
                                                  return numA - numB
                                                }).map((grupoKey) => {
                                                  const paquetesGrupo = gruposPersonalizados[grupoKey]
                                                  const uniqueKey = `${ciudad}-${canton}-${bucketKey}-${subRefKey}-${tipoDestino}-${grupoKey}`
                                                  const secuencia = secuenciasPorTipo.get(uniqueKey) || ''
                                                  const listasGeneradas = listasGeneradasPorTipo.get(uniqueKey) || []

                                                  return (
                                                    <div key={grupoKey} className="space-y-3">
                                                      <div className="flex items-center gap-2 mb-2">
                                                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <h4 className="text-sm font-medium text-foreground">
                                                          {grupoKey}
                                                          <span className="ml-2 text-xs text-muted-foreground font-normal">{paquetesGrupo.length} paquete(s)</span>
                                                        </h4>
                                                      </div>

                                                      <div className="bg-muted/20 p-3 rounded-md border border-border/30 flex flex-col gap-3">
                                                        <div className="flex items-center gap-3">
                                                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Generar listas:</span>
                                                          <Input
                                                            className="h-8 w-48 font-mono text-xs bg-background"
                                                            placeholder="Ej: 3,3,6"
                                                            value={secuencia}
                                                            onChange={(e) => handleSecuenciaChange(uniqueKey, e.target.value)}
                                                            onKeyDown={(e) => {
                                                              if (e.key === 'Enter') handleGenerarListas(uniqueKey, paquetesGrupo, secuencia)
                                                            }}
                                                            onBlur={() => handleGenerarListas(uniqueKey, paquetesGrupo, secuencia)}
                                                          />
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleGenerarListas(uniqueKey, paquetesGrupo, secuencia)}
                                                            disabled={!secuencia}
                                                          >
                                                            <Copy className="h-3.5 w-3.5" />
                                                          </Button>
                                                          {secuencia.trim() && (
                                                            <span className="text-xs text-muted-foreground">
                                                              Máx. {maxGruposFromSecuencia(secuencia, paquetesGrupo.length)} grupos
                                                            </span>
                                                          )}
                                                        </div>
                                                        {listasGeneradas.length > 0 && (
                                                          <div className="space-y-2 border-t border-border/30 pt-3">
                                                            <div className="text-xs font-medium text-muted-foreground">
                                                              {listasGeneradas.length} lista{listasGeneradas.length !== 1 ? 's' : ''} generada{listasGeneradas.length !== 1 ? 's' : ''}
                                                            </div>
                                                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                              {listasGeneradas.map((lista, grupoIndex) => {
                                                                const listaKey = `${uniqueKey}-${grupoIndex}`
                                                                const estaCopiado = copiadoPorGrupo.get(listaKey) || false
                                                                return (
                                                                  <div key={grupoIndex} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors group">
                                                                    <span className="text-xs text-muted-foreground min-w-[70px] font-medium">Lista {grupoIndex + 1} ({lista.length})</span>
                                                                    <span className="font-mono text-xs flex-1 truncate text-foreground">{lista.join(', ')}</span>
                                                                    <Button
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      onClick={() => copiarLista(lista, grupoIndex, uniqueKey)}
                                                                      className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                                                                    >
                                                                      {estaCopiado ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                                                                    </Button>
                                                                  </div>
                                                                )
                                                              })}
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>

                                                      <div className="rounded-md border border-border/50 overflow-hidden">
                                                        <Table>
                                                          <TableHeader>
                                                            <TableRow className="bg-muted/30">
                                                              <TableHead className="w-[40px] px-2 py-2">
                                                                <Checkbox
                                                                  checked={paquetesGrupo.every(p => p.idPaquete && paquetesSeleccionados.has(p.idPaquete))}
                                                                  onCheckedChange={(checked) => {
                                                                    if (checked) handleSeleccionarTodos(paquetesGrupo)
                                                                    else paquetesGrupo.forEach(p => p.idPaquete && handleTogglePaquete(p.idPaquete))
                                                                  }}
                                                                />
                                                              </TableHead>
                                                              <TableHead className="py-2 text-xs">Guía</TableHead>
                                                              <TableHead className="py-2 text-xs">Guía Padre</TableHead>
                                                              <TableHead className="py-2 text-xs">Estado</TableHead>
                                                              <TableHead className="py-2 text-xs w-1/3">Dirección</TableHead>
                                                              <TableHead className="py-2 text-xs w-1/3">Observaciones</TableHead>
                                                            </TableRow>
                                                          </TableHeader>
                                                          <TableBody>
                                                            {paquetesGrupo.map((paquete) => {
                                                              const etiquetaDestino = clasificarEtiquetaDestino({
                                                                direccionCompleta: formatearDireccion(paquete),
                                                                observaciones: paquete.observaciones,
                                                                tipoDestino: paquete.tipoDestino,
                                                              })
                                                              return (
                                                                <PaqueteTableRow
                                                                  key={paquete.idPaquete}
                                                                  paquete={paquete}
                                                                  resaltarPatron={resaltarPatron}
                                                                  formatearDireccion={formatearDireccion}
                                                                  isSelected={paquetesSeleccionados.has(paquete.idPaquete!)}
                                                                  onToggleSelect={() => handleTogglePaquete(paquete.idPaquete!)}
                                                                  mostrarNumeroGuiaPadre={true}
                                                                  mostrarTipoPaquete={false}
                                                                  etiquetaDestino={etiquetaDestino}
                                                                />
                                                              )
                                                            })}
                                                          </TableBody>
                                                        </Table>
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Diálogos */}
      {showCambiarTipoDestinoMasivoDialog && (
        <CambiarTipoDestinoMasivoDialog
          open={showCambiarTipoDestinoMasivoDialog}
          onOpenChange={(open) => {
            setShowCambiarTipoDestinoMasivoDialog(open)
            if (!open) {
              setPaquetesSeleccionados(new Set())
            }
          }}
          paquetes={paquetesSeleccionadosArray}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'] })
            setPaquetesSeleccionados(new Set())
          }}
        />
      )}

      {showCambiarTipoDestinoDialog && paqueteParaCambiarTipoDestino && (
        <CambiarTipoDestinoDialog
          open={showCambiarTipoDestinoDialog}
          onOpenChange={(open) => {
            setShowCambiarTipoDestinoDialog(open)
            if (!open) {
              setPaqueteParaCambiarTipoDestino(null)
            }
          }}
          paquete={paqueteParaCambiarTipoDestino}
          onSuccess={() => {
            // Invalidar todas las queries de lote-recepcion-paquetes (con cualquier ID)
            queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'], exact: false })
            if (loteRecepcionId) {
              queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', loteRecepcionId] })
            }
            setPaqueteParaCambiarTipoDestino(null)
          }}
        />
      )}

      {showAgregarAtencionDialog && paqueteParaAtencion && (
        <AgregarAtencionDialog
          open={showAgregarAtencionDialog}
          onOpenChange={(open) => {
            setShowAgregarAtencionDialog(open)
            if (!open) {
              setPaqueteParaAtencion(null)
            }
          }}
          paquete={paqueteParaAtencion}
          onSuccess={() => {
            setPaqueteParaAtencion(null)
          }}
        />
      )}

      {showExportarDialog && (
        <ExportarClementinaHijosDialog
          paquetes={paquetes}
          numeroRecepcion={numeroRecepcion}
          open={showExportarDialog}
          onOpenChange={setShowExportarDialog}
          agencias={agenciasData?.content || []}
          paquetesAgrupados={paquetesAgrupados}
          paqueteAGrupoPersonalizado={paqueteAGrupoPersonalizado}
        />
      )}
    </div>
  )
}