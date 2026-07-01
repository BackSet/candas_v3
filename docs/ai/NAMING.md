# Candas - Convenciones de nombres

## Proposito

Este archivo fija terminos canonicos para nuevas implementaciones y documentacion IA. No renombra codigo existente por si solo; registra nombres vigentes, compatibilidades historicas y dudas. [verificado en documentacion de la solicitud]

## Terminos canonicos de producto

| Canonico | Usar en | Evidencia |
| --- | --- | --- |
| Candas v3 | Identidad del proyecto | [verificado en documentacion: `README.md`] |
| Paquete | UI, API, backend, DB | [verificado en Git] |
| Cliente | UI, API, backend, DB | [verificado en Git] |
| Agencia | UI, API, backend, DB | [verificado en Git] |
| Destinatario directo | UI/documentacion; `destinatario_directo` en DB; `destinatarios-directos` en rutas | [verificado en Git] |
| Distribuidor | UI, API, backend, DB | [verificado en Git] |
| Punto de origen | UI/documentacion; `punto_origen` en DB; `puntos-origen` en rutas | [verificado en Git] |
| Lote Recepcion | UI/rutas; `LoteRecepcion` backend; `lote_recepcion` DB | [verificado en Git] |
| Lote especial | Flujo operativo asociado a `TipoLote`; rutas legacy aun existen | [verificado en Git] |
| Lote automático (despacho) | Backend: `TipoLote.AUTOMATICO_DESPACHO`, servicio `LoteRecepcionAutomaticoService` (MVP 1/3, base sin UI/integración aún). Lote de recepción creado automáticamente para paquetes de despachos/sacas sin lote previo, agrupado por fecha del despacho + agencia propietaria. No usar en UI todavía (sin frontend asociado). | [verificado en Git] |
| Saca | UI, API, backend, DB | [verificado en Git] |
| Presinto | Sello de seguridad por saca. Canonico tecnico: `presinto` (UI "Presinto", DB `codigo_presinto`, `Saca.codigoPresinto`). El termino RAE es "precinto"; se mantiene `presinto` por compatibilidad con esquema y contratos. No renombrar masivamente. | [verificado en Git] |
# Candas - Convenciones de nombres

## Proposito

Este archivo fija terminos canonicos para nuevas implementaciones y documentacion IA. No renombra codigo existente por si solo; registra nombres vigentes, compatibilidades historicas y dudas. [verificado en documentacion de la solicitud]

## Terminos canonicos de producto

| Canonico | Usar en | Evidencia |
| --- | --- | --- |
| Candas v3 | Identidad del proyecto | [verificado en documentacion: `README.md`] |
| Paquete | UI, API, backend, DB | [verificado en Git] |
| Cliente | UI, API, backend, DB | [verificado en Git] |
| Agencia | UI, API, backend, DB | [verificado en Git] |
| Destinatario directo | UI/documentacion; `destinatario_directo` en DB; `destinatarios-directos` en rutas | [verificado en Git] |
| Distribuidor | UI, API, backend, DB | [verificado en Git] |
| Punto de origen | UI/documentacion; `punto_origen` en DB; `puntos-origen` en rutas | [verificado en Git] |
| Lote Recepcion | UI/rutas; `LoteRecepcion` backend; `lote_recepcion` DB | [verificado en Git] |
| Lote especial | Flujo operativo asociado a `TipoLote`; rutas legacy aun existen | [verificado en Git] |
| Lote automático (despacho) | Backend: `TipoLote.AUTOMATICO_DESPACHO`, servicio `LoteRecepcionAutomaticoService` (MVP 1/3, base sin UI/integración aún). Lote de recepción creado automáticamente para paquetes de despachos/sacas sin lote previo, agrupado por fecha del despacho + agencia propietaria. No usar en UI todavía (sin frontend asociado). | [verificado en Git] |
| Saca | UI, API, backend, DB | [verificado en Git] |
| Presinto | Sello de seguridad por saca. Canonico tecnico: `presinto` (UI "Presinto", DB `codigo_presinto`, `Saca.codigoPresinto`). El termino RAE es "precinto"; se mantiene `presinto` por compatibilidad con esquema y contratos. No renombrar masivamente. | [verificado en Git] |
| Despacho | UI, API, backend, DB | [verificado en Git] |
| Despacho rápido | Módulo/flujo de despacho con ciclo de vida y guía de distribuidor diferida, bajo `/api/v1/despachos-rapidos`; vista desktop (tablero/finalización) en `/despachos/rapidos`, vista móvil de captura en `/despachos/rapidos/mobile`. Usar "despacho rápido"/"despachos rápidos" en UI/API. | [verificado en Git] |
| Estado del despacho | Estados canónicos de `EstadoDespacho` (despacho rápido): `BORRADOR`, `EN_ENSACADO`, `LISTO_PARA_GUIA` (pendiente de guía del distribuidor), `FINALIZADO` (cerrado con guía; también los despachos clásicos/históricos). En DB `despacho.estado`. | [verificado en Git] |
| Parametros del sistema | UI/API/backend; `parametro_sistema` DB | [verificado en Git] |
| Agencia origen activa | Agencia bajo la que opera el usuario en la sesión actual (`authStore.activeAgencyId`), enviada en el header `X-Agencia-Origen-Activa-Id`. Usar "agencia activa" en UI. | [verificado en Git] |
| Agencia por defecto / predeterminada | Preferencia de agencia activa que el usuario fija para restaurarla al iniciar sesión (`authStore.defaultAgencyId`, persistida en localStorage `candas-default-active-agency:<idUsuario>`). Usar "predeterminada" en UI. | [verificado en Git] |
| Usuario, Rol, Permiso | RBAC | [verificado en Git] |
| Captura móvil / Lector móvil | UI, Documentación | Uso de cámara y linterna para capturar códigos de barras en smartphones. |


