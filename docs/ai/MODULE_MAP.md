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
| Despachos rápidos | `/despachos/rapidos` (tablero desktop, finalización), `/despachos/rapidos/mobile` (vista móvil de captura); `pages/despachos-rapidos`, `components/despachos-rapidos/*`, `lib/api/despacho-rapido.service.ts`; endpoints `/api/v1/despachos-rapidos` | `DespachoRapidoController`, `DespachoRapidoService` | `despacho` (+ `estado`), `saca`, `paquete_saca`, `paquete` | `despachos:crear`, `despachos:editar`, `despachos:ver`, `despachos:listar` |
| Despacho masivo (Backend) | (Retirado de la UI; persistencia/sesión conservadas para Lote Recepción) | `DespachoMasivoController`, `DespachoMasivoSesionService` | `despacho_masivo_sesion` | `despachos:crear` |
| Ensacado | `/ensacado`; `hooks/useEnsacado.ts`, `hooks/useBarcodeScanner.ts`; `ensacado.service.ts` | `EnsacadoController`, `EnsacadoService` | `ensacado_sesion`, `saca`, `paquete` | `ensacado:operar` |
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
- Rutas especiales: `/lotes-recepcion/$id/tipeo`, `/despachos/rapidos`, `/despachos/rapidos/mobile`, `/ensacado`, `/parametros-sistema/whatsapp-despacho`. [verificado en Git]
- Rutas legacy/redireccion: `/lotes-especiales*`, `/listas-etiquetadas`, `/operario-etiquetas`. [verificado en Git]
- Navegacion lateral canonica: `src/config/navigation.ts`. Soporta grupos con `children` (subitems): el grupo `Despachos` agrupa General (`/despachos`), Rápidos (`/despachos/rapidos`) y Ensacado rápido (`/despachos/rapidos/mobile`); el sidebar resuelve el ítem activo por prefijo más largo, de modo que rutas anidadas activan un único ítem. [verificado en Git]

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
| `DespachoRapidoController` | `/api/v1/despachos-rapidos` |
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

- `EstadoPaquete`, `TipoPaquete`, `TipoDestino`, `EstadoAtencion`, `TipoProblemaAtencion`, `EstadoListaEtiqueta`, `EstadoGuiaEtiqueta`, `InstruccionGuiaEtiqueta`, `TipoLote`, `TamanoSaca`, `EstadoDespacho`. [verificado en Git]
- `EstadoDespacho` (ciclo de vida de despacho, módulo Despachos rápidos): `BORRADOR`, `EN_ENSACADO`, `LISTO_PARA_GUIA`, `FINALIZADO`. [verificado en Git]
- `TipoLote` (MVP 1/3 lote automático desde despachos): `NORMAL`, `ESPECIAL`, `AUTOMATICO_DESPACHO`. `AUTOMATICO_DESPACHO` identifica lotes de recepción creados automáticamente (no manualmente) para paquetes asociados a despachos/sacas que no tenían lote de recepción. [verificado en Git]

## Dependencias entre modulos

