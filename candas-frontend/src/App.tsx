import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useParams } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useHasPermission, useHasAnyPermission, useHasRole } from '@/hooks/useHasRole'
import { MainLayout } from './app/layout/MainLayout'
import { PERMISSIONS } from '@/types/permissions'

// Lazy load pages
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const PaquetesList = lazy(() => import('@/pages/paquetes/PaquetesList'))
const PaqueteForm = lazy(() => import('@/pages/paquetes/PaqueteForm'))
const PaqueteDetail = lazy(() => import('@/pages/paquetes/PaqueteDetail'))
const ClientesList = lazy(() => import('@/pages/clientes/ClientesList'))
const ClienteForm = lazy(() => import('@/pages/clientes/ClienteForm'))
const ClienteDetail = lazy(() => import('@/pages/clientes/ClienteDetail'))
const AgenciasList = lazy(() => import('@/pages/agencias/AgenciasList'))
const AgenciaForm = lazy(() => import('@/pages/agencias/AgenciaForm'))
const AgenciaDetail = lazy(() => import('@/pages/agencias/AgenciaDetail'))
const PuntosOrigenList = lazy(() => import('@/pages/puntos-origen/PuntosOrigenList'))
const PuntoOrigenForm = lazy(() => import('@/pages/puntos-origen/PuntoOrigenForm'))
const PuntoOrigenDetail = lazy(() => import('@/pages/puntos-origen/PuntoOrigenDetail'))
const PermisosList = lazy(() => import('@/pages/permisos/PermisosList'))
const PermisoForm = lazy(() => import('@/pages/permisos/PermisoForm'))
const PermisoDetail = lazy(() => import('@/pages/permisos/PermisoDetail'))
const LotesRecepcionList = lazy(() => import('@/pages/lotes-recepcion/LotesRecepcionList'))
const LoteRecepcionForm = lazy(() => import('@/pages/lotes-recepcion/LoteRecepcionForm'))
const LoteRecepcionDetail = lazy(() => import('@/pages/lotes-recepcion/LoteRecepcionDetail'))
const LoteEspecialTipeo = lazy(() => import('@/pages/lotes-especiales/LoteEspecialTipeo'))
const SacasList = lazy(() => import('@/pages/sacas/SacasList'))
const SacaForm = lazy(() => import('@/pages/sacas/SacaForm'))
const SacaDetail = lazy(() => import('@/pages/sacas/SacaDetail'))
const DespachosList = lazy(() => import('@/pages/despachos/DespachosList'))
const DespachoForm = lazy(() => import('@/pages/despachos/DespachoForm'))
const DespachoDetail = lazy(() => import('@/pages/despachos/DespachoDetail'))
const AtencionPaquetesList = lazy(() => import('@/pages/atencion-paquetes/AtencionPaquetesList'))
const AtencionPaqueteForm = lazy(() => import('@/pages/atencion-paquetes/AtencionPaqueteForm'))
const AtencionPaqueteDetail = lazy(() => import('@/pages/atencion-paquetes/AtencionPaqueteDetail'))
const UsuariosList = lazy(() => import('@/pages/usuarios/UsuariosList'))
const UsuarioForm = lazy(() => import('@/pages/usuarios/UsuarioForm'))
const UsuarioDetail = lazy(() => import('@/pages/usuarios/UsuarioDetail'))
const RolesList = lazy(() => import('@/pages/roles/RolesList'))
const RolForm = lazy(() => import('@/pages/roles/RolForm'))
const RolDetail = lazy(() => import('@/pages/roles/RolDetail'))
const DistribuidoresList = lazy(() => import('@/pages/distribuidores/DistribuidoresList'))
const DistribuidorForm = lazy(() => import('@/pages/distribuidores/DistribuidorForm'))
const DistribuidorDetail = lazy(() => import('@/pages/distribuidores/DistribuidorDetail'))
const ManifiestosConsolidadosList = lazy(() => import('@/pages/manifiestos-consolidados/ManifiestosConsolidadosList'))
const DestinatariosDirectosList = lazy(() => import('@/pages/destinatarios-directos/DestinatariosDirectosList'))
const DestinatarioDirectoForm = lazy(() => import('@/pages/destinatarios-directos/DestinatarioDirectoForm'))
const DestinatarioDirectoDetail = lazy(() => import('@/pages/destinatarios-directos/DestinatarioDirectoDetail'))
const EnsacadoPage = lazy(() => import('@/pages/ensacado/EnsacadoPage'))
const ListasEtiquetadasPage = lazy(() => import('@/pages/listas-etiquetadas/ListasEtiquetadasPage'))

