import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { cn } from '@/lib/utils'

export interface SelectFilterOption {
  value: string
  label: string
  /** Descripción opcional (sólo visible en modo `searchable`). */
  description?: string
}

export interface SelectFilterProps {
  /** Valor actual ("all" para "todos"). */
  value: string
  /** Setea el nuevo valor. */
  onChange: (next: string) => void
  /** Opciones a mostrar. La primera suele ser { value: 'all', label: 'Todos' }. */
  options: SelectFilterOption[]
  /** Texto cuando no hay valor (visualmente raro porque siempre hay un value). */
  placeholder?: string
  /** Etiqueta accesible (sr-only) para el trigger. */
  ariaLabel?: string
  className?: string
  disabled?: boolean
  /** Ancho del trigger; default `w-[180px]`. */
  triggerClassName?: string
  /**
   * Si `true`, fuerza el modo combobox con buscador.
   * Si `false`, fuerza el modo select simple.
   * Si se omite, se activa automáticamente cuando `options.length > searchableThreshold`.
   */
  searchable?: boolean
  /** Umbral para activar el buscador en modo automático. Default: 8. */
  searchableThreshold?: number
  /** Placeholder del input de búsqueda (modo searchable). */
  searchPlaceholder?: string
  /** Mensaje cuando no hay resultados (modo searchable). */
  emptyMessage?: string
  /** Valor que representa "Todos / Sin filtro". Default: 'all'. */
  allValue?: string
}

/**
 * Filtro tipo "select" para `FilterBar`.
 *
 * - Por defecto usa `<Select>` de Radix.
 * - Si la lista de opciones supera `searchableThreshold` (8) o `searchable === true`,
 *   se renderiza un `Combobox` con buscador interno, navegación por teclado y
 *   contador de resultados.
 *
 * El valor "all" (o `allValue`) representa "sin filtro" y siempre se muestra
 * como una opción seleccionable.
 */
export function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
  disabled,
  triggerClassName,
  searchable,
  searchableThreshold = 8,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados.',
  allValue = 'all',
}: SelectFilterProps) {
  const useSearch = searchable ?? options.length > searchableThreshold

  const comboOptions = useMemo<ComboboxOption[]>(
    () =>
      options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
      })),
    [options]
  )

  if (useSearch) {
    const allOption = options.find((opt) => opt.value === allValue)
    const allLabel = allOption?.label ?? placeholder ?? 'Todos'

    return (
      <Combobox
        options={comboOptions}
        value={value === allValue ? null : value}
        onValueChange={(next) => onChange(next == null ? allValue : String(next))}
        placeholder={allLabel}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        ariaLabel={ariaLabel}
        disabled={disabled}
        className={className}
        triggerClassName={cn('w-[200px]', triggerClassName)}
        usePortal
      />
    )
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn('h-9 w-[180px] text-sm', triggerClassName, className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
