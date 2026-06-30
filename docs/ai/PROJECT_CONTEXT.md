# Candas - Contexto tecnico del proyecto

## Identificacion

- Proyecto: Candas v3. [verificado en documentacion: `README.md`]
- Repositorio remoto: `https://github.com/BackSet/candas_v3.git`. [verificado en Git]
- Rama base de trabajo para agentes: `dev`. [verificado en Git]
- Ruta de contexto IA: `docs/ai`. [verificado en Git]
- Proposito de la aplicacion: sistema de gestion logistica y operativa. [verificado en documentacion: `README.md`]

## Estado de inspeccion

- La rama activa es `dev`. [verificado en Git]
- `git status --short --branch` limpio antes de la iteración. [verificado en Git]
- Los cuatro archivos canonicos de `docs/ai` existen y reflejan el stack tecnológico actual. [verificado en Git]

## Estructura principal

- `candas-backend/`: API REST Spring Boot, recursos, migraciones Flyway, Dockerfile y configuracion Railway. [verificado en Git]
- `candas-frontend/`: SPA React/Vite/TypeScript, rutas, paginas, hooks, services API, stores, componentes UI, Dockerfile y configuracion Railway. [verificado en Git]
- `docs/`: documentacion funcional, tecnica, despliegue, UX/UI y arquitectura. [verificado en documentacion]
- `docs/ai/`: contexto tecnico canonico para IA y agentes. [verificado en Git]

## Stack confirmado

### Backend

- Java 25. [verificado en Git: `candas-backend/pom.xml`, `candas-backend/Dockerfile`]
- Spring Boot `4.1.0` como parent Maven. [verificado en Git: `candas-backend/pom.xml`]
- Starters: Web MVC, Security, Data JPA, Validation, Flyway, Actuator, Test, Data JPA Test. [verificado en Git: `candas-backend/pom.xml`]
- PostgreSQL JDBC runtime y Flyway PostgreSQL. [verificado en Git: `candas-backend/pom.xml`]
- JJWT `0.13.0`. [verificado en Git: `candas-backend/pom.xml`]
- Springdoc OpenAPI con integración de Scalar `3.0.3`. [verificado en Git: `candas-backend/pom.xml`]
- MapStruct `1.6.3`, Lombok, Apache POI `5.5.1`, JasperReports `7.0.7`, Barbecue `1.5-beta1`. [verificado en Git: `candas-backend/pom.xml`]
- Testcontainers (PostgreSQL) y Spring Modulith (starter-test, docs) en ámbito de pruebas de calidad. [verificado en Git: `candas-backend/pom.xml`]

### Frontend

- React `19.2.7`, React DOM `19.2.7`, TypeScript `~6.0.3`, Vite `^8.1.0`. [verificado en Git: `candas-frontend/package.json`]
- TanStack Router `^1.170.15`, TanStack Query `^5.101.0`, Zustand `^5.0.14`. [verificado en Git]
- React Hook Form, Zod, Radix UI, openapi-fetch, openapi-typescript, Vitest, Sonner, Lucide React, Tailwind CSS 4, jspdf, html2canvas, qrcode, react-barcode, xlsx desde CDN de SheetJS. [verificado en Git]
- `@zxing/browser` `^0.2.0` con peer `@zxing/library` `^0.22.0` (instalado como dependencia directa por `legacy-peer-deps=true` en `.npmrc`): lectura de códigos de barras con la cámara del dispositivo en el lector móvil de Ensacado (`/ensacado/lector-movil`). [verificado en Git]
- PWA: `vite-plugin-pwa` `^1.3.0` (devDependency) genera service worker (`generateSW`/Workbox) y `manifest.webmanifest`; la app es instalable en Windows (Edge/Chrome), Android e iOS (Añadir a pantalla de inicio) y abre en modo standalone. Precachea el app shell (JS/CSS/HTML/iconos) con `registerType: 'autoUpdate'`; offline solo de shell/fallback. NO cachea la API logística/transaccional (solo Google Fonts como runtime estático). Iconos en `public/` (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, derivados de los SVG de marca). [verificado en Git]
- Build con Vite 8 y TypeScript 6; runtime Docker servido por Nginx. [verificado en Git: `package.json`, `Dockerfile`, `nginx.conf`]

## Arquitectura por capa

### Backend

