import React, { useState, useMemo, useEffect, useCallback } from 'react'

import type { Paquete } from '@/types/paquete'
import { TipoPaquete, TipoDestino } from '@/types/paquete'
import type { GrupoPersonalizadoLocal } from '@/hooks/useGruposPersonalizadosLocal'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, Copy, MapPin, Edit, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import AsignarHijosClementinaDialog from './AsignarHijosClementinaDialog'
import { useGruposPersonalizadosLocal } from '@/hooks/useGruposPersonalizadosLocal'


import { guiaEfectiva } from '@/utils/paqueteGuia'
import CrearGrupoDialog from '@/components/lotes-recepcion/CrearGrupoDialog'
import CambiarTipoDialog from '@/components/lotes-recepcion/CambiarTipoDialog'
import CambiarTipoDestinoDialog from '@/components/lotes-recepcion/CambiarTipoDestinoDialog'
import CambiarTipoDestinoMasivoDialog from '@/components/lotes-recepcion/CambiarTipoDestinoMasivoDialog'
import CambiarTipoMasivoDialog from '@/components/lotes-recepcion/CambiarTipoMasivoDialog'
import AgregarAtencionDialog from '@/components/lotes-recepcion/AgregarAtencionDialog'
import { PaqueteTableRow } from '@/components/lotes-recepcion/PaqueteTableRow'
import { clasificarEtiquetaDestino } from '@/utils/clasificarEtiquetaDestino'
import { derivarCiudadCantonDeDireccion } from '@/utils/derivarCiudadCanton'
import { cn } from '@/lib/utils'

/** Calcula el máximo de grupos que se pueden formar con la secuencia para N ítems (guías). */
function maxGruposFromSecuencia(secuencia: string, totalItems: number): number {
  const numeros = secuencia
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n > 0)
  if (numeros.length === 0) return 0
  const suma = numeros.reduce((a, b) => a + b, 0)
  return suma > 0 ? Math.floor(totalItems / suma) : 0
}

/** Expande paquetes a lista de guías: CLEMENTINA → guías efectivas de hijos; resto → guía efectiva. */
function expandirPaquetesAGuias(
  paquetes: Paquete[],
  mapaClementinaHijos: Map<number, Paquete[]>
): string[] {
  const guias: string[] = []
  for (const p of paquetes) {
    if (p.tipoPaquete === TipoPaquete.CLEMENTINA && p.idPaquete) {
      const hijos = mapaClementinaHijos.get(p.idPaquete)
      if (hijos?.length) {
        hijos.forEach(h => { const g = guiaEfectiva(h); if (g) guias.push(g) })
        continue
      }
    }
    const g = guiaEfectiva(p)
    if (g) guias.push(g)
  }
  return guias
}

/** Parsea secuencia "3,3,6" y devuelve { numeros, suma } o null si inválida. */
function parsearSecuencia(secuencia: string): { numeros: number[]; suma: number } | null {
  const numeros = secuencia
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n > 0)
  if (numeros.length === 0) return null
  return { numeros, suma: numeros.reduce((a, b) => a + b, 0) }
}

/** Genera listas de guías según secuencia (ej. "3,3,6" sobre array de guías). */
function generarListasFromGuias(guias: string[], secuencia: string): string[][] | null {
  const parsed = parsearSecuencia(secuencia)
  if (!parsed) return null
  const totalRequerido = parsed.suma
  if (totalRequerido > guias.length) return null
  const grupos: string[][] = []
  let indiceActual = 0
  for (const cantidad of parsed.numeros) {
    const grupo: string[] = []
    for (let i = 0; i < cantidad && indiceActual < guias.length; i++) {
      grupo.push(guias[indiceActual])
      indiceActual++
    }
    if (grupo.length > 0) grupos.push(grupo)
  }
  return grupos.length > 0 ? grupos : null
}

const TIPOS_CLASIFICACION_ORDEN: Array<'CLEMENTINA' | 'SEPARAR' | 'CADENITA' | 'NORMAL'> = ['CLEMENTINA', 'SEPARAR', 'CADENITA', 'NORMAL']

function getTipoClasificacion(paquete: Paquete): 'CLEMENTINA' | 'SEPARAR' | 'CADENITA' | 'NORMAL' {
  // Paquetes hijo (CLEMENTINA hijos) se muestran en la misma agrupación que normales, bajo CLEMENTINA
  if (paquete.idPaquetePadre != null) return 'CLEMENTINA'
  if (paquete.tipoPaquete === TipoPaquete.CLEMENTINA) return 'CLEMENTINA'
  if (paquete.tipoPaquete === TipoPaquete.SEPARAR) return 'SEPARAR'
  if (paquete.tipoPaquete === TipoPaquete.CADENITA) return 'CADENITA'
  return 'NORMAL'
}

