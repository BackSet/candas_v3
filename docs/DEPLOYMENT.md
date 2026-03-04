# Despliegue en producción — Candas

Guía para desplegar el backend y el frontend de Candas en un entorno de producción. Para el stack exacto (versiones) consultar [TECH-STACK.md](TECH-STACK.md).

---

## Requisitos de producción

- **Java 25** (JDK 25)
- **Node.js 20+** y **npm** (solo para generar el build del frontend)
- **PostgreSQL** (12+ recomendado; el proyecto suele usar PostgreSQL 18 en desarrollo)
- Servidor web o reverse proxy (Nginx, Caddy, etc.) para servir el frontend estático y, si se desea, proxy inverso al backend

---

## Variables de entorno

### Backend (Spring Boot)

Configurar antes de ejecutar el JAR o el contenedor:

- **Base de datos:** `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
- **JWT:** Secret y caducidad (por ejemplo `JWT_SECRET`, `JWT_EXPIRATION` o las propiedades que use la aplicación)
- **Perfil:** `SPRING_PROFILES_ACTIVE=prod` (si existe perfil `prod`)

Consultar `candas-backend/src/main/resources/application.properties` (y perfiles `application-*.properties` si existen) para los nombres exactos de las propiedades.

### Frontend (build estático)

El frontend se construye contra una URL base del API. Si la API está en otro origen o ruta, configurar la variable de entorno que use Vite (por ejemplo `VITE_API_BASE_URL`) antes del build. Revisar `candas-frontend` para la variable exacta.

---

## Backend: generación del JAR y ejecución

1. **Generar el JAR:**
   ```bash
   cd candas-backend
   ./mvnw -DskipTests package
   ```
   El JAR ejecutable quedará en `target/` (por ejemplo `candas-backend-0.0.1-SNAPSHOT.jar`).

2. **Ejecutar:**
   ```bash
   java -jar target/candas-backend-*.jar
   ```
   O con variables de entorno:
   ```bash
   export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/candas
   export SPRING_DATASOURCE_USERNAME=usuario
   export SPRING_DATASOURCE_PASSWORD=contraseña
   java -jar target/candas-backend-*.jar
   ```

3. **Flyway** se ejecuta al arranque y aplica las migraciones sobre la base de datos configurada. Asegurar que el usuario de BD tenga permisos para crear/modificar tablas.

4. Por defecto Spring Boot expone la API en el puerto **8080**. Cambiar con `server.port` o `SERVER_PORT` si hace falta.

---

## Frontend: build de producción

1. **Instalar dependencias y generar build:**
   ```bash
   cd candas-frontend
   npm ci
   npm run build
   ```
   La salida estática quedará en `dist/` (por defecto en Vite).

2. **Servir el contenido de `dist/`:**
   - Copiar el contenido de `dist/` al directorio que sirva el servidor web (Nginx, Caddy, Apache, etc.).
   - Configurar **SPA fallback:** todas las rutas que no coincidan con un archivo estático deben devolver `index.html` para que TanStack Router funcione.
   - Ejemplo Nginx:
     ```nginx
     root /ruta/a/candas-frontend/dist;
     index index.html;
     location / {
         try_files $uri $uri/ /index.html;
     }
     ```
   - Si el backend está en el mismo dominio bajo `/api`, configurar el proxy inverso correspondiente para que el frontend llame a `/api/...`.

3. **CORS:** Si el frontend y el backend están en dominios distintos, configurar CORS en el backend (Spring Security) para permitir el origen del frontend.

---

## Resumen

| Componente | Comando / Acción |
|------------|-------------------|
| Backend | `./mvnw -DskipTests package` → `java -jar target/*.jar` |
| Frontend | `npm ci` → `npm run build` → servir contenido de `dist/` con SPA fallback |
| Base de datos | PostgreSQL creado y migrado por Flyway al arrancar el backend |

Para más detalle sobre tecnologías y versiones: [TECH-STACK.md](TECH-STACK.md).
