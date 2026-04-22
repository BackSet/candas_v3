import { useState, useCallback } from 'react'
import { notify } from '@/lib/notify'
import { TamanoSaca } from '@/types/saca'

export interface SacaFormData {
  tamano: TamanoSaca
  idPaquetes: number[]
}

export function useSacasManager(initialSacas: SacaFormData[] = []) {
  const [sacas, setSacas] = useState<SacaFormData[]>(initialSacas)

  const agregarSaca = useCallback(() => {
    setSacas((prev) => [...prev, { tamano: TamanoSaca.PEQUENO, idPaquetes: [] }])
  }, [])

  const eliminarSaca = useCallback((index: number) => {
    setSacas((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const actualizarTamanoSaca = useCallback((index: number, tamano: TamanoSaca) => {
    setSacas((prev) => {
      const nuevas = [...prev]
      nuevas[index].tamano = tamano
      return nuevas
    })
  }, [])

  const agregarPaqueteASaca = useCallback((sacaIndex: number, paqueteId: number) => {
    setSacas((prev) => {
      const nuevas = [...prev]
      if (!nuevas[sacaIndex].idPaquetes.includes(paqueteId)) {
        nuevas[sacaIndex].idPaquetes.push(paqueteId)
        notify.success('Paquete agregado a la saca')
      } else {
        notify.info('El paquete ya está en la saca')
      }
      return nuevas
    })
  }, [])

  const eliminarPaqueteDeSaca = useCallback((sacaIndex: number, paqueteId: number) => {
    setSacas((prev) => {
      const nuevas = [...prev]
      nuevas[sacaIndex].idPaquetes = nuevas[sacaIndex].idPaquetes.filter(id => id !== paqueteId)
      return nuevas
    })
    notify.success('Paquete eliminado de la saca')
  }, [])

  const moverPaqueteASaca = useCallback((paqueteId: number, sacaOrigenIndex: number, sacaDestinoIndex: number) => {
    setSacas((prev) => {
      const nuevas = [...prev]
      // Eliminar de la saca origen
      nuevas[sacaOrigenIndex].idPaquetes = nuevas[sacaOrigenIndex].idPaquetes.filter(id => id !== paqueteId)
      // Agregar a la saca destino si no está ya
      if (!nuevas[sacaDestinoIndex].idPaquetes.includes(paqueteId)) {
        nuevas[sacaDestinoIndex].idPaquetes.push(paqueteId)
      }
      return nuevas
    })
    notify.success('Paquete movido a otra saca')
  }, [])

  const agregarPaquetesPorListado = useCallback((
    sacaIndex: number,
    numerosGuia: string[],
    paquetesDisponibles: Array<{ idPaquete?: number; numeroGuia?: string }>
  ) => {
    let encontrados = 0
    let noEncontrados: string[] = []
    let yaAgregados = 0

    setSacas((prev) => {
      const nuevas = [...prev]

      numerosGuia.forEach((numeroGuia) => {
        const paquete = paquetesDisponibles.find(
          p => p.numeroGuia?.toUpperCase() === numeroGuia.toUpperCase() ||
               p.idPaquete?.toString() === numeroGuia
        )

        if (paquete && paquete.idPaquete) {
          // Verificar si ya está en otra saca
          const paqueteEnOtraSaca = nuevas.findIndex((s, idx) =>
            idx !== sacaIndex &&
            s.idPaquetes.includes(paquete.idPaquete!)
          )

          if (paqueteEnOtraSaca !== -1) {
            // Remover de la otra saca
            nuevas[paqueteEnOtraSaca].idPaquetes =
              nuevas[paqueteEnOtraSaca].idPaquetes.filter(id => id !== paquete.idPaquete)
          }

          // Agregar a la saca actual si no está
          if (!nuevas[sacaIndex].idPaquetes.includes(paquete.idPaquete)) {
            nuevas[sacaIndex].idPaquetes.push(paquete.idPaquete)
            encontrados++
          } else {
            yaAgregados++
          }
        } else {
          noEncontrados.push(numeroGuia)
        }
      })

      return nuevas
    })

    // Mostrar resumen
    if (encontrados > 0) {
      notify.success(`${encontrados} paquete(s) agregado(s) a la saca`)
    }
    if (yaAgregados > 0) {
      notify.info(`${yaAgregados} paquete(s) ya estaban en la saca`)
    }
    if (noEncontrados.length > 0) {
      notify.error(`${noEncontrados.length} paquete(s) no encontrado(s): ${noEncontrados.slice(0, 5).join(', ')}${noEncontrados.length > 5 ? '...' : ''}`)
    }
  }, [])

  const validarSacas = useCallback((): string | null => {
    if (sacas.length === 0) {
      return 'Debe haber al menos una saca en el despacho'
    }

    for (let i = 0; i < sacas.length; i++) {
      if (sacas[i].idPaquetes.length === 0) {
        return `La saca ${i + 1} debe tener al menos un paquete`
      }
    }

    return null
  }, [sacas])

  return {
    sacas,
    setSacas,
    agregarSaca,
    eliminarSaca,
    actualizarTamanoSaca,
    agregarPaqueteASaca,
    eliminarPaqueteDeSaca,
    moverPaqueteASaca,
    agregarPaquetesPorListado,
    validarSacas,
  }
}
