# Variables Railway — Candas (producción)

Sin URLs fijas en el código: todo se define en variables de entorno / `.env`.

> **CORS:** `CORS_ALLOWED_ORIGINS` = origen del **frontend** (lo que muestra la barra del navegador), no la URL del API.

---

## Servicio frontend (`candas-frontend`)

Build Docker (`vite build`):

```env
VITE_API_BASE_URL=https://${{candas-backend.RAILWAY_PUBLIC_DOMAIN}}
```

O dominio custom del API, si lo tienes configurado en Railway.

**No uses** `VITE_API_URL` (otro proyecto). Candas solo lee `VITE_API_BASE_URL`.

---

## Servicio backend (`candas-backend`)

```env
SPRING_PROFILES_ACTIVE=prod

DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

JWT_SECRET=<secreto-largo>
JWT_EXPIRATION=86400000
PRESINTO_SECRET=<secreto-largo>

# Origen(es) del frontend — obligatorio en producción
CORS_ALLOWED_ORIGINS=https://${{candas-frontend.RAILWAY_PUBLIC_DOMAIN}}
```

Si usas **dominio custom** en el frontend, añade la URL exacta (sin barra final):

```env
CORS_ALLOWED_ORIGINS=https://tu-frontend.com,https://${{candas-frontend.RAILWAY_PUBLIC_DOMAIN}}
```

Mapeo en Spring (`application.properties`):

```properties
app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:}
```

---

## Variables que Candas no usa (otros proyectos)

- `CORS_ALLOWED_HEADERS`, `CORS_ALLOWED_METHODS`, `CORS_EXPOSED_HEADERS`, `CORS_MAX_AGE` → fijados en `CorsConfig.java`
- `CORS_ALLOWED_ORIGIN_PATTERNS` → eliminado; usar solo `CORS_ALLOWED_ORIGINS`
- `SERVER_PORT` → en prod usa `PORT` de Railway
- `ADMIN_*`

---

## Comprobación

1. Logs al arrancar: `CORS: orígenes permitidos: [...]`
2. Si está vacío: `CORS: CORS_ALLOWED_ORIGINS / app.cors.allowed-origins está vacío`
3. Preflight:

   ```bash
   curl -sI -X OPTIONS "https://<API>/api/auth/login" \
     -H "Origin: https://<FRONTEND>" \
     -H "Access-Control-Request-Method: POST"
   ```

   Debe ser **200/204**, no `403 Invalid CORS request`.
