# Estimación de Costos - Candas

Documento unificado de estimación de costos para las dos ofertas del sistema Candas. Incluye el **sistema completo** de gestión logística y el **sistema simplificado** con reutilización de códigos de barras.

**Stack técnico de referencia:** Java 25, Spring Boot 4.0.1, React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, PostgreSQL, jjwt 0.12.5, TanStack Router/Query, Radix UI, Sonner. Detalle completo en [TECH-STACK.md](TECH-STACK.md).

---

## Índice

1. [Parte A — Sistema completo CANDAS](#parte-a--sistema-completo-candas)
2. [Parte B — Sistema simplificado](#parte-b--sistema-simplificado-reutilización-de-códigos)
3. [Parte C — Comparativa entre ofertas](#parte-c--comparativa-entre-ofertas)
4. [Modelos de comercialización](#modelos-de-comercialización)
5. [Factores de ajuste de precio](#factores-de-ajuste-de-precio)
6. [Comparativa con competencia](#comparativa-con-competencia)
7. [Recomendaciones por tipo de cliente](#recomendaciones-por-tipo-de-cliente)
8. [Estructura de costos de desarrollo](#estructura-de-costos-de-desarrollo-referencia)
9. [Consideraciones adicionales](#consideraciones-adicionales)
10. [Documentos relacionados](#documentos-relacionados)

---

## Parte A — Sistema completo CANDAS

### Resumen ejecutivo

El sistema CANDAS es una solución completa de gestión logística de paquetes desarrollada con tecnologías modernas (Java 25, Spring Boot 4.0.1, React 19, Vite 7, Tailwind CSS 4, TanStack Router/Query, Radix UI, jjwt 0.12.5, Apache POI). Los PDF se generan en el frontend con jsPDF. Esta estimación está basada en análisis de complejidad técnica, comparación con sistemas similares en LATAM y metodologías estándar de estimación de software.

**Rango de precio recomendado: $75,000 - $130,000 USD**

### Metodología de estimación — Factores considerados

1. **Complejidad técnica:** Alta  
   - Backend: Spring Boot 4.0.1 (Java 25), PostgreSQL, JPA/Hibernate, Flyway, jjwt 0.12.5  
   - Frontend: React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, TanStack Router, TanStack Query, Radix UI, Sonner  
   - Seguridad: JWT (jjwt), Spring Security, RBAC completo  
   - Reportes: Apache POI (Excel), generación de PDFs en frontend (jsPDF)  
   - API: RESTful, Springdoc OpenAPI 2.7

2. **Volumen de código estimado:** Backend ~15,000-20,000 LOC; Frontend ~10,000-15,000 LOC; Total ~25,000-35,000 LOC.

3. **Módulos funcionales:** 11 (Autenticación, Paquetes, Clientes, Agencias/Distribuidores, Lotes Recepción, Sacas/Ensacado, Despachos, Atención Paquetes, Manifiestos Consolidados, Dashboard, Reportes/Exportaciones).

4. **Historias de usuario:** ~71 historias, ~485 Story Points.

5. **Tecnologías avanzadas:** Apache POI, Flyway, RBAC granular.

### Método 1: Story Points a horas

- Total Story Points: ~485; 1 SP = 5 h promedio → **2,425 horas**.  
- Equipo promedio: 60% Senior ($40/h), 30% Semi-Senior ($30/h), 10% Junior ($20/h) → subtotal desarrollo **$84,880**.  
- Adicionales: UI/UX, QA, documentación, gestión → **$28,500**.  
- **Total Método 1: $113,380 USD**. Rango: **$95,000 - $140,000 USD**.

### Método 2: Por módulo funcional

Subtotal módulos (Autenticación $8k, Paquetes $15k, Clientes $6k, Agencias $5k, Lotes $8k, Sacas $10k, Despachos $12k, Atención $6k, Manifiestos $8k, Dashboard $5k, Reportes $10k): **$93,000**. Componentes transversales (arquitectura, seguridad JWT/RBAC, integración, testing, documentación, DevOps): **$34,000**.  
- **Total Método 2: $127,000 USD**. Rango: **$110,000 - $145,000 USD**.

### Método 3: Valor de mercado (comparables LATAM)

Posicionamiento: intermedio-alto. Comparables sistemas especializados en paquetes ($50k-$100k) y ERP logístico ($80k-$120k). Ajustes por stack moderno e interfaz actual.  
- **Total Método 3: $83,000 - $143,000 USD**. Promedio: **$113,000 USD**.

### Precio final recomendado — Sistema completo

| Método | Rango | Promedio |
|--------|-------|----------|
| Método 1 (Story Points) | $95,000 - $140,000 | $117,500 |
| Método 2 (Por Módulo) | $110,000 - $145,000 | $127,500 |
| Método 3 (Mercado) | $83,000 - $143,000 | $113,000 |

**Promedio general: $119,333 USD.**  
**Rango final: $75,000 - $130,000 USD.** Precio óptimo sugerido: **$95,000 - $110,000 USD**.

---

## Parte B — Sistema simplificado (reutilización de códigos)

### Resumen ejecutivo

Sistema de gestión de paquetes simplificado: autenticación/autorización, landing page corporativa y sistema de reutilización de códigos de barras para etiquetado. Stack actual: **Java 25, Spring Boot 4.x, React 19, Vite 7, TypeScript 5.9, Tailwind CSS 4**, PostgreSQL, jjwt, TanStack Router.

**Rango de precio recomendado: $20,000 - $30,000 USD**

### Alcance

- **Módulo 1:** Autenticación y autorización (JWT, RBAC, protección rutas).  
- **Módulo 2:** Landing page corporativa (responsive, formulario contacto, SEO básico).  
- **Módulo 3:** Sistema de reutilización de códigos (escaneo, consulta BD, lógica reutilización, CRUD paquetes, generación etiquetas PDF/ZPL, impresión).

### Método 1: Por Story Points

Total: **96 SP** (Autenticación 34, Landing 17, Reutilización códigos 45). 96 × 5 h = **480 h**. Costo desarrollo + adicionales → **Total $22,900 USD**. Rango: **$18,000 - $28,000 USD**.

### Método 2: Por módulo funcional

Autenticación $6k-$8k, Landing $2k-$3.5k, Reutilización códigos $8k-$12k, Base datos/backend $2k-$3k, Integración/testing $2k-$3k.  
- **Total Método 2: $20,000 - $29,500 USD**.

### Método 3: Valor de mercado

Comparables: sistema con escáner y gestión ($15k-$30k), sistema completo con landing ($20k-$35k). Ajustes por stack moderno (Spring Boot 4, React 19).  
- **Total Método 3: $20,000 - $35,000 USD**. Promedio: **$27,500 USD**.

### Precio final recomendado — Sistema simplificado

**Promedio general: $25,083 USD.**  
**Rango final: $20,000 - $30,000 USD.** Precio óptimo sugerido: **$22,000 - $26,000 USD**.

---

## Parte C — Comparativa entre ofertas

| Aspecto | Sistema simplificado | Sistema completo CANDAS |
|---------|----------------------|--------------------------|
| **Módulos** | 3 | 11 |
| **Story Points** | ~96 SP | ~485 SP |
| **Precio (Licencia Única)** | $20k - $30k | $75k - $130k |
| **Precio (Suscripción)** | $400 - $1,200/mes | $800 - $5,000/mes |
| **Complejidad** | Media | Alta |
| **Tiempo de desarrollo** | 2-3 meses | 6-9 meses |
| **Usuarios típicos** | 3-10 | 10-50+ |
| **Volumen de paquetes** | Bajo-Medio | Medio-Alto |

**Cuándo elegir sistema simplificado:** Empresas pequeñas-medianas, volumen bajo-medio, necesidad de reutilización de códigos, presupuesto limitado, proceso simple.

**Cuándo elegir sistema completo CANDAS:** Empresas medianas-grandes, volumen alto, gestión logística completa, múltiples procesos (ensacado, despachos, manifiestos), presupuesto mayor.

---

## Modelos de comercialización

### Opción 1: Licencia única (pago único)

| Oferta | Rango |
|--------|--------|
| **Sistema completo** | $85,000 - $120,000 USD |
| **Sistema simplificado** | $22,000 - $26,000 USD |

Incluye: código fuente completo, documentación técnica y de usuario, soporte inicial (3-6 meses completo / 3 meses simplificado), capacitación, instalación y configuración, licencia perpetua. Opciones adicionales: personalizaciones, soporte extendido, capacitación extra, migración de datos, integraciones externas (rangos según oferta).

### Opción 2: Suscripción mensual

**Sistema completo:** Plan Básico $800-$1,200/mes (hasta 5 usuarios), Estándar $1,500-$2,500/mes (hasta 15), Enterprise $3,000-$5,000/mes (ilimitado).  
**Sistema simplificado:** Plan Básico $400-$600/mes (hasta 3 usuarios), Estándar $800-$1,200/mes (hasta 10).

### Opción 3: Suscripción anual (descuento 12-20%)

**Sistema completo:** Básico $8k-$10k/año, Estándar $15k-$24k/año, Enterprise $30k-$48k/año.  
**Sistema simplificado:** Básico $4.2k-$6k/año, Estándar $8.4k-$12k/año.

### Opción 4: Modelo híbrido

**Sistema completo:** Implementación inicial $40,000-$60,000 USD + suscripción $1,000-$2,000/mes.  
**Sistema simplificado:** Implementación inicial $12,000-$16,000 USD + suscripción $500-$800/mes.

---

## Factores de ajuste de precio

### Factores que aumentan el precio (+10% a +30%)

Personalizaciones y flujos de trabajo; integraciones con sistemas externos (APIs, ERP, pagos); múltiples idiomas; alto volumen y optimizaciones; compliance y certificaciones; SLA y soporte premium. (Aplicable a ambas ofertas; rangos concretos en documento original según oferta.)

### Factores que disminuyen el precio (-10% a -20%)

Múltiples licencias; acuerdos largo plazo; cliente referido; versión simplificada o menos módulos; pago anticipado; sin soporte incluido. Para sistema simplificado además: sin landing, sin RBAC completo, solo PDF sin ZPL, sin historial estados.

---

## Comparativa con competencia

### Sistemas similares en LATAM (sistema completo)

| Tipo | Rango | Características |
|------|--------|-----------------|
| Tracking básico | $15,000 - $30,000 | Tracking simple, CRUD básico |
| WMS básico | $40,000 - $80,000 | Inventario, recepciones, despachos básicos |
| Especializado paquetes | $50,000 - $100,000 | Paquetes, tracking, reportes |
| ERP logístico | $80,000 - $150,000 | Múltiples módulos, reportes avanzados |
| Enterprise | $150,000 - $300,000+ | Personalización extensa, soporte 24/7 |

**Posicionamiento CANDAS (completo):** Intermedio-Alto. Fortalezas: stack moderno (Spring Boot 4, React 19, Vite 7, Tailwind 4, jjwt, TanStack), 11 módulos, RBAC/JWT, UI moderna, especialización en paquetes. Precio $75k-$130k justificado.

---

## Recomendaciones por tipo de cliente

- **Cliente pequeño (5-10 usuarios):** Plan Básico mensual o licencia única simplificada ($50k-$65k completo; sistema simplificado según plan).
- **Cliente mediano (15-30 usuarios):** Plan Estándar anual o licencia única ($85k-$100k completo).
- **Cliente grande (50+ usuarios):** Plan Enterprise o licencia única + soporte ($110k-$130k completo).
- **Cliente enterprise (100+ usuarios):** Licencia única personalizada ($130k-$180k) o Plan Enterprise Premium.

Para sistema simplificado: según plan Básico/Estándar y modelo híbrido como recomendación frecuente.

---

## Estructura de costos de desarrollo (referencia)

### Sistema completo

Desarrollo 70% (backend, frontend, integraciones), Calidad 10%, Diseño/UX 8%, Documentación 5%, Gestión 7%. Total estimado costos: **$100,000 - $150,000**. Margen 20-30% → precio venta sugerido $120,000 - $195,000.

### Sistema simplificado

Desarrollo 70%, Calidad 12%, Diseño 8%, Documentación 5%, Gestión 5%. Total: **$21,900 - $33,100**. Precio venta sugerido: **$26,280 - $43,030**.

**Nota:** Desglose para referencia interna. El precio final debe basarse en valor de mercado y capacidad de pago del cliente.

---

## Consideraciones adicionales

### Factores de riesgo

Complejidad subestimada (buffer 15-20%); cambios de alcance (definir alcance y cobrar extras); integraciones inesperadas (incluir tiempo de investigación).

### Oportunidades de valor agregado

Soporte y mantenimiento continuo; personalizaciones futuras; múltiples licencias.

### Conclusión

- **Sistema completo CANDAS:** **$75,000 - $130,000 USD** (licencia única) o **$800 - $5,000 USD/mes** (suscripción). Priorizar modelo híbrido o suscripción anual.
- **Sistema simplificado:** **$20,000 - $30,000 USD** (licencia única) o **$400 - $1,200 USD/mes** (suscripción). Recomendación frecuente: modelo híbrido ($12k-$16k inicial + $500-$800/mes).

---

## Documentos relacionados

- [TECH-STACK.md](TECH-STACK.md) — Stack tecnológico y librerías
- [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md) — Resumen ejecutivo del sistema
- [HISTORIAS_USUARIO.md](HISTORIAS_USUARIO.md) — Historias de usuario sistema completo
- [HISTORIAS_USUARIO_SIMPLIFICADO.md](HISTORIAS_USUARIO_SIMPLIFICADO.md) — Historias sistema simplificado
- [REQUERIMIENTOS_TECNICOS.md](REQUERIMIENTOS_TECNICOS.md) — Requerimientos técnicos detallados
