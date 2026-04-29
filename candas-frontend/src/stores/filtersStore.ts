import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ListFilterKey =
  | 'paquetes'
  | 'despachos'
  | 'clientes'
  | 'agencias'
  | 'puntos-origen'
  | 'permisos'
  | 'lotes-recepcion'
  | 'sacas'
  | 'atencion-paquetes'
  | 'usuarios'
  | 'roles'
  | 'distribuidores'
  | 'destinatarios-directos'
  | 'manifiestos-consolidados'
  | 'lotes-especiales'

export interface ListFiltersState {
  search?: string
  page?: number
  size?: number
  filtroEstado?: string
  filtroTipo?: string
  [key: string]: string | number | undefined
}

type FiltersState = Partial<Record<ListFilterKey, ListFiltersState>>

interface FiltersStore {
  filters: FiltersState
  recentKeys: ListFilterKey[]
  setFilters: (listKey: ListFilterKey, filters: Partial<ListFiltersState>) => void
  getFilters: (listKey: ListFilterKey) => ListFiltersState
  clearFilters: (listKey: ListFilterKey) => void
  clearAllFilters: () => void
}

const MAX_RECENT_KEYS = 5

const defaultFilters = (): ListFiltersState => ({
  search: '',
  page: 0,
  size: 20,
  filtroEstado: 'all',
  filtroTipo: 'all',
})

function pruneOldKeys(
  state: FiltersStore
): Pick<FiltersStore, 'filters' | 'recentKeys'> {
  const recentKeys = state.recentKeys.slice(0, MAX_RECENT_KEYS)
  const filters: FiltersState = {}
  for (const key of recentKeys) {
    if (state.filters[key]) {
      filters[key] = state.filters[key]
    }
  }
  return { filters, recentKeys }
}

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set, get) => ({
      filters: {},
      recentKeys: [],

      setFilters: (listKey, filters) => {
        set((state) => {
          const newRecent = state.recentKeys.includes(listKey)
            ? state.recentKeys
            : [listKey, ...state.recentKeys].slice(0, MAX_RECENT_KEYS)
          return {
            filters: {
              ...state.filters,
              [listKey]: {
                ...defaultFilters(),
                ...state.filters[listKey],
                ...filters,
              },
            },
            recentKeys: newRecent,
          }
        })
      },

      getFilters: (listKey) => {
        return {
          ...defaultFilters(),
          ...get().filters[listKey],
        }
      },

      clearFilters: (listKey) => {
        set((state) => {
          const next = { ...state.filters }
          delete next[listKey]
          const nextRecent = state.recentKeys.filter((k) => k !== listKey)
          return { filters: next, recentKeys: nextRecent }
        })
      },

      clearAllFilters: () => {
        set({ filters: {}, recentKeys: [] })
      },
    }),
    {
      name: 'candas-filters-storage',
      partialize: (state) => pruneOldKeys(state),
    }
  )
)
