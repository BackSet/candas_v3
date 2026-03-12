import { createRoute, createRouter, useParams } from '@tanstack/react-router'
import { rootRoute } from './routes/__root'
import { layoutRoute } from './routes/_layout'
import { indexRoute } from './routes/index'
import { lazyRouteComponent } from '@tanstack/react-router'
import { PERMISSIONS } from '@/types/permissions'
import ProtectedRouteByPermission from '@/components/auth/ProtectedByPermission'
import { useAuthStore } from '@/stores/authStore'
import { Navigate } from '@tanstack/react-router'

const Login = lazyRouteComponent(() => import('@/pages/auth/Login'))
const Register = lazyRouteComponent(() => import('@/pages/auth/Register'))
const Dashboard = lazyRouteComponent(() => import('@/pages/dashboard/Dashboard'))
const PaquetesList = lazyRouteComponent(() => import('@/pages/paquetes/PaquetesList'))
const PaqueteForm = lazyRouteComponent(() => import('@/pages/paquetes/PaqueteForm'))
const PaqueteDetail = lazyRouteComponent(() => import('@/pages/paquetes/PaqueteDetail'))
const ClientesList = lazyRouteComponent(() => import('@/pages/clientes/ClientesList'))
const ClienteForm = lazyRouteComponent(() => import('@/pages/clientes/ClienteForm'))
const ClienteDetail = lazyRouteComponent(() => import('@/pages/clientes/ClienteDetail'))
const AgenciasList = lazyRouteComponent(() => import('@/pages/agencias/AgenciasList'))
const AgenciaForm = lazyRouteComponent(() => import('@/pages/agencias/AgenciaForm'))
const AgenciaDetail = lazyRouteComponent(() => import('@/pages/agencias/AgenciaDetail'))
const PuntosOrigenList = lazyRouteComponent(() => import('@/pages/puntos-origen/PuntosOrigenList'))
const PuntoOrigenForm = lazyRouteComponent(() => import('@/pages/puntos-origen/PuntoOrigenForm'))
const PuntoOrigenDetail = lazyRouteComponent(() => import('@/pages/puntos-origen/PuntoOrigenDetail'))
const PermisosList = lazyRouteComponent(() => import('@/pages/permisos/PermisosList'))
const PermisoForm = lazyRouteComponent(() => import('@/pages/permisos/PermisoForm'))
const PermisoDetail = lazyRouteComponent(() => import('@/pages/permisos/PermisoDetail'))
const LotesRecepcionList = lazyRouteComponent(() => import('@/pages/lotes-recepcion/LotesRecepcionList'))
const LoteRecepcionForm = lazyRouteComponent(() => import('@/pages/lotes-recepcion/LoteRecepcionForm'))
const LoteRecepcionDetail = lazyRouteComponent(() => import('@/pages/lotes-recepcion/LoteRecepcionDetail'))
const LoteEspecialTipeo = lazyRouteComponent(() => import('@/pages/lotes-especiales/LoteEspecialTipeo'))
const SacasList = lazyRouteComponent(() => import('@/pages/sacas/SacasList'))
const SacaForm = lazyRouteComponent(() => import('@/pages/sacas/SacaForm'))
const SacaDetail = lazyRouteComponent(() => import('@/pages/sacas/SacaDetail'))
const DespachosList = lazyRouteComponent(() => import('@/pages/despachos/DespachosList'))
const DespachoForm = lazyRouteComponent(() => import('@/pages/despachos/DespachoForm'))
const DespachoDetail = lazyRouteComponent(() => import('@/pages/despachos/DespachoDetail'))
const AtencionPaquetesList = lazyRouteComponent(() => import('@/pages/atencion-paquetes/AtencionPaquetesList'))
const AtencionPaqueteForm = lazyRouteComponent(() => import('@/pages/atencion-paquetes/AtencionPaqueteForm'))
const AtencionPaqueteDetail = lazyRouteComponent(() => import('@/pages/atencion-paquetes/AtencionPaqueteDetail'))
const UsuariosList = lazyRouteComponent(() => import('@/pages/usuarios/UsuariosList'))
const UsuarioForm = lazyRouteComponent(() => import('@/pages/usuarios/UsuarioForm'))
const UsuarioDetail = lazyRouteComponent(() => import('@/pages/usuarios/UsuarioDetail'))
const RolesList = lazyRouteComponent(() => import('@/pages/roles/RolesList'))
const RolForm = lazyRouteComponent(() => import('@/pages/roles/RolForm'))
const RolDetail = lazyRouteComponent(() => import('@/pages/roles/RolDetail'))
const DistribuidoresList = lazyRouteComponent(() => import('@/pages/distribuidores/DistribuidoresList'))
const DistribuidorForm = lazyRouteComponent(() => import('@/pages/distribuidores/DistribuidorForm'))
const DistribuidorDetail = lazyRouteComponent(() => import('@/pages/distribuidores/DistribuidorDetail'))
const ManifiestosConsolidadosList = lazyRouteComponent(() => import('@/pages/manifiestos-consolidados/ManifiestosConsolidadosList'))
const DestinatariosDirectosList = lazyRouteComponent(() => import('@/pages/destinatarios-directos/DestinatariosDirectosList'))
const DestinatarioDirectoForm = lazyRouteComponent(() => import('@/pages/destinatarios-directos/DestinatarioDirectoForm'))
const DestinatarioDirectoDetail = lazyRouteComponent(() => import('@/pages/destinatarios-directos/DestinatarioDirectoDetail'))
const EnsacadoPage = lazyRouteComponent(() => import('@/pages/ensacado/EnsacadoPage'))
const ParametrosSistemaLayout = lazyRouteComponent(() => import('@/pages/parametros-sistema/ParametrosSistemaLayout'))
const ParametrosSistemaIndexPage = lazyRouteComponent(() => import('@/pages/parametros-sistema/ParametrosSistemaIndexPage'))
const ParametrosWhatsAppDespachoPage = lazyRouteComponent(() => import('@/pages/parametros-sistema/ParametrosWhatsAppDespachoPage'))

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => (
    <PublicRoute>
      <Login />
    </PublicRoute>
  ),
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: () => (
    <PublicRoute>
      <Register />
    </PublicRoute>
  ),
})