- Paquetes es modulo central: se relaciona con clientes, agencias/destinatarios directos, lote recepcion, sacas, despachos, atencion y manifiestos. [inferido desde entidades, services y endpoints]
- Lotes Recepcion crea/importa/organiza paquetes; Lotes Especiales reutiliza infraestructura de Lotes Recepcion. [verificado en Git] [inferido]
- `LoteRecepcionAutomaticoService` (MVP 1/3 base + MVP 2/3 integrado): asegura que un paquete asociado a un despacho/saca tenga lote de recepción cuando no tiene uno, buscando o creando un lote `AUTOMATICO_DESPACHO` agrupado por fecha del despacho (`Despacho.fechaDespacho`) + agencia propietaria del despacho (`Despacho.agenciaPropietaria`, no `Despacho.agencia` que es el destino). No reutiliza `LoteRecepcionService.agregarPaquetes` porque ese método fuerza estado `RECIBIDO` en el paquete; solo asigna la relación `Paquete.loteRecepcion` sin tocar estado ni fechaRecepcion del paquete, y nunca sobreescribe un lote ya asignado. El `numeroRecepcion` del lote automático es determinístico (`REC-AUTO-<idAgencia>-<yyyyMMdd>`), lo que aprovecha la unicidad existente de esa columna para evitar lotes duplicados bajo creación concurrente (multi-dispositivo). Si el despacho no tiene `agenciaPropietaria` (admin sin agencia origen activa seleccionada), el servicio no hace nada (no hay agencia inequívoca para agrupar). [verificado en Git]
  - Integración MVP 2/3: `DespachoRapidoService.agregarPaquete` la invoca justo después de reservar el paquete en la saca; `DespachoRapidoService.finalizar` la invoca como respaldo sobre todos los paquetes de todas las sacas del despacho antes de considerar el cierre completo. `DespachoService.crearYAsignarSacas` (usado por `create`/`update` del flujo clásico) y `DespachoService.agregarCadenitaAlDespacho` la invocan al asociar cada paquete a una saca; `DespachoService.marcarPaquetesComoDespachados` la invoca como respaldo sobre todos los paquetes de las sacas del despacho antes/al marcarlos `DESPACHADO` (evento equivalente a "finalizar" en el flujo clásico, que no tiene `EstadoDespacho`). [verificado en Git]
  - Gap conocido (fuera de alcance de MVP 2/3, pendiente de una futura iteración): `SacaService.agregarPaquetes(idSaca, idPaquetes)` asocia paquetes directamente a una saca (que puede ya pertenecer a un despacho) sin pasar por `DespachoRapidoService` ni `DespachoService`, y no invoca el servicio de lote automático en el momento de la asociación. El respaldo en `finalizar`/`marcarPaquetesComoDespachados` sí termina cubriendo estos paquetes (recorren todas las sacas del despacho sin importar cómo se poblaron), pero quedan sin lote automático mientras el despacho no se finalice/marque despachado. [pendiente de confirmar]
- Sacas agrupa paquetes mediante `paquete_saca`; Despachos agrupa sacas y puede agregar cadenitas. [verificado en Git]
- Cada saca tiene su propio presinto de seguridad (`saca.codigo_presinto`, `Saca.codigoPresinto`, `SacaDTO.codigoPresinto`), colocado al ensacar; el backend lo genera por saca si no se informa y se imprime en la etiqueta de la saca. `despacho.codigo_presinto` es legacy (deprecado, no fuente de verdad). [verificado en Git]
- Ensacado opera sobre despachos, sacas y paquetes, guardando sesion de trabajo. [verificado en Git]
- Manifiestos consolidados dependen de agencias/despachos/paquetes para consolidacion e impresion/exportacion. [inferido]
- Usuarios, roles y permisos alimentan autorizacion backend y gating frontend. [verificado en Git]
- Parametros del sistema alimenta configuracion de plantilla WhatsApp de despacho. [verificado en Git]

## Flujos criticos

