import {
  ResumenDestinoDespacho,
  type ResumenDestinoData,
  type ResumenSacaDetalle,
} from '@/components/despacho/ResumenDestinoDespacho'
import { CopyActionButton } from '@/components/ui/copy-action-button'
import type { DespachoRapido, DespachoRapidoPaquete } from '@/types/despacho-rapido'
import { TamanoSaca } from '@/types/saca'
import { capacidadMaximaKg } from '@/utils/saca'
import { formatearTamanoSaca } from '@/utils/ensacado'
import { ClipboardCopy } from 'lucide-react'
import { useMemo } from 'react'

function valor(v?: string | number | null): string | undefined {
  const text = v?.toString().trim()
  return text ? text : undefined
}

function formatKg(value: number): string {
  return `${value.toFixed(2)} kg`
}

function paquetesDelDespacho(despacho: DespachoRapido): DespachoRapidoPaquete[] {
  return despacho.sacas.flatMap((saca) => saca.paquetes)
}

function primeraCoincidencia(
  paquetes: DespachoRapidoPaquete[],
  selector: (paquete: DespachoRapidoPaquete) => string | undefined | null
): string | undefined {
  for (const paquete of paquetes) {
    const value = valor(selector(paquete))
    if (value) return value
  }
  return undefined
}

function construirUbicacion(...partes: Array<string | undefined | null>): string | undefined {
  const limpias = partes.map(valor).filter(Boolean) as string[]
  return limpias.length > 0 ? limpias.join(' / ') : undefined
}

function construirDetalleSacas(despacho: DespachoRapido): ResumenSacaDetalle[] {
  return despacho.sacas.map((saca) => {
    const paquetes = saca.paquetes.map((paquete) => ({
      idPaquete: paquete.idPaquete,
      numeroGuia: paquete.numeroGuia,
      pesoKg: Number(paquete.pesoKilos ?? 0),
    }))
    const pesoKg = paquetes.reduce((acc, paquete) => acc + paquete.pesoKg, 0)
    const tamano = saca.tamano ?? TamanoSaca.INDIVIDUAL

    return {
      numeroOrden: saca.numeroOrden,
      tamanoLabel: saca.tamano ? formatearTamanoSaca(saca.tamano) : 'Sin tamano',
      capacidadKg: saca.tamano ? capacidadMaximaKg(tamano) : 0,
      pesoKg,
      totalPaquetes: saca.paquetes.length,
      paquetes,
    }
  })
}

function sacasPorTamano(sacas: ResumenSacaDetalle[]): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const saca of sacas) {
    counts.set(saca.tamanoLabel, (counts.get(saca.tamanoLabel) ?? 0) + 1)
  }
  return Array.from(counts, ([label, count]) => ({ label, count }))
}

function construirResumenData(despacho: DespachoRapido): ResumenDestinoData {
  const paquetes = paquetesDelDespacho(despacho)
  const sacasDetalle = construirDetalleSacas(despacho)
  const pesoTotalKg = sacasDetalle.reduce((acc, saca) => acc + saca.pesoKg, 0)
  const esAgencia = Boolean(despacho.idAgencia || despacho.nombreAgencia)

  const telefonoPaquete = primeraCoincidencia(paquetes, (paquete) => paquete.telefonoDestinatario)
  const direccionPaquete = primeraCoincidencia(
    paquetes,
    (paquete) => paquete.direccionDestinatarioDirecto ?? paquete.direccionDestinatario
  )
  const ubicacionPaquete = construirUbicacion(
    primeraCoincidencia(paquetes, (paquete) => paquete.cantonDestinatarioDirecto ?? paquete.cantonDestinatario),
    primeraCoincidencia(paquetes, (paquete) => paquete.provinciaDestinatario)
  )

  return {
    tipoLabel: esAgencia ? 'Agencia' : 'Destinatario directo',
    nombre: esAgencia ? despacho.nombreAgencia : despacho.nombreDestinatarioDirecto,
    nombreEmpresa: esAgencia ? undefined : despacho.nombreEmpresaDestinatarioDirecto,
    codigoDestino: esAgencia ? despacho.codigoAgencia : despacho.codigoDestinatarioDirecto,
    telefono: esAgencia ? despacho.telefonoAgencia ?? telefonoPaquete : despacho.telefonoDestinatarioDirecto ?? telefonoPaquete,
    direccion: esAgencia
      ? despacho.direccionAgencia ?? direccionPaquete
      : despacho.direccionDestinatarioDirecto ?? direccionPaquete,
    ubicacion: esAgencia
      ? construirUbicacion(despacho.cantonAgencia) ?? ubicacionPaquete
      : construirUbicacion(despacho.cantonDestinatarioDirecto) ?? ubicacionPaquete,
    pesoTotalKg,
    totalSacas: despacho.totalSacas,
    totalPaquetes: despacho.totalPaquetes,
    sacasPorTamano: sacasPorTamano(sacasDetalle),
    sacasDetalle,
  }
}

