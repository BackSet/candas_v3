# Candas - Mapa de modulos

## Alcance

Este mapa describe los modulos funcionales y tecnicos presentes en la rama `dev`. Usa evidencia de rutas frontend, controladores backend, entidades JPA, endpoints declarados, permisos y documentacion existente. [verificado en Git] [verificado en documentacion]

## Modulos funcionales

| Modulo | Frontend | Backend | Persistencia | Permisos |
| --- | --- | --- | --- | --- |
| Autenticacion y perfil | `/login`, `/register`, `/mi-perfil`; `stores/authStore.ts`; `lib/api/auth.service.ts` | `AuthController`, `AuthService`, `JwtService` | `usuario`, `usuario_rol`, `rol`, `permiso` | Autenticado; login/register publicos segun seguridad |
| Dashboard/Home | `/`, `/dashboard`; `pages/home`, `pages/dashboard` | No se encontro controller dedicado | Pendiente de confirmar | Navegacion con `permission: null` para Dashboard |
| Paquetes | `/paquetes`, `/paquetes/new`, `/paquetes/$id`, `/paquetes/$id/edit`; `hooks/usePaquetes.ts`; `paquete.service.ts` | `PaqueteController`, `PaqueteService`, `PaqueteImportService`, `PaqueteHierarchyService`, `PaqueteValidator`, `PaqueteMapper` | `paquete`, `paquete_no_encontrado`, `paquete_saca` | `paquetes:*` |
| Clientes | `/clientes`, `/clientes/new`, `/clientes/$id`, `/clientes/$id/edit` | `ClienteController`, `ClienteService`, `ClienteRepository`, `ClienteSpecs` | `cliente` | `clientes:*` |
| Agencias | `/agencias`, `/agencias/new`, `/agencias/$id`, `/agencias/$id/edit` | `AgenciaController`, `AgenciaService`, `AgenciaRepository`, `AgenciaSpecs` | `agencia`, `telefono_agencia` | `agencias:*` |
| Destinatarios directos | `/destinatarios-directos`, `/destinatarios-directos/new`, `/destinatarios-directos/$id`, `/destinatarios-directos/$id/edit` | `DestinatarioDirectoController`, `DestinatarioDirectoService`, specs | `destinatario_directo` | `destinatarios_directos:*` |
| Distribuidores | `/distribuidores`, `/distribuidores/new`, `/distribuidores/$id`, `/distribuidores/$id/edit` | `DistribuidorController`, `DistribuidorService`, specs | `distribuidor` | `distribuidores:*` |
| Puntos de origen | `/puntos-origen`, `/puntos-origen/new`, `/puntos-origen/$id`, `/puntos-origen/$id/edit` | `PuntoOrigenController`, `PuntoOrigenService`, specs | `punto_origen` | `puntos_origen:*` |
| Lotes Recepcion | `/lotes-recepcion`, `/lotes-recepcion/new`, `/lotes-recepcion/$id`, `/lotes-recepcion/$id/edit`, `/lotes-recepcion/$id/tipeo` | `LoteRecepcionController`, `LoteRecepcionService`, specs | `lote_recepcion`, `paquete` | `lotes_recepcion:*` |
| Lotes especiales | Rutas legacy `/lotes-especiales*` redirigen en `routeTree.gen.tsx`; paginas en `pages/lotes-especiales` y flujo operador en `pages/lotes-recepcion` | Se atiende desde `LoteRecepcionController` y endpoints `/api/v1/lotes-recepcion/especiales*` | `lote_recepcion` con `TipoLote` | `lotes_recepcion:*` |
| Sacas | `/sacas`, `/sacas/new`, `/sacas/$id`, `/sacas/$id/edit` | `SacaController`, `SacaService`, specs | `saca`, `paquete_saca`, relacion con `paquete` | `sacas:*` |
| Despachos | `/despachos`, `/despachos/new`, `/despachos/$id`, `/despachos/$id/edit` | `DespachoController`, `DespachoService`, specs | `despacho`, `saca`, `paquete_saca` | `despachos:*` |
| Despacho masivo | Dialogs/hooks de despacho masivo; endpoint session | `DespachoMasivoController`, `DespachoMasivoSesionService` | `despacho_masivo_sesion` | `despachos:crear` |
| Ensacado | `/ensacado`; `hooks/useEnsacado.ts`; `ensacado.service.ts` | `EnsacadoController`, `EnsacadoService` | `ensacado_sesion`, `saca`, `paquete` | `ensacado:operar` |
| Atencion de paquetes | `/atencion-paquetes`, `/atencion-paquetes/new`, `/atencion-paquetes/$id`, `/atencion-paquetes/$id/edit` | `AtencionPaqueteController`, `AtencionPaqueteService` | `atencion_paquete`, `paquete` | `atencion_paquetes:*` |
| Manifiestos consolidados | `/manifiestos-consolidados`; paginas y utilidades de exportacion/impresion | `ManifiestoConsolidadoController`, `ManifiestoConsolidadoService`, specs | `manifiesto_consolidado` | `manifiestos_consolidados:*` |
| Listas etiquetadas | Rutas legacy `/listas-etiquetadas` y `/operario-etiquetas` redirigen; componentes en `components/listas-etiquetadas`; service dedicado | `ListasEtiquetadasController`, `ListasEtiquetadasService` | Flujo basado en `paquete`; tablas historicas de listas fueron eliminadas por migraciones `V113` | Pendiente de confirmar; usa endpoints bajo paquetes |
| Usuarios | `/usuarios`, `/usuarios/new`, `/usuarios/$id`, `/usuarios/$id/edit` | `UsuarioController`, `UsuarioService`, `CustomUserDetailsService` | `usuario`, `usuario_rol` y alcance de agencias | `usuarios:*`, `usuarios:asignar_roles` |
| Roles | `/roles`, `/roles/new`, `/roles/$id`, `/roles/$id/edit` | `RolController`, `RolService` | `rol`, `rol_permiso` | `roles:*`, `roles:asignar_permisos` |
| Permisos | `/permisos`, `/permisos/$id`, `/permisos/$id/edit` | `PermisoController`, `PermisoService` | `permiso` | `permisos:*` |
| Parametros del sistema | `/parametros-sistema`, `/parametros-sistema/whatsapp-despacho` | `ParametroSistemaController`, `ParametroSistemaService` | `parametro_sistema` | `parametros_sistema:ver`, `parametros_sistema:editar` |

