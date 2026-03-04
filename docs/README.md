# Documentación del proyecto Candas

Índice de la documentación del proyecto, en orden de lectura recomendado.

---

## Nivel 1 — Inicio y referencia técnica

1. **[README.md](../README.md)** — Visión general del proyecto, estructura del repositorio, stack resumido, inicio rápido y módulos principales.

2. **[TECH-STACK.md](TECH-STACK.md)** — Tecnologías y librerías utilizadas en backend y frontend. Fuente de verdad del stack (Java 25, Spring Boot 4, React 19, Vite 7, etc.).

---

## Nivel 2 — Producto y negocio

3. **[RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md)** — Descripción del sistema CANDAS, valor de negocio, precios resumidos y recomendaciones comerciales.

4. **[ESTIMACION_COSTOS.md](ESTIMACION_COSTOS.md)** — Estimación de costos unificada: sistema completo y sistema simplificado (reutilización de códigos), métodos de estimación, modelos de comercialización y factores de ajuste.

---

## Nivel 3 — Requisitos y diseño

5. **[HISTORIAS_USUARIO.md](HISTORIAS_USUARIO.md)** — Historias de usuario del sistema completo.

6. **[HISTORIAS_USUARIO_SIMPLIFICADO.md](HISTORIAS_USUARIO_SIMPLIFICADO.md)** — Historias de usuario del sistema simplificado (reutilización de códigos de barras).

7. **[REQUERIMIENTOS_TECNICOS.md](REQUERIMIENTOS_TECNICOS.md)** — Requerimientos técnicos detallados: hardware, software, formatos de etiqueta, base de datos (sistema simplificado).

8. **[UX-UI-DESIGN.md](UX-UI-DESIGN.md)** — Diseño UX/UI: sistema de diseño, colores, tipografía, layout global, patrones de página, componentes y feedback.

---

## Nivel 4 — Verificación

9. **[VERIFICACION_COMPLETITUD.md](VERIFICACION_COMPLETITUD.md)** — Verificación de completitud del sistema.

---

## Documentación por subproyecto

10. **Backend:** [ARQUITECTURA_BACKEND.md](ARQUITECTURA_BACKEND.md) — Arquitectura del backend: paquetes, capas, seguridad JWT, configuración, entidades y manejo de errores.

11. **Backend:** [candas-backend/docs/JasperReportsUsage.md](../candas-backend/docs/JasperReportsUsage.md) — Uso de JasperReports 7 en Candas, patrones para evitar fugas de memoria y generación de reportes PDF.

12. **Frontend:** [candas-frontend/docs/DESIGN_SYSTEM.md](../candas-frontend/docs/DESIGN_SYSTEM.md) — Guía de línea gráfica y componentes para desarrolladores (complementa [UX-UI-DESIGN.md](UX-UI-DESIGN.md)).

---

## Despliegue

13. **[DEPLOYMENT.md](DEPLOYMENT.md)** — Guía de despliegue en producción: requisitos, variables de entorno, build del backend y frontend.

---

## Artefactos internos

14. [candas-frontend/src/artifacts/implementation_plan_flows.md](../candas-frontend/src/artifacts/implementation_plan_flows.md) — Plan de implementación de flujos de recepción y despacho (referencia para desarrollo).