function construirBloqueSistemaExterno(despacho: DespachoRapido, data: ResumenDestinoData): string {
  const lineas: string[] = []
  lineas.push(`Despacho: ${despacho.numeroManifiesto ?? `#${despacho.idDespacho}`}`)
  if (valor(data.codigoDestino)) lineas.push(`Codigo destinatario: ${data.codigoDestino}`)
  if (valor(data.nombre)) lineas.push(`Destinatario: ${data.nombre}`)
  if (valor(data.nombreEmpresa)) lineas.push(`Empresa: ${data.nombreEmpresa}`)
  if (valor(data.telefono)) lineas.push(`Telefono: ${data.telefono}`)
  if (valor(data.direccion)) lineas.push(`Direccion: ${data.direccion}`)
  if (valor(data.ubicacion)) lineas.push(`Ciudad/Canton/Provincia: ${data.ubicacion}`)
  lineas.push(`Total sacas: ${data.totalSacas}`)
  lineas.push(`Total paquetes: ${data.totalPaquetes}`)
  lineas.push(`Peso total: ${formatKg(data.pesoTotalKg)}`)
  if (data.sacasPorTamano?.length) {
    lineas.push(`Sacas por tamano: ${data.sacasPorTamano.map((saca) => `${saca.count} ${saca.label}`).join(', ')}`)
  }
  lineas.push('')
  lineas.push('Detalle de sacas:')
  data.sacasDetalle?.forEach((saca) => {
    lineas.push(`Saca ${saca.numeroOrden}: ${saca.tamanoLabel} | ${formatKg(saca.pesoKg)} | ${saca.totalPaquetes} paquete(s)`)
    if (saca.paquetes.length > 0) {
      lineas.push(`Guias: ${saca.paquetes.map((paquete) => paquete.numeroGuia).join(', ')}`)
    }
  })

  return lineas.join('\n')
}

interface DespachoRapidoResumenCopiableProps {
  despacho: DespachoRapido
}

export function DespachoRapidoResumenCopiable({ despacho }: DespachoRapidoResumenCopiableProps) {
  const data = useMemo(() => construirResumenData(despacho), [despacho])
  const bloqueSistemaExterno = useMemo(() => construirBloqueSistemaExterno(despacho, data), [despacho, data])

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Lista para guia</p>
          <p className="text-xs text-muted-foreground">Campos copiables para crear la guia externa.</p>
        </div>
        <CopyActionButton
          textToCopy={bloqueSistemaExterno}
          successMessage="Bloque para guia copiado"
          errorMessage="No se pudo copiar el bloque para guia"
          title="Copiar bloque para sistema externo"
          size="sm"
          className="h-8 gap-1.5"
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Copiar todo
        </CopyActionButton>
      </div>

      <ResumenDestinoDespacho data={data} />
    </div>
  )
}