- Login: `POST /api/auth/login` (vía `publicClient`) -> token JWT -> store frontend -> `authClient` envía `Authorization` en las siguientes peticiones. [verificado en Git]
- CRUD maestro: pagina/lista -> hook -> service API -> controller -> service -> repository/spec -> entidad/DB. [verificado en Git] [inferido]
- Importacion de paquetes: UI de paquetes/lotes -> endpoints de Paquete/LoteRecepcion -> `PaqueteImportService`/`ExcelHelper`. [verificado en Git] [inferido]
- Recepcion por lote y tipeo: rutas `/lotes-recepcion*`, endpoints `/api/v1/lotes-recepcion*`, `TipoLote`. [verificado en Git]
- Despachos rápidos (MVP 1-2/4): un despacho real con ciclo de vida `EstadoDespacho` (BORRADOR → EN_ENSACADO → LISTO_PARA_GUIA → FINALIZADO). Puede crearse sin destino ni guía de distribuidor; agregar un paquete lo reserva en una saca (`ASIGNADO_SACA`) y un paquete ya reservado no puede reasignarse a otro despacho. El destino (agencia o destinatario directo, excluyentes) es obligatorio antes de LISTO_PARA_GUIA; la guía externa (`numeroGuiaAgenciaDistribucion`) y el distribuidor se asignan al finalizar, lo que permite que otro dispositivo de la misma cuenta lo cierre después. Reutiliza `Despacho`/`Saca`/`PaqueteSaca`/`Paquete` sin romper el flujo clásico; los despachos previos quedan `FINALIZADO`. Alcance por `agenciaPropietaria` vía `AgenciaScopeResolver`. Endpoints: `POST /` (crear), `GET /` y `GET /{id}`, `POST /{id}/paquetes` (agregar/reservar), `POST /{id}/paquetes/mover`, `POST /{id}/sacas` (crear/cambiar saca), `PUT /{id}/sacas/{idSaca}/presinto` (ingresar presinto), `PUT /{id}/destino`, `POST /{id}/listo-para-guia`, `POST /{id}/finalizar`. Vista móvil MVP 2/4 en `/despachos/rapidos/mobile`: captura con cámara/ZXing (`useBarcodeScanner` + `MobileScannerPanel` reutilizados) o input manual, saca activa con presinto, mover paquetes entre sacas, selector de destino y marcar listo para guía; reutiliza `useScanFeedback`. Vista desktop MVP 3/4 en `/despachos/rapidos`: tablero de solo lectura sobre paquetes/sacas (no los edita) que lista despachos LISTO_PARA_GUIA (o todos los activos), permite copiar un resumen del despacho (`utils/despachoRapidoCopy.ts`, vía `CopyActionButton`, aislado de `utils/despachoMasivoCopy.ts` que fue retirado) y finalizar (`FinalizarDespachoDialog.tsx`: ingresa/edita distribuidor y `numeroGuiaAgenciaDistribucion`). El botón de finalizar se oculta a usuarios sin `despachos:editar` (`useHasPermission`); el listado solo exige `despachos:ver`/`despachos:listar`. Si el movil retoma un despacho LISTO_PARA_GUIA y agrega/mueve paquetes o modifica sacas/presinto, el backend devuelve el despacho a EN_ENSACADO; escritorio lo deja de ver como listo hasta que el operario lo marque listo otra vez, evitando cierres sobre datos en edicion. [verificado en Git]
- Despachos rápidos (MVP 4/4): sincronización operativa por polling en `constants/despachosRapidos.ts`. Desktop refresca el tablero cada 3 s y al recuperar foco/red; móvil refresca el detalle del despacho abierto cada 2.5 s y reconcilia la saca activa si otro dispositivo cambia estado, destino, sacas o finaliza. Las mutaciones exitosas actualizan el caché del detalle y las listas; las mutaciones fallidas invalidan detalle/listas para traer el estado vigente tras conflictos. El backend devuelve mensajes específicos para paquete ya reservado, despacho ya finalizado, despacho no listo, guía externa faltante, destino faltante y saca vacía. En desktop, los despachos `LISTO_PARA_GUIA` muestran `DespachoRapidoResumenCopiable`: adapta el patrón de `ResumenDestinoDespacho` para copiar campos individuales (sacas, paquetes, peso, código destino, destinatario, teléfono, dirección, ubicación y tamaño/peso por saca) y un bloque completo para crear la guía en un sistema externo; el DTO rápido expone datos de destino de agencia/destinatario directo para ese resumen. [verificado en Git]
- Despachos rapidos (mejora movil): el detalle de paquetes en `DespachoRapidoPaqueteDTO` incluye metadatos operativos para revision en `/despachos/rapidos/mobile` (tipo de paquete/destino, peso, ref, observaciones, destinatario, telefono, direccion/canton/provincia, agencia destino o destinatario directo). La UI movil usa `DespachosRapidosMobileList` para ver despachos activos ya tipeados, seleccionar uno existente y continuar captura; persiste solo `activeDespachoId` localmente para retomar el ultimo despacho. Usa `DespachoRapidoActivoCard` para resumir/cambiar el despacho activo, `SacaActivaPanel` para presinto y creacion de sacas, y `PaquetesTipeadosPanel`/`PaqueteTipeadoCard` para revisar paquetes por saca y conservar movimiento entre sacas. `SacaActivaPanel` sugiere el tamano de nueva saca reutilizando `utils/saca.ts` (`calcularTamanoSugerido` y `capacidadMaximaKg`), pero permite que el operario cambie el selector antes de crearla. La seccion Destino usa `Combobox` buscable por nombre y descripcion (codigo, canton, provincia, direccion, telefono) para Agencia y Destinatario directo. Al agregar una guia inexistente, `POST /api/v1/despachos-rapidos/{id}/paquetes` crea/resuelve un paquete simplificado con `idPaquete` real dentro de la misma transaccion antes de reservarlo en `paquete_saca`; las guias se normalizan a mayusculas en backend y la respuesta del endpoint actualiza el detalle como fuente de verdad. [verificado en Git]
- Backend controller: `candas-backend/src/main/java/com/candas/candas_backend/controller`.
- Backend negocio: `service`, `repository`, `repository/spec`, `validation`.
- Backend dominio: `entity`, `entity/enums`, `dto`, `mapper`.
- Backend seguridad: `config`, `security`, `util/PermissionConstants.java`.
- DB: `candas-backend/src/main/resources/db/migration`.
- Frontend rutas: `candas-frontend/src/routeTree.gen.tsx`, `src/routes`.
- Frontend navegacion/permisos: `src/config/navigation.ts`, `src/types/permissions.ts`.
- Frontend API: `src/lib/api/openapi-client.ts` (cliente openapi-fetch central: `publicClient`/`authClient`, alias `openapiClient`, `unwrap`/`handleResponse`), `src/lib/api/generated/schema.ts` (contrato generado), `src/lib/api/endpoints.ts`, `src/lib/api/*.service.ts`.
- Frontend UI: `src/pages`, `src/components`, `src/hooks`, `src/schemas`, `src/types`, `src/stores`, `src/utils`.
- Base UI/UX (contrato visual canónico): `docs/ai/UI_UX_BASE.md` (tokens `src/index.css`, primitivas `src/components/ui`, estados `src/components/states`, layouts `src/app/layout` y `src/components/detail`).
- Documentacion: `README.md`, `docs/README.md`, `docs/ARQUITECTURA_BACKEND.md`, `docs/TECH-STACK.md`, `docs/DEPLOYMENT.md`, `candas-frontend/docs`, `candas-backend/docs`.