## Reglas por contexto

### UI y rutas frontend

- Rutas en kebab-case plural: `/paquetes`, `/clientes`, `/agencias`, `/puntos-origen`, `/lotes-recepcion`, `/destinatarios-directos`, `/manifiestos-consolidados`, `/parametros-sistema`. [verificado en Git]
- Formularios nuevos usan sufijo `/new`; edicion usa `/$id/edit`; detalle usa `/$id`. [verificado en Git]
- Nombres visibles de navegacion vigentes: Dashboard, Paquetes, Clientes, Destinatarios, Agencias, Distribuidores, Puntos Origen, Lotes Recepcion, Despachos (grupo con subitems: General, Rápidos, Ensacado rápido), Ensacado, Atencion, Manifiestos, Usuarios, Roles, Permisos, Parametros. [verificado en Git]
- Mantener `VITE_API_BASE_URL` como nombre de variable para API. No introducir `VITE_API_URL`. [verificado en Git] [verificado en documentacion]

### API

- Endpoints de dominio bajo `/api/v1/<recurso-plural>`. [verificado en Git]
- Autenticacion bajo `/api/auth`. [verificado en Git]
- Usar kebab-case para segmentos compuestos: `puntos-origen`, `lotes-recepcion`, `destinatarios-directos`, `manifiestos-consolidados`, `parametros-sistema`, `despacho-masivo`, `listas-etiquetadas`. [verificado en Git]
- El modulo de atencion usa endpoint `/api/v1/atenciones`, aunque el permiso/modulo se llame `atencion_paquetes`. [verificado en Git]

### Backend Java

- Paquete base: `com.candas.candas_backend`. [verificado en Git]
- Clases de dominio en PascalCase singular: `Paquete`, `Cliente`, `LoteRecepcion`, `DestinatarioDirecto`, `ManifiestoConsolidado`. [verificado en Git]
- Controladores, servicios y repositorios usan sufijos `Controller`, `Service`, `Repository`; specs usan sufijo `Specs`. [verificado en Git]
- DTOs usan sufijo `DTO`; requests/responses puntuales usan `RequestDTO`, `ResponseDTO` o nombres historicos existentes (`LoginRequest`, `LoginResponse`). [verificado en Git]
- Enums viven en `entity/enums` y usan nombres PascalCase. [verificado en Git]

### Base de datos

- Tablas en snake_case singular: `paquete`, `cliente`, `lote_recepcion`, `destinatario_directo`, `manifiesto_consolidado`, `parametro_sistema`. [verificado en Git]
- Tablas puente o de relacion tambien en snake_case: `usuario_rol`, `rol_permiso`, `paquete_saca`. [verificado en Git]
- Migraciones Flyway usan prefijo `V<number>__Descripcion.sql`; no modificar historicas. [verificado en Git] [verificado en documentacion de la solicitud]

### Permisos

- Formato canonico: `<modulo>:<accion>`, en minusculas y snake_case para modulos compuestos. [verificado en Git]
- Acciones observadas: `ver`, `listar`, `crear`, `editar`, `eliminar`, `imprimir`, `generar`, `operar`, `asignar_roles`, `asignar_permisos`. [verificado en Git]
- Fuente backend: `PermissionConstants.java`. [verificado en Git]
- Fuente frontend: `src/types/permissions.ts`. [verificado en Git]

## Permisos canonicos observados