const dashboardRoute = createRoute({ getParentRoute: () => layoutRoute, path: 'dashboard', component: Dashboard })

const paquetesIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'paquetes',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.PAQUETES.LISTAR, PERMISSIONS.PAQUETES.VER]}>
      <PaquetesList />
    </ProtectedRouteByPermission>
  ),
})
const paquetesNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'paquetes/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
      <PaqueteForm />
    </ProtectedRouteByPermission>
  ),
})
const paquetesIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'paquetes/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PAQUETES.VER}>
      <PaqueteDetail />
    </ProtectedRouteByPermission>
  ),
})
const paquetesIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'paquetes/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
      <PaqueteForm />
    </ProtectedRouteByPermission>
  ),
})

const clientesIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'clientes',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.CLIENTES.LISTAR, PERMISSIONS.CLIENTES.VER]}>
      <ClientesList />
    </ProtectedRouteByPermission>
  ),
})
const clientesNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'clientes/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.CLIENTES.CREAR}>
      <ClienteForm />
    </ProtectedRouteByPermission>
  ),
})
const clientesIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'clientes/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.CLIENTES.VER}>
      <ClienteDetail />
    </ProtectedRouteByPermission>
  ),
})
const clientesIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'clientes/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.CLIENTES.EDITAR}>
      <ClienteForm />
    </ProtectedRouteByPermission>
  ),
})

const agenciasIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'agencias',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.VER}>
      <AgenciasList />
    </ProtectedRouteByPermission>
  ),
})
const agenciasNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'agencias/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.CREAR}>
      <AgenciaForm />
    </ProtectedRouteByPermission>
  ),
})
const agenciasIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'agencias/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.VER}>
      <AgenciaDetail />
    </ProtectedRouteByPermission>
  ),
})
const agenciasIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'agencias/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.AGENCIAS.EDITAR}>
      <AgenciaForm />
    </ProtectedRouteByPermission>
  ),
})

const puntosOrigenIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'puntos-origen',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.PUNTOS_ORIGEN.LISTAR, PERMISSIONS.PUNTOS_ORIGEN.VER]}>
      <PuntosOrigenList />
    </ProtectedRouteByPermission>
  ),
})
const puntosOrigenNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'puntos-origen/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.CREAR}>
      <PuntoOrigenForm />
    </ProtectedRouteByPermission>
  ),
})
const puntosOrigenIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'puntos-origen/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.VER}>
      <PuntoOrigenDetail />
    </ProtectedRouteByPermission>
  ),
})
const puntosOrigenIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'puntos-origen/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.EDITAR}>
      <PuntoOrigenForm />
    </ProtectedRouteByPermission>
  ),
})

const permisosIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'permisos',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.PERMISOS.LISTAR, PERMISSIONS.PERMISOS.VER]}>
      <PermisosList />
    </ProtectedRouteByPermission>
  ),
})
const permisosNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'permisos/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PERMISOS.CREAR}>
      <PermisoForm />
    </ProtectedRouteByPermission>
  ),
})
const permisosIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'permisos/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PERMISOS.VER}>
      <PermisoDetail />
    </ProtectedRouteByPermission>
  ),
})
const permisosIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'permisos/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PERMISOS.EDITAR}>
      <PermisoForm />
    </ProtectedRouteByPermission>
  ),
})

const lotesRecepcionIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-recepcion',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.LOTES_RECEPCION.LISTAR, PERMISSIONS.LOTES_RECEPCION.VER]}>
      <LotesRecepcionList />
    </ProtectedRouteByPermission>
  ),
})
const lotesRecepcionNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-recepcion/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.CREAR}>
      <LoteRecepcionForm />
    </ProtectedRouteByPermission>
  ),
})
const lotesRecepcionIdTipeoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-recepcion/$id/tipeo',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.VER}>
      <LoteEspecialTipeo />
    </ProtectedRouteByPermission>
  ),
})
const lotesRecepcionIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-recepcion/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.VER}>
      <LoteRecepcionDetail />
    </ProtectedRouteByPermission>
  ),
})
const lotesRecepcionIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-recepcion/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.LOTES_RECEPCION.EDITAR}>
      <LoteRecepcionForm />
    </ProtectedRouteByPermission>
  ),
})

const sacasIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'sacas',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.SACAS.LISTAR, PERMISSIONS.SACAS.VER]}>
      <SacasList />
    </ProtectedRouteByPermission>
  ),
})
const sacasNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'sacas/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.SACAS.CREAR}>
      <SacaForm />
    </ProtectedRouteByPermission>
  ),
})
const sacasIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'sacas/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.SACAS.VER}>
      <SacaDetail />
    </ProtectedRouteByPermission>
  ),
})
const sacasIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'sacas/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.SACAS.EDITAR}>
      <SacaForm />
    </ProtectedRouteByPermission>
  ),
})

const despachosIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'despachos',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.DESPACHOS.LISTAR, PERMISSIONS.DESPACHOS.VER]}>
      <DespachosList />
    </ProtectedRouteByPermission>
  ),
})
const despachosNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'despachos/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DESPACHOS.CREAR}>
      <DespachoForm />
    </ProtectedRouteByPermission>
  ),
})
const despachosIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'despachos/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DESPACHOS.VER}>
      <DespachoDetail />
    </ProtectedRouteByPermission>
  ),
})
const despachosIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'despachos/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DESPACHOS.EDITAR}>
      <DespachoForm />
    </ProtectedRouteByPermission>
  ),
})

const atencionPaquetesIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'atencion-paquetes',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.VER}>
      <AtencionPaquetesList />
    </ProtectedRouteByPermission>
  ),
})
const atencionPaquetesNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'atencion-paquetes/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.CREAR}>
      <AtencionPaqueteForm />
    </ProtectedRouteByPermission>
  ),
})
const atencionPaquetesIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'atencion-paquetes/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.VER}>
      <AtencionPaqueteDetail />
    </ProtectedRouteByPermission>
  ),
})
const atencionPaquetesIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'atencion-paquetes/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}>
      <AtencionPaqueteForm />
    </ProtectedRouteByPermission>
  ),
})

const usuariosIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'usuarios',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.USUARIOS.LISTAR, PERMISSIONS.USUARIOS.VER]}>
      <UsuariosList />
    </ProtectedRouteByPermission>
  ),
})
const usuariosNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'usuarios/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.USUARIOS.CREAR}>
      <UsuarioForm />
    </ProtectedRouteByPermission>
  ),
})
const usuariosIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'usuarios/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.USUARIOS.VER}>
      <UsuarioDetail />
    </ProtectedRouteByPermission>
  ),
})
const usuariosIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'usuarios/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.USUARIOS.EDITAR}>
      <UsuarioForm />
    </ProtectedRouteByPermission>
  ),
})

const rolesIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'roles',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.ROLES.LISTAR, PERMISSIONS.ROLES.VER]}>
      <RolesList />
    </ProtectedRouteByPermission>
  ),
})
const rolesNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'roles/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ROLES.CREAR}>
      <RolForm />
    </ProtectedRouteByPermission>
  ),
})
const rolesIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'roles/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ROLES.VER}>
      <RolDetail />
    </ProtectedRouteByPermission>
  ),
})
const rolesIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'roles/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ROLES.EDITAR}>
      <RolForm />
    </ProtectedRouteByPermission>
  ),
})

const distribuidoresIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'distribuidores',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.DISTRIBUIDORES.LISTAR, PERMISSIONS.DISTRIBUIDORES.VER]}>
      <DistribuidoresList />
    </ProtectedRouteByPermission>
  ),
})
const distribuidoresNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'distribuidores/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DISTRIBUIDORES.CREAR}>
      <DistribuidorForm />
    </ProtectedRouteByPermission>
  ),
})
const distribuidoresIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'distribuidores/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DISTRIBUIDORES.VER}>
      <DistribuidorDetail />
    </ProtectedRouteByPermission>
  ),
})
const distribuidoresIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'distribuidores/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DISTRIBUIDORES.EDITAR}>
      <DistribuidorForm />
    </ProtectedRouteByPermission>
  ),
})

const manifiestosConsolidadosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'manifiestos-consolidados',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.LISTAR, PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER]}>
      <ManifiestosConsolidadosList />
    </ProtectedRouteByPermission>
  ),
})

const ensacadoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'ensacado',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.ENSACADO.OPERAR}>
      <EnsacadoPage />
    </ProtectedRouteByPermission>
  ),
})

const parametrosSistemaLayoutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'parametros-sistema',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.PARAMETROS_SISTEMA.VER}>
      <ParametrosSistemaLayout />
    </ProtectedRouteByPermission>
  ),
})

const parametrosSistemaIndexRoute = createRoute({
  getParentRoute: () => parametrosSistemaLayoutRoute,
  path: '/',
  component: ParametrosSistemaIndexPage,
})

const parametrosSistemaWhatsappDespachoRoute = createRoute({
  getParentRoute: () => parametrosSistemaLayoutRoute,
  path: 'whatsapp-despacho',
  component: ParametrosWhatsAppDespachoPage,
})

parametrosSistemaLayoutRoute.addChildren([parametrosSistemaIndexRoute, parametrosSistemaWhatsappDespachoRoute])

const destinatariosDirectosIndexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'destinatarios-directos',
  component: () => (
    <ProtectedRouteByPermission permissions={[PERMISSIONS.DESTINATARIOS_DIRECTOS.LISTAR, PERMISSIONS.DESTINATARIOS_DIRECTOS.VER]}>
      <DestinatariosDirectosList />
    </ProtectedRouteByPermission>
  ),
})
const destinatariosDirectosNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'destinatarios-directos/new',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.CREAR}>
      <DestinatarioDirectoForm />
    </ProtectedRouteByPermission>
  ),
})
const destinatariosDirectosIdRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'destinatarios-directos/$id',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.VER}>
      <DestinatarioDirectoDetail />
    </ProtectedRouteByPermission>
  ),
})
const destinatariosDirectosIdEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'destinatarios-directos/$id/edit',
  component: () => (
    <ProtectedRouteByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.EDITAR}>
      <DestinatarioDirectoForm />
    </ProtectedRouteByPermission>
  ),
})

const lotesEspecialesRedirectRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-especiales',
  component: () => <Navigate to="/lotes-recepcion" replace />,
})
const lotesEspecialesNewRedirectRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-especiales/new',
  component: () => <Navigate to="/lotes-recepcion/new" replace />,
})
const lotesEspecialesIdRedirectRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-especiales/$id',
  component: () => {
    const { id } = useParams({ strict: false })
    if (!id) return <Navigate to="/lotes-recepcion" replace />
    return <Navigate to="/lotes-recepcion/$id" params={{ id }} replace />
  },
})
const lotesEspecialesIdEditRedirectRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'lotes-especiales/$id/edit',
  component: () => {
    const { id } = useParams({ strict: false })
    if (!id) return <Navigate to="/lotes-recepcion" replace />
    return <Navigate to="/lotes-recepcion/$id/edit" params={{ id }} replace />
  },
})
const listasEtiquetadasRedirectRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'listas-etiquetadas',
  component: () => <Navigate to="/lotes-recepcion" replace />,
})
const operarioEtiquetasRedirectRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'operario-etiquetas',
  component: () => <Navigate to="/lotes-recepcion" replace />,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  layoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    paquetesIndexRoute,
    paquetesNewRoute,
    paquetesIdRoute,
    paquetesIdEditRoute,
    clientesIndexRoute,
    clientesNewRoute,
    clientesIdRoute,
    clientesIdEditRoute,
    agenciasIndexRoute,
    agenciasNewRoute,
    agenciasIdRoute,
    agenciasIdEditRoute,
    puntosOrigenIndexRoute,
    puntosOrigenNewRoute,
    puntosOrigenIdRoute,
    puntosOrigenIdEditRoute,
    permisosIndexRoute,
    permisosNewRoute,
    permisosIdRoute,
    permisosIdEditRoute,
    lotesRecepcionIndexRoute,
    lotesRecepcionNewRoute,
    lotesRecepcionIdTipeoRoute,
    lotesRecepcionIdRoute,
    lotesRecepcionIdEditRoute,
    sacasIndexRoute,
    sacasNewRoute,
    sacasIdRoute,
    sacasIdEditRoute,
    despachosIndexRoute,
    despachosNewRoute,
    despachosIdRoute,
    despachosIdEditRoute,
    atencionPaquetesIndexRoute,
    atencionPaquetesNewRoute,
    atencionPaquetesIdRoute,
    atencionPaquetesIdEditRoute,
    usuariosIndexRoute,
    usuariosNewRoute,
    usuariosIdRoute,
    usuariosIdEditRoute,
    rolesIndexRoute,
    rolesNewRoute,
    rolesIdRoute,
    rolesIdEditRoute,
    distribuidoresIndexRoute,
    distribuidoresNewRoute,
    distribuidoresIdRoute,
    distribuidoresIdEditRoute,
    manifiestosConsolidadosRoute,
    ensacadoRoute,
    parametrosSistemaLayoutRoute,
    destinatariosDirectosIndexRoute,
    destinatariosDirectosNewRoute,
    destinatariosDirectosIdRoute,
    destinatariosDirectosIdEditRoute,
    lotesEspecialesRedirectRoute,
    lotesEspecialesNewRedirectRoute,
    lotesEspecialesIdRedirectRoute,
    lotesEspecialesIdEditRedirectRoute,
    listasEtiquetadasRedirectRoute,
    operarioEtiquetasRedirectRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
