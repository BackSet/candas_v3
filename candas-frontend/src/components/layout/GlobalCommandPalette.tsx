import { AppIcon,getModuleIcon } from '@/components/icons'
import {
CommandDialog,
CommandEmpty,
CommandGroup,
CommandInput,
CommandItem,
CommandList,
} from '@/components/ui/command'
import { flattenNavigation } from '@/config/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { usePaquetes } from '@/hooks/usePaquetes'
import { useUIStore } from '@/stores/uiStore'
import { useNavigate } from '@tanstack/react-router'
import { Plus,Upload } from 'lucide-react'
import { useEffect,useState } from 'react'

const NAV_ITEMS = flattenNavigation()

export function GlobalCommandPalette() {
  const navigate = useNavigate()
  const { isCommandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette } = useUIStore()

  const [commandSearch, setCommandSearch] = useState('')
  const debouncedCommandSearch = useDebounce(commandSearch, 300)

  const { data: commandSearchResults } = usePaquetes({
    page: 0,
    size: 5,
    search: debouncedCommandSearch,
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleCommandPalette()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggleCommandPalette])

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false)
    setCommandSearch('')
    command()
  }

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput
        placeholder="Buscar paquete por guía o ir a un módulo..."
        onValueChange={setCommandSearch}
        value={commandSearch}
      />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        {commandSearchResults?.content && commandSearchResults.content.length > 0 ? (
          <CommandGroup heading="Paquetes encontrados">
            {commandSearchResults.content.map((paquete) => (
              <CommandItem
                key={paquete.idPaquete}
                value={`${paquete.numeroGuia} ${paquete.observaciones ?? ''}`}
                onSelect={() => runCommand(() => navigate({ to: `/paquetes/${paquete.idPaquete}` }))}
              >
                <AppIcon icon={getModuleIcon('paquetes')} size="sm" className="mr-2 opacity-80" />
                <span className="font-mono">{paquete.numeroGuia}</span>
                {paquete.clienteRemitente ? (
                  <span className="ml-2 text-muted-foreground">— {paquete.clienteRemitente.nombre}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Navegación">
          {NAV_ITEMS.map((item) => {
            const Icon = getModuleIcon(item.moduleId)
            return (
              <CommandItem
                key={item.href}
                value={item.name}
                onSelect={() => runCommand(() => navigate({ to: item.href }))}
              >
                <AppIcon icon={Icon} size="sm" className="mr-2 opacity-80" />
                {item.name}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandGroup heading="Acciones rápidas">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/paquetes/new' }))}>
            <Plus className="mr-2 size-4 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
            Crear paquete
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/despachos/new' }))}>
            <Plus className="mr-2 size-4 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
            Nuevo despacho
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/paquetes' }))}>
            <Upload className="mr-2 size-4 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
            Importar Excel (ir a paquetes)
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => void navigate({ to: '/parametros-sistema/whatsapp-despacho' as never }))
            }
          >
            <AppIcon icon={getModuleIcon('whatsappDespacho')} size="sm" className="mr-2 opacity-80" />
            Parámetros WhatsApp despacho
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
