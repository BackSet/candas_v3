import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface ComboboxOption<T = unknown> {
  value: string | number
  label: string
  description?: string
  data?: T
  highlighted?: boolean
}

export interface ComboboxProps<T = unknown> {
  options: ComboboxOption<T>[]
  value?: string | number | null
  onValueChange?: (value: string | number | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  /** Clases extra al trigger (botón). */
  triggerClassName?: string
  disabled?: boolean
  /** Búsqueda controlada (delegada al consumidor). */
  onSearchChange?: (search: string) => void
  searchValue?: string
  /** Si true, renderiza el dropdown en un portal para evitar recorte dentro de modales. */
  usePortal?: boolean
  /** Contenedor donde montar el portal (ej. ref del DialogContent). */
  portalContainerRef?: React.RefObject<HTMLElement | null>
  /** Si true, muestra un botón "X" para limpiar el valor seleccionado (sólo si `value != null`). */
  clearable?: boolean
  /** ID del input/trigger (útil para `<Label htmlFor>`). */
  id?: string
  /** Etiqueta accesible (sr-only) para el trigger. */
  ariaLabel?: string
}

const TRIGGER_BASE_CLASSES =
  "flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function Combobox<T = unknown>({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona una opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  className,
  triggerClassName,
  disabled = false,
  onSearchChange,
  searchValue,
  usePortal = false,
  portalContainerRef,
  clearable = false,
  id,
  ariaLabel,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [internalSearch, setInternalSearch] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const dropdownPanelRef = React.useRef<HTMLDivElement>(null)
  const optionsListRef = React.useRef<HTMLDivElement>(null)
  const [dropdownRect, setDropdownRect] = React.useState({ top: 0, left: 0, width: 0 })
  const [containerRect, setContainerRect] = React.useState<{ top: number; left: number } | null>(null)

  const search = searchValue !== undefined && searchValue !== null ? searchValue : internalSearch
  const setSearch = React.useCallback(
    (v: string) => {
      if (onSearchChange) onSearchChange(v)
      else setInternalSearch(v)
    },
    [onSearchChange]
  )

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const selectedOption = options.find((opt) => opt.value === value) ?? null

