import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { applyDefaultDocumentMeta } from '@/lib/document-meta'
import { applyThemeClass, resolveTheme } from '@/lib/theme'
import { useUIStore } from '@/stores/uiStore'

function RootComponent() {
  const theme = useUIStore((s) => s.theme)
  const setResolvedTheme = useUIStore((s) => s.setResolvedTheme)

  useEffect(() => {
    applyDefaultDocumentMeta()
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const syncTheme = () => {
      const resolved = resolveTheme(theme)
      applyThemeClass(resolved)
      setResolvedTheme(resolved)
    }

    syncTheme()

    if (theme !== 'system') return

    const onChange = () => syncTheme()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, setResolvedTheme])

  return <Outlet />
}

export const rootRoute = createRootRoute({
  component: RootComponent,
})
