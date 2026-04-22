import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useFiltersStore, type ListFilterKey } from '@/stores/filtersStore'

/**
 * Estado de filtros tipado y serializable. Cada valor debe ser:
 * - string  (search, selects con valores tipo "all" | "PENDIENTE" | …)
 * - number  (idAgencia, idLote, page, size)
 * - boolean (toggles activo/activa, soloConPendientes, …)
 * - undefined (filtro no establecido)
 */
export type ListFilterValue = string | number | boolean | undefined

export type ListFiltersValues = Record<string, ListFilterValue>

export interface ListFilterChip {
  /** Clave única dentro del estado de filtros. */
  key: string
  /** Etiqueta amigable para el chip ("Estado: Pendiente", "Agencia: Quito", …). */
  label: string
  /** Handler para limpiar este filtro individual. */
  onRemove: () => void
}

interface UseListFiltersOptions<T extends ListFiltersValues> {
  /** Clave de la lista (también usada como key opcional de Zustand). */
  storageKey: ListFilterKey | string
  /** Valores por defecto para todos los filtros (sirven también como "valor neutro"). */
  defaults: T
  /** Si true, persiste filtros (no pagination) en Zustand además de URL (default false). */
  persist?: boolean
  /** Construye la lista de chips dado el valor actual. */
  buildChips?: (
    values: T,
    helpers: { removeFilter: <K extends keyof T>(key: K) => void }
  ) => ListFilterChip[]
  /** Determina si un valor es "activo" para chips (default: distinto de default y no vacío). */
  isActive?: <K extends keyof T>(key: K, value: T[K], defaults: T) => boolean
}

export interface UseListFiltersReturn<T extends ListFiltersValues> {
  /** Valores actuales (defaults + URL). Listos para pasar a hooks de listado. */
  values: T
  /** Setea un único filtro y resetea page a 0 si la key no es 'page'/'size'. */
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  /** Setea varios filtros de una vez y resetea page si no se incluye explícitamente. */
  setFilters: (patch: Partial<T>) => void
  /** Quita un filtro (vuelve al default de esa key). */
  removeFilter: <K extends keyof T>(key: K) => void
  /** Resetea todos los filtros a sus defaults. */
  clearAll: () => void
  /** Helper para componentes de filtro: { value, onChange }. */
  bind: <K extends keyof T>(key: K) => {
    value: T[K]
    onChange: (next: T[K]) => void
  }
  /** Chips de filtros activos para renderizar. */
  activeChips: ListFilterChip[]
  /** True si hay al menos un filtro activo (no pagination). */
  hasActiveFilters: boolean
}

const PAGINATION_KEYS = new Set(['page', 'size'])
const URL_CHANGE_EVENT = 'candas:url-change'

function defaultIsActive<T extends ListFiltersValues, K extends keyof T>(
  key: K,
  value: T[K],
  defaults: T
): boolean {
  if (PAGINATION_KEYS.has(String(key))) return false
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (value === defaults[key]) return false
  return true
}

function subscribeUrl(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('popstate', callback)
  window.addEventListener(URL_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(URL_CHANGE_EVENT, callback)
  }
}

function getUrlSnapshot(): string {
  if (typeof window === 'undefined') return ''
  return window.location.search
}

function getServerSnapshot(): string {
  return ''
}

/**
 * Hook unificado de filtros para listas. URL (query string) es la fuente de verdad,
 * permitiendo deep-linking; opcionalmente espeja a Zustand para persistir entre sesiones.
 */
