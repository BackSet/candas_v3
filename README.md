# Candas v3

Sistema de gestión logística y operativa.

## Estructura del proyecto

```
candas v3/
├── candas-backend/     # API REST — Java 25 + Spring Boot 4
├── candas-frontend/    # SPA — React 19 + Vite 7 + TypeScript
└── README.md
```

## Stack Tecnológico

### Backend
- **Java 25** — Virtual Threads, Records, Pattern Matching
- **Spring Boot 4.0.1** — Spring Web MVC, Spring Security, Spring Data JPA
- **PostgreSQL** — Base de datos principal
- **Flyway** — Migraciones de base de datos
- **Lombok** — Reducción de boilerplate; mapeo Entity↔DTO en service y PaqueteMapper (Paquete)
- **jjwt 0.12.5** — Autenticación JWT stateless
- **Apache POI 5.5.1** — Exportación a Excel

### Frontend
- **React 19** + **TypeScript 5.9** (strict)
- **Vite 7** — Build tool
- **TanStack Router 1.95** — Routing type-safe
- **TanStack Query v5** — Server state y caché
- **Zustand v5** — Client state
- **React Hook Form 7** + **Zod 4** — Formularios y validación
- **Tailwind CSS 4** — Estilos
- **Radix UI** — Componentes headless
- **Axios** — HTTP client con interceptores JWT

## Requisitos previos

- **Java 25** (o superior)
- **Node.js 20+** y **npm**
- **PostgreSQL 18**
- **Git**

## Inicio rápido

### Backend
```bash
cd candas-backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd candas-frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Módulos principales

| Módulo | Descripción |
|--------|-------------|
| Paquetes | Registro y seguimiento de paquetes |
| Clientes | Gestión de clientes |
| Agencias | Gestión de agencias de distribución |
| Destinatarios directos | Gestión de destinatarios directos |
| Puntos de origen | Gestión de puntos de origen |
| Lotes Recepción | Recepción de paquetes por lotes (incl. tipeo / lotes especiales) |
| Ensacado | Proceso de ensacado con scanner |
| Sacas | Gestión de sacas |
| Despachos | Despachos a agencias/distribuidores |
| Manifiestos | Manifiestos consolidados |
| Atención Paquetes | Resolución de incidencias |
| Distribuidores | Gestión de distribuidores |
| Usuarios/Roles/Permisos | Control de acceso (RBAC) |

## Documentación

Toda la documentación del proyecto (requisitos, estimación de costos, diseño UX/UI, despliegue) está ordenada en **[docs/README.md](docs/README.md)**.