## Rutas frontend canonicas

- Publicas: `/`, `/login`, `/register`. [verificado en Git: `routeTree.gen.tsx`]
- Protegidas por layout autenticado: `/dashboard`, `/mi-perfil`, modulos CRUD y operativos bajo `layoutRoute`. [verificado en Git]
- CRUD con patron `list/new/detail/edit`: paquetes, clientes, agencias, puntos origen, lotes recepcion, sacas, despachos, atencion paquetes, usuarios, roles, distribuidores, destinatarios directos. [verificado en Git]
- Rutas especiales: `/lotes-recepcion/$id/tipeo`, `/ensacado`, `/parametros-sistema/whatsapp-despacho`. [verificado en Git]
- Rutas legacy/redireccion: `/lotes-especiales*`, `/listas-etiquetadas`, `/operario-etiquetas`. [verificado en Git]
- Navegacion lateral canonica: `src/config/navigation.ts`. [verificado en Git]

## Endpoints y controladores backend

| Controller | Ruta base |
| --- | --- |
| `AuthController` | `/api/auth` |
| `UsuarioController` | `/api/v1/usuarios` |
| `ClienteController` | `/api/v1/clientes` |
| `AgenciaController` | `/api/v1/agencias` |
| `PuntoOrigenController` | `/api/v1/puntos-origen` |
| `PaqueteController` | `/api/v1/paquetes` |
| `LoteRecepcionController` | `/api/v1/lotes-recepcion` |
| `SacaController` | `/api/v1/sacas` |
| `DespachoController` | `/api/v1/despachos` |
| `DespachoMasivoController` | `/api/v1/despacho-masivo` |
| `AtencionPaqueteController` | `/api/v1/atenciones` |
| `RolController` | `/api/v1/roles` |
| `PermisoController` | `/api/v1/permisos` |
| `DistribuidorController` | `/api/v1/distribuidores` |
| `ManifiestoConsolidadoController` | `/api/v1/manifiestos-consolidados` |
| `DestinatarioDirectoController` | `/api/v1/destinatarios-directos` |
| `EnsacadoController` | `/api/v1/ensacado` |
| `ParametroSistemaController` | `/api/v1/parametros-sistema` |
| `ListasEtiquetadasController` | `/api/v1/paquetes/listas-etiquetadas` |

