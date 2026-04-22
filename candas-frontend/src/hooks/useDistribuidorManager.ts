import { useState } from 'react'
import { notify } from '@/lib/notify'
import { useQueryClient } from '@tanstack/react-query'
import { useBuscarOCrearDistribuidor, useCreateDistribuidor } from './useDistribuidores'

export function useDistribuidorManager(onDistribuidorCreado?: (idDistribuidor: number) => void) {
  const [nuevoDistribuidorNombre, setNuevoDistribuidorNombre] = useState('')
  const [nuevoDistribuidorCodigo, setNuevoDistribuidorCodigo] = useState('')
  const [nuevoDistribuidorEmail, setNuevoDistribuidorEmail] = useState('')
  const [crearNuevoDistribuidor, setCrearNuevoDistribuidor] = useState(false)
  const queryClient = useQueryClient()
  const buscarOCrearMutation = useBuscarOCrearDistribuidor()
  const createMutation = useCreateDistribuidor()

  const handleCrearDistribuidor = async () => {
    if (!nuevoDistribuidorNombre.trim()) {
      notify.error('El nombre del distribuidor es requerido')
      return
    }

    // Validar email si se proporciona
    if (nuevoDistribuidorEmail && nuevoDistribuidorEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(nuevoDistribuidorEmail.trim())) {
        notify.error('El email proporcionado no es válido')
        return
      }
    }

    try {
      const hasEmail = nuevoDistribuidorEmail?.trim()

      const nuevoDistribuidor = hasEmail
        ? await createMutation.mutateAsync({
            nombre: nuevoDistribuidorNombre.trim(),
            codigo: nuevoDistribuidorCodigo?.trim() || undefined,
            email: hasEmail || undefined,
            activa: true,
          })
        : await buscarOCrearMutation.mutateAsync({
            nombre: nuevoDistribuidorNombre,
            codigo: nuevoDistribuidorCodigo || undefined,
          })

      await queryClient.invalidateQueries({ queryKey: ['distribuidores'] })

      if (nuevoDistribuidor.idDistribuidor) {
        await new Promise(resolve => setTimeout(resolve, 100))
        onDistribuidorCreado?.(nuevoDistribuidor.idDistribuidor)
      }

      setCrearNuevoDistribuidor(false)
      setNuevoDistribuidorNombre('')
      setNuevoDistribuidorCodigo('')
      setNuevoDistribuidorEmail('')
      notify.success('Distribuidor creado y seleccionado exitosamente')
    } catch {
      // Error ya manejado en el hook
    }
  }

  const reset = () => {
    setNuevoDistribuidorNombre('')
    setNuevoDistribuidorCodigo('')
    setNuevoDistribuidorEmail('')
    setCrearNuevoDistribuidor(false)
  }

  return {
    nuevoDistribuidorNombre,
    setNuevoDistribuidorNombre,
    nuevoDistribuidorCodigo,
    setNuevoDistribuidorCodigo,
    nuevoDistribuidorEmail,
    setNuevoDistribuidorEmail,
    crearNuevoDistribuidor,
    setCrearNuevoDistribuidor,
    handleCrearDistribuidor,
    reset,
    isLoading: buscarOCrearMutation.isPending || createMutation.isPending,
  }
}
