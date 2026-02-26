import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, User, Trash2 } from 'lucide-react'
import type { useClienteManager } from '@/hooks/useClienteManager'

interface ClienteSearchFieldProps {
  label: string
  required?: boolean
  manager: ReturnType<typeof useClienteManager>
  selectedId: number | string | undefined
  onClear: () => void
  error?: string
}

export function ClienteSearchField({
  label,
  required,
  manager,
  selectedId,
  onClear,
  error,
}: ClienteSearchFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <User className="h-3.5 w-3.5" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${label.toLowerCase()}...`}
            className="pl-9"
            value={manager.busqueda}
            onChange={(e) => manager.setBusqueda(e.target.value)}
          />
          {manager.busqueda.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {manager.resultados.length > 0 ? (
                <div className="max-h-[200px] overflow-auto py-1">
                  {manager.resultados.map((cliente) => (
                    <div
                      key={cliente.idCliente}
                      className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                      onClick={() => manager.handleSeleccionarCliente(cliente)}
                    >
                      <div className="font-medium">{cliente.nombreCompleto}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        {cliente.documentoIdentidad && <span>{cliente.documentoIdentidad}</span>}
                        {cliente.telefono && <span>• {cliente.telefono}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-xs text-muted-foreground text-center">No se encontraron resultados</div>
              )}
            </div>
          )}
        </div>
        <Button type="button" size="icon" variant="outline" onClick={() => manager.setShowCrearClienteDialog(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {!manager.busqueda && Boolean(selectedId) && manager.clienteSeleccionado && (
        <div className="p-3 bg-muted/40 rounded-md border border-border/50 text-sm flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{manager.clienteSeleccionado.nombreCompleto}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {[
                manager.clienteSeleccionado.documentoIdentidad,
                manager.clienteSeleccionado.telefono
              ].filter(Boolean).join(' • ')}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-1 -mt-1"
            onClick={onClear}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
