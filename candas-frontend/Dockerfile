# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

# Obligatoria en imagen de producción: URL completa del API (Railway la inyecta en build).
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: Runtime ----
# Nginx + plantilla envsubst: patrón recomendado en Railway (evita 502 frecuentes con Caddy + edge).
FROM nginx:1.27-alpine

# Default para docker local (`docker run` sin PORT). En Railway la plataforma
# inyecta PORT en runtime (típ. 8080): Nginx escucha ahí vía envsubst; el target
# port del dominio en Networking debe coincidir con ese PORT, no con lo siguiente.
ENV PORT=80

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/10-default-port.sh /docker-entrypoint.d/10-default-port.sh
RUN chmod +x /docker-entrypoint.d/10-default-port.sh

COPY --from=build /app/dist /usr/share/nginx/html

# 80 = imagen local con ENV PORT=80. 8080 = puerto habitual de Railway (PORT
# inyectado). EXPOSE es solo metadocumentación; el edge usa el target port del panel.
EXPOSE 80 8080
