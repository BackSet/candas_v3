FROM node:20-alpine AS build
WORKDIR /app

# Obligatoria en imagen de producción: URL completa del API (Railway la inyecta en build).
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

# Railway (y otros) suelen sobrescribir PORT en runtime (p. ej. 80); nginx.conf usa listen ${PORT}.
ENV PORT=8080

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