export function useListFilters<T extends ListFiltersValues>(
  options: UseListFiltersOptions<T>
): UseListFiltersReturn<T> {
  const { storageKey, defaults, persist = false, buildChips, isActive = defaultIsActive } = options

  // Persistencia opcional en Zustand (solo defaults por usuario, no URL).
  const stored = useFiltersStore((state) => state.filters[storageKey as ListFilterKey])
  const setStored = useFiltersStore((state) => state.setFilters)

  // Suscríbete a la URL para forzar re-render cuando cambia.
  const search = useSyncExternalStore(subscribeUrl, getUrlSnapshot, getServerSnapshot)

  const urlValues = useMemo<Partial<T>>(() => readUrlValues<T>(defaults, search), [defaults, search])

  // Combina: defaults < persistidos < URL.
  const values = useMemo<T>(() => {
    const persisted = persist && stored ? (stored as Partial<T>) : undefined
    return { ...defaults, ...(persisted ?? {}), ...urlValues } as T
  }, [defaults, stored, urlValues, persist])

  const valuesRef = useRef(values)
  useEffect(() => {
    valuesRef.current = values
  }, [values])

  // Si persist y los filtros cambian, espeja en Zustand (sin paginación).
  useEffect(() => {
    if (!persist) return
    const toStore: Record<string, string | number | undefined> = {}
    for (const [k, v] of Object.entries(values)) {
      if (PAGINATION_KEYS.has(k)) continue
      toStore[k] = typeof v === 'boolean' ? String(v) : v
    }
    setStored(storageKey as ListFilterKey, toStore)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, persist, storageKey])

  const writeUrl = useCallback(
    (nextValues: T) => {
      const url = new URL(window.location.href)
      for (const [k, v] of Object.entries(nextValues)) {
        const def = defaults[k as keyof T]
        const isEmpty =
          v === undefined ||
          v === null ||
          v === def ||
          (typeof v === 'string' && v.trim() === '')
        if (isEmpty) {
          url.searchParams.delete(k)
        } else {
          url.searchParams.set(k, String(v))
        }
      }
      window.history.replaceState({}, '', url.toString())
      window.dispatchEvent(new Event(URL_CHANGE_EVENT))
    },
    [defaults]
  )

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const next: T = { ...valuesRef.current, [key]: value }
      if (!PAGINATION_KEYS.has(String(key)) && 'page' in defaults) {
        ;(next as Record<string, ListFilterValue>).page = (defaults as Record<string, ListFilterValue>).page
      }
      writeUrl(next)
    },
    [defaults, writeUrl]
  )

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      const next: T = { ...valuesRef.current, ...patch }
      const cambianFiltros = Object.keys(patch).some((k) => !PAGINATION_KEYS.has(k))
      if (cambianFiltros && !('page' in patch) && 'page' in defaults) {
        ;(next as Record<string, ListFilterValue>).page = (defaults as Record<string, ListFilterValue>).page
      }
      writeUrl(next)
    },
    [defaults, writeUrl]
  )

  const removeFilter = useCallback(
    <K extends keyof T>(key: K) => {
      setFilter(key, defaults[key])
    },
    [defaults, setFilter]
  )

  const clearAll = useCallback(() => {
    writeUrl(defaults)
  }, [defaults, writeUrl])

  const bind = useCallback(
    <K extends keyof T>(key: K) => ({
      value: values[key],
      onChange: (next: T[K]) => setFilter(key, next),
    }),
    [values, setFilter]
  )

  const activeChips = useMemo<ListFilterChip[]>(() => {
    if (buildChips) {
      return buildChips(values, { removeFilter })
    }
    return Object.entries(values)
      .filter(([k, v]) => isActive(k as keyof T, v as T[keyof T], defaults))
      .map(([k, v]) => ({
        key: k,
        label: `${k}: ${String(v)}`,
        onRemove: () => removeFilter(k as keyof T),
      }))
  }, [values, defaults, buildChips, isActive, removeFilter])

  const hasActiveFilters = activeChips.length > 0

  return {
    values,
    setFilter,
    setFilters,
    removeFilter,
    clearAll,
    bind,
    activeChips,
    hasActiveFilters,
  }
}

function readUrlValues<T extends ListFiltersValues>(defaults: T, search: string): Partial<T> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(search)
  const out: Record<string, ListFilterValue> = {}
  for (const [key, defaultVal] of Object.entries(defaults)) {
    const raw = params.get(key)
    if (raw === null) continue
    if (typeof defaultVal === 'number') {
      const n = Number(raw)
      out[key] = Number.isFinite(n) ? n : defaultVal
    } else if (typeof defaultVal === 'boolean') {
      out[key] = raw === 'true'
    } else {
      out[key] = raw
    }
  }
  return out as Partial<T>
}
