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

# ---- Stage 2: Runtime (Caddy, alineado con ecubox-frontend) ----
FROM caddy:2-alpine
WORKDIR /srv

ENV PORT=80

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/dist

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