## Tests y documentacion relacionada

- Backend declara `spring-boot-starter-test`, `spring-boot-starter-data-jpa-test`, `spring-modulith-starter-test` y `testcontainers-postgresql` en `pom.xml`. [verificado en Git]
- Tests backend detectados: `CandasBackendApplicationTests`, `JwtAuthenticationEntryPointTest`, `EnsacadoControllerTest`, `PresintoUtilTest`, `ModulithTest` (verificación de modularidad) y `UsuarioRepositoryTest` (integración con Testcontainers). [verificado en Git]
- Frontend declara scripts `test` y `test:run` con `Vitest` en `package.json`. [verificado en Git]
- Tests frontend detectados: `openapi-client.test.ts` y `usuario.service.test.ts` bajo `src/lib/api/` usando `jsdom`. [verificado en Git]
- Documentacion relacionada: `docs/README.md`, `docs/TECH-STACK.md`, `docs/ARQUITECTURA_BACKEND.md`, `docs/DEPLOYMENT.md`, `candas-frontend/docs/DESIGN_SYSTEM.md`, `candas-frontend/docs/XLSX_SECURITY_MITIGATION.md`, `candas-backend/docs/JasperReportsUsage.md`. [verificado en documentacion]

## Pendientes de confirmar

- Contrato detallado campo por campo de cada DTO/API; no se genero OpenAPI durante esta auditoria. [pendiente de confirmar]
- Cobertura real de pruebas automatizadas mas alla de los tests backend detectados y criterio de QA manual. [pendiente de confirmar]
- Estado funcional de rutas legacy/redireccion (`lotes-especiales`, `listas-etiquetadas`, `operario-etiquetas`) y si deben mantenerse publicamente. [pendiente de confirmar]
- Politica definitiva para permisos de impresion presentes en frontend (`sacas:imprimir`, `despachos:imprimir`, `manifiestos_consolidados:imprimir`) pero no en `PermissionConstants.java`. [pendiente de confirmar]
