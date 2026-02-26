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
  setFilters: (listKey: ListFilterKey, filters: Partial<ListFiltersState>) => void
  getFilters: (listKey: ListFilterKey) => ListFiltersState
  clearFilters: (listKey: ListFilterKey) => void
}

const defaultFilters = (): ListFiltersState => ({
  search: '',
  page: 0,
  size: 20,
  filtroEstado: 'all',
  filtroTipo: 'all',
})

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set, get) => ({
      filters: {},

      setFilters: (listKey, filters) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [listKey]: {
              ...defaultFilters(),
              ...state.filters[listKey],
              ...filters,
            },
          },
        }))
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
          return { filters: next }
        })
      },
    }),
    {
      name: 'candas-filters-storage',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
)
