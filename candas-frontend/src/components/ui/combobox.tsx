import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ComboboxOption<T = any> {
  value: string | number
  label: string
  description?: string
  data?: T
  highlighted?: boolean
}

export interface ComboboxProps<T = any> {
  options: ComboboxOption<T>[]
  value?: string | number | null
  onValueChange?: (value: string | number | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  onSearchChange?: (search: string) => void
  searchValue?: string
  /** Si true, renderiza el dropdown en un portal para evitar recorte dentro de modales */
  usePortal?: boolean
  /** Contenedor donde montar el portal (ej. ref del DialogContent). Si se pasa, el dropdown queda dentro del focus scope del diálogo y el buscador recibe foco. */
  portalContainerRef?: React.RefObject<HTMLElement | null>
}

export function Combobox<T = any>({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona una opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  className,
  disabled = false,
  onSearchChange,
  searchValue,
  usePortal = false,
  portalContainerRef,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [internalSearch, setInternalSearch] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const [dropdownRect, setDropdownRect] = React.useState({ top: 0, left: 0, width: 0 })
  const [containerRect, setContainerRect] = React.useState<{ top: number; left: number } | null>(null)

  const search = searchValue !== undefined && searchValue !== null ? searchValue : internalSearch
  const setSearch = onSearchChange ?? ((v: string) => setInternalSearch(v))

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower) ||
      opt.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  // useLayoutEffect: calcular posición antes del paint para que el dropdown no aparezca "separado"
  React.useLayoutEffect(() => {
    if (!open) {
      setDropdownRect({ top: 0, left: 0, width: 0 })
      setContainerRect(null)
      return
    }
    if (!usePortal || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 200),
    })
    if (portalContainerRef?.current) {
      const cr = portalContainerRef.current.getBoundingClientRect()
      setContainerRect({ top: cr.top, left: cr.left })
    } else {
      setContainerRect(null)
    }
  }, [open, usePortal, portalContainerRef])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setSearch("")
  }

  const handleOpenChangeRef = React.useRef(handleOpenChange)
  handleOpenChangeRef.current = handleOpenChange

  // En portal: solo mostrar el panel cuando ya tenemos rect válido (evita flash en 0,0)
  // Si usamos portalContainerRef, esperamos también containerRect para posicionar con absolute
  const showPortalDropdown = open && (!usePortal || dropdownRect.width > 0) &&
    (!portalContainerRef?.current || containerRect != null)

  const isPortalToContainer = usePortal && portalContainerRef?.current != null && containerRect != null
  const dropdownStyle = usePortal
    ? isPortalToContainer
      ? {
          position: 'absolute' as const,
          top: dropdownRect.top - containerRect!.top,
          left: dropdownRect.left - containerRect!.left,
          width: dropdownRect.width,
          maxWidth: `min(400px, ${portalContainerRef!.current!.offsetWidth - (dropdownRect.left - containerRect!.left) - 16}px)`,
          maxHeight: `calc(100% - ${dropdownRect.top - containerRect!.top}px - 16px)`,
        }
      : {
          position: 'fixed' as const,
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
          maxWidth: `min(400px, calc(100vw - ${dropdownRect.left}px - 16px))`,
          maxHeight: `calc(100vh - ${dropdownRect.top}px - 16px)`,
        }
    : undefined

  // Cerrar dropdown al hacer scroll en el diálogo/contenedor para que no se "despegue" del trigger
  React.useEffect(() => {
    if (!open || !usePortal || !triggerRef.current) return
    const trigger = triggerRef.current
    const scrollParents: Element[] = []
    let p: HTMLElement | null = trigger.parentElement
    while (p) {
      const s = getComputedStyle(p)
      const overflow = `${s.overflow}${s.overflowY}${s.overflowX}`
      if (/auto|scroll|overlay/.test(overflow)) scrollParents.push(p)
      p = p.parentElement
    }
    scrollParents.push(document.documentElement)
    const close = () => handleOpenChangeRef.current(false)
    scrollParents.forEach((el) => el.addEventListener('scroll', close, true))
    return () => scrollParents.forEach((el) => el.removeEventListener('scroll', close, true))
  }, [open, usePortal])

  // Enfocar el input de búsqueda tras montar el portal (evita que el focus trap del diálogo lo robe)
  React.useLayoutEffect(() => {
    if (!showPortalDropdown) return
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [showPortalDropdown])

  const dropdownContent = showPortalDropdown ? (
    <>
      <div
        className="fixed inset-0 z-[90]"
        onClick={() => handleOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Lista de opciones"
        className={cn(
          "rounded-md border bg-background shadow-md",
          usePortal && "z-[100] flex flex-col",
          !usePortal && "absolute z-50 mt-1 w-full"
        )}
        style={
          usePortal
            ? {
                ...dropdownStyle,
              }
            : undefined
        }
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              autoFocus
              aria-label="Buscar opción"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleOpenChange(false)
                }
              }}
              data-combobox-search
            />
          </div>
        </div>
        <ScrollArea
          className={cn("max-h-60", usePortal && "flex-1 min-h-0")}
        >
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent",
                    option.highlighted && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                  onClick={() => {
                    onValueChange?.(option.value === value ? null : option.value)
                    handleOpenChange(false)
                    setSearch("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {option.highlighted && (
                        <span className="text-primary text-xs">⭐</span>
                      )}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  ) : null

  return (
    <div className={cn("relative min-w-0", className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full min-w-0 justify-between gap-2"
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <span className={cn("min-w-0 truncate text-left", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {usePortal && typeof document !== "undefined" && createPortal(dropdownContent, portalContainerRef?.current && containerRect != null ? portalContainerRef.current : document.body)}
      {!usePortal && dropdownContent}
    </div>
  )
}
