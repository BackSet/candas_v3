# Despliegue en producción — Candas

Guía para desplegar Candas en Railway con dos servicios Docker separados.

## Arquitectura objetivo (Railway)

- Servicio `candas-backend` (Spring Boot + Flyway + PostgreSQL).
- Servicio `candas-frontend` (Vite compilado y servido con Nginx).
- Ambos servicios públicos; frontend consume backend por URL pública.

## Archivos de despliegue

- Backend:
  - `candas-backend/Dockerfile`
  - `candas-backend/.dockerignore`
  - `candas-backend/src/main/resources/application-prod.properties`
- Frontend:
  - `candas-frontend/Dockerfile`
  - `candas-frontend/nginx.conf`
  - `candas-frontend/.dockerignore`

## Paso 1: Crear proyecto y servicios en Railway

1. Crea un proyecto en Railway.
2. Crea un servicio para backend conectado al mismo repo.
3. Crea un servicio para frontend conectado al mismo repo.
4. Configura el **Root Directory**:
   - Backend: `candas-backend`
   - Frontend: `candas-frontend`

## Paso 2: Configurar variables de entorno

### Backend (`candas-backend`)

Variables mínimas:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL=jdbc:postgresql://<host>:<port>/<database>`
- `DB_USERNAME=<usuario>`
- `DB_PASSWORD=<password>`
- `JWT_SECRET=<secreto-largo-y-seguro>`
- `JWT_EXPIRATION=86400000`
- `PRESINTO_SECRET=<secreto-largo-y-seguro>`
- `CORS_ALLOWED_ORIGINS=https://<frontend>.up.railway.app`

Notas:

- En `prod`, el backend usa `server.port=${PORT:8080}` para ajustarse al puerto dinámico de Railway.
- En `prod`, no necesitas definir `SERVER_ADDRESS` ni `SERVER_PORT`.
- Flyway corre al arranque y aplica migraciones automáticamente.
- También se acepta `CORS_ALLOWED_ORIGIN_PATTERNS` por compatibilidad, pero se recomienda `CORS_ALLOWED_ORIGINS`.

### Frontend (`candas-frontend`)

Variables mínimas:

- `VITE_API_BASE_URL=https://<backend>.up.railway.app`

Notas:

- El frontend toma variables desde `candas-frontend/.env` durante el build.
- En Railway, define `VITE_API_BASE_URL` en el servicio frontend para que Railway genere ese `.env` en build-time.
- El Nginx del contenedor incluye fallback SPA para rutas de TanStack Router.
- Para desarrollo local, puedes usar `candas-frontend/.env.development.example` si necesitas personalizar `VITE_NETWORK_MODE` y `VITE_PORT`.

## Paso 3: Orden de despliegue recomendado

1. Desplegar backend.
2. Confirmar que backend responde:
   - `https://<backend>.up.railway.app/v3/api-docs`
3. Configurar/validar `VITE_API_BASE_URL` en frontend.
4. Desplegar frontend.
5. Validar login y llamadas a `/api`.

## Comandos útiles de validación local

### Backend

```bash
cd candas-backend
./mvnw -DskipTests compile
docker build -t candas-backend:local .
```

### Frontend

```bash
cd candas-frontend
npm ci
npm run build
docker build -t candas-frontend:local .
```

## Troubleshooting rápido

- **Error CORS en navegador**:
  - Revisar `CORS_ALLOWED_ORIGINS` en backend.
  - Confirmar que el valor coincide con la URL exacta del frontend Railway.
- **Frontend no conecta API**:
  - Verificar `VITE_API_BASE_URL` y redeploy frontend.
- **Backend no inicia**:
  - Validar `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` y logs de Flyway.

Para más detalle de stack y versiones: [TECH-STACK.md](TECH-STACK.md).
