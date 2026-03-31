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

# Default para docker local. En Railway la plataforma inyecta PORT en runtime: el
# target port del dominio público (Networking) debe ser exactamente ese valor.
ENV PORT=80

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/10-default-port.sh /docker-entrypoint.d/10-default-port.sh
RUN chmod +x /docker-entrypoint.d/10-default-port.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
