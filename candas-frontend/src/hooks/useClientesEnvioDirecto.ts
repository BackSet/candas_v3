import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteEnvioDirectoService } from '@/lib/api/cliente-envio-directo.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { ClienteEnvioDirecto } from '@/types/cliente-envio-directo'
import { toast } from 'sonner'

export function useClientesEnvioDirecto() {
  return useQuery({
    queryKey: ['clientes-envio-directo'],
    queryFn: () => clienteEnvioDirectoService.getAll(),
  })
}

export function useClienteEnvioDirecto(id: number | undefined) {
  return useQuery({
    queryKey: ['cliente-envio-directo', id],
    queryFn: () => clienteEnvioDirectoService.findById(id!),
    enabled: !!id,
  })
}

export function useSearchClientesEnvioDirecto(query: string) {
  return useQuery({
    queryKey: ['clientes-envio-directo', 'search', query],
    queryFn: () => clienteEnvioDirectoService.search(query),
    enabled: query.length > 0,
  })
}

export function useCreateClienteEnvioDirecto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: ClienteEnvioDirecto) => clienteEnvioDirectoService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-envio-directo'] })
      toast.success('Cliente de envío directo creado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el cliente de envío directo'))
    },
  })
}

export function useUpdateClienteEnvioDirecto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ClienteEnvioDirecto }) =>
      clienteEnvioDirectoService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes-envio-directo'] })
      queryClient.invalidateQueries({ queryKey: ['cliente-envio-directo', variables.id] })
      toast.success('Cliente de envío directo actualizado exitosamente')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar el cliente de envío directo'))
    },
  })
}
