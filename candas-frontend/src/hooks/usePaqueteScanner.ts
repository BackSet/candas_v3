import { useState, useEffect, useRef } from 'react'
import { notify } from '@/lib/notify'
import type { Paquete } from '@/types/paquete'

export function usePaqueteScanner(
  paquetesDisponibles: Paquete[],
  onPaqueteEncontrado: (paquete: Paquete) => void,
  enabled: boolean = true
) {
  const [busqueda, setBusqueda] = useState('')
  const [ultimoCodigoEscaneado, setUltimoCodigoEscaneado] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const buscarPaquetePorCodigo = (codigo: string): Paquete | undefined => {
    return paquetesDisponibles.find(
      p => p.numeroGuia?.toUpperCase() === codigo.toUpperCase() ||
           p.idPaquete?.toString() === codigo
    )
  }

  // Efecto para detectar escaneo automático
  useEffect(() => {
    if (!enabled || !busqueda || busqueda.length < 10) {
      return
    }

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Esperar 300ms después de la última entrada para detectar si es un escáner
    timeoutRef.current = setTimeout(() => {
      const paqueteEncontrado = buscarPaquetePorCodigo(busqueda)
      if (paqueteEncontrado) {
        onPaqueteEncontrado(paqueteEncontrado)
        // Limpiar búsqueda después de un momento
        setTimeout(() => {
          setBusqueda('')
          setUltimoCodigoEscaneado('')
        }, 500)
      } else if (busqueda.length >= 10) {
        // Código escaneado pero no encontrado
        notify.error(`No se encontró un paquete con el código: ${busqueda}`)
        setTimeout(() => {
          setBusqueda('')
          setUltimoCodigoEscaneado('')
        }, 1000)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [busqueda, enabled, onPaqueteEncontrado])

  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)
    setUltimoCodigoEscaneado(value)
  }

  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busqueda.trim()) {
      e.preventDefault()
      const paqueteEncontrado = buscarPaquetePorCodigo(busqueda.trim())
      if (paqueteEncontrado) {
        onPaqueteEncontrado(paqueteEncontrado)
        setBusqueda('')
      } else {
        notify.error('No se encontró un paquete con ese código')
      }
    }
  }

  const limpiarBusqueda = () => {
    setBusqueda('')
    setUltimoCodigoEscaneado('')
  }

  return {
    busqueda,
    setBusqueda,
    handleBusquedaChange,
    handleBusquedaKeyDown,
    limpiarBusqueda,
    buscarPaquetePorCodigo,
  }
}
