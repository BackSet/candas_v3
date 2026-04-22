import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    LayoutDashboard,
    Building2,
    Users,
    Package,
    Plus,
    Upload,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { usePaquetes } from '@/hooks/usePaquetes'
import { useDebounce } from '@/hooks/useDebounce'

export function GlobalCommandPalette() {
    const navigate = useNavigate()
    const { isCommandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette } = useUIStore()

    const [commandSearch, setCommandSearch] = useState('')
    const debouncedCommandSearch = useDebounce(commandSearch, 300)

    // Búsqueda para el Command Palette resources
    const { data: commandSearchResults } = usePaquetes({ page: 0, size: 5, search: debouncedCommandSearch })

    // Efecto para atajo de teclado Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                toggleCommandPalette()
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [toggleCommandPalette])

    const runCommand = (command: () => void) => {
        setCommandPaletteOpen(false)
        command()
    }

    return (
        <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
            <CommandInput
                placeholder="Buscar paquete por guía, o ejecuta un comando..."
                onValueChange={setCommandSearch}
                value={commandSearch}
            />
            <CommandList>
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>

                {commandSearchResults?.content && commandSearchResults.content.length > 0 && (
                    <CommandGroup heading="Paquetes Encontrados">
                        {commandSearchResults.content.map((paquete) => (
                            <CommandItem
                                key={paquete.idPaquete}
                                value={`${paquete.numeroGuia} ${paquete.observaciones}`}
                                onSelect={() => runCommand(() => navigate({ to: `/paquetes/${paquete.idPaquete}` }))}
                            >
                                <Package className="mr-2 h-4 w-4" />
                                <span className="font-mono">{paquete.numeroGuia}</span>
                                {paquete.clienteRemitente && <span className="ml-2 text-muted-foreground">- {paquete.clienteRemitente.nombre}</span>}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandGroup heading="Navegación">
                    <CommandItem onSelect={() => runCommand(() => navigate({ to: '/dashboard' }))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate({ to: '/agencias' }))}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Agencias
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate({ to: '/clientes' }))}>
                        <Users className="mr-2 h-4 w-4" />
                        Clientes
                    </CommandItem>
                </CommandGroup>

                <CommandGroup heading="Acciones">
                    <CommandItem onSelect={() => runCommand(() => navigate({ to: '/paquetes/new' }))}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Paquete
                    </CommandItem>
                    {/* Note: Import dialogs are page-specific, so we might need a way to trigger them globally or navigate to the page with a query param */}
                    <CommandItem onSelect={() => runCommand(() => navigate({ to: '/paquetes' }))}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar Excel (Ir a Paquetes)
                    </CommandItem>
                </CommandGroup>

            </CommandList>
        </CommandDialog>
    )
}