/** Clave de agrupación para TipoDestino: solo AGENCIA, DOMICILIO o Sin destino (evita textos largos que crean grupos extra). */
function normalizarTipoDestinoKey(tipoDestino: TipoDestino | string | undefined): string {
  if (!tipoDestino || typeof tipoDestino !== 'string') return 'Sin destino'
  const v = String(tipoDestino).trim().toUpperCase()
  if (v === TipoDestino.AGENCIA) return TipoDestino.AGENCIA
  if (v === TipoDestino.DOMICILIO) return TipoDestino.DOMICILIO
  if (v.startsWith('AGENCIA') || v.includes('AGENCIA')) return TipoDestino.AGENCIA
  if (v.startsWith('DOMICILIO') || v.includes('DOMICILIO')) return TipoDestino.DOMICILIO
  return 'Sin destino'
}

/** Nivel Ciudad → Cantón → (Sin clasificar | Agencia | Domicilio). */
function clasificacionDestinoLabel(tipoDestinoKey: string): string {
  if (tipoDestinoKey === TipoDestino.AGENCIA) return CLASIF_AGENCIA
  if (tipoDestinoKey === TipoDestino.DOMICILIO) return CLASIF_DOMICILIO
  return CLASIF_SIN_CLASIFICAR
}

/** Para CLEMENTINA: devuelve filas a mostrar (hijos con guía origen + datos del hijo; si no hay hijos, el padre). */
function getFilasClementina(
  padres: Paquete[],
  mapaClementinaHijos: Map<number, Paquete[]>
): Paquete[] {
  const filas: Paquete[] = []
  for (const padre of padres) {
    const hijos = padre.idPaquete ? mapaClementinaHijos.get(padre.idPaquete) : undefined
    if (hijos?.length) {
      hijos.forEach(h => {
        if (h.numeroGuiaPaquetePadre == null && padre.numeroGuia) {
          filas.push({ ...h, numeroGuiaPaquetePadre: padre.numeroGuia })
        } else {
          filas.push(h)
        }
      })
    } else {
      filas.push(padre)
    }
  }
  return filas
}

interface PaquetesAgrupadosListProps {
  paquetes: Paquete[]
  /** Listado completo del lote (incl. hijos CLEMENTINA) para copiar guía hoja */
  paquetesTodos?: Paquete[]
  loteRecepcionId?: number
  numeroRecepcion?: string
}

interface PaquetesPorTipoClasificacion {
  [tipoClasificacion: string]: Paquete[]
}

/** REF (Referencia si tiene) → tipo (CLEMENTINA/SEPARAR/CADENITA/NORMAL) */
interface PaquetesPorRef {
  [refKey: string]: PaquetesPorTipoClasificacion
}

/** Sin clasificar | Agencia | Domicilio → REF → tipo */
interface PaquetesPorClasificacionDestino {
  [clasificacion: string]: PaquetesPorRef
}

interface PaquetesPorCanton {
  [canton: string]: PaquetesPorClasificacionDestino
}

interface PaquetesPorCiudad {
  [ciudad: string]: PaquetesPorCanton
}

/** Estructura simple: Ciudad → Cantón → REF (si tiene) → paquetes */
interface PaquetesPorRefSimple {
  [refKey: string]: Paquete[]
}
interface PaquetesPorCantonSimple {
  [canton: string]: PaquetesPorRefSimple
}
interface PaquetesPorCiudadSimple {
  [ciudad: string]: PaquetesPorCantonSimple
}

const REF_SIN_REF = 'Sin REF'
const CLASIF_SIN_CLASIFICAR = 'Sin clasificar'
const CLASIF_AGENCIA = 'Agencia'
const CLASIF_DOMICILIO = 'Domicilio'