- Paquete base: `com.candas.candas_backend`. [verificado en Git]
- Capas principales: `controller` -> `service` -> `repository`/`repository/spec` -> entidades JPA. [verificado en Git] [verificado en documentacion: `docs/ARQUITECTURA_BACKEND.md`]
- DTOs en `dto`; validacion con Jakarta Validation en entradas donde aplica. [verificado en Git]
- Mapeo: `PaqueteMapper` para Paquete; otros modulos hacen mapeo en servicios. [verificado en Git] [verificado en documentacion]
- Manejo de errores: `GlobalExceptionHandler`, `ApiErrorResponse`, `ResourceNotFoundException`, `BadRequestException`, `AgenciaAccessDeniedException`. [verificado en Git]
- Seguridad: JWT stateless con `JwtAuthenticationFilter`, `JwtService`, `CustomUserDetailsService`, `SecurityConfig` y `@PreAuthorize` en controladores. [verificado en Git]

### Frontend

- Rutas TanStack centralizadas en `src/routeTree.gen.tsx` y layout protegido en `src/routes/_layout.tsx`. [verificado en Git]
- Layout y navegacion en `src/app/layout` y `src/config/navigation.ts`. [verificado en Git]
- Paginas por modulo en `src/pages/<modulo>`. [verificado en Git]
- Services API en `src/lib/api/*.service.ts`, endpoints en `src/lib/api/endpoints.ts` y cliente openapi-fetch en `src/lib/api/openapi-client.ts` (dividido en `publicClient` y `authClient` con helpers `unwrap`/`ensureOk` y gestión aislada en `http-feedback.ts`). [verificado en Git]
- Hooks por dominio en `src/hooks`, schemas Zod en `src/schemas`, tipos en `src/types`, stores Zustand en `src/stores`. [verificado en Git]
- Componentes reutilizables en `src/components`, incluyendo UI base, tablas, filtros, dialogs, estados y componentes por modulo. [verificado en Git]
- Base UI/UX (contrato visual canónico): [`docs/ai/UI_UX_BASE.md`](UI_UX_BASE.md). Tokens en `src/index.css` (light/dark vía clase `.dark`), primitivas en `src/components/ui`, estados en `src/components/states`, layouts en `src/app/layout`/`src/components/detail`. [verificado en Git]

## Contratos y convenciones

- API publica backend: `/api/auth/*` para autenticacion y `/api/v1/*` para dominios. [verificado en Git]
- Frontend consume `VITE_API_BASE_URL` en produccion; en desarrollo usa la variable si existe, modo LAN o `http://localhost:8080`. [verificado en Git: `openapi-client.ts`]
- Cliente openapi-fetch agrega `Authorization: Bearer <token>` y, si existe, `X-Agencia-Origen-Activa-Id`. [verificado en Git]
- Endpoints canonicos frontend: `src/lib/api/endpoints.ts`. [verificado en Git]
- Permisos canonicos backend: `PermissionConstants.java`; espejo frontend: `src/types/permissions.ts`. [verificado en Git]
- Alias frontend: `@` apunta a `candas-frontend/src`. [verificado en Git: `vite.config.ts`]
- No usar `VITE_API_URL`; la variable vigente es `VITE_API_BASE_URL`. [verificado en documentacion: `docs/DEPLOYMENT.md`, `.env.example`]

## Seguridad y permisos

- Spring Security deshabilita CSRF, usa sesiones stateless y JWT. [verificado en Git]
- Endpoints publicos: `OPTIONS /**`, `/api/auth/login`, `/api/auth/register`, `/actuator/health`, `/scalar`, `/scalar/**`, `/v3/api-docs/**`. [verificado en Git: `SecurityConfig.java`]
- Todo lo demas requiere autenticacion por defecto. [verificado en Git]
- `@EnableMethodSecurity(prePostEnabled = true)` habilita reglas `@PreAuthorize`. [verificado en Git]
- CORS se configura por `app.cors.allowed-origins` / `CORS_ALLOWED_ORIGINS`; allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH`; headers: `Authorization`, `Content-Type`, `Accept`, `X-Agencia-Origen-Activa-Id`; credentials deshabilitado. [verificado en Git: `CorsConfig.java`]
- BCrypt usa `app.security.bcrypt-strength`, default `12`. [verificado en Git]
- Registro publico se controla con `PUBLIC_REGISTRATION_ENABLED` / `app.auth.public-registration-enabled`; en `dev` default `true`, en properties base default `false`. [verificado en Git]
- Alcance/agencia activa: existen `AgenciaScopeResolver`, campo de usuario/agencias y header `X-Agencia-Origen-Activa-Id`. [verificado en Git]

## Base de datos y migraciones

- Base de datos: PostgreSQL. [verificado en Git]
- Configuracion datasource via `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. [verificado en Git]
- Flyway habilitado con migraciones en `candas-backend/src/main/resources/db/migration`. [verificado en Git]
- Migraciones observadas: `V1__Create_base_tables.sql` a `V134__Fix_despacho_sequence_desync.sql`, con huecos historicos propios del proyecto. [verificado en Git]
- `application.properties` activa Flyway, `baseline-on-migrate=true`, `validate-on-migrate=false`; `application-prod.properties` cambia a `validate-on-migrate=true` y `ddl-auto=validate`. [verificado en Git]
- `application.properties` mantiene `spring.jpa.hibernate.ddl-auto=update`; en produccion se sobreescribe a `validate`. [verificado en Git]
- No modificar migraciones historicas salvo instruccion explicita y plan de reparacion. [verificado en documentacion de la solicitud]