- `paquetes:ver`, `paquetes:listar`, `paquetes:crear`, `paquetes:editar`, `paquetes:eliminar`, `paquetes:imprimir`. [verificado en Git]
- `clientes:ver`, `clientes:listar`, `clientes:crear`, `clientes:editar`, `clientes:eliminar`. [verificado en Git]
- `agencias:ver`, `agencias:listar`, `agencias:crear`, `agencias:editar`, `agencias:eliminar`. [verificado en Git]
- `puntos_origen:ver`, `puntos_origen:listar`, `puntos_origen:crear`, `puntos_origen:editar`, `puntos_origen:eliminar`. [verificado en Git]
- `lotes_recepcion:ver`, `lotes_recepcion:listar`, `lotes_recepcion:crear`, `lotes_recepcion:editar`, `lotes_recepcion:eliminar`. [verificado en Git]
- `sacas:ver`, `sacas:listar`, `sacas:crear`, `sacas:editar`, `sacas:eliminar`. [verificado en Git]
- `despachos:ver`, `despachos:listar`, `despachos:crear`, `despachos:editar`, `despachos:eliminar`. [verificado en Git]
- `atencion_paquetes:ver`, `atencion_paquetes:listar`, `atencion_paquetes:crear`, `atencion_paquetes:editar`, `atencion_paquetes:eliminar`. [verificado en Git]
- `usuarios:ver`, `usuarios:listar`, `usuarios:crear`, `usuarios:editar`, `usuarios:eliminar`, `usuarios:asignar_roles`. [verificado en Git]
- `roles:ver`, `roles:listar`, `roles:crear`, `roles:editar`, `roles:eliminar`, `roles:asignar_permisos`. [verificado en Git]
- `permisos:ver`, `permisos:listar`, `permisos:crear`, `permisos:editar`, `permisos:eliminar`. [verificado en Git]
- `distribuidores:ver`, `distribuidores:listar`, `distribuidores:crear`, `distribuidores:editar`, `distribuidores:eliminar`. [verificado en Git]
- `manifiestos_consolidados:ver`, `manifiestos_consolidados:listar`, `manifiestos_consolidados:generar`, `manifiestos_consolidados:eliminar`. [verificado en Git]
- `destinatarios_directos:ver`, `destinatarios_directos:listar`, `destinatarios_directos:crear`, `destinatarios_directos:editar`, `destinatarios_directos:eliminar`. [verificado en Git]
- `ensacado:operar`. [verificado en Git]
- `parametros_sistema:ver`, `parametros_sistema:editar`. [verificado en Git]

## Mapeo tecnico confirmado

| UI/ruta | Backend | DB | Permiso base |
| --- | --- | --- | --- |
| Paquetes `/paquetes` | `Paquete*` | `paquete` | `paquetes` |
| Clientes `/clientes` | `Cliente*` | `cliente` | `clientes` |
| Agencias `/agencias` | `Agencia*` | `agencia` | `agencias` |
| Destinatarios `/destinatarios-directos` | `DestinatarioDirecto*` | `destinatario_directo` | `destinatarios_directos` |
| Distribuidores `/distribuidores` | `Distribuidor*` | `distribuidor` | `distribuidores` |
| Puntos Origen `/puntos-origen` | `PuntoOrigen*` | `punto_origen` | `puntos_origen` |
| Lotes Recepcion `/lotes-recepcion` | `LoteRecepcion*` | `lote_recepcion` | `lotes_recepcion` |
| Sacas `/sacas` | `Saca*` | `saca` | `sacas` |
| Despachos `/despachos` | `Despacho*` | `despacho` | `despachos` |
| Ensacado `/ensacado` | `Ensacado*` | `ensacado_sesion` | `ensacado` |
| Atencion `/atencion-paquetes` | `AtencionPaquete*` | `atencion_paquete` | `atencion_paquetes` |
| Manifiestos `/manifiestos-consolidados` | `ManifiestoConsolidado*` | `manifiesto_consolidado` | `manifiestos_consolidados` |
| Parametros `/parametros-sistema` | `ParametroSistema*` | `parametro_sistema` | `parametros_sistema` |

## Variantes desaconsejadas o historicas

- `origen-usa`, `OrigenUsa`, `useOrigenesUsa`: nombre historico presente en frontend; para nueva documentacion usar Punto de origen/PuntoOrigen salvo que se toque compatibilidad existente. [verificado en Git]
- `recepcion` y `useRecepciones`: nombre historico; canonico actual es Lote Recepcion/LoteRecepcion. [verificado en Git]
- `cliente-envio-directo`, `ClienteEnvioDirecto`, `envio-directo`: historico; canonico actual es Destinatario directo/DestinatarioDirecto. [verificado en Git]
- `manifiesto-pago`, `ManifiestoPago`: historico; canonico actual es Manifiesto consolidado/ManifiestoConsolidado. [verificado en Git]
- `agencia-distribucion`: historico; canonico actual observado es Distribuidor. [verificado en Git]
- `lista_etiqueta_guia` y tablas relacionadas: migraciones indican eliminacion en `V113`; no reintroducir sin decision explicita. [verificado en Git]
- `VITE_API_URL`: desaconsejado; usar `VITE_API_BASE_URL`. [verificado en documentacion]

## Pendientes de confirmar

- Si los permisos `sacas:imprimir`, `despachos:imprimir` y `manifiestos_consolidados:imprimir` del frontend deben agregarse al backend o retirarse del frontend. [pendiente de confirmar]
- Si nombres visibles de UI deben llevar tildes formalmente (`Recepcion`, `Atencion`, `Parametros`) o conservar casing/texto actual por consistencia. [pendiente de confirmar]
- Si rutas legacy deben seguir indexables/visibles o quedar solo como redireccion interna. [pendiente de confirmar]
