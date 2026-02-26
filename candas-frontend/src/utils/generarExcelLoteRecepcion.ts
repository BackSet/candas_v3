import * as XLSX from 'xlsx'
import type { Paquete } from '@/types/paquete'
import { TipoDestino, TipoPaquete } from '@/types/paquete'
import { guiaEfectiva, tieneGuiaEfectiva } from '@/utils/paqueteGuia'
import type { Agencia } from '@/types/agencia'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'
import type { GrupoPersonalizadoLocal } from '@/hooks/useGruposPersonalizadosLocal'

/**
 * Ordena paquetes por ciudad, cantón y referencia (si existe)
 * Los valores null/undefined/vacíos van al final en cada nivel
 * @param paquetes Lista de paquetes a ordenar
 * @returns Lista de paquetes ordenada
 */
function ordenarPaquetesPorCiudadCantonRef(paquetes: Paquete[]): Paquete[] {
  return [...paquetes].sort((a, b) => {
    // Ordenar por ciudad (alfabéticamente, nulls al final)
    const ciudadA = a.ciudadDestinatario?.trim() || ''
    const ciudadB = b.ciudadDestinatario?.trim() || ''

    if (ciudadA && !ciudadB) return -1
    if (!ciudadA && ciudadB) return 1
    if (ciudadA && ciudadB) {
      const comparacionCiudad = ciudadA.localeCompare(ciudadB, 'es', { sensitivity: 'base' })
      if (comparacionCiudad !== 0) return comparacionCiudad
    }

    // Si las ciudades son iguales (o ambas vacías), ordenar por cantón
    const cantonA = a.cantonDestinatario?.trim() || ''
    const cantonB = b.cantonDestinatario?.trim() || ''

    if (cantonA && !cantonB) return -1
    if (!cantonA && cantonB) return 1
    if (cantonA && cantonB) {
      const comparacionCanton = cantonA.localeCompare(cantonB, 'es', { sensitivity: 'base' })
      if (comparacionCanton !== 0) return comparacionCanton
    }

    // Si ciudad y cantón son iguales (o ambas vacías), ordenar por referencia
    const refA = a.ref?.trim() || ''
    const refB = b.ref?.trim() || ''

    if (refA && !refB) return -1
    if (!refA && refB) return 1
    if (refA && refB) {
      return refA.localeCompare(refB, 'es', { sensitivity: 'base' })
    }

    // Si todo es igual, mantener el orden original
    return 0
  })
}

/**
 * Genera un archivo Excel con el formato especificado para un lote de recepción
 * @param paquetes Lista de paquetes del lote de recepción
 * @param fecha Fecha en formato YYYY-MM-DD (ej: 2026-01-08)
 * @param hora Hora en formato HH:mm (ej: 14:50)
 * @param numeroRecepcion Número de recepción para el nombre del archivo
 * @param formatoSimplificado Si es true, solo incluye columnas básicas para tracking (FECHA, HORA, HAWB/REFERENCIA, ESTADO DE GUIA, OBSERVACION, REMESA)
 * @param agenciaPorPaquete Mapa opcional de idPaquete -> idAgencia para agrupación visual
 * @param destinatarioPorPaquete Mapa opcional de idPaquete -> idDestinatarioDirecto para agrupación visual
 * @param agencias Lista opcional de agencias para obtener nombres
 * @param destinatarios Lista opcional de destinatarios directos para obtener nombres
 */
