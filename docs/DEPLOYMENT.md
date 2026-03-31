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

Variables mínimas (build de la imagen Docker / `vite build`):

- `VITE_API_BASE_URL=https://<backend>.up.railway.app` (URL completa del API; el código de producción no añade puerto por defecto)

Notas:

- El `Dockerfile` declara `ARG`/`ENV` para `VITE_API_BASE_URL` antes de `npm run build`, de modo que la variable del servicio Railway quede embebida en el bundle.
- En local: copia `candas-frontend/.env.production.example` a `.env.production` o exporta la variable antes de `npm run build`.
- El Nginx del contenedor usa `listen ${PORT}`; Railway inyecta `PORT` en runtime (suele ser `80` en el dominio público).
- Desarrollo: `candas-frontend/.env.development.example` y `.env.lan.example` (`VITE_NETWORK_MODE=lan` solo para acceso en red local).

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
