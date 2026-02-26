import { useState, useMemo } from 'react'

export interface PaginationState {
  page: number
  size: number
}

export interface PaginationControls {
  page: number
  setPage: (page: number) => void
  size: number
  totalPages: number
  currentPage: number
  totalElements: number
  hasNext: boolean
  hasPrevious: boolean
  goToFirst: () => void
  goToLast: () => void
  goToNext: () => void
  goToPrevious: () => void
}

/**
 * Hook para manejar paginación de listas.
 * 
 * @param initialPage - Página inicial (default: 0)
 * @param initialSize - Tamaño de página inicial (default: 20)
 * @param totalElements - Total de elementos (de la respuesta del backend)
 * @param totalPages - Total de páginas (de la respuesta del backend)
 * @param currentPage - Página actual (de la respuesta del backend)
 * @returns Objeto con estado y controles de paginación
 */
export function usePagination(
  totalElements: number = 0,
  totalPages: number = 0,
  currentPage: number = 0,
  initialSize: number = 20
): PaginationControls {
  const [page, setPage] = useState(initialSize === 20 ? currentPage : 0)

  const hasNext = useMemo(() => currentPage < totalPages - 1, [currentPage, totalPages])
  const hasPrevious = useMemo(() => currentPage > 0, [currentPage])

  const goToFirst = () => setPage(0)
  const goToLast = () => setPage(Math.max(0, totalPages - 1))
  const goToNext = () => setPage((p) => Math.min(totalPages - 1, p + 1))
  const goToPrevious = () => setPage((p) => Math.max(0, p - 1))

  return {
    page,
    setPage,
    size: initialSize,
    totalPages,
    currentPage,
    totalElements,
    hasNext,
    hasPrevious,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
  }
}