export default function PaquetesAgrupadosList({
  paquetes,
  paquetesTodos,
  loteRecepcionId,
}: PaquetesAgrupadosListProps) {
  const queryClient = useQueryClient()

  // Estado para listas de paquetes por tipo
  const [secuenciasPorTipo, setSecuenciasPorTipo] = useState<Map<string, string>>(new Map())
  const [listasGeneradasPorTipo, setListasGeneradasPorTipo] = useState<Map<string, string[][]>>(new Map())


  // Estado para dialog de asignar hijos CLEMENTINA
  const [showAsignarHijosClementina, setShowAsignarHijosClementina] = useState(false)
  const [paqueteClementinaSeleccionado, setPaqueteClementinaSeleccionado] = useState<number | null>(null)

  // Estado para grupos personalizados
  const [ciudadCantonParaGrupo, setCiudadCantonParaGrupo] = useState<{ ciudad: string; canton: string } | null>(null)

  // Estado para selección de paquetes
  const [paquetesSeleccionados, setPaquetesSeleccionados] = useState<Set<number>>(new Set())
  const [showAsignarGrupoDialog, setShowAsignarGrupoDialog] = useState(false)
  const [paquetesParaAsignar, setPaquetesParaAsignar] = useState<Paquete[]>([])
  // Estado para cambiar tipo de paquete
  const [showCambiarTipoDialog, setShowCambiarTipoDialog] = useState(false)
  const [paqueteParaCambiarTipo, setPaqueteParaCambiarTipo] = useState<Paquete | null>(null)
  const [showCambiarTipoMasivoDialog, setShowCambiarTipoMasivoDialog] = useState(false)
  const [showCambiarTipoDestinoMasivoDialog, setShowCambiarTipoDestinoMasivoDialog] = useState(false)

  // Estado para cambiar tipo de distribución
  const [showCambiarTipoDestinoDialog, setShowCambiarTipoDestinoDialog] = useState(false)
  const [paqueteParaCambiarTipoDestino, setPaqueteParaCambiarTipoDestino] = useState<Paquete | null>(null)

  // Estado para agregar a atención
  const [showAgregarAtencionDialog, setShowAgregarAtencionDialog] = useState(false)
  const [paqueteParaAtencion, setPaqueteParaAtencion] = useState<Paquete | null>(null)

  // Mapa idPaquetePadre -> hijos[] para copiar guía hoja cuando hay paquetesTodos
  const mapaClementinaHijos = useMemo(() => {
    const mapa = new Map<number, Paquete[]>()
    if (!paquetesTodos?.length) return mapa
    paquetesTodos
      .filter(p => p.idPaquetePadre != null)
      .forEach(p => {
        const idPadre = p.idPaquetePadre!
        if (!mapa.has(idPadre)) mapa.set(idPadre, [])
        mapa.get(idPadre)!.push(p)
      })
    return mapa
  }, [paquetesTodos])

  // Para la agrupación: CLEMENTINA padres se sustituyen por sus hijos (los hijos no se añaden otra vez para evitar duplicados)
  const paquetesParaAgrupar = useMemo(() => {
    const result: Paquete[] = []
    for (const p of paquetes) {
      if (p.idPaquetePadre != null) {
        // Hijo CLEMENTINA: no añadir aquí, ya se incluye cuando se expande el padre
        continue
      }
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

  const paquetesFiltrados = paquetesParaAgrupar

  // Cargar grupos personalizados desde localStorage (debe estar antes de paquetesAgrupados)
  const { grupos: gruposPersonalizados, refrescarGrupos } = useGruposPersonalizadosLocal(loteRecepcionId)

  // Estado para forzar re-render cuando se crean grupos
  const [gruposVersion, setGruposVersion] = useState(0)

  // Crear mapa de paquetes a grupos personalizados (debe estar antes de paquetesAgrupados)
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

  // Agrupar: Ciudad (Guayas) → Cantón (Guayaquil) → Sin clasificar | Agencia | Domicilio → Referencia (si tiene) → tipo (CLEMENTINA/SEPARAR/CADENITA/NORMAL). Clementina con datos del hijo.
  const paquetesAgrupados = useMemo(() => {
    const estructura: PaquetesPorCiudad = {}

    paquetesFiltrados.forEach((paquete) => {
      const { ciudad, canton } = derivarCiudadCantonDeDireccion(paquete)
      const tipoDestinoKey = normalizarTipoDestinoKey(paquete.tipoDestino)
      const clasificacionKey = clasificacionDestinoLabel(tipoDestinoKey)
      const refKey = paquete.ref && paquete.ref.trim() !== '' ? paquete.ref.trim() : REF_SIN_REF
      const tipoClasificacion = getTipoClasificacion(paquete)

      if (!estructura[ciudad]) estructura[ciudad] = {}
      if (!estructura[ciudad][canton]) estructura[ciudad][canton] = {}
      if (!estructura[ciudad][canton][clasificacionKey]) estructura[ciudad][canton][clasificacionKey] = {}
      if (!estructura[ciudad][canton][clasificacionKey][refKey]) estructura[ciudad][canton][clasificacionKey][refKey] = {}
      if (!estructura[ciudad][canton][clasificacionKey][refKey][tipoClasificacion]) {
        estructura[ciudad][canton][clasificacionKey][refKey][tipoClasificacion] = []
      }
      estructura[ciudad][canton][clasificacionKey][refKey][tipoClasificacion].push(paquete)
    })

    return estructura
  }, [paquetesFiltrados])

  // Agrupación simple: Ciudad → Cantón → REF (si tiene) → paquetes (para la vista principal)
  const paquetesAgrupadosPorCiudadCantonRef = useMemo(() => {
    const estructura: PaquetesPorCiudadSimple = {}
    paquetesFiltrados.forEach((paquete) => {
      const { ciudad, canton } = derivarCiudadCantonDeDireccion(paquete)
      const refKey = paquete.ref && paquete.ref.trim() !== '' ? paquete.ref.trim() : REF_SIN_REF
      if (!estructura[ciudad]) estructura[ciudad] = {}
      if (!estructura[ciudad][canton]) estructura[ciudad][canton] = {}
      if (!estructura[ciudad][canton][refKey]) estructura[ciudad][canton][refKey] = []
      estructura[ciudad][canton][refKey].push(paquete)
    })
    return estructura
  }, [paquetesFiltrados])

  // Función helper para ordenar claves alfabéticamente (declarada antes de su uso)
  const ordenarClaves = (claves: string[]): string[] => {
    return [...claves].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }
  // Ordenar REF: "Sin REF" al final, resto alfabético
  const ordenarClavesRef = (claves: string[]): string[] => {
    return [...claves].sort((a, b) => {
      if (a === REF_SIN_REF) return 1
      if (b === REF_SIN_REF) return -1
      return a.localeCompare(b, 'es', { sensitivity: 'base' })
    })
  }

  // Función helper para formatear dirección del destinatario (memoizada)
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

  // Definir palabras clave por categoría (para resaltar en dirección/observaciones de cada fila)
  const palabrasClave = {
    CLEMENTINA: ['CLEMENTINA', 'CLT', 'REE'],
    CADENITA: ['CADENITA', 'CAD', 'CAJAS'],
    SEPARAR: ['MEZ', 'SE SEPARA'],
    ECUABOX: ['ECUABOX']
  }

  // Función para resaltar palabras clave específicas en texto (memoizada)
  const resaltarPatron = useCallback((texto: string, tipo: 'direccion' | 'observacion'): React.ReactNode => {
    if (!texto || texto === '-') return texto

    const textoUpper = texto.toUpperCase()

    // Obtener todas las palabras clave que deben resaltarse
    const todasLasPalabrasClave: Array<{ palabra: string, categoria: 'CLEMENTINA' | 'CADENITA' | 'SEPARAR' | 'ECUABOX' }> = []
    Object.entries(palabrasClave).forEach(([categoria, palabras]) => {
      palabras.forEach(palabra => {
        todasLasPalabrasClave.push({ palabra, categoria: categoria as 'CLEMENTINA' | 'CADENITA' | 'SEPARAR' | 'ECUABOX' })
      })
    })

    // Encontrar todas las coincidencias
    const coincidencias: Array<{ inicio: number, fin: number, categoria: 'CLEMENTINA' | 'CADENITA' | 'SEPARAR' | 'ECUABOX' }> = []

    todasLasPalabrasClave.forEach(({ palabra, categoria }) => {
      // Para frases de múltiples palabras, buscar la frase completa
      // Para palabras individuales, buscar como palabra completa
      const palabraEscapada = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = palabra.includes(' ')
        ? new RegExp(palabraEscapada, 'gi') // Frase: buscar directamente
        : new RegExp(`\\b${palabraEscapada}\\b`, 'gi') // Palabra: usar word boundary
      let match
      while ((match = regex.exec(textoUpper)) !== null) {
        coincidencias.push({
          inicio: match.index,
          fin: match.index + match[0].length,
          categoria
        })
      }
    })

    if (coincidencias.length === 0) return texto

    // Ordenar coincidencias por posición
    coincidencias.sort((a, b) => a.inicio - b.inicio)

    // Eliminar solapamientos (mantener la primera coincidencia)
    const coincidenciasSinSolapamiento: Array<{ inicio: number, fin: number, categoria: 'CLEMENTINA' | 'CADENITA' | 'SEPARAR' | 'ECUABOX' }> = []
    let ultimoFin = 0
    coincidencias.forEach(coincidencia => {
      if (coincidencia.inicio >= ultimoFin) {
        coincidenciasSinSolapamiento.push(coincidencia)
        ultimoFin = coincidencia.fin
      }
    })

    // Construir elementos con resaltado
    const elementos: React.ReactNode[] = []
    let ultimoIndice = 0

    // Colores por categoría - tokens semánticos (no hardcode)
    const coloresPorCategoria = {
      CLEMENTINA: 'bg-info/10 text-info border border-info/20',
      CADENITA: 'bg-success/10 text-success border border-success/20',
      SEPARAR: 'bg-warning/10 text-warning border border-warning/20',
      ECUABOX: 'bg-secondary text-secondary-foreground border border-border/50'
    }

    coincidenciasSinSolapamiento.forEach(coincidencia => {
      // Agregar texto antes de la coincidencia
      if (coincidencia.inicio > ultimoIndice) {
        elementos.push(texto.substring(ultimoIndice, coincidencia.inicio))
      }
      // Agregar texto resaltado con color según categoría
      elementos.push(
        <span
          key={`${coincidencia.inicio}-${coincidencia.fin}`}
          className={`${coloresPorCategoria[coincidencia.categoria]} font-medium px-1 py-0.5 rounded-sm`}
        >
          {texto.substring(coincidencia.inicio, coincidencia.fin)}
        </span>
      )
      ultimoIndice = coincidencia.fin
    })

    // Agregar texto restante
    if (ultimoIndice < texto.length) {
      elementos.push(texto.substring(ultimoIndice))
    }

    return <>{elementos}</>
  }, [palabrasClave])

  // Función para generar listas de paquetes según secuencia (memoizada)
  const generarListas = useCallback((paquetes: Paquete[], secuencia: string): string[][] | null => {
    // Parsear la secuencia (ej: "3,3,6,9" -> [3, 3, 6, 9])
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
      return null // La suma excede el total de paquetes
    }

    // Generar los grupos
    const grupos: string[][] = []
    let indiceActual = 0

    for (const cantidad of numeros) {
      const grupo: string[] = []
      for (let i = 0; i < cantidad && indiceActual < paquetes.length; i++) {
        const g = guiaEfectiva(paquetes[indiceActual])
        if (g) {
          grupo.push(g)
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

    // Limpiar listas generadas si la secuencia está vacía
    if (!secuencia.trim()) {
      setListasGeneradasPorTipo(prev => {
        const nuevo = new Map(prev)
        nuevo.delete(tipoKey)
        return nuevo
      })
    }
  }

  // Función para generar listas cuando se presiona Enter o se hace blur (usa guía hoja para CLEMENTINA si hay paquetesTodos)
  const handleGenerarListas = (tipoKey: string, paquetes: Paquete[], secuencia: string) => {
    if (!secuencia.trim()) {
      setListasGeneradasPorTipo(prev => {
        const nuevo = new Map(prev)
        nuevo.delete(tipoKey)
        return nuevo
      })
      return
    }

    const totalPaquetes = getCantidadParaSecuencia(paquetes)
    const parsed = parsearSecuencia(secuencia)
    if (parsed && parsed.suma > totalPaquetes) {
      toast.error(`La secuencia suma ${parsed.suma}; hay ${totalPaquetes} paquetes. Faltan ${parsed.suma - totalPaquetes} paquetes para completar la secuencia.`)
      return
    }

    const useExpansion = mapaClementinaHijos.size > 0
    const listas = useExpansion
      ? generarListasFromGuias(expandirPaquetesAGuias(paquetes, mapaClementinaHijos), secuencia)
      : generarListas(paquetes, secuencia)
    if (listas === null) {
      toast.error('La secuencia no es válida o excede el total de guías disponibles')
      return
    }

    setListasGeneradasPorTipo(prev => {
      const nuevo = new Map(prev)
      nuevo.set(tipoKey, listas)
      return nuevo
    })
  }

  // Cantidad efectiva de ítems para secuencia (guías expandidas si hay CLEMENTINA con hijos, sino paquetes)
  const getCantidadParaSecuencia = useCallback((paquetes: Paquete[]): number => {
    if (mapaClementinaHijos.size > 0) {
      return expandirPaquetesAGuias(paquetes, mapaClementinaHijos).length
    }
    return paquetes.length
  }, [mapaClementinaHijos])

  const copiarLista = async (lista: string[]) => {
    const texto = lista.join('\n')
    // const grupoKey = `${tipoKey}-${grupoIndex}` // unused

    try {
      await navigator.clipboard.writeText(texto)
      toast.success(`Lista de ${lista.length} paquete(s) copiada al portapapeles`)
      // check state removed
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


  const handleCambiarTipo = useCallback((paquete: Paquete) => {
    setPaqueteParaCambiarTipo(paquete)
    setShowCambiarTipoDialog(true)
  }, [])

  const handleAgregarAtencion = useCallback((paquete: Paquete) => {
    setPaqueteParaAtencion(paquete)
    setShowAgregarAtencionDialog(true)
  }, [])

  const handleCambiarTipoDestino = useCallback((paquete: Paquete) => {
    setPaqueteParaCambiarTipoDestino(paquete)
    setShowCambiarTipoDestinoDialog(true)
  }, [])




  // Obtener paquetes seleccionados como array
  const paquetesSeleccionadosArray = useMemo(() => {
    return paquetesFiltrados.filter(p => p.idPaquete && paquetesSeleccionados.has(p.idPaquete))
  }, [paquetesFiltrados, paquetesSeleccionados])

  // Para "Cambiar tipo destino" y "Agregar a atención": excluir padres CLEMENTINA (solo hijos en sección CLEMENTINA Hijos)
  const paquetesParaDestinoYAtencion = useMemo(() => {
    return paquetesSeleccionadosArray.filter(
      p => p.tipoPaquete !== TipoPaquete.CLEMENTINA
    )
  }, [paquetesSeleccionadosArray])

  // Función para contar paquetes en un bloque tipoDestino (por clasificación CLEMENTINA/SEPARAR/CADENITA/NORMAL)
  const contarPaquetesPorTipoDestino = (porClasificacion: PaquetesPorTipoClasificacion): number => {
    return Object.values(porClasificacion).reduce((sum, paquetes) => sum + paquetes.length, 0)
  }

  const contarPaquetesEnClasificacion = (clasificacion: PaquetesPorRef): number => {
    return Object.values(clasificacion).reduce((total, porTipo) => total + contarPaquetesPorTipoDestino(porTipo), 0)
  }

  const contarPaquetesEnCanton = (canton: PaquetesPorClasificacionDestino): number => {
    return Object.values(canton).reduce((total, clasif) => total + contarPaquetesEnClasificacion(clasif), 0)
  }

  const contarPaquetesCantones = (cantones: PaquetesPorCanton): number => {
    return Object.values(cantones).reduce((total, canton) => total + contarPaquetesEnCanton(canton), 0)
  }

  // Conteo para estructura simple Ciudad → Cantón → REF
  const contarPaquetesEnRef = (porRef: PaquetesPorRefSimple): number =>
    Object.values(porRef).reduce((sum, list) => sum + list.length, 0)
  const contarPaquetesEnCantonSimple = (canton: PaquetesPorCantonSimple): number =>
    Object.values(canton).reduce((total, porRef) => total + contarPaquetesEnRef(porRef), 0)
  const contarPaquetesCiudadSimple = (ciudad: PaquetesPorCiudadSimple[string]): number =>
    Object.values(ciudad).reduce((total, canton) => total + contarPaquetesEnCantonSimple(canton), 0)

  const ORDER_CLASIFICACION = [CLASIF_SIN_CLASIFICAR, CLASIF_AGENCIA, CLASIF_DOMICILIO]

  return (
    <div className="space-y-6 py-6">

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
            onClick={() => setShowCambiarTipoMasivoDialog(true)}
            className="h-8 text-xs shadow-sm hover:bg-muted"
          >
            Cambiar tipo
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (paquetesParaDestinoYAtencion.length === 0) {
                toast.info('Para paquetes CLEMENTINA use la sección CLEMENTINA Hijos.')
                return
              }
              const first = paquetesParaDestinoYAtencion[0]
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
            onClick={() => {
              if (paquetesParaDestinoYAtencion.length === 0) {
                toast.info('Para paquetes CLEMENTINA use la sección CLEMENTINA Hijos.')
                return
              }
              setShowCambiarTipoDestinoMasivoDialog(true)
            }}
            disabled={paquetesSeleccionadosArray.length === 0}
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

      {/* Lista principal: Ciudad → Cantón → Tipo de destino → REF */}
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
                  const porClasificacionDestino = cantones[canton]
                  const totalPaquetesCanton = contarPaquetesEnCanton(porClasificacionDestino)

                  return (
                    <div key={canton} className="border border-border/40 rounded-md bg-background/50 overflow-hidden">
                      <div className="bg-muted/20 px-4 py-3 border-b border-border/30 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="text-sm font-medium">{canton}</span>
                        <span className="text-xs text-muted-foreground ml-1">({totalPaquetesCanton})</span>
                      </div>

                      <div className="p-4 space-y-6">
                        {ORDER_CLASIFICACION.filter((clasifKey) => porClasificacionDestino[clasifKey]).map((clasifKey) => {
                          const porRef = porClasificacionDestino[clasifKey]
                          const totalClasif = contarPaquetesEnClasificacion(porRef)
                          const uniqueKeyListas = `${ciudad}|${canton}|${clasifKey}`
                          const secuencia = secuenciasPorTipo.get(uniqueKeyListas) || ''
                          const paquetesDelBloque = Object.values(porRef).flatMap((porTipo) => Object.values(porTipo).flat())
                          const totalAgrupable = getCantidadParaSecuencia(paquetesDelBloque)
                          const parsedSec = parsearSecuencia(secuencia)
                          const sumaSecuencia = parsedSec?.suma ?? 0

                          const statusSuma = useMemo(() => {
                            if (!parsedSec || totalAgrupable === 0) return null
                            if (sumaSecuencia > totalAgrupable) return 'error'
                            if (sumaSecuencia < totalAgrupable) return 'warning'
                            return 'success'
                          }, [parsedSec, sumaSecuencia, totalAgrupable])

                          const renderMensajeSuma = () => {
                            if (!statusSuma) return null

                            const icons = {
                              error: <AlertTriangle className="h-3.5 w-3.5" />,
                              warning: <Info className="h-3.5 w-3.5" />,
                              success: <CheckCircle2 className="h-3.5 w-3.5" />
                            }

                            const colors = {
                              error: 'text-destructive bg-destructive/10 border-destructive/20',
                              warning: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-950/30 dark:border-amber-900/50',
                              success: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-500 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                            }

                            let texto = ''
                            if (statusSuma === 'error') {
                              texto = `La secuencia suma ${sumaSecuencia}. Supera los ${totalAgrupable} disponibles.`
                            } else if (statusSuma === 'warning') {
                              texto = `Suman ${sumaSecuencia}. Faltan ${totalAgrupable - sumaSecuencia} para completar los ${totalAgrupable}.`
                            } else {
                              texto = `Suman ${sumaSecuencia}. Se utilizarán todos los paquetes.`
                            }

                            return (
                              <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md border text-[11px] font-medium animate-in fade-in slide-in-from-top-1 duration-200",
                                colors[statusSuma]
                              )}>
                                {icons[statusSuma]}
                                <span>{texto}</span>
                              </div>
                            )
                          }

                          return (
                            <div key={clasifKey} className="border border-border/35 rounded-md bg-background/45 overflow-hidden">
                              <div className="bg-muted/18 px-4 py-2.5 border-b border-border/25 flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-5 px-2">
                                  {clasifKey}
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-1">({totalClasif})</span>
                              </div>

                              <div className="p-4 space-y-6">
                                {/* Bloque Generar listas por tipo de destino */}
                                <div className="bg-muted/20 p-3 rounded-md border border-border/30 flex flex-col gap-3">
                                  <div className="text-xs font-medium text-muted-foreground">
                                    Total: {totalAgrupable} paquete{totalAgrupable !== 1 ? 's' : ''}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">Generar listas:</span>
                                    <Input
                                      className="h-8 w-48 font-mono text-xs bg-background"
                                      placeholder="Ej: 3,3,6"
                                      value={secuencia}
                                      onChange={(e) => handleSecuenciaChange(uniqueKeyListas, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleGenerarListas(uniqueKeyListas, paquetesDelBloque, secuencia)
                                      }}
                                      onBlur={() => handleGenerarListas(uniqueKeyListas, paquetesDelBloque, secuencia)}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                      onClick={() => handleGenerarListas(uniqueKeyListas, paquetesDelBloque, secuencia)}
                                      disabled={!secuencia.trim()}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    {secuencia.trim() && (
                                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                                        <Package className="h-3 w-3" />
                                        <span>Máx. {maxGruposFromSecuencia(secuencia, totalAgrupable)} grupos</span>
                                      </div>
                                    )}
                                  </div>
                                  {renderMensajeSuma()}
                                  {listasGeneradasPorTipo.get(uniqueKeyListas)?.length ? (
                                    <div className="space-y-2 border-t border-border/30 pt-3">
                                      <div className="text-xs font-medium text-muted-foreground">
                                        {listasGeneradasPorTipo.get(uniqueKeyListas)!.length} lista{listasGeneradasPorTipo.get(uniqueKeyListas)!.length !== 1 ? 's' : ''} generada{listasGeneradasPorTipo.get(uniqueKeyListas)!.length !== 1 ? 's' : ''}
                                      </div>
                                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {listasGeneradasPorTipo.get(uniqueKeyListas)!.map((lista, grupoIndex) => (
                                          <div key={grupoIndex} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors group">
                                            <span className="text-xs text-muted-foreground min-w-[70px] font-medium">
                                              Lista {grupoIndex + 1} ({lista.length})
                                            </span>
                                            <span className="font-mono text-xs flex-1 truncate text-foreground">
                                              {lista.join(', ')}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => copiarLista(lista)}
                                              className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                                            >
                                              <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                {/* Por cada REF dentro de este tipo de destino */}
                                {ordenarClavesRef(Object.keys(porRef)).map((refKey) => {
                                  const porTipoClasif = porRef[refKey]
                                  const totalRef = contarPaquetesPorTipoDestino(porTipoClasif)
                                  const paquetesRef = TIPOS_CLASIFICACION_ORDEN.flatMap((tipoClasificacion) => porTipoClasif[tipoClasificacion] ?? [])
                                  const padresClementina = paquetesRef.filter(p => p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre)
                                  const otros = paquetesRef.filter(p => p.tipoPaquete !== TipoPaquete.CLEMENTINA || p.idPaquetePadre != null)
                                  const filasClementina = getFilasClementina(padresClementina, mapaClementinaHijos)
                                  const filas = [...filasClementina, ...otros]
                                  const mostrarGuiaOrigen = filas.some(f => f.numeroGuiaPaquetePadre)

                                  return (
                                    <div key={refKey} className="border border-border/25 rounded-md bg-background/30 overflow-hidden">
                                      <div className="bg-muted/12 px-3 py-2 border-b border-border/15 flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] h-5 px-2 font-mono">
                                          {refKey}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">({totalRef})</span>
                                      </div>

                                      <div className="p-3">
                                        <div className="rounded-md border border-border/50 overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="bg-muted/30">
                                                <TableHead className="w-[40px] px-2 py-2">
                                                  <Checkbox
                                                    checked={filas.every(p => p.idPaquete && paquetesSeleccionados.has(p.idPaquete))}
                                                    onCheckedChange={(checked) => {
                                                      if (checked) handleSeleccionarTodos(filas)
                                                      else filas.forEach(p => p.idPaquete && handleTogglePaquete(p.idPaquete))
                                                    }}
                                                  />
                                                </TableHead>
                                                <TableHead className="py-2 text-xs">Guía</TableHead>
                                                {mostrarGuiaOrigen && (
                                                  <TableHead className="py-2 text-xs">Guía origen</TableHead>
                                                )}
                                                <TableHead className="py-2 text-xs">Estado</TableHead>
                                                <TableHead className="py-2 text-xs w-1/3">Dirección</TableHead>
                                                <TableHead className="py-2 text-xs w-1/3">Observaciones</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {filas.map((paquete) => {
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
                                                    isSelected={paquete.idPaquete ? paquetesSeleccionados.has(paquete.idPaquete) : false}
                                                    onToggleSelect={() => paquete.idPaquete && handleTogglePaquete(paquete.idPaquete)}
                                                    mostrarTipoPaquete={false}
                                                    mostrarNumeroGuiaPadre={mostrarGuiaOrigen}
                                                    etiquetaDestino={etiquetaDestino}
                                                  />
                                                )
                                              })}
                                            </TableBody>
                                          </Table>
                                        </div>
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

      <AsignarHijosClementinaDialog
        open={showAsignarHijosClementina && !!paqueteClementinaSeleccionado}
        onOpenChange={(open) => {
          setShowAsignarHijosClementina(open)
          if (!open) setPaqueteClementinaSeleccionado(null)
        }}
        idPaquetePadre={paqueteClementinaSeleccionado || 0}
        loteRecepcionId={loteRecepcionId || 0}
      />

      {/* Diálogos adicionales */}
      {showAsignarGrupoDialog && ciudadCantonParaGrupo && (
        <CrearGrupoDialog
          open={showAsignarGrupoDialog}
          onOpenChange={setShowAsignarGrupoDialog}
          paquetesSeleccionados={paquetesParaAsignar}
          // Si el diálogo necesita IDs, los extraerá internamente, pero según la definición usa paquetesSeleccionados
          ciudad={ciudadCantonParaGrupo.ciudad}
          canton={ciudadCantonParaGrupo.canton}
          loteRecepcionId={loteRecepcionId || 0}
          onSuccess={() => {
            handleDeseleccionarTodos()
            refrescarGrupos()
            // Forzar actualización
            setGruposVersion(prev => prev + 1)
          }}
        />
      )}

      {showCambiarTipoMasivoDialog && paquetesSeleccionadosArray.length > 0 && (
        <CambiarTipoMasivoDialog
          open={showCambiarTipoMasivoDialog}
          onOpenChange={setShowCambiarTipoMasivoDialog}
          paquetes={paquetesSeleccionadosArray}
          onSuccess={() => {
            handleDeseleccionarTodos()
            queryClient.invalidateQueries({ queryKey: ['paquetes-lote', loteRecepcionId] })
          }}
        />
      )}

      {showCambiarTipoDialog && paqueteParaCambiarTipo && (
        <CambiarTipoDialog
          open={showCambiarTipoDialog}
          onOpenChange={setShowCambiarTipoDialog}
          paquete={paqueteParaCambiarTipo}
          onSuccess={() => {
            setPaqueteParaCambiarTipo(null)
            queryClient.invalidateQueries({ queryKey: ['paquetes-lote', loteRecepcionId] })
          }}
        />
      )}

      {showCambiarTipoDestinoMasivoDialog && paquetesParaDestinoYAtencion.length > 0 && (
        <CambiarTipoDestinoMasivoDialog
          open={showCambiarTipoDestinoMasivoDialog}
          onOpenChange={setShowCambiarTipoDestinoMasivoDialog}
          paquetes={paquetesParaDestinoYAtencion}
          onSuccess={() => {
            handleDeseleccionarTodos()
            queryClient.invalidateQueries({ queryKey: ['paquetes-lote', loteRecepcionId] })
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
            setPaqueteParaCambiarTipoDestino(null)
            queryClient.invalidateQueries({ queryKey: ['paquetes-lote', loteRecepcionId] })
          }}
        />
      )}

      {showAgregarAtencionDialog && paqueteParaAtencion && loteRecepcionId && (
        <AgregarAtencionDialog
          open={showAgregarAtencionDialog}
          onOpenChange={setShowAgregarAtencionDialog}
          paquete={paqueteParaAtencion}
          onSuccess={() => {
            setPaqueteParaAtencion(null)
            queryClient.invalidateQueries({ queryKey: ['paquetes-lote', loteRecepcionId] })
          }}
        />
      )}

    </div>
  )
}