Todos los controladores anteriores existen en `candas-backend/src/main/java/com/candas/candas_backend/controller`. [verificado en Git]

## Entidades y tablas

| Entidad | Tabla |
| --- | --- |
| `Agencia` | `agencia` |
| `AtencionPaquete` | `atencion_paquete` |
| `Cliente` | `cliente` |
| `Despacho` | `despacho` |
| `DespachoMasivoSesion` | `despacho_masivo_sesion` |
| `DestinatarioDirecto` | `destinatario_directo` |
| `Distribuidor` | `distribuidor` |
| `EnsacadoSesion` | `ensacado_sesion` |
| `LoteRecepcion` | `lote_recepcion` |
| `ManifiestoConsolidado` | `manifiesto_consolidado` |
| `Paquete` | `paquete` |
| `PaqueteNoEncontrado` | `paquete_no_encontrado` |
| `PaqueteSaca` | `paquete_saca` |
| `ParametroSistema` | `parametro_sistema` |
| `Permiso` | `permiso` |
| `PuntoOrigen` | `punto_origen` |
| `Rol` | `rol` |
| `RolPermiso` | `rol_permiso` |
| `Saca` | `saca` |
| `TelefonoAgencia` | `telefono_agencia` |
| `Usuario` | `usuario` |
| `UsuarioRol` | `usuario_rol` |

Fuente: anotaciones `@Entity` y `@Table` en `candas-backend/src/main/java/com/candas/candas_backend/entity`. [verificado en Git]

## Enums de dominio

- `EstadoPaquete`, `TipoPaquete`, `TipoDestino`, `EstadoAtencion`, `TipoProblemaAtencion`, `EstadoListaEtiqueta`, `EstadoGuiaEtiqueta`, `InstruccionGuiaEtiqueta`, `TipoLote`, `TamanoSaca`. [verificado en Git]

## Dependencias entre modulos

- Paquetes es modulo central: se relaciona con clientes, agencias/destinatarios directos, lote recepcion, sacas, despachos, atencion y manifiestos. [inferido desde entidades, services y endpoints]
- Lotes Recepcion crea/importa/organiza paquetes; Lotes Especiales reutiliza infraestructura de Lotes Recepcion. [verificado en Git] [inferido]
- Sacas agrupa paquetes mediante `paquete_saca`; Despachos agrupa sacas y puede agregar cadenitas. [verificado en Git]
- Cada saca tiene su propio presinto de seguridad (`saca.codigo_presinto`, `Saca.codigoPresinto`, `SacaDTO.codigoPresinto`), colocado al ensacar; el backend lo genera por saca si no se informa y se imprime en la etiqueta de la saca. `despacho.codigo_presinto` es legacy (deprecado, no fuente de verdad). [verificado en Git]
- Ensacado opera sobre despachos, sacas y paquetes, guardando sesion de trabajo. [verificado en Git]
- Manifiestos consolidados dependen de agencias/despachos/paquetes para consolidacion e impresion/exportacion. [inferido]
- Usuarios, roles y permisos alimentan autorizacion backend y gating frontend. [verificado en Git]
- Parametros del sistema alimenta configuracion de plantilla WhatsApp de despacho. [verificado en Git]

