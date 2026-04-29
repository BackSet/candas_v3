import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DataTableColumn } from './types'

export type SortDir = 'asc' | 'desc'

export interface SortState {
  id: string
  dir: SortDir
}

interface PersistedState {
  sort: SortState | null
  hidden: string[]
}

const STORAGE_PREFIX = 'candas:table:'

function readPersistedState(storageKey: string): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + storageKey)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function writePersistedState(storageKey: string, state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(state))
  } catch {
    // ignore quota / disabled storage
  }
}

interface UseTableStateOptions<T> {
  storageKey: string
  columns: DataTableColumn<T>[]
}

export function useTableState<T>({ storageKey, columns }: UseTableStateOptions<T>) {
  const columnsRef = useRef(columns)
  columnsRef.current = columns

  const initialHidden = useMemo(() => {
    const persisted = readPersistedState(storageKey)
    if (persisted?.hidden) return new Set(persisted.hidden)
    return new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id))
  }, [storageKey, columns])

  const initialSort = useMemo<SortState | null>(() => {
    const persisted = readPersistedState(storageKey)
    return persisted?.sort ?? null
  }, [storageKey])

  const [sort, setSort] = useState<SortState | null>(initialSort)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(initialHidden)

  useEffect(() => {
    writePersistedState(storageKey, {
      sort,
      hidden: Array.from(hiddenColumns),
    })
  }, [storageKey, sort, hiddenColumns])

  const toggleSort = useCallback((id: string) => {
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: 'asc' }
      if (prev.dir === 'asc') return { id, dir: 'desc' }
      return null
    })
  }, [])

  const toggleColumn = useCallback((id: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const showAllColumns = useCallback(() => {
    setHiddenColumns(new Set())
  }, [])

  const visibleColumns = useMemo(
    () => columnsRef.current.filter((c) => !hiddenColumns.has(c.id)),
    [hiddenColumns]
  )

  const sortData = useCallback(
    (data: T[]): T[] => {
      if (!sort) return data
      const cols = columnsRef.current
      const col = cols.find((c) => c.id === sort.id)
      if (!col?.sortValue) return data
      const accessor = col.sortValue
      const sorted = [...data].sort((a, b) => {
        const va = accessor(a)
        const vb = accessor(b)
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        if (va instanceof Date && vb instanceof Date) {
          return va.getTime() - vb.getTime()
        }
        if (typeof va === 'number' && typeof vb === 'number') {
          return va - vb
        }
        return String(va).localeCompare(String(vb), 'es', { numeric: true, sensitivity: 'base' })
      })
      return sort.dir === 'asc' ? sorted : sorted.reverse()
    },
    [sort]
  )

  return {
    sort,
    toggleSort,
    hiddenColumns,
    toggleColumn,
    showAllColumns,
    visibleColumns,
    sortData,
  }
}