## Infraestructura y CI/CD

- Despliegue documentado: Railway con dos servicios Docker separados, backend y frontend. [verificado en documentacion: `docs/DEPLOYMENT.md`]
- Backend Docker: build Maven con `eclipse-temurin:25-jdk`, runtime `eclipse-temurin:25-jre`, JAR en `/opt/app/app.jar`, healthcheck `/actuator/health`. [verificado en Git]
- Frontend Docker: build Node `20-alpine`, runtime `nginx:1.27-alpine`, `VITE_API_BASE_URL` y `VITE_APP_URL` como build args, healthcheck `/`. [verificado en Git]
- Nginx (`nginx.conf`): `/assets/` con cache inmutable 30d; `sw.js`, `manifest.webmanifest` e `index.html` con `Cache-Control: no-cache` para propagar actualizaciones del service worker y nuevas releases. [verificado en Git]
- Railway backend: Dockerfile, start command `java -Dspring.profiles.active=prod -jar /opt/app/app.jar`, healthcheck `/actuator/health`. [verificado en Git]
- Railway frontend: Dockerfile, healthcheck `/`. [verificado en Git]
- No se encontro configuracion CI en `.github`, `.gitlab` o `.circleci` en la inspeccion local. [verificado en Git]

## Comandos confirmados

Backend:

```bash
cd candas-backend
./mvnw spring-boot:run
./mvnw -DskipTests compile
./mvnw -DskipTests package
./mvnw test
```

- Confirmados por `README.md`, `docs/DEPLOYMENT.md`, `Dockerfile`, `pom.xml` y la presencia de tests en `candas-backend/src/test`. `./mvnw test` ejecuta la suite de pruebas unitarias, la verificación y documentación modular de Spring Modulith, y las pruebas de repositorio con base de datos real en Testcontainers (PostgreSQL). [verificado en documentacion] [verificado en Git]

Frontend:

```bash
cd candas-frontend
npm install
npm ci
npm run dev
npm run build
npm run lint
npm run preview
npm run test
npm run test:run
```

- `dev`, `build`, `lint`, `preview`, `test` y `test:run` estan en `package.json`; `npm ci` esta en Dockerfile y docs de despliegue; `npm install` esta en README. [verificado en Git] [verificado en documentacion]

Validacion Git:

```bash
git status --short
```

- Requerido como validacion final de cambios. [verificado en documentacion de la solicitud]

## Fuentes canonicas

- Primero: codigo, manifiestos, configuracion ejecutable, migraciones y contratos de la rama `dev`. [verificado en Git]
- Segundo: README y documentacion vigente en `docs/`, cuando no contradiga configuracion ejecutable. [verificado en documentacion]
- Tercero: archivos de ejemplo `.env.example` para variables, no secretos reales. [verificado en Git]
- No usar `.env`, `node_modules`, `dist`, `target`, logs o archivos locales como fuente canonica. [inferido]

## Reglas criticas

- No modificar codigo funcional, migraciones historicas ni dependencias cuando la tarea sea solo documentacion IA. [verificado en documentacion de la solicitud]
- Mantener `docs/ai/PROJECT_CONTEXT.md`, `MODULE_MAP.md`, `NAMING.md` y `PROJECT_INSTRUCTIONS.md` actualizados despues de implementaciones que cambien arquitectura, rutas, permisos, stack, comandos, DB o convenciones. [verificado en documentacion de la solicitud]
- Toda informacion no respaldada debe marcarse como `pendiente de confirmar`. [verificado en documentacion de la solicitud]
- Si una doc historica contradice codigo ejecutable, registrar la discrepancia y priorizar el codigo. [inferido]

## Pendientes de confirmar

- Estrategia formal de CI/CD fuera de Railway; no se encontro workflow local. [pendiente de confirmar]
- Cobertura completa de pruebas automatizadas y matriz de QA: existen tests backend en `candas-backend/src/test`, y pruebas unitarias de integración del cliente API en frontend (`src/lib/api/openapi-client.test.ts`, `usuario.service.test.ts`), pero no se confirmó cobertura integral de componentes. [pendiente de confirmar]
- Politica de perfiles locales y puertos entre `README.md`, `CONFIGURACION_RED_LOCAL.md` y `.env.example`, que muestran valores distintos por contexto. [pendiente de confirmar]
- Estado de vigencia de otros documentos históricos menores. [pendiente de confirmar]
