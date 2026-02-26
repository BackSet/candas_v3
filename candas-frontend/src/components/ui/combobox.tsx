import * as React from "react"
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
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [internalSearch, setInternalSearch] = React.useState("")
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

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  autoFocus
                  aria-label="Buscar opción"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setOpen(false)
                    }
                  }}
                />
              </div>
            </div>
            <ScrollArea className="max-h-60">
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
                        setOpen(false)
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
      )}
    </div>
  )
}