export function generarExcelLoteRecepcion(
  paquetes: Paquete[],
  fecha: string,
  hora: string,
  numeroRecepcion?: string,
  formatoSimplificado: boolean = false,
  agenciaPorPaquete?: Map<number, number>,
  destinatarioPorPaquete?: Map<number, number>,
  agencias?: Agencia[],
  destinatarios?: DestinatarioDirecto[]
): void {
  // Filtrar solo paquetes que tengan guía (propia o origen del padre)
  const paquetesConGuia = paquetes.filter(tieneGuiaEfectiva)

  if (paquetesConGuia.length === 0) {
    throw new Error('No hay paquetes con número de guía para generar el Excel')
  }

  // Separar paquetes CLEMENTINA (padres e hijos) de paquetes normales
  // Solo si NO es formato simplificado
  const paquetesClementina: Paquete[] = []
  const paquetesNormales: Paquete[] = []
  const idsPadresClementina = new Set<number>()

  if (!formatoSimplificado) {
    // Primero identificar padres CLEMENTINA para saber cuáles son los hijos
    // Un padre CLEMENTINA es un paquete con tipoPaquete === 'CLEMENTINA' y sin idPaquetePadre
    paquetesConGuia.forEach((p) => {
      if (p.tipoPaquete === TipoPaquete.CLEMENTINA) {
        // Si no tiene padre, es un padre CLEMENTINA
        if (!p.idPaquetePadre && p.idPaquete) {
          idsPadresClementina.add(p.idPaquete)
        }
      }
    })

    // Luego identificar hijos de CLEMENTINA y separar el resto
    paquetesConGuia.forEach((p) => {
      // Si es hijo de un padre CLEMENTINA, agregarlo a CLEMENTINA (solo hijos, no padres)
      if (p.idPaquetePadre && idsPadresClementina.has(p.idPaquetePadre)) {
        paquetesClementina.push(p)
      }
      // Si no es CLEMENTINA ni hijo de CLEMENTINA, agregarlo a normales
      else if (p.tipoPaquete !== TipoPaquete.CLEMENTINA) {
        paquetesNormales.push(p)
      }
      // Si es CLEMENTINA padre (no tiene padre), agregarlo a normales
      else if (p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre) {
        paquetesNormales.push(p)
      }
    })
  } else {
    // En formato simplificado, todos los paquetes van a normales
    paquetesNormales.push(...paquetesConGuia)
  }

  // Ordenar paquetes CLEMENTINA por ciudad, cantón y referencia
  const paquetesClementinaOrdenados = ordenarPaquetesPorCiudadCantonRef(paquetesClementina)
  // Ordenar paquetes normales por ciudad, cantón y referencia
  const paquetesNormalesOrdenados = ordenarPaquetesPorCiudadCantonRef(paquetesNormales)

  // Verificar si hay padres CLEMENTINA para crear la hoja (aunque no tengan hijos)
  const hayPadresClementina = idsPadresClementina.size > 0

  // Función helper para obtener nombre de agencia
  const obtenerNombreAgencia = (paquete: Paquete): string => {
    if (paquete.idPaquete) {
      const idAgencia = agenciaPorPaquete?.get(paquete.idPaquete) || paquete.idAgenciaDestino
      if (idAgencia && agencias) {
        const agencia = agencias.find(a => a.idAgencia === idAgencia)
        if (agencia) {
          return agencia.canton
            ? `${agencia.nombre} - ${agencia.canton}`
            : agencia.nombre
        }
      }
    }
    return paquete.nombreAgenciaDestino || ''
  }

  // Función helper para obtener nombre de destinatario directo
  const obtenerNombreDestinatario = (paquete: Paquete): string => {
    if (paquete.idPaquete) {
      const idDestinatario = destinatarioPorPaquete?.get(paquete.idPaquete)
      if (idDestinatario && destinatarios) {
        const destinatario = destinatarios.find(d => d.idDestinatarioDirecto === idDestinatario)
        if (destinatario) {
          return destinatario.nombreDestinatario
        }
      }
    }
    return ''
  }

  // Función helper para preparar datos de un paquete
  const prepararDatosPaquete = (paquete: Paquete, incluirNumeroGuiaPadre: boolean = false) => {
    if (formatoSimplificado) {
      // Formato simplificado para exportación por grupo (tracking en otro sistema)
      // Formato según imagen: FECHA, HORA, HAWB/REFERENCIA, ESTADO DE GUIA, OBSERVACION, REMESA
      return {
        FECHA: fecha,
        HORA: hora,
        'HAWB/REFERENCIA': guiaEfectiva(paquete),
        'ESTADO DE GUIA': 'LLEGA A CENTRO DE ACOPIO QUITO',
        OBSERVACION: paquete.observaciones || '',
        REMESA: '',
      }
    }

    // Formato completo para exportación normal del lote
    // Construir dirección completa del destino
    const direccionDestino = paquete.direccionDestinatarioCompleta ||
      [
        paquete.direccionDestinatario,
        paquete.cantonDestinatario,
        paquete.ciudadDestinatario,
        paquete.paisDestinatario
      ].filter(Boolean).join(', ') || ''

    if (incluirNumeroGuiaPadre) {
      // Para CLEMENTINA: NUMERO GUIA PADRE primero
      return {
        'NUMERO GUIA PADRE': paquete.numeroGuiaPaquetePadre || '',
        FECHA: fecha,
        HORA: hora,
        'HAWB/REFERENCIA': guiaEfectiva(paquete),
        REFERENCIA: paquete.ref || '',
        'ESTADO DE GUIA': 'LLEGA A CENTRO DE ACOPIO QUITO',
        'PESO (KG)': paquete.pesoKilos?.toString() || '',
        'REMITENTE': paquete.nombreClienteRemitente || '',
        'DESTINATARIO': paquete.nombreClienteDestinatario || '',
        'TELEFONO DESTINATARIO': paquete.telefonoDestinatario || '',
        'DIRECCION DESTINO': direccionDestino,
        'CIUDAD DESTINO': paquete.ciudadDestinatario || '',
        'CANTON DESTINO': paquete.cantonDestinatario || '',
        OBSERVACION: paquete.observaciones || '',
        REMESA: '',
      }
    }

    // Para paquetes normales: orden estándar
    return {
      FECHA: fecha,
      HORA: hora,
      'HAWB/REFERENCIA': guiaEfectiva(paquete),
      REFERENCIA: paquete.ref || '',
      'ESTADO DE GUIA': 'LLEGA A CENTRO DE ACOPIO QUITO',
      'PESO (KG)': paquete.pesoKilos?.toString() || '',
      'REMITENTE': paquete.nombreClienteRemitente || '',
      'DESTINATARIO': paquete.nombreClienteDestinatario || '',
      'TELEFONO DESTINATARIO': paquete.telefonoDestinatario || '',
      'DIRECCION DESTINO': direccionDestino,
      'CIUDAD DESTINO': paquete.ciudadDestinatario || '',
      'CANTON DESTINO': paquete.cantonDestinatario || '',
      OBSERVACION: paquete.observaciones || '',
      REMESA: '',
    }
  }

  // Crear workbook
  const workbook = XLSX.utils.book_new()

  // Crear hoja para CLEMENTINA si hay padres CLEMENTINA (aunque no tengan hijos)
  if (hayPadresClementina && !formatoSimplificado) {
    const datosClementina = paquetesClementinaOrdenados.map((paquete) =>
      prepararDatosPaquete(paquete, true)
    )
    const worksheetClementina = XLSX.utils.json_to_sheet(datosClementina)

    // Configurar anchos de columna para CLEMENTINA
    const columnWidthsClementina = [
      { wch: 20 }, // NUMERO GUIA PADRE
      { wch: 12 }, // FECHA
      { wch: 8 }, // HORA
      { wch: 20 }, // HAWB/REFERENCIA
      { wch: 15 }, // REFERENCIA
      { wch: 35 }, // ESTADO DE GUIA
      { wch: 12 }, // PESO (KG)
      { wch: 25 }, // REMITENTE
      { wch: 25 }, // DESTINATARIO
      { wch: 15 }, // TELEFONO DESTINATARIO
      { wch: 40 }, // DIRECCION DESTINO
      { wch: 20 }, // CIUDAD DESTINO
      { wch: 20 }, // CANTON DESTINO
      { wch: 30 }, // OBSERVACION
      { wch: 15 }, // REMESA
      { wch: 20 }, // NUMERO GUIA PADRE
    ]
    worksheetClementina['!cols'] = columnWidthsClementina
    XLSX.utils.book_append_sheet(workbook, worksheetClementina, 'CLEMENTINA')
  }

  // Crear hoja para paquetes normales (solo si hay paquetes normales o si no hay CLEMENTINA)
  if (paquetesNormalesOrdenados.length > 0 || (paquetesClementinaOrdenados.length === 0 || formatoSimplificado)) {
    const datosNormales = paquetesNormalesOrdenados.map((paquete) =>
      prepararDatosPaquete(paquete, false)
    )
    const worksheet = XLSX.utils.json_to_sheet(datosNormales)

    // Configurar anchos de columna según el formato
    if (formatoSimplificado) {
      const columnWidths = [
        { wch: 12 }, // FECHA
        { wch: 8 }, // HORA
        { wch: 20 }, // HAWB/REFERENCIA
        { wch: 35 }, // ESTADO DE GUIA
        { wch: 30 }, // OBSERVACION
        { wch: 15 }, // REMESA
      ]
      worksheet['!cols'] = columnWidths
    } else {
      const columnWidths = [
        { wch: 12 }, // FECHA
        { wch: 8 }, // HORA
        { wch: 20 }, // HAWB/REFERENCIA
        { wch: 15 }, // REFERENCIA
        { wch: 35 }, // ESTADO DE GUIA
        { wch: 12 }, // PESO (KG)
        { wch: 25 }, // REMITENTE
        { wch: 25 }, // DESTINATARIO
        { wch: 15 }, // TELEFONO DESTINATARIO
        { wch: 40 }, // DIRECCION DESTINO
        { wch: 20 }, // CIUDAD DESTINO
        { wch: 20 }, // CANTON DESTINO
        { wch: 30 }, // OBSERVACION
        { wch: 15 }, // REMESA
      ]
      worksheet['!cols'] = columnWidths
    }

    // Nombre de la hoja: "Paquetes" si hay CLEMENTINA, o mantener "Paquetes" si no hay
    const nombreHojaNormales = paquetesClementinaOrdenados.length > 0 && !formatoSimplificado
      ? 'Paquetes Normales'
      : 'Paquetes'
    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHojaNormales)
  }

  // Generar nombre del archivo
  const fechaFormato = fecha.replace(/-/g, '')
  const nombreArchivo = numeroRecepcion
    ? `lote-recepcion-${numeroRecepcion}-${fechaFormato}.xlsx`
    : `lote-recepcion-${fechaFormato}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, nombreArchivo)
}

/**
 * Genera un archivo Excel con información completa del paquete y destinatario para grupos
 * @param paquetes Lista de paquetes del grupo
 * @param fecha Fecha en formato YYYY-MM-DD (ej: 2026-01-08)
 * @param hora Hora en formato HH:mm (ej: 14:50)
 * @param numeroRecepcion Número de recepción para el nombre del archivo
 * @param agenciaPorPaquete Mapa opcional de idPaquete -> idAgencia para agrupación visual
 * @param destinatarioPorPaquete Mapa opcional de idPaquete -> idDestinatarioDirecto para agrupación visual
 * @param agencias Lista opcional de agencias para obtener nombres
 * @param destinatarios Lista opcional de destinatarios directos para obtener nombres
 */
export function generarExcelGruposCompleto(
  paquetes: Paquete[],
  fecha: string,
  hora: string,
  numeroRecepcion?: string,
  agenciaPorPaquete?: Map<number, number>,
  destinatarioPorPaquete?: Map<number, number>,
  agencias?: Agencia[],
  destinatarios?: DestinatarioDirecto[],
  nombreArchivoPersonalizado?: string
): void {
  // Filtrar solo paquetes que tengan guía (propia o origen del padre)
  const paquetesConGuia = paquetes.filter(tieneGuiaEfectiva)

  if (paquetesConGuia.length === 0) {
    throw new Error('No hay paquetes con número de guía para generar el Excel')
  }

  // Ordenar paquetes por ciudad, cantón y referencia
  const paquetesOrdenados = ordenarPaquetesPorCiudadCantonRef(paquetesConGuia)

  // Función helper para obtener nombre de agencia
  const obtenerNombreAgencia = (paquete: Paquete): string => {
    if (paquete.idPaquete) {
      const idAgencia = agenciaPorPaquete?.get(paquete.idPaquete) || paquete.idAgenciaDestino
      if (idAgencia && agencias) {
        const agencia = agencias.find(a => a.idAgencia === idAgencia)
        if (agencia) {
          return agencia.canton
            ? `${agencia.nombre} - ${agencia.canton}`
            : agencia.nombre
        }
      }
    }
    return paquete.nombreAgenciaDestino || ''
  }

  // Función helper para obtener nombre de destinatario directo
  const obtenerNombreDestinatario = (paquete: Paquete): string => {
    if (paquete.idPaquete) {
      const idDestinatario = destinatarioPorPaquete?.get(paquete.idPaquete)
      if (idDestinatario && destinatarios) {
        const destinatario = destinatarios.find(d => d.idDestinatarioDirecto === idDestinatario)
        if (destinatario) {
          return destinatario.nombreDestinatario
        }
      }
    }
    return ''
  }

  // Preparar datos para el Excel con información completa
  // Formato basado en los PDFs de información del paquete
  const datos = paquetesOrdenados.map((paquete) => {
    // Construir dirección completa del destino
    const direccionDestino = paquete.direccionDestinatarioCompleta ||
      [
        paquete.direccionDestinatario,
        paquete.cantonDestinatario,
        paquete.ciudadDestinatario,
        paquete.paisDestinatario
      ].filter(Boolean).join(', ') || ''

    return {
      'Número de Guía': guiaEfectiva(paquete),
      'Referencia': paquete.ref || '',
      'Peso (KG)': paquete.pesoKilos?.toString() || '',
      'Destinatario': paquete.nombreClienteDestinatario || '',
      'Teléfono Destinatario': paquete.telefonoDestinatario || '',
      'Dirección Destino': direccionDestino,
      'Ciudad Destino': paquete.ciudadDestinatario || '',
      'Cantón Destino': paquete.cantonDestinatario || '',
      'Observaciones': paquete.observaciones || '',
    }
  })

  // Crear workbook y worksheet
  const worksheet = XLSX.utils.json_to_sheet(datos)

  // Configurar anchos de columna (formato basado en PDFs de información del paquete)
  const columnWidths = [
    { wch: 20 }, // Número de Guía
    { wch: 15 }, // Referencia
    { wch: 12 }, // Peso (KG)
    { wch: 25 }, // Destinatario
    { wch: 15 }, // Teléfono Destinatario
    { wch: 40 }, // Dirección Destino
    { wch: 20 }, // Ciudad Destino
    { wch: 20 }, // Cantón Destino
    { wch: 30 }, // Observaciones
  ]
  worksheet['!cols'] = columnWidths

  // Crear workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Paquetes')

  // Generar nombre del archivo
  const fechaFormato = fecha.replace(/-/g, '')
  const nombreArchivo = nombreArchivoPersonalizado
    ? `${nombreArchivoPersonalizado}-${fechaFormato}.xlsx`
    : numeroRecepcion
      ? `lote-recepcion-grupos-completo-${numeroRecepcion}-${fechaFormato}.xlsx`
      : `lote-recepcion-grupos-completo-${fechaFormato}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, nombreArchivo)
}

