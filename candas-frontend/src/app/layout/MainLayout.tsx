import { useEffect, useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { GlobalCommandPalette } from '@/components/layout/GlobalCommandPalette'
import { useAuthStore } from '@/stores/authStore'

export function MainLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const refreshMe = useAuthStore((s) => s.refreshMe)
  const [permissionsSynced, setPermissionsSynced] = useState(false)

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
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center text-sm text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 h-full">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 flex flex-col">
            <Outlet />
        </main>
      </div>
      <GlobalCommandPalette />
      <Toaster position="top-right" richColors />
    </div >
  )
}
