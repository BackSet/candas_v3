import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

const SCOPED_QUERY_ROOTS = new Set([
  'despachos',
  'despacho',
  'despacho-sacas',
  'atencion-paquetes',
  'atencion-paquete',
  'atencion-paquetes-pendientes',
  'manifiestos-consolidados',
  'manifiesto-consolidado',
])

export function AgencyScopeSync() {
  const queryClient = useQueryClient()
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  const previousAgencyRef = useRef<number | null | undefined>(undefined)

  useEffect(() => {
    const previous = previousAgencyRef.current
    previousAgencyRef.current = activeAgencyId

    if (previous === undefined || previous === activeAgencyId) {
      return
    }

    if (activeAgencyId == null) {
      queryClient.removeQueries({
        predicate: (query) => {
          const first = Array.isArray(query.queryKey) ? query.queryKey[0] : null
          return typeof first === 'string' && SCOPED_QUERY_ROOTS.has(first)
        },
      })
      return
    }

    queryClient.invalidateQueries({
      predicate: (query) => {
        const first = Array.isArray(query.queryKey) ? query.queryKey[0] : null
        return typeof first === 'string' && SCOPED_QUERY_ROOTS.has(first)
      },
      refetchType: 'active',
    })
  }, [activeAgencyId, queryClient])

  return null
}