## Flujos criticos

- Login: `POST /api/auth/login` -> token JWT -> store frontend -> Axios envia `Authorization`. [verificado en Git]
- CRUD maestro: pagina/lista -> hook -> service API -> controller -> service -> repository/spec -> entidad/DB. [verificado en Git] [inferido]
- Importacion de paquetes: UI de paquetes/lotes -> endpoints de Paquete/LoteRecepcion -> `PaqueteImportService`/`ExcelHelper`. [verificado en Git] [inferido]
- Recepcion por lote y tipeo: rutas `/lotes-recepcion*`, endpoints `/api/v1/lotes-recepcion*`, `TipoLote`. [verificado en Git]
- Ensacado: buscar guia, marcar/desmarcar ensacado, consultar despachos/sacas y sesion. [verificado en Git]
- Despacho: crear/editar despacho, agregar sacas, agregar cadenita, marcar despachado individual o batch. [verificado en Git]
- RBAC: usuario -> roles -> permisos -> `@PreAuthorize` backend y navegacion/protecciones frontend. [verificado en Git]

## Zonas de busqueda

- Backend controller: `candas-backend/src/main/java/com/candas/candas_backend/controller`.
- Backend negocio: `service`, `repository`, `repository/spec`, `validation`.
- Backend dominio: `entity`, `entity/enums`, `dto`, `mapper`.
- Backend seguridad: `config`, `security`, `util/PermissionConstants.java`.
- DB: `candas-backend/src/main/resources/db/migration`.
- Frontend rutas: `candas-frontend/src/routeTree.gen.tsx`, `src/routes`.
- Frontend navegacion/permisos: `src/config/navigation.ts`, `src/types/permissions.ts`.
- Frontend API: `src/lib/api/client.ts`, `src/lib/api/endpoints.ts`, `src/lib/api/*.service.ts`.
- Frontend UI: `src/pages`, `src/components`, `src/hooks`, `src/schemas`, `src/types`, `src/stores`, `src/utils`.
- Documentacion: `README.md`, `docs/README.md`, `docs/ARQUITECTURA_BACKEND.md`, `docs/TECH-STACK.md`, `docs/DEPLOYMENT.md`, `candas-frontend/docs`, `candas-backend/docs`.

## Tests y documentacion relacionada

- Backend declara `spring-boot-starter-test` en `pom.xml`. [verificado en Git]
- Tests backend detectados: `CandasBackendApplicationTests`, `JwtAuthenticationEntryPointTest`, `EnsacadoControllerTest`. [verificado en Git]
- Frontend no declara script `test` en `package.json`. [verificado en Git]
- No se detectaron archivos frontend `*.test.*` o `*.spec.*` relevantes durante la auditoria. [verificado en Git]
- Documentacion relacionada: `docs/README.md`, `docs/TECH-STACK.md`, `docs/ARQUITECTURA_BACKEND.md`, `docs/DEPLOYMENT.md`, `candas-frontend/docs/DESIGN_SYSTEM.md`, `candas-frontend/docs/XLSX_SECURITY_MITIGATION.md`, `candas-backend/docs/JasperReportsUsage.md`. [verificado en documentacion]

## Pendientes de confirmar

- Contrato detallado campo por campo de cada DTO/API; no se genero OpenAPI durante esta auditoria. [pendiente de confirmar]
- Cobertura real de pruebas automatizadas mas alla de los tests backend detectados y criterio de QA manual. [pendiente de confirmar]
- Estado funcional de rutas legacy/redireccion (`lotes-especiales`, `listas-etiquetadas`, `operario-etiquetas`) y si deben mantenerse publicamente. [pendiente de confirmar]
- Politica definitiva para permisos de impresion presentes en frontend (`sacas:imprimir`, `despachos:imprimir`, `manifiestos_consolidados:imprimir`) pero no en `PermissionConstants.java`. [pendiente de confirmar]
