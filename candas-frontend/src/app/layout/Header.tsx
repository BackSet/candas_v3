import { Search, Bell, LogOut, Shield, Loader2, UserCog } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { authService } from '@/lib/api/auth.service'
import { useNavigate } from '@tanstack/react-router'
import { useAgencias } from '@/hooks/useSelectOptions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function Header() {
  const { user, activeAgencyId, setActiveAgencyId } = useAuthStore()
  const navigate = useNavigate()
  const [isSwitchingAgency, setIsSwitchingAgency] = useState(false)
  const { data: agencias = [] } = useAgencias()
  const agenciasUsuario = (user?.idAgencias ?? (user?.idAgencia ? [user.idAgencia] : []))
    .map((id) => agencias.find((a) => a.value === id))
    .filter((a): a is { value: number; label: string } => !!a)
  const agenciaActivaLabel = agenciasUsuario.find((a) => a.value === activeAgencyId)?.label
    ?? (activeAgencyId ? `#${activeAgencyId}` : 'Sin agencia')

  const handleLogout = () => {
    authService.logout()
    navigate({ to: '/login' })
  }

  useEffect(() => {
    if (!isSwitchingAgency) return
    const t = window.setTimeout(() => setIsSwitchingAgency(false), 500)
    return () => window.clearTimeout(t)
  }, [activeAgencyId, isSwitchingAgency])

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4">
      {/* Search - Command Palette trigger */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-muted-foreground transition-colors" />
          <Input
            type="text"
            placeholder="Buscar paquetes, navegar..."
            className="pl-9 pr-16 h-8 text-[13px] cursor-pointer bg-muted/30 border-border/30 rounded-lg hover:bg-muted/50 hover:border-border/50 transition-all focus-visible:ring-0 focus-visible:bg-background focus-visible:border-border/60"
            readOnly
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                useUIStore.getState().toggleCommandPalette()
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded-md border border-border/40 bg-muted/50 px-1.5 font-mono text-[9px] font-medium text-muted-foreground/60 sm:flex">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {agenciasUsuario.length > 0 && (
          <Select
            value={activeAgencyId != null ? String(activeAgencyId) : undefined}
            onValueChange={(value) => {
              const nextId = Number(value)
              if (nextId === activeAgencyId) return
              setIsSwitchingAgency(true)
              setActiveAgencyId(nextId)
            }}
          >
            <SelectTrigger
              className="h-8 min-w-[210px] rounded-lg border-border/40 bg-muted/30 text-[12px]"
              disabled={isSwitchingAgency}
            >
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              {agenciasUsuario.map((agencia) => (
                <SelectItem key={agencia.value} value={String(agencia.value)}>
                  {agencia.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {isSwitchingAgency && (
          <div className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Cambiando entorno...
          </div>
        )}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          title="Notificaciones"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="User menu"
              title="Menú de usuario"
              className="h-8 w-8 rounded-lg p-0 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                {initials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl border-border/50 p-0 overflow-hidden">
            {user && (
              <>
                {/* User Info Header */}
                <div className="px-4 py-4 bg-gradient-to-b from-muted/40 to-transparent">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-1">
                        Agencia origen activa: {agenciaActivaLabel}
                      </p>
                      {user.roles && user.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 rounded-md border-0 font-semibold bg-violet-100/80 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
                            >
                              <Shield className="h-2.5 w-2.5 mr-0.5" />
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-1.5">
                  <DropdownMenuItem
                    onClick={() => navigate({ to: '/mi-perfil' })}
                    className="rounded-lg text-[13px] gap-2 cursor-pointer"
                  >
                    <UserCog className="h-4 w-4" />
                    Mi perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-lg text-[13px] gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