/**
 * Genera un archivo Excel filtrando por tipo de paquete y opcionalmente por agencia/destinatario específico
 * @param paquetes Lista completa de paquetes
 * @param tipoPaquete Tipo de paquete a filtrar (AGENCIA, DOMICILIO, etc.)
 * @param fecha Fecha en formato YYYY-MM-DD (ej: 2026-01-08)
 * @param hora Hora en formato HH:mm (ej: 14:50)
 * @param numeroRecepcion Número de recepción para el nombre del archivo
 * @param idAgencia Opcional: ID de agencia específica para filtrar (solo si tipoPaquete es AGENCIA)
 * @param idDestinatario Opcional: ID de destinatario directo específico para filtrar (solo si tipoPaquete es DOMICILIO)
 * @param agenciaPorPaquete Mapa opcional de idPaquete -> idAgencia para agrupación visual
 * @param destinatarioPorPaquete Mapa opcional de idPaquete -> idDestinatarioDirecto para agrupación visual
 * @param agencias Lista opcional de agencias para obtener nombres
 * @param destinatarios Lista opcional de destinatarios directos para obtener nombres
 */
export function generarExcelPorTipo(
  paquetes: Paquete[],
  tipoPaquete: string,
  fecha: string,
  hora: string,
  numeroRecepcion?: string,
  idAgencia?: number,
  idDestinatario?: number,
  agenciaPorPaquete?: Map<number, number>,
  destinatarioPorPaquete?: Map<number, number>,
  agencias?: Agencia[],
  destinatarios?: DestinatarioDirecto[],
  opts?: { filtroDomicilio?: 'TODOS' | 'CON_DESTINATARIO' | 'SIN_DESTINATARIO' }
): void {
  // Filtrar paquetes por tipo o destino
  let paquetesFiltrados: Paquete[]
  if (tipoPaquete === 'AGENCIA' || tipoPaquete === 'DOMICILIO') {
    // Para AGENCIA y DOMICILIO, filtrar por tipoDestino
    paquetesFiltrados = paquetes.filter(p => p.tipoDestino === tipoPaquete)
  } else {
    // Para otros tipos, filtrar por tipoPaquete
    paquetesFiltrados = paquetes.filter(p => p.tipoPaquete === tipoPaquete)
  }

  // Filtrar por agencia si se especifica
  if (tipoPaquete === 'AGENCIA' && idAgencia) {
    paquetesFiltrados = paquetesFiltrados.filter(p => {
      const idAgenciaPaquete = p.idPaquete ? agenciaPorPaquete?.get(p.idPaquete) || p.idAgenciaDestino : p.idAgenciaDestino
      return idAgenciaPaquete === idAgencia
    })
  }

  // Filtrar por destinatario directo si se especifica
  if (tipoPaquete === 'DOMICILIO' && idDestinatario) {
    paquetesFiltrados = paquetesFiltrados.filter(p => {
      const idDestinatarioPaquete = p.idDestinatarioDirecto ?? (p.idPaquete ? destinatarioPorPaquete?.get(p.idPaquete) : undefined)
      return idDestinatarioPaquete === idDestinatario
    })
  }

  // Filtro adicional para DOMICILIO: todos / con destinatario / sin destinatario
  if (tipoPaquete === 'DOMICILIO' && opts?.filtroDomicilio && opts.filtroDomicilio !== 'TODOS') {
    const quiereCon = opts.filtroDomicilio === 'CON_DESTINATARIO'
    paquetesFiltrados = paquetesFiltrados.filter(p => {
      const id = p.idDestinatarioDirecto ?? (p.idPaquete ? destinatarioPorPaquete?.get(p.idPaquete) : undefined)
      return quiereCon ? !!id : !id
    })
  }

  if (paquetesFiltrados.length === 0) {
    const tipoFiltro = (tipoPaquete === 'AGENCIA' || tipoPaquete === 'DOMICILIO') ? 'destino' : 'tipo'
    throw new Error(`No hay paquetes con ${tipoFiltro} ${tipoPaquete} para generar el Excel`)
  }

  // Generar nombre descriptivo del archivo
  let nombreTipo = tipoPaquete
  if (tipoPaquete === 'AGENCIA' && idAgencia && agencias) {
    const agencia = agencias.find(a => a.idAgencia === idAgencia)
    if (agencia) {
      nombreTipo = `AGENCIA_${agencia.nombre.replace(/\s+/g, '_')}${agencia.canton ? `_${agencia.canton.replace(/\s+/g, '_')}` : ''}`
    }
  } else if (tipoPaquete === 'DOMICILIO' && idDestinatario && destinatarios) {
    const destinatario = destinatarios.find(d => d.idDestinatarioDirecto === idDestinatario)
    if (destinatario) {
      nombreTipo = `DOMICILIO_${destinatario.nombreDestinatario.replace(/\s+/g, '_')}`
    }
  } else if (tipoPaquete === 'DOMICILIO' && opts?.filtroDomicilio && opts.filtroDomicilio !== 'TODOS') {
    nombreTipo = `DOMICILIO_${opts.filtroDomicilio === 'CON_DESTINATARIO' ? 'CON_DESTINATARIO' : 'SIN_DESTINATARIO'}`
  }

  // Separar paquetes CLEMENTINA (solo hijos) de paquetes normales
  const paquetesClementina: Paquete[] = []
  const paquetesNormales: Paquete[] = []
  const idsPadresClementina = new Set<number>()

  // Primero identificar padres CLEMENTINA para saber cuáles son los hijos
  paquetesFiltrados.forEach((p) => {
    if (p.tipoPaquete === TipoPaquete.CLEMENTINA && p.idPaquete && !p.idPaquetePadre) {
      idsPadresClementina.add(p.idPaquete)
    }
  })

  // Luego identificar hijos de CLEMENTINA y separar el resto
  paquetesFiltrados.forEach((p) => {
    // Si es hijo de un padre CLEMENTINA, agregarlo a CLEMENTINA (solo hijos, no padres)
    if (p.idPaquetePadre && idsPadresClementina.has(p.idPaquetePadre)) {
      paquetesClementina.push(p)
    }
    // Si no es CLEMENTINA ni hijo de CLEMENTINA, agregarlo a normales
    else if (p.tipoPaquete !== TipoPaquete.CLEMENTINA) {
      paquetesNormales.push(p)
    }
    // Si es CLEMENTINA padre (no tiene padre), agregarlo a normales
    else if (p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre) {
      paquetesNormales.push(p)
    }
  })

  // Si se está exportando por destino, buscar también paquetes clementina hijos 
  // que tengan ese destino (incluso si el padre tiene otro destino)
  if (tipoPaquete === 'AGENCIA' || tipoPaquete === 'DOMICILIO') {
    // Buscar en todos los paquetes del lote, no solo en los filtrados
    const paquetesClementinaHijosPorDestino = paquetes.filter(p => {
      // Debe ser un hijo (tiene padre)
      if (!p.idPaquetePadre) return false

      // Debe tener el destino filtrado
      if (p.tipoDestino !== tipoPaquete) return false

      // Si es AGENCIA y hay idAgencia específico, filtrar por esa agencia
      if (tipoPaquete === 'AGENCIA' && idAgencia) {
        const idAgenciaPaquete = p.idPaquete ? agenciaPorPaquete?.get(p.idPaquete) || p.idAgenciaDestino : p.idAgenciaDestino
        if (idAgenciaPaquete !== idAgencia) return false
      }

      // Si es DOMICILIO y hay idDestinatario específico, filtrar por ese destinatario
      if (tipoPaquete === 'DOMICILIO' && idDestinatario) {
        const idDestinatarioPaquete = p.idDestinatarioDirecto ?? (p.idPaquete ? destinatarioPorPaquete?.get(p.idPaquete) : undefined)
        if (idDestinatarioPaquete !== idDestinatario) return false
      }

      // Filtro adicional para DOMICILIO (con/sin destinatario)
      if (tipoPaquete === 'DOMICILIO' && opts?.filtroDomicilio && opts.filtroDomicilio !== 'TODOS') {
        const quiereCon = opts.filtroDomicilio === 'CON_DESTINATARIO'
        const id = p.idDestinatarioDirecto ?? (p.idPaquete ? destinatarioPorPaquete?.get(p.idPaquete) : undefined)
        if (quiereCon && !id) return false
        if (!quiereCon && !!id) return false
      }

      return true
    })

    // Agregar estos paquetes a la lista de CLEMENTINA (sin duplicados)
    paquetesClementinaHijosPorDestino.forEach(p => {
      if (p.idPaquete && !paquetesClementina.find(existing => existing.idPaquete === p.idPaquete)) {
        paquetesClementina.push(p)
      }
    })
  }

  // Ordenar paquetes CLEMENTINA por ciudad, cantón y referencia
  const paquetesClementinaOrdenados = ordenarPaquetesPorCiudadCantonRef(paquetesClementina)
  // Ordenar paquetes normales por ciudad, cantón y referencia
  const paquetesNormalesOrdenados = ordenarPaquetesPorCiudadCantonRef(paquetesNormales)

  // Verificar si hay paquetes CLEMENTINA hijos para crear la hoja
  const hayPaquetesClementina = paquetesClementinaOrdenados.length > 0

  // Función helper para preparar datos de un paquete
  const prepararDatosPaquete = (paquete: Paquete, incluirNumeroGuiaPadre: boolean = false) => {
    // Construir dirección completa del destino
    const direccionDestino = paquete.direccionDestinatarioCompleta ||
      [
        paquete.direccionDestinatario,
        paquete.cantonDestinatario,
        paquete.ciudadDestinatario,
        paquete.paisDestinatario
      ].filter(Boolean).join(', ') || ''

    if (incluirNumeroGuiaPadre) {
      // Para CLEMENTINA: Número de Guía Padre primero
      return {
        'Número de Guía Padre': paquete.numeroGuiaPaquetePadre || '',
        'Número de Guía': guiaEfectiva(paquete),
        'Referencia': paquete.ref || '',
        'Peso (KG)': paquete.pesoKilos?.toString() || '',
        'Destinatario': paquete.nombreClienteDestinatario || '',
        'Teléfono Destinatario': paquete.telefonoDestinatario || '',
        'Dirección Destino': direccionDestino,
        'Ciudad Destino': paquete.ciudadDestinatario || '',
        'Cantón Destino': paquete.cantonDestinatario || '',
        'Observaciones': paquete.observaciones || '',
      }
    }

    // Para paquetes normales: Número de Guía primero
    return {
      'Número de Guía': guiaEfectiva(paquete),
      'Referencia': paquete.ref || '',
      'Peso (KG)': paquete.pesoKilos?.toString() || '',
      'Destinatario': paquete.nombreClienteDestinatario || '',
      'Teléfono Destinatario': paquete.telefonoDestinatario || '',
      'Dirección Destino': direccionDestino,
      'Ciudad Destino': paquete.ciudadDestinatario || '',
      'Cantón Destino': paquete.cantonDestinatario || '',
      'Observaciones': paquete.observaciones || '',
    }
  }

  // Crear workbook
  const workbook = XLSX.utils.book_new()

  // Crear hoja para CLEMENTINA si hay paquetes clementina hijos
  if (hayPaquetesClementina) {
    const datosClementina = paquetesClementinaOrdenados.map((paquete) =>
      prepararDatosPaquete(paquete, true)
    )
    const worksheetClementina = XLSX.utils.json_to_sheet(datosClementina)

    // Configurar anchos de columna para CLEMENTINA
    const columnWidthsClementina = [
      { wch: 20 }, // Número de Guía Padre
      { wch: 20 }, // Número de Guía (Hijo)
      { wch: 15 }, // Referencia
      { wch: 12 }, // Peso (KG)
      { wch: 25 }, // Destinatario
      { wch: 15 }, // Teléfono Destinatario
      { wch: 40 }, // Dirección Destino
      { wch: 20 }, // Ciudad Destino
      { wch: 20 }, // Cantón Destino
      { wch: 30 }, // Observaciones
    ]
    worksheetClementina['!cols'] = columnWidthsClementina
    XLSX.utils.book_append_sheet(workbook, worksheetClementina, 'CLEMENTINA')
  }

  // Crear hoja para paquetes normales (solo si hay paquetes normales)
  if (paquetesNormalesOrdenados.length > 0) {
    const datosNormales = paquetesNormalesOrdenados.map((paquete) =>
      prepararDatosPaquete(paquete, false)
    )
    const worksheet = XLSX.utils.json_to_sheet(datosNormales)

    // Configurar anchos de columna
    const columnWidths = [
      { wch: 20 }, // Número de Guía
      { wch: 15 }, // Referencia
      { wch: 12 }, // Peso (KG)
      { wch: 25 }, // Destinatario
      { wch: 15 }, // Teléfono Destinatario
      { wch: 40 }, // Dirección Destino
      { wch: 20 }, // Ciudad Destino
      { wch: 20 }, // Cantón Destino
      { wch: 30 }, // Observaciones
    ]
    worksheet['!cols'] = columnWidths

    // Nombre de la hoja: "Paquetes" si hay CLEMENTINA, o mantener "Paquetes" si no hay
    const nombreHojaNormales = paquetesClementinaOrdenados.length > 0
      ? 'Paquetes Normales'
      : 'Paquetes'
    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHojaNormales)
  }

  // Generar nombre personalizado del archivo
  const fechaFormato = fecha.replace(/-/g, '')
  let nombreArchivo = nombreTipo
  if (numeroRecepcion) {
    nombreArchivo = `${nombreTipo}-${numeroRecepcion}-${fechaFormato}.xlsx`
  } else {
    nombreArchivo = `${nombreTipo}-${fechaFormato}.xlsx`
  }

  // Descargar archivo
  XLSX.writeFile(workbook, nombreArchivo)
}

