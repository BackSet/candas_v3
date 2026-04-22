import { useState, useMemo } from 'react'
import { notify } from '@/lib/notify'
import { useClientes, useCreateCliente } from './useClientes'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { clienteService } from '@/lib/api/cliente.service'
import { type Cliente } from '@/types/cliente'
import { clienteFormDataToDto, type ClienteFormData } from '@/schemas/cliente'

export function useClienteManager(
  onClienteSeleccionado?: (cliente: Cliente) => void
) {
  const [busqueda, setBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [showCrearClienteDialog, setShowCrearClienteDialog] = useState(false)
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [nuevoClienteDocumento, setNuevoClienteDocumento] = useState('')
  const [nuevoClienteEmail, setNuevoClienteEmail] = useState('')
  const [nuevoClientePais, setNuevoClientePais] = useState('')
  const [nuevoClienteProvincia, setNuevoClienteProvincia] = useState('')
  const [nuevoClienteCanton, setNuevoClienteCanton] = useState('')
  const [nuevoClienteDireccion, setNuevoClienteDireccion] = useState('')
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('')

  // Obtener todos los clientes (solo cuando no hay búsqueda activa)
  const { data: clientesData, isLoading: loadingClientes } = useClientes({ page: 0, size: 1000 })
  
  // Búsqueda en el backend cuando hay una búsqueda activa
  const { data: clientesBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['clientes', 'search', busqueda],
    queryFn: () => clienteService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000, // Cache por 30 segundos
  })
  
  const createMutation = useCreateCliente()
  const queryClient = useQueryClient()

  // Filtrar clientes basado en la búsqueda
  const resultados = useMemo(() => {
    // Si hay búsqueda activa, usar resultados del backend
    if (busqueda.trim().length > 0) {
      if (!clientesBusqueda) {
        return []
      }
      return clientesBusqueda
    }
    
    // Si no hay búsqueda, usar todos los clientes cargados
    if (!clientesData?.content) {
      return []
    }
    
    return clientesData.content
  }, [clientesData, clientesBusqueda, busqueda])

  const handleSeleccionarCliente = (cliente: Cliente) => {
    if (!cliente.idCliente) {
      notify.error('Error: El cliente no tiene un ID válido')
      return
    }
    setClienteSeleccionado(cliente)
    if (onClienteSeleccionado) {
      onClienteSeleccionado(cliente)
    }
    setBusqueda('') // Limpiar búsqueda después de seleccionar
  }

  const handleCrearCliente = async () => {
    if (!nuevoClienteNombre.trim()) {
      notify.error('El nombre del cliente es requerido')
      return
    }

    const formData: ClienteFormData = {
      nombreCompleto: nuevoClienteNombre.trim(),
      documentoIdentidad: nuevoClienteDocumento || undefined,
      email: nuevoClienteEmail || undefined,
      pais: nuevoClientePais || undefined,
      provincia: nuevoClienteProvincia || undefined,
      canton: nuevoClienteCanton || undefined,
      direccion: nuevoClienteDireccion || undefined,
      telefono: nuevoClienteTelefono || undefined,
      activo: true,
    }
    const dto = clienteFormDataToDto(formData)

    try {
      const nuevoCliente = await createMutation.mutateAsync(dto)

      // Invalidar queries para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      
      // Recargar los clientes para que el nuevo aparezca en el buscador
      await queryClient.refetchQueries({ queryKey: ['clientes'] })

      setShowCrearClienteDialog(false)
      setNuevoClienteNombre('')
      setNuevoClienteDocumento('')
      setNuevoClienteEmail('')
      setNuevoClientePais('')
      setNuevoClienteProvincia('')
      setNuevoClienteCanton('')
      setNuevoClienteDireccion('')
      setNuevoClienteTelefono('')
      
      // Seleccionar automáticamente el cliente creado
      if (nuevoCliente) {
        setClienteSeleccionado(nuevoCliente)
        if (onClienteSeleccionado) {
          onClienteSeleccionado(nuevoCliente)
        }
      }
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  const reset = () => {
    setBusqueda('')
    setClienteSeleccionado(null)
    setShowCrearClienteDialog(false)
    setNuevoClienteNombre('')
    setNuevoClienteDocumento('')
    setNuevoClienteEmail('')
    setNuevoClientePais('')
    setNuevoClienteProvincia('')
    setNuevoClienteCanton('')
    setNuevoClienteDireccion('')
    setNuevoClienteTelefono('')
  }

  return {
    busqueda,
    setBusqueda,
    clienteSeleccionado,
    setClienteSeleccionado,
    handleSeleccionarCliente,
    resultados: resultados || [],
    showCrearClienteDialog,
    setShowCrearClienteDialog,
    nuevoClienteNombre,
    setNuevoClienteNombre,
    nuevoClienteDocumento,
    setNuevoClienteDocumento,
    nuevoClienteEmail,
    setNuevoClienteEmail,
    nuevoClientePais,
    setNuevoClientePais,
    nuevoClienteProvincia,
    setNuevoClienteProvincia,
    nuevoClienteCanton,
    setNuevoClienteCanton,
    nuevoClienteDireccion,
    setNuevoClienteDireccion,
    nuevoClienteTelefono,
    setNuevoClienteTelefono,
    handleCrearCliente,
    reset,
    isLoading: createMutation.isPending || loadingClientes || loadingBusqueda,
  }
}
