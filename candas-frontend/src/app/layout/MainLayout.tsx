import { GlobalCommandPalette } from '@/components/layout/GlobalCommandPalette'
import { LoadingState } from '@/components/states'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Outlet,useLocation } from '@tanstack/react-router'
import { Suspense,useEffect,useMemo,useState } from 'react'
import { Toaster } from 'sonner'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

function mainUsesContentPadding(pathname: string): boolean {
  if (pathname === '/dashboard' || pathname === '/mi-perfil') return true
  if (pathname === '/parametros-sistema') return true
  return false
}

export function MainLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const refreshMe = useAuthStore((s) => s.refreshMe)
  const resolvedTheme = useUIStore((s) => s.resolvedTheme)
  const location = useLocation()
  const [permissionsSynced, setPermissionsSynced] = useState(false)

  const mainPaddingClass = useMemo(() => {
    if (mainUsesContentPadding(location.pathname)) {
      return 'p-4 md:p-6 lg:p-8'
    }
    return 'p-0'
  }, [location.pathname])

  useEffect(() => {
    if (isAuthenticated) {
      setPermissionsSynced(false)
      refreshMe()
        .finally(() => setPermissionsSynced(true))
    } else {
      setPermissionsSynced(true)
    }
  }, [isAuthenticated, refreshMe])

  const showContent = !isAuthenticated || permissionsSynced

  if (!showContent) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-6">
        <LoadingState
          label="Sincronizando sesión..."
          description="Estamos cargando permisos y preferencias del usuario."
          className="w-full max-w-md"
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 h-full">
        <Header />
        <main
          className={`flex flex-1 min-h-0 flex-col overflow-x-hidden overflow-y-auto ${mainPaddingClass}`}
        >
          <Suspense fallback={<RouteSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <GlobalCommandPalette />
      <Toaster
        position="top-right"
        theme={resolvedTheme}
        closeButton
        expand={false}
        richColors
        toastOptions={{
          duration: 4000,
          classNames: {
            toast:
              'group rounded-lg border border-border bg-background text-foreground shadow-lg backdrop-blur-sm',
            title: 'text-sm font-medium leading-tight',
            description: 'text-sm text-muted-foreground',
            actionButton:
              'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-medium',
            cancelButton:
              'bg-muted text-muted-foreground hover:bg-muted/80 rounded-md text-xs font-medium',
            closeButton:
              'border-border bg-background text-muted-foreground hover:bg-muted',
            success: 'border-success/50',
            error: 'border-error/50',
            warning: 'border-warning/50',
            info: 'border-info/50',
            loading: 'border-border',
          },
        }}
      />
    </div >
  )
}

function RouteSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24 ml-auto" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