  const updatePortalGeometry = React.useCallback((): boolean => {
    if (!usePortal || !triggerRef.current) return true
    const rect = triggerRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 200),
    })
    if (portalContainerRef?.current) {
      const cr = portalContainerRef.current.getBoundingClientRect()
      if (cr.width <= 0 || cr.height <= 0) return false
      setContainerRect({ top: cr.top, left: cr.left })
    } else {
      setContainerRect(null)
    }
    return true
  }, [usePortal, portalContainerRef])

  React.useLayoutEffect(() => {
    if (!open) {
      setDropdownRect({ top: 0, left: 0, width: 0 })
      setContainerRect(null)
      return
    }
    updatePortalGeometry()
  }, [open, updatePortalGeometry])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) setSearch("")
      if (next) {
        const idx = filteredOptions.findIndex((opt) => opt.value === value)
        setActiveIndex(idx >= 0 ? idx : 0)
      }
    },
    [filteredOptions, setSearch, value]
  )

  const handleOpenChangeRef = React.useRef(handleOpenChange)
  handleOpenChangeRef.current = handleOpenChange

  React.useEffect(() => {
    if (!open) return
    if (activeIndex >= filteredOptions.length) {
      setActiveIndex(Math.max(0, filteredOptions.length - 1))
    }
  }, [open, filteredOptions.length, activeIndex])

  React.useEffect(() => {
    if (!open) return
    const list = optionsListRef.current
    if (!list) return
    const item = list.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    if (item) item.scrollIntoView({ block: "nearest" })
  }, [activeIndex, open])

  const showPortalDropdown =
    open &&
    (!usePortal || dropdownRect.width > 0) &&
    (!portalContainerRef?.current || containerRect != null)

  const isPortalToContainer =
    usePortal && portalContainerRef?.current != null && containerRect != null
  const dropdownStyle = usePortal
    ? isPortalToContainer
      ? {
          position: "absolute" as const,
          top: dropdownRect.top - containerRect!.top,
          left: dropdownRect.left - containerRect!.left,
          width: dropdownRect.width,
          maxWidth: `min(420px, ${
            portalContainerRef!.current!.offsetWidth -
            (dropdownRect.left - containerRect!.left) -
            16
          }px)`,
          maxHeight: `calc(100% - ${dropdownRect.top - containerRect!.top}px - 16px)`,
        }
      : {
          position: "fixed" as const,
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
          maxWidth: `min(420px, calc(100vw - ${dropdownRect.left}px - 16px))`,
          maxHeight: `calc(100vh - ${dropdownRect.top}px - 16px)`,
        }
    : undefined

  React.useEffect(() => {
    if (!open || !usePortal || !triggerRef.current) return
    const repositionOrClose = () => {
      if (!updatePortalGeometry()) {
        handleOpenChangeRef.current(false)
      }
    }

    const trigger = triggerRef.current
    const scrollParents: EventTarget[] = []
    let p: HTMLElement | null = trigger.parentElement
    while (p) {
      const s = getComputedStyle(p)
      const overflow = `${s.overflow}${s.overflowY}${s.overflowX}`
      if (/auto|scroll|overlay/.test(overflow)) {
        scrollParents.push(p)
      }
      p = p.parentElement
    }
    if (portalContainerRef?.current) {
      scrollParents.push(portalContainerRef.current)
    }

    window.addEventListener("resize", repositionOrClose)
    scrollParents.forEach((el) => el.addEventListener("scroll", repositionOrClose))
    return () => {
      window.removeEventListener("resize", repositionOrClose)
      scrollParents.forEach((el) => el.removeEventListener("scroll", repositionOrClose))
    }
  }, [open, usePortal, updatePortalGeometry, portalContainerRef])

  // Click fuera (modo no-portal). En modo portal hay un overlay propio que cubre toda la pantalla.
  React.useEffect(() => {
    if (!open || usePortal) return
    const handler = (e: MouseEvent) => {
      const trigger = triggerRef.current
      const panel = dropdownPanelRef.current
      const target = e.target as Node | null
      if (!target) return
      if (trigger?.contains(target)) return
      if (panel?.contains(target)) return
      handleOpenChangeRef.current(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, usePortal])

  React.useLayoutEffect(() => {
    if (!showPortalDropdown) return
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [showPortalDropdown])

  const commitOption = (option: ComboboxOption<T>) => {
    onValueChange?.(option.value === value ? null : option.value)
    handleOpenChange(false)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Home") {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setActiveIndex(Math.max(0, filteredOptions.length - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opt = filteredOptions[activeIndex]
      if (opt) commitOption(opt)
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleOpenChange(false)
      triggerRef.current?.focus()
    } else if (e.key === "Tab") {
      handleOpenChange(false)
    }
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault()
      handleOpenChange(true)
    }
  }

  const dropdownContent = showPortalDropdown ? (
    <>
      {usePortal && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => handleOpenChange(false)}
          aria-hidden
        />
      )}
      <div
        ref={dropdownPanelRef}
        role="dialog"
        aria-label="Lista de opciones"
        className={cn(
          "rounded-md border border-border bg-background text-foreground shadow-md",
          usePortal && "z-[100] flex flex-col",
          !usePortal && "absolute z-50 mt-1 w-full flex flex-col"
        )}
        style={usePortal ? dropdownStyle : undefined}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setActiveIndex(0)
              }}
              className="pl-8 h-8"
              autoFocus
              aria-label="Buscar opción"
              aria-controls="combobox-listbox"
              aria-activedescendant={
                filteredOptions[activeIndex]
                  ? `combobox-option-${filteredOptions[activeIndex].value}`
                  : undefined
              }
              onKeyDown={handleSearchKeyDown}
              data-combobox-search
            />
          </div>
        </div>
        <div
          ref={optionsListRef}
          id="combobox-listbox"
          role="listbox"
          className={cn(
            "max-h-[260px] overflow-y-auto overscroll-contain",
            usePortal && "flex-1 min-h-0"
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option, index) => {
                const isSelected = value === option.value
                const isActive = index === activeIndex
                return (
                  <div
                    key={option.value}
                    id={`combobox-option-${option.value}`}
                    role="option"
                    aria-selected={isSelected}
                    data-index={index}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                      isActive && "bg-muted",
                      isSelected && "bg-accent text-accent-foreground",
                      option.highlighted &&
                        !isSelected &&
                        "border-l-2 border-l-primary bg-primary/5"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commitOption(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {option.highlighted && (
                          <span className="text-primary text-xs">★</span>
                        )}
                        <span className="font-medium truncate">{option.label}</span>
                      </div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {(search || filteredOptions.length > 8) && (
          <div className="px-3 py-1.5 border-t border-border text-[11px] text-muted-foreground bg-muted/30 shrink-0 flex items-center justify-between">
            <span>
              {filteredOptions.length === options.length
                ? `${options.length} opciones`
                : `${filteredOptions.length} de ${options.length}`}
            </span>
            <span className="hidden sm:inline">↑ ↓ navegar · ↵ seleccionar · Esc cerrar</span>
          </div>
        )}
      </div>
    </>
  ) : null

  const showClear = clearable && value != null && !disabled

  return (
    <div className={cn("relative min-w-0", className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => handleOpenChange(!open)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(TRIGGER_BASE_CLASSES, triggerClassName)}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            !selectedOption && "text-muted-foreground"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {showClear ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Limpiar selección"
            onClick={(e) => {
              e.stopPropagation()
              onValueChange?.(null)
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {usePortal &&
        typeof document !== "undefined" &&
        createPortal(
          dropdownContent,
          portalContainerRef?.current && containerRect != null
            ? portalContainerRef.current
            : document.body
        )}
      {!usePortal && dropdownContent}
    </div>
  )
}