/** Qué exportar en el tracking: NORMAL (normales + padres CLEMENTINA bodega), CLEMENTINA (con subtipos), SEPARAR o CADENITA. */
export type TipoExportacionTracking = 'NORMAL' | 'CLEMENTINA' | 'SEPARAR' | 'CADENITA'
/** Subtipo cuando tipoExportacion es CLEMENTINA: hijas (estado LLEGO...) o padres por observación. */
export type SubTipoClementinaTracking = 'hijas' | 'padres_separar' | 'padres_cadenita' | 'padres_cambio_guia'
/** Modo de filtro CLEMENTINA para exportar tracking: excluir hijas, incluir hijas, o solo CLEMENTINA. */
export type ModoClementinaTracking = 'excluir' | 'incluir' | 'solo'
/** Cuando modoClementina es 'solo': solo hijas, solo padres, o ambas. */
export type SoloClementinaTipo = 'solo_hijas' | 'solo_padres' | 'ambas'
/** Estado de guía en tracking: LLEGO A CENTRO DE ACOPIO QUITO o EDITADA (observaciones cambian). */
export type EstadoGuiaTracking = 'LLEGO A CENTRO DE ACOPIO QUITO' | 'EDITADA'

/** Mensaje cuando no hay paquetes del tipo seleccionado para tracking; mostrar como advertencia/info. */
export const MSG_SIN_PAQUETES_TRACKING =
  'No hay paquetes del tipo seleccionado (clementinas, separar o cadenita) con número de guía en este lote. Tenga en cuenta que el lote puede no contener paquetes del tipo elegido.'

