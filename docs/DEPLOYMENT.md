# Despliegue en producción — Candas

Guía para desplegar Candas en Railway con dos servicios Docker separados.

## Arquitectura objetivo (Railway)

- Servicio `candas-backend` (Spring Boot + Flyway + PostgreSQL).
- Servicio `candas-frontend` (Vite compilado y servido con **Nginx**; plantilla `default.conf.template` sustituye `${PORT}`).
- Ambos servicios públicos; frontend consume backend por URL pública.

## Archivos de despliegue

- Backend:
  - `candas-backend/Dockerfile`
  - `candas-backend/.dockerignore`
  - `candas-backend/src/main/resources/application-prod.properties`
- Frontend:
  - `candas-frontend/Dockerfile`
  - `candas-frontend/nginx.conf` (plantilla para `/etc/nginx/templates/`)
  - `candas-frontend/docker-entrypoint.d/10-default-port.sh` (asegura `PORT` antes de `envsubst`)
  - `candas-frontend/railway.json` (healthcheck, restart)
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
- Nginx usa `listen 0.0.0.0:${PORT}` tras `envsubst` (recomendación Railway: `0.0.0.0` + variable `PORT`). `ENV PORT=80` en el Dockerfile es solo default local; Railway sobrescribe `PORT` en runtime.
- Desarrollo: `candas-frontend/.env.development.example` y `.env.lan.example` (`VITE_NETWORK_MODE=lan` solo para acceso en red local).

## Paso 3: Orden de despliegue recomendado

1. Desplegar backend.
2. Confirmar que backend responde:
   - `https://<backend>.up.railway.app/v3/api-docs`
3. Configurar/validar `VITE_API_BASE_URL` en frontend.
4. Desplegar frontend.
5. Validar login y llamadas a `/api`.

### Checklist: dominio público del frontend (evitar 502 con healthcheck OK)

Railway no expone el **target port** del dominio en `railway.json`; hay que revisarlo en el panel. Si en **Deploy logs** ves `candas-frontend: Nginx escuchará en PORT=8080` y el healthcheck da 200, pero el navegador recibe 502:

1. Abre el servicio **`candas-frontend`** (mismo que usa `candas-frontend/Dockerfile`), no el backend.
2. Ve a **Settings → Networking** → **Public Networking** (no basta con la pestaña Build/Deploy).
3. En la tarjeta del dominio (`…-frontend.up.railway.app` o custom), pulsa **editar** (icono de lápiz).
4. Pon el **target port** en el **mismo número** que **`PORT`** en **Variables** o el que muestra el log (`candas-frontend: Nginx escuchará en PORT=…`; suele ser **8080**). **Señal típica:** la UI muestra **→ Port 80** debajo del dominio pero el log indica **`PORT=8080`** → ahí el edge habla con el puerto equivocado y aparece 502 / [Application failed to respond](https://docs.railway.com/networking/troubleshooting/application-failed-to-respond). Deja el dominio en **→ Port 8080** (o el mismo entero que `PORT`).
5. **No** uses **80** como target solo porque el `Dockerfile` declara `EXPOSE 80` / `ENV PORT=80`: eso es el default para **Docker local**; en Railway Nginx escucha en el **`PORT` inyectado** por la plataforma.

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

### Railway: «Application failed to respond» / 502

Ese mensaje indica que el [Edge Proxy no puede alcanzar tu aplicación](https://docs.railway.com/guides/fixing-common-errors) (respuesta 502). Revisa en este orden:

1. **Target port**  
   En el servicio afectado, abre **Variables** y anota el valor de **`PORT`** (Railway lo inyecta). En **Networking → dominio público**, el **target port** debe ser **exactamente** ese número. Un error típico es dejar el target en `3000` cuando la app escucha en `8080` (o al revés), [como describe la documentación](https://docs.railway.com/guides/fixing-common-errors).

2. **Host y puerto de escucha**  
   El proceso debe escuchar en **`0.0.0.0`** y en el **`PORT`** de Railway. El frontend usa Nginx con `listen 0.0.0.0:${PORT}` y `listen [::]:${PORT}`; el backend Spring usa `server.port=${PORT:8080}`.

   **Healthcheck 200 en logs pero el navegador sigue con 502:** el healthcheck de Railway habla con el contenedor en el puerto correcto (`PORT`), pero el **dominio público** puede tener un **target port** distinto. Abre **Networking** en el servicio **frontend**, edita el dominio (`…-frontend.up.railway.app`) y pon el **target port = mismo número** que ves en **Variables → `PORT`** (o el que imprime el log `candas-frontend: Nginx escuchará en PORT=…` al arrancar). No mezcles el `PORT` del backend con el del frontend. Si el log muestra `PORT=8080`, el dominio debe apuntar a **8080**; **no** tomes **80** del `EXPOSE` del Dockerfile como referencia para producción.

3. **Dominio correcto**  
   El `.up.railway.app` (o custom domain) debe estar asociado al **mismo servicio** que despliega esa app (no mezclar un dominio del servicio `candas-frontend` con otro servicio). Si el **backend responde** pero `https://…-frontend.up.railway.app` no, revisa **solo el servicio del frontend** (Variables + Networking de ese servicio, no del backend).

4. **Variable `PORT` en el servicio frontend**  
   No dejes `PORT` **vacía** ni un valor que no coincida con el **target port** del dominio. Si añadiste `PORT` a mano y duda, elimínala y vuelve a desplegar para que Railway la inyecte; o usa **Generate Domain** en ese servicio para alinear dominio y puerto.

5. **Healthcheck**  
   `candas-frontend/railway.json` define `healthcheckPath: "/"` para que el despliegue no se marque listo hasta que Nginx responda. Si falla, revisa **Deploy logs** (p. ej. `listen` mal formado si `PORT` no se sustituyó).

6. **Build del frontend**  
   `VITE_API_BASE_URL` no corrige un 502 en `/`, pero es necesaria para el login y las llamadas al API tras cargar la SPA.

Referencias oficiales: [Fixing Common Errors](https://docs.railway.com/guides/fixing-common-errors), [Config as code](https://docs.railway.com/reference/config-as-code), [Public networking](https://docs.railway.com/networking/public-networking).

Para más detalle de stack y versiones: [TECH-STACK.md](TECH-STACK.md).
