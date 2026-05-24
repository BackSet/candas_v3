import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permisoService, type PermisoListParams } from '@/lib/api/permiso.service'
import type { Permiso } from '@/types/permiso'
import { notify } from '@/lib/notify'

export function usePermisos(params: PermisoListParams = {}) {
  const { page = 0, size = 20, search, recurso, accion } = params
  return useQuery({
    queryKey: ['permisos', page, size, search, recurso, accion],
    queryFn: () => permisoService.findAll({ page, size, search, recurso, accion }),
  })
}

export function usePermiso(id: number | undefined) {
  return useQuery({
    queryKey: ['permiso', id],
    queryFn: () => permisoService.findById(id!),
    enabled: !!id,
  })
}

export function useUpdatePermisoNombre() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Pick<Permiso, 'nombre'> }) =>
      permisoService.updateNombre(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permisos'] })
      queryClient.invalidateQueries({ queryKey: ['permiso', variables.id] })
      notify.success('Nombre del permiso actualizado')
    },
    onError: (error: unknown) => {
      notify.error(error, 'Error al actualizar el permiso')
    },
  })
}
