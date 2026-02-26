import { createRoute, redirect } from '@tanstack/react-router'
import { rootRoute } from './__root'
import { layoutRoute } from './_layout'

export const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