function RedirectLoteEspecialToRecepcion() {
  const { id } = useParams({ strict: false })
  return <Navigate to={id ? `/lotes-recepcion/${id}` : '/lotes-recepcion'} replace />
}
function RedirectLoteEspecialEditToRecepcion() {
  const { id } = useParams({ strict: false })
  return <Navigate to={id ? `/lotes-recepcion/${id}/edit` : '/lotes-recepcion'} replace />
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function ProtectedRouteByPermission({
  children,
  permission,
  permissions
}: {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAdmin = useHasRole('ADMIN')
  // Llamar siempre los mismos hooks en el mismo orden (Rules of Hooks)
  const hasPermissionResult = useHasPermission(permission ?? '')
  const hasAnyPermissionResult = useHasAnyPermission(permissions ?? [])
  const hasPermission = permission ? hasPermissionResult : false
  const hasAnyPermission = permissions && permissions.length > 0 ? hasAnyPermissionResult : false
  const hasAccess = isAdmin || hasPermission || hasAnyPermission

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // ADMIN tiene acceso a todo
  if ((permission || (permissions && permissions.length > 0)) && !hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { theme } = useUIStore()

  useEffect(() => {
    // Apply theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="paquetes" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.PAQUETES.LISTAR, PERMISSIONS.PAQUETES.VER]}><PaquetesList /></ProtectedRouteByPermission>} />
          <Route path="paquetes/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.PAQUETES.CREAR}><PaqueteForm /></ProtectedRouteByPermission>} />
          <Route path="paquetes/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.PAQUETES.VER}><PaqueteDetail /></ProtectedRouteByPermission>} />
          <Route path="paquetes/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.PAQUETES.EDITAR}><PaqueteForm /></ProtectedRouteByPermission>} />
          <Route path="clientes" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.CLIENTES.LISTAR, PERMISSIONS.CLIENTES.VER]}><ClientesList /></ProtectedRouteByPermission>} />
          <Route path="clientes/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.CLIENTES.CREAR}><ClienteForm /></ProtectedRouteByPermission>} />
          <Route path="clientes/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.CLIENTES.VER}><ClienteDetail /></ProtectedRouteByPermission>} />
          <Route path="clientes/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.CLIENTES.EDITAR}><ClienteForm /></ProtectedRouteByPermission>} />
          <Route path="agencias" element={<ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.VER}><AgenciasList /></ProtectedRouteByPermission>} />
          <Route path="agencias/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.CREAR}><AgenciaForm /></ProtectedRouteByPermission>} />
          <Route path="agencias/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.VER}><AgenciaDetail /></ProtectedRouteByPermission>} />
          <Route path="agencias/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.EDITAR}><AgenciaForm /></ProtectedRouteByPermission>} />
          <Route path="puntos-origen" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.PUNTOS_ORIGEN.LISTAR, PERMISSIONS.PUNTOS_ORIGEN.VER]}><PuntosOrigenList /></ProtectedRouteByPermission>} />
          <Route path="puntos-origen/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.CREAR}><PuntoOrigenForm /></ProtectedRouteByPermission>} />
          <Route path="puntos-origen/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.VER}><PuntoOrigenDetail /></ProtectedRouteByPermission>} />
          <Route path="puntos-origen/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.EDITAR}><PuntoOrigenForm /></ProtectedRouteByPermission>} />
          <Route path="permisos" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.PERMISOS.LISTAR, PERMISSIONS.PERMISOS.VER]}><PermisosList /></ProtectedRouteByPermission>} />
          <Route path="permisos/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.PERMISOS.CREAR}><PermisoForm /></ProtectedRouteByPermission>} />
          <Route path="permisos/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.PERMISOS.VER}><PermisoDetail /></ProtectedRouteByPermission>} />
          <Route path="permisos/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.PERMISOS.EDITAR}><PermisoForm /></ProtectedRouteByPermission>} />
          <Route path="lotes-recepcion" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.LOTES_RECEPCION.LISTAR, PERMISSIONS.LOTES_RECEPCION.VER]}><LotesRecepcionList /></ProtectedRouteByPermission>} />
          <Route path="lotes-recepcion/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.CREAR}><LoteRecepcionForm /></ProtectedRouteByPermission>} />
          <Route path="lotes-recepcion/:id/tipeo" element={<ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.VER}><LoteEspecialTipeo /></ProtectedRouteByPermission>} />
          <Route path="lotes-recepcion/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.VER}><LoteRecepcionDetail /></ProtectedRouteByPermission>} />
          <Route path="lotes-recepcion/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.EDITAR}><LoteRecepcionForm /></ProtectedRouteByPermission>} />
          <Route path="sacas" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.SACAS.LISTAR, PERMISSIONS.SACAS.VER]}><SacasList /></ProtectedRouteByPermission>} />
          <Route path="sacas/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.SACAS.CREAR}><SacaForm /></ProtectedRouteByPermission>} />
          <Route path="sacas/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.SACAS.VER}><SacaDetail /></ProtectedRouteByPermission>} />
          <Route path="sacas/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.SACAS.EDITAR}><SacaForm /></ProtectedRouteByPermission>} />
          <Route path="despachos" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.DESPACHOS.LISTAR, PERMISSIONS.DESPACHOS.VER]}><DespachosList /></ProtectedRouteByPermission>} />
          <Route path="despachos/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.DESPACHOS.CREAR}><DespachoForm /></ProtectedRouteByPermission>} />
          <Route path="despachos/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.DESPACHOS.VER}><DespachoDetail /></ProtectedRouteByPermission>} />
          <Route path="despachos/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.DESPACHOS.EDITAR}><DespachoForm /></ProtectedRouteByPermission>} />
          <Route path="atencion-paquetes" element={<ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.VER}><AtencionPaquetesList /></ProtectedRouteByPermission>} />
          <Route path="atencion-paquetes/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.CREAR}><AtencionPaqueteForm /></ProtectedRouteByPermission>} />
          <Route path="atencion-paquetes/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.VER}><AtencionPaqueteDetail /></ProtectedRouteByPermission>} />
          <Route path="atencion-paquetes/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}><AtencionPaqueteForm /></ProtectedRouteByPermission>} />
          <Route path="usuarios" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.USUARIOS.LISTAR, PERMISSIONS.USUARIOS.VER]}><UsuariosList /></ProtectedRouteByPermission>} />
          <Route path="usuarios/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.USUARIOS.CREAR}><UsuarioForm /></ProtectedRouteByPermission>} />
          <Route path="usuarios/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.USUARIOS.VER}><UsuarioDetail /></ProtectedRouteByPermission>} />
          <Route path="usuarios/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.USUARIOS.EDITAR}><UsuarioForm /></ProtectedRouteByPermission>} />
          <Route path="roles" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.ROLES.LISTAR, PERMISSIONS.ROLES.VER]}><RolesList /></ProtectedRouteByPermission>} />
          <Route path="roles/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.ROLES.CREAR}><RolForm /></ProtectedRouteByPermission>} />
          <Route path="roles/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.ROLES.VER}><RolDetail /></ProtectedRouteByPermission>} />
          <Route path="roles/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.ROLES.EDITAR}><RolForm /></ProtectedRouteByPermission>} />
          <Route path="distribuidores" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.DISTRIBUIDORES.LISTAR, PERMISSIONS.DISTRIBUIDORES.VER]}><DistribuidoresList /></ProtectedRouteByPermission>} />
          <Route path="distribuidores/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.DISTRIBUIDORES.CREAR}><DistribuidorForm /></ProtectedRouteByPermission>} />
          <Route path="distribuidores/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.DISTRIBUIDORES.VER}><DistribuidorDetail /></ProtectedRouteByPermission>} />
          <Route path="distribuidores/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.DISTRIBUIDORES.EDITAR}><DistribuidorForm /></ProtectedRouteByPermission>} />
          <Route path="manifiestos-consolidados" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.LISTAR, PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER]}><ManifiestosConsolidadosList /></ProtectedRouteByPermission>} />
          <Route path="ensacado" element={<ProtectedRouteByPermission permission={PERMISSIONS.ENSACADO.OPERAR}><EnsacadoPage /></ProtectedRouteByPermission>} />
          <Route path="destinatarios-directos" element={<ProtectedRouteByPermission permissions={[PERMISSIONS.DESTINATARIOS_DIRECTOS.LISTAR, PERMISSIONS.DESTINATARIOS_DIRECTOS.VER]}><DestinatariosDirectosList /></ProtectedRouteByPermission>} />
          <Route path="destinatarios-directos/new" element={<ProtectedRouteByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.CREAR}><DestinatarioDirectoForm /></ProtectedRouteByPermission>} />
          <Route path="destinatarios-directos/:id" element={<ProtectedRouteByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.VER}><DestinatarioDirectoDetail /></ProtectedRouteByPermission>} />
          <Route path="destinatarios-directos/:id/edit" element={<ProtectedRouteByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.EDITAR}><DestinatarioDirectoForm /></ProtectedRouteByPermission>} />
          <Route path="lotes-especiales" element={<Navigate to="/lotes-recepcion" replace />} />
          <Route path="lotes-especiales/new" element={<Navigate to="/lotes-recepcion/new" replace />} />
          <Route path="lotes-especiales/:id" element={<RedirectLoteEspecialToRecepcion />} />
          <Route path="lotes-especiales/:id/edit" element={<RedirectLoteEspecialEditToRecepcion />} />
          <Route path="listas-etiquetadas" element={<Navigate to="/lotes-recepcion" replace />} />
          <Route path="operario-etiquetas" element={<Navigate to="/lotes-recepcion" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
