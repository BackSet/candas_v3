import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

function RootComponent() {
  const theme = useUIStore((s) => s.theme)
  const setResolvedTheme = useUIStore((s) => s.setResolvedTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const resolved = theme === 'system'
        ? (media.matches ? 'dark' : 'light')
        : theme

      if (resolved === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')

      setResolvedTheme(resolved)
    }

    applyTheme()

    if (theme !== 'system') return

    const onChange = () => applyTheme()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, setResolvedTheme])

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <Outlet />
    </Suspense>
  )
}

export const rootRoute = createRootRoute({
  component: RootComponent,
})
