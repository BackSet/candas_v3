import { useState } from 'react'
import { toast } from 'sonner'
import { useSearchDestinatariosDirectos, useCreateDestinatarioDirecto } from './useDestinatariosDirectos'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'

export function useDestinatarioDirectoManager(
  onDestinatarioSeleccionado?: (destinatario: DestinatarioDirecto) => void
) {
  const [busqueda, setBusqueda] = useState('')
  const [destinatarioSeleccionado, setDestinatarioSeleccionado] = useState<DestinatarioDirecto | null>(null)
  const [showCrearClienteDialog, setShowCrearClienteDialog] = useState(false)
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('')
  const [nuevoClienteDireccion, setNuevoClienteDireccion] = useState('')
  const [nuevoClienteCanton, setNuevoClienteCanton] = useState('')

  const { data: resultados } = useSearchDestinatariosDirectos(busqueda)
  const createMutation = useCreateDestinatarioDirecto()

  const handleSeleccionarDestinatario = (destinatario: DestinatarioDirecto) => {
    setDestinatarioSeleccionado(destinatario)
    if (onDestinatarioSeleccionado) {
      onDestinatarioSeleccionado(destinatario)
    }
  }

  const handleCrearCliente = async () => {
    if (!nuevoClienteNombre.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }

    if (!nuevoClienteTelefono.trim()) {
      toast.error('El teléfono del cliente es requerido')
      return
    }

    try {
      const nuevoCliente = await createMutation.mutateAsync({
        nombreDestinatario: nuevoClienteNombre.trim(),
        telefonoDestinatario: nuevoClienteTelefono.trim(),
        direccionDestinatario: nuevoClienteDireccion.trim() || undefined,
        canton: nuevoClienteCanton.trim() || undefined,
      })

      setShowCrearClienteDialog(false)
      setBusqueda('') // Limpiar búsqueda para mostrar el nuevo destinatario
      setNuevoClienteNombre('')
      setNuevoClienteTelefono('')
      setNuevoClienteDireccion('')
      setNuevoClienteCanton('')
      
      if (nuevoCliente && onDestinatarioSeleccionado) {
        onDestinatarioSeleccionado(nuevoCliente)
      }
      
      toast.success('Destinatario directo creado exitosamente')
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  const reset = () => {
    setBusqueda('')
    setDestinatarioSeleccionado(null)
    setShowCrearClienteDialog(false)
    setNuevoClienteNombre('')
    setNuevoClienteTelefono('')
    setNuevoClienteDireccion('')
    setNuevoClienteCanton('')
  }

  return {
    busqueda,
    setBusqueda,
    destinatarioSeleccionado,
    setDestinatarioSeleccionado,
    handleSeleccionarDestinatario,
    resultados: resultados || [],
    showCrearClienteDialog,
    setShowCrearClienteDialog,
    nuevoClienteNombre,
    setNuevoClienteNombre,
    nuevoClienteTelefono,
    setNuevoClienteTelefono,
    nuevoClienteDireccion,
    setNuevoClienteDireccion,
    nuevoClienteCanton,
    setNuevoClienteCanton,
    handleCrearCliente,
    reset,
    isLoading: createMutation.isPending,
  }
}
