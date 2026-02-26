import { useMemo, useState } from 'react'

/**
 * Hook genérico para filtrar listas de elementos.
 * 
 * @template T - Tipo de elemento en la lista
 * @param items - Array de items a filtrar
 * @param searchTerm - Término de búsqueda
 * @param searchFields - Campos en los que buscar (funciones que extraen el valor a buscar de cada item)
 * @param additionalFilters - Filtros adicionales opcionales (funciones que retornan true si el item debe incluirse)
 * @returns Array filtrado de items
 */
export function useListFilter<T>(
  items: T[] | undefined,
  searchTerm: string,
  searchFields: Array<(item: T) => string | number | null | undefined>,
  additionalFilters?: Array<(item: T) => boolean>
) {
  return useMemo(() => {
    if (!items) return []

    const searchLower = searchTerm.toLowerCase().trim()

    return items.filter((item) => {
      // Aplicar filtros adicionales primero
      if (additionalFilters) {
        for (const filter of additionalFilters) {
          if (!filter(item)) {
            return false
          }
        }
      }

      // Si no hay término de búsqueda, retornar todos los items que pasaron los filtros adicionales
      if (!searchLower) {
        return true
      }

      // Buscar en los campos especificados
      for (const getField of searchFields) {
        const fieldValue = getField(item)
        if (fieldValue != null) {
          const fieldStr = String(fieldValue).toLowerCase()
          if (fieldStr.includes(searchLower)) {
            return true
          }
        }
      }

      return false
    })
  }, [items, searchTerm, searchFields, additionalFilters])
}

/**
 * Hook simplificado para búsqueda simple en un solo campo.
 */
export function useSimpleFilter<T>(
  items: T[] | undefined,
  searchTerm: string,
  getSearchValue: (item: T) => string | number | null | undefined
) {
  return useListFilter(items, searchTerm, [getSearchValue])
}
