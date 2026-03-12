import { useCallback } from 'react'
import { useFiltersStore, type ListFilterKey, type ListFiltersState } from '@/stores/filtersStore'

/**
 * Wrapper tipado para reducir boilerplate en listas con filtros persistidos.
 */
export function usePersistedListFilters<TExtra extends ListFiltersState = ListFiltersState>(
  listKey: ListFilterKey
) {
  const stored = useFiltersStore((state) => state.filters[listKey]) as Partial<TExtra> | undefined
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const clearFilters = useFiltersStore((state) => state.clearFilters)

  const setFilters = useCallback(
    (patch: Partial<TExtra>) => {
      setFiltersAction(listKey, patch)
    },
    [listKey, setFiltersAction]
  )

  const setPage = useCallback(
    (page: number) => {
      setFiltersAction(listKey, { page })
    },
    [listKey, setFiltersAction]
  )

  const setSearch = useCallback(
    (search: string) => {
      setFiltersAction(listKey, { search, page: 0 })
    },
    [listKey, setFiltersAction]
  )

  const reset = useCallback(() => {
    clearFilters(listKey)
  }, [clearFilters, listKey])

  return {
    stored,
    setFilters,
    setPage,
    setSearch,
    reset,
  }
}