function observacionesContiene(obs: string | undefined, texto: string): boolean {
  if (!obs || !texto) return false
  return obs.toLowerCase().includes(texto.toLowerCase())
}

/**
 * Genera un archivo Excel con formato específico para tracking de otro sistema
 * Formato: FECHA, HORA, HAWB/REFERENCIA, ESTADO DE GUIA, OBSERVACION, REMESA
 * @param paquetes Lista de paquetes a exportar
 * @param fecha Fecha en formato YYYY-MM-DD (ej: 2026-01-08)
 * @param hora Hora en formato HH:mm (ej: 14:50)
 * @param numeroRecepcion Número de recepción opcional para el nombre del archivo
 * @param opciones modoClementina: 'excluir' (sin hijas), 'incluir' (con hijas), 'solo' (solo CLEMENTINA). Se respeta incluirClementinaHijos si no se pasa modoClementina.
 */
export function generarExcelTrackingSistemaExterno(
  paquetes: Paquete[],
  fecha: string,
  hora: string,
  numeroRecepcion?: string,
  opciones?: {
    /** Si se indica, solo se exporta ese tipo: CLEMENTINA (con opciones), SEPARAR o CADENITA */
    tipoExportacion?: TipoExportacionTracking
    /** Cuando tipoExportacion es CLEMENTINA: hijas (estado LLEGO...) o padres por observación. */
    subTipoClementina?: SubTipoClementinaTracking
    incluirClementinaHijos?: boolean
    modoClementina?: ModoClementinaTracking
    soloClementinaTipo?: SoloClementinaTipo
    /** Estado de guía para la columna ESTADO DE GUIA; si EDITADA, observaciones según tipo. */
    estadoGuia?: EstadoGuiaTracking
  }
): void {
  const tipoExportacion = opciones?.tipoExportacion ?? 'CLEMENTINA'
  const subTipoClementina = opciones?.subTipoClementina
  const estadoGuiaDefault = 'LLEGO A CENTRO DE ACOPIO QUITO'
  const estadoGuia = opciones?.estadoGuia ?? estadoGuiaDefault
  const modoSoloClementina = tipoExportacion === 'CLEMENTINA' && opciones?.modoClementina === 'solo' && !subTipoClementina
  const soloTipo = opciones?.soloClementinaTipo ?? 'ambas'
  let paquetesFiltrados: Paquete[]
  let estadoGuiaEfectivo: EstadoGuiaTracking = estadoGuia

  if (tipoExportacion === 'NORMAL') {
    paquetesFiltrados = paquetes.filter(p => !p.idPaquetePadre)
  } else if (tipoExportacion === 'CLEMENTINA' && subTipoClementina === 'hijas') {
    paquetesFiltrados = paquetes.filter(p => p.idPaquetePadre != null)
    estadoGuiaEfectivo = 'LLEGO A CENTRO DE ACOPIO QUITO'
  } else if (tipoExportacion === 'CLEMENTINA' && subTipoClementina === 'padres_separar') {
    paquetesFiltrados = paquetes.filter(
      p => p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre && observacionesContiene(p.observaciones, 'se separo')
    )
    estadoGuiaEfectivo = 'EDITADA'
  } else if (tipoExportacion === 'CLEMENTINA' && subTipoClementina === 'padres_cadenita') {
    paquetesFiltrados = paquetes.filter(
      p => p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre && observacionesContiene(p.observaciones, 'se hizo caja')
    )
    estadoGuiaEfectivo = 'EDITADA'
  } else if (tipoExportacion === 'CLEMENTINA' && subTipoClementina === 'padres_cambio_guia') {
    // Incluir todos los padres CLEMENTINA del lote; la observación se arma con las guías hijas
    paquetesFiltrados = paquetes.filter(
      p => p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre
    )
    estadoGuiaEfectivo = 'EDITADA'
  } else if (tipoExportacion === 'SEPARAR') {
    paquetesFiltrados = paquetes.filter(p => p.tipoPaquete === TipoPaquete.SEPARAR)
  } else if (tipoExportacion === 'CADENITA') {
    paquetesFiltrados = paquetes.filter(p => p.tipoPaquete === TipoPaquete.CADENITA)
  } else if (modoSoloClementina) {
    const baseClementina = paquetes.filter(
      p => p.tipoPaquete === TipoPaquete.CLEMENTINA || p.idPaquetePadre != null
    )
    if (soloTipo === 'solo_hijas') {
      paquetesFiltrados = baseClementina.filter(p => p.idPaquetePadre != null)
    } else if (soloTipo === 'solo_padres') {
      paquetesFiltrados = baseClementina.filter(
        p => p.tipoPaquete === TipoPaquete.CLEMENTINA && p.idPaquetePadre == null
      )
    } else {
      paquetesFiltrados = baseClementina
    }
  } else if (opciones?.modoClementina === 'excluir' || opciones?.incluirClementinaHijos === false) {
    paquetesFiltrados = paquetes.filter(p => !p.idPaquetePadre)
  } else {
    paquetesFiltrados = paquetes
  }

  const useSubTipoClementina = tipoExportacion === 'CLEMENTINA' && !!subTipoClementina
  const paquetesConGuiaSubTipo = useSubTipoClementina
    ? paquetesFiltrados.filter(tieneGuiaEfectiva)
    : null

  // En modo solo CLEMENTINA: incluir paquetes padres aunque no tengan numeroGuia (usaremos guía del primer hijo si hace falta)
  const paquetesParaExportar: Paquete[] = paquetesConGuiaSubTipo !== null
    ? paquetesConGuiaSubTipo
    : modoSoloClementina
      ? paquetesFiltrados
      : paquetesFiltrados.filter(tieneGuiaEfectiva)
  const paquetesConGuia = paquetesConGuiaSubTipo !== null
    ? paquetesConGuiaSubTipo
    : modoSoloClementina
      ? paquetesFiltrados.filter(tieneGuiaEfectiva)
      : paquetesParaExportar

  if (paquetesParaExportar.length === 0 && paquetesConGuia.length === 0) {
    throw new Error(MSG_SIN_PAQUETES_TRACKING)
  }

  // Map padre id -> hijos para observación en tracking CLEMENTINA (padres cambio guía y modo solo CLEMENTINA)
  const hijosPorPadre = new Map<number, Paquete[]>()
  if (modoSoloClementina || (useSubTipoClementina && subTipoClementina === 'padres_cambio_guia')) {
    const todosClementina = paquetes.filter(
      p => p.tipoPaquete === TipoPaquete.CLEMENTINA || p.idPaquetePadre != null
    )
    for (const p of todosClementina) {
      if (p.idPaquetePadre != null) {
        const lista = hijosPorPadre.get(p.idPaquetePadre) || []
        lista.push(p)
        hijosPorPadre.set(p.idPaquetePadre, lista)
      }
    }
  }

  const datos: Array<{ FECHA: string; HORA: string; 'HAWB/REFERENCIA': string; 'ESTADO DE GUIA': string; OBSERVACION: string; REMESA: string }> = []

  const iterar = useSubTipoClementina ? paquetesConGuia : (modoSoloClementina ? paquetesFiltrados : paquetesConGuia)
  for (const paquete of iterar) {
    if (useSubTipoClementina && subTipoClementina) {
      const hawb = guiaEfectiva(paquete)
      if (!hawb) continue
      let observacionSub = ''
      if (subTipoClementina === 'hijas') {
        observacionSub = ''
      } else if (subTipoClementina === 'padres_separar') {
        observacionSub = 'se separo'
      } else if (subTipoClementina === 'padres_cadenita') {
        observacionSub = 'se hizo caja'
      } else if (subTipoClementina === 'padres_cambio_guia') {
        const hijos = paquete.idPaquete != null ? hijosPorPadre.get(paquete.idPaquete) || [] : []
        const guiasHijas = hijos.map((h) => guiaEfectiva(h)).filter((g): g is string => !!g)
        observacionSub = guiasHijas.length > 0 ? 'se cambio guía por ' + guiasHijas.join(', ') : 'se cambio guía'
      }
      datos.push({
        FECHA: fecha,
        HORA: hora,
        'HAWB/REFERENCIA': hawb,
        'ESTADO DE GUIA': estadoGuiaEfectivo,
        OBSERVACION: observacionSub,
        REMESA: '',
      })
      continue
    }

    const esPadreClementina =
      paquete.tipoPaquete === TipoPaquete.CLEMENTINA && paquete.idPaquetePadre == null
    const hijos = esPadreClementina && paquete.idPaquete != null ? hijosPorPadre.get(paquete.idPaquete) || [] : []
    const guiasHijos = hijos
      .map((h) => guiaEfectiva(h))
      .filter((g): g is string => !!g)
    let observacion: string
    if (estadoGuia === 'EDITADA') {
      if (esPadreClementina && guiasHijos.length > 0) {
        observacion = 'se reemplazó por guía ' + guiasHijos.join(', ')
      } else if (esPadreClementina) {
        observacion = 'se reemplazó por guía'
      } else if (paquete.tipoPaquete === TipoPaquete.SEPARAR) {
        observacion = 'se separa'
      } else if (paquete.tipoPaquete === TipoPaquete.CADENITA) {
        observacion = 'Se armó caja'
      } else {
        observacion = ''
      }
    } else {
      if (guiasHijos.length > 0) {
        observacion = `Se cambió por guía ${guiasHijos.join(', ')}`
      } else if (paquete.tipoPaquete === TipoPaquete.SEPARAR) {
        observacion = 'Se separó' + (paquete.observaciones?.trim() ? ' ' + paquete.observaciones.trim() : '')
      } else if (paquete.tipoPaquete === TipoPaquete.CADENITA) {
        observacion = 'Se armó con número de guía de caja ' + (paquete.observaciones?.trim() || '')
      } else {
        observacion = ''
      }
    }
    const hawb = (guiaEfectiva(paquete) || (guiasHijos[0] ?? '')) as string
    if (!modoSoloClementina && !hawb) continue
    if (modoSoloClementina && !hawb) continue
    datos.push({
      FECHA: fecha,
      HORA: hora,
      'HAWB/REFERENCIA': hawb,
      'ESTADO DE GUIA': estadoGuia,
      OBSERVACION: observacion,
      REMESA: '',
    })
  }

  if (datos.length === 0) {
    throw new Error(MSG_SIN_PAQUETES_TRACKING)
  }

  // Crear workbook y worksheet
  const worksheet = XLSX.utils.json_to_sheet(datos)

  // Configurar anchos de columna
  const columnWidths = [
    { wch: 12 }, // FECHA
    { wch: 8 }, // HORA
    { wch: 20 }, // HAWB/REFERENCIA
    { wch: 35 }, // ESTADO DE GUIA
    { wch: 30 }, // OBSERVACION
    { wch: 15 }, // REMESA
  ]
  worksheet['!cols'] = columnWidths

  // Crear workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tracking')

  // Generar nombre del archivo
  const fechaFormato = fecha.replace(/-/g, '')
  const nombreArchivo = numeroRecepcion
    ? `tracking-sistema-externo-${numeroRecepcion}-${fechaFormato}.xlsx`
    : `tracking-sistema-externo-${fechaFormato}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, nombreArchivo)
}

// Interfaces para la estructura de agrupación (Ciudad → Cantón → Bucket → SubRef → TipoDestino → GrupoPersonalizado)
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

/**
 * Genera un archivo Excel específico para paquetes CLEMENTINA hijos
 * Incluye la columna del número de guía del padre y mantiene la agrupación jerárquica
 * @param paquetes Lista de paquetes hijos de CLEMENTINA
 * @param fecha Fecha en formato YYYY-MM-DD (ej: 2026-01-08)
 * @param hora Hora en formato HH:mm (ej: 14:50)
 * @param numeroRecepcion Número de recepción opcional para el nombre del archivo
 * @param tipoDestino Tipo de distribución opcional para filtrar
 * @param idAgencia ID de agencia opcional para filtrar (solo si tipoDestino es AGENCIA)
 * @param paquetesAgrupados Estructura de agrupación jerárquica (opcional)
 * @param paqueteAGrupoPersonalizado Mapa de paquetes a grupos personalizados (opcional)
 */
export function generarExcelClementinaHijos(
  paquetes: Paquete[],
  fecha: string,
  hora: string,
  numeroRecepcion?: string,
  tipoDestino?: TipoDestino,
  idAgencia?: number,
  paquetesAgrupados?: PaquetesPorCiudad,
  paqueteAGrupoPersonalizado?: Map<number, GrupoPersonalizadoLocal>
): void {
  // Filtrar solo paquetes que tengan guía (propia o origen del padre)
  let paquetesConGuia = paquetes.filter(tieneGuiaEfectiva)

  // Aplicar filtros si se proporcionan
  if (tipoDestino) {
    paquetesConGuia = paquetesConGuia.filter(p => p.tipoDestino === tipoDestino)
  }
  if (tipoDestino === TipoDestino.AGENCIA && idAgencia) {
    paquetesConGuia = paquetesConGuia.filter(p => p.idAgenciaDestino === idAgencia)
  }

  if (paquetesConGuia.length === 0) {
    throw new Error('No hay paquetes con número de guía para generar el Excel')
  }

  // Crear un Set de IDs de paquetes filtrados para verificación rápida
  const idsPaquetesFiltrados = new Set(paquetesConGuia.map(p => p.idPaquete).filter((id): id is number => !!id))

  // Función helper para contar paquetes en un grupo
  const contarPaquetes = (paquetesGrupo: Paquete[]): number => {
    return paquetesGrupo.filter(p => p.idPaquete && idsPaquetesFiltrados.has(p.idPaquete)).length
  }

  // Función helper para ordenar claves alfabéticamente
  const ordenarClaves = (claves: string[]): string[] => {
    return [...claves].sort((a, b) => a.localeCompare(b))
  }

  // Preparar datos usando array of arrays para mantener agrupación
  const datos: (string | number)[][] = []

  // Encabezados de columna
  const encabezados = [
    'Número de Guía',
    'Número de Guía Padre',
    'Tipo Destino',
    'Agencia Destino',
    'Peso (KG)',
    'Destinatario',
    'Teléfono Destinatario',
    'Dirección Destino',
    'Ciudad Destino',
    'Cantón Destino',
    'Observaciones'
  ]
  datos.push(encabezados)

  // Si hay estructura de agrupación, usarla (Ciudad → Cantón → Bucket → SubRef → TipoDestino → GrupoPersonalizado)
  if (paquetesAgrupados && paqueteAGrupoPersonalizado) {
    ordenarClaves(Object.keys(paquetesAgrupados)).forEach((ciudad) => {
      const cantones = paquetesAgrupados[ciudad]
      let totalCiudad = 0
      Object.values(cantones).forEach(buckets => {
        Object.values(buckets).forEach(subRefs => {
          Object.values(subRefs).forEach(tiposDestino => {
            Object.values(tiposDestino).forEach(grupo => {
              totalCiudad += contarPaquetes(grupo)
            })
          })
        })
      })
      if (totalCiudad === 0) return

      datos.push([`CIUDAD: ${ciudad} (${totalCiudad} paquete${totalCiudad !== 1 ? 's' : ''})`])
      datos.push([])

      ordenarClaves(Object.keys(cantones)).forEach((canton) => {
        const buckets = cantones[canton]
        let totalCanton = 0
        Object.values(buckets).forEach(subRefs => {
          Object.values(subRefs).forEach(tiposDestino => {
            Object.values(tiposDestino).forEach(grupo => {
              totalCanton += contarPaquetes(grupo)
            })
          })
        })
        if (totalCanton === 0) return

        datos.push([`  CANTÓN: ${canton} (${totalCanton} paquete${totalCanton !== 1 ? 's' : ''})`])
        datos.push([])

        ordenarClaves(Object.keys(buckets)).forEach((bucketKey) => {
          const subRefs = buckets[bucketKey]
          const esAgencia = bucketKey.startsWith('AGENCIA|')
          const esDestinatario = bucketKey.startsWith('DESTINATARIO|')
          const labelBucket = esAgencia ? bucketKey.replace(/^AGENCIA\|[^|]+\|/, '') : esDestinatario ? `Destinatario #${bucketKey.split('|')[1]}` : bucketKey.replace(/^REF\|/, '')

          ordenarClaves(Object.keys(subRefs)).forEach((subRefKey) => {
            const tiposDestino = subRefs[subRefKey]
            const refTxt = subRefKey.replace(/^REF\|/, '')
            const mostrarRef = subRefKey !== '__SIN_SUBREF__' && refTxt

            ordenarClaves(Object.keys(tiposDestino)).forEach((tipoDestino) => {
              const gruposPersonalizados = tiposDestino[tipoDestino]
              let totalTipoDestino = 0
              Object.values(gruposPersonalizados).forEach(grupo => {
                totalTipoDestino += contarPaquetes(grupo)
              })
              if (totalTipoDestino === 0) return

              datos.push([`    BUCKET: ${labelBucket}${mostrarRef ? ` / REF: ${refTxt}` : ''} / TIPO DESTINO: ${tipoDestino} (${totalTipoDestino} paquete${totalTipoDestino !== 1 ? 's' : ''})`])
              datos.push([])

              ordenarClaves(Object.keys(gruposPersonalizados)).sort((a, b) => {
                if (a === 'Sin grupo') return 1
                if (b === 'Sin grupo') return -1
                const numA = parseInt(a.replace('Grupo ', '')) || 0
                const numB = parseInt(b.replace('Grupo ', '')) || 0
                return numA - numB
              }).forEach((grupoKey) => {
                const paquetesGrupo = gruposPersonalizados[grupoKey]
                const paquetesFiltradosGrupo = paquetesGrupo.filter(p => p.idPaquete && idsPaquetesFiltrados.has(p.idPaquete))

                if (paquetesFiltradosGrupo.length === 0) return

                const paquetesOrdenadosGrupo = ordenarPaquetesPorCiudadCantonRef(paquetesFiltradosGrupo)

                datos.push([`      GRUPO: ${grupoKey} (${paquetesOrdenadosGrupo.length} paquete${paquetesOrdenadosGrupo.length !== 1 ? 's' : ''})`])
                datos.push([])

                paquetesOrdenadosGrupo.forEach((paquete) => {
                  const direccionDestino = paquete.direccionDestinatarioCompleta ||
                    [
                      paquete.direccionDestinatario,
                      paquete.cantonDestinatario,
                      paquete.ciudadDestinatario,
                      paquete.paisDestinatario
                    ].filter(Boolean).join(', ') || ''

                  datos.push([
                    guiaEfectiva(paquete),
                    paquete.numeroGuiaPaquetePadre || '',
                    paquete.tipoDestino || '',
                    paquete.nombreAgenciaDestino || '',
                    paquete.pesoKilos?.toString() || '',
                    paquete.nombreClienteDestinatario || '',
                    paquete.telefonoDestinatario || '',
                    direccionDestino,
                    paquete.ciudadDestinatario || '',
                    paquete.cantonDestinatario || '',
                    paquete.observaciones || '',
                  ])
                })

                datos.push([]) // Fila en blanco después del grupo
              })
            })
          })
        })
        datos.push([]) // Fila en blanco después del cantón
      })

      datos.push([]) // Fila en blanco después de la ciudad
    })
  } else {
    // Si no hay estructura de agrupación, exportar de forma plana (compatibilidad hacia atrás)
    // Ordenar paquetes por ciudad, cantón y referencia
    const paquetesOrdenados = ordenarPaquetesPorCiudadCantonRef(paquetesConGuia)
    paquetesOrdenados.forEach((paquete) => {
      const direccionDestino = paquete.direccionDestinatarioCompleta ||
        [
          paquete.direccionDestinatario,
          paquete.cantonDestinatario,
          paquete.ciudadDestinatario,
          paquete.paisDestinatario
        ].filter(Boolean).join(', ') || ''

      datos.push([
        guiaEfectiva(paquete),
        paquete.numeroGuiaPaquetePadre || '',
        paquete.tipoDestino || '',
        paquete.nombreAgenciaDestino || '',
        paquete.pesoKilos?.toString() || '',
        paquete.nombreClienteDestinatario || '',
        paquete.telefonoDestinatario || '',
        direccionDestino,
        paquete.ciudadDestinatario || '',
        paquete.cantonDestinatario || '',
        paquete.observaciones || '',
      ])
    })
  }

  // Crear worksheet usando array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(datos)

  // Configurar anchos de columna
  const columnWidths = [
    { wch: 20 }, // Número de Guía
    { wch: 20 }, // Número de Guía Padre
    { wch: 18 }, // Tipo de Distribución
    { wch: 25 }, // Agencia Destino
    { wch: 12 }, // Peso (KG)
    { wch: 25 }, // Destinatario
    { wch: 15 }, // Teléfono Destinatario
    { wch: 40 }, // Dirección Destino
    { wch: 20 }, // Ciudad Destino
    { wch: 20 }, // Cantón Destino
    { wch: 30 }, // Observaciones
  ]
  worksheet['!cols'] = columnWidths

  // Crear workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CLEMENTINA Hijos')

  // Generar nombre del archivo
  const fechaFormato = fecha.replace(/-/g, '')
  let nombreArchivo = numeroRecepcion
    ? `clementina-hijos-${numeroRecepcion}-${fechaFormato}.xlsx`
    : `clementina-hijos-${fechaFormato}.xlsx`

  // Agregar sufijo según filtros
  if (tipoDestino) {
    nombreArchivo = nombreArchivo.replace('.xlsx', `-${tipoDestino}.xlsx`)
  }
  if (tipoDestino === TipoDestino.AGENCIA && idAgencia) {
    nombreArchivo = nombreArchivo.replace('.xlsx', `-agencia-${idAgencia}.xlsx`)
  }

  // Descargar archivo
  XLSX.writeFile(workbook, nombreArchivo)
}
