import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './__root'
import { MainLayout } from '@/app/layout/MainLayout'
import { useAuthStore } from '@/stores/authStore'
import { Navigate } from '@tanstack/react-router'

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
