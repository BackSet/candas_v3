import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

function RootComponent() {
  const theme = useUIStore((s) => s.theme)
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <Outlet />
    </Suspense>
  )
}

export const rootRoute = createRootRoute({
  component: RootComponent,
})
