import { MainLayout } from '@/app/layout/MainLayout'
import { useAuthStore } from '@/stores/authStore'
import { createRoute,Navigate } from '@tanstack/react-router'
import { rootRoute } from './__root'

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <MainLayout />
}

export const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: ProtectedLayout,
})
