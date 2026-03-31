# Resumen Ejecutivo - Sistema CANDAS

## Visión General

**CANDAS** es un sistema completo de gestión logística de paquetes diseñado para empresas que manejan recepción, procesamiento, ensacado y despacho de paquetes. El sistema proporciona una solución integral que abarca desde el registro inicial hasta la generación de manifiestos y reportes finales.

### Información Clave

- **Nombre del Sistema:** CANDAS (Sistema de Gestión Logística de Paquetes)
- **Tipo:** Software de gestión empresarial especializado
- **Arquitectura:** Aplicación web full-stack (Backend + Frontend)
- **Tecnologías:** Java 25, Spring Boot 4, React 19, Vite 7, TypeScript, PostgreSQL. Detalle en [TECH-STACK.md](TECH-STACK.md).
- **Modelo de Despliegue:** On-premise o Cloud
- **Precio Estimado:** $75,000 - $130,000 USD (licencia única) o $800 - $5,000 USD/mes (suscripción)

---

## Descripción del Sistema

### Propósito

CANDAS automatiza y optimiza los procesos logísticos de empresas que manejan paquetes, proporcionando:

- **Trazabilidad completa** del ciclo de vida de cada paquete
- **Gestión eficiente** de recepciones, ensacado y despachos
- **Reportes y documentación** automatizada (manifiestos, etiquetas)
- **Control de calidad** mediante sistema de atención de paquetes
- **Visibilidad en tiempo real** mediante dashboard con estadísticas

### Características Principales

1. **Gestión Integral de Paquetes**
  - Registro individual e importación masiva desde Excel
  - Tipos especiales: CLEMENTINA (consolidación), SEPARAR (división)
  - Seguimiento completo del estado (REGISTRADO → RECIBIDO → ENSACADO → DESPACHADO)
2. **Proceso de Ensacado Optimizado**
  - Sistema de escaneo de códigos de barras
  - Asignación de paquetes a sacas por tamaño
  - Verificación en tiempo real antes de confirmar ensacado
3. **Gestión de Despachos**
  - Proceso paso a paso para crear despachos
  - Soporte para envíos a agencias, distribuidores o destinatarios directos
  - Generación automática de manifiestos en PDF
4. **Sistema de Atención de Paquetes**
  - Gestión de problemas y solicitudes
  - Flujo de trabajo: PENDIENTE → EN_REVISION → RESUELTO
  - Documentación completa de soluciones
5. **Reportes y Exportaciones**
  - Múltiples formatos: Excel (simplificado y completo), PDF
  - Manifiestos consolidados
  - Etiquetas imprimibles para paquetes y sacas
6. **Seguridad y Control de Acceso**
  - Sistema RBAC (Role-Based Access Control) completo
  - Permisos granulares por funcionalidad
  - Autenticación JWT segura

---

## Valor de Negocio

### Problemas que Resuelve

1. **Ineficiencia en Procesos Manuales**
  - **Antes:** Registro manual en hojas de cálculo, riesgo de errores
  - **Después:** Sistema automatizado con validaciones, reducción de errores en 80-90%
2. **Falta de Trazabilidad**
  - **Antes:** Dificultad para localizar paquetes, estados desconocidos
  - **Después:** Seguimiento completo en tiempo real, historial completo
3. **Documentación Inconsistente**
  - **Antes:** Manifiestos y reportes creados manualmente, formatos inconsistentes
  - **Después:** Generación automática de documentos estandarizados
4. **Procesos de Ensacado Lentos**
  - **Antes:** Verificación manual, riesgo de errores
  - **Después:** Escaneo rápido, validación automática, proceso 3-5x más rápido
5. **Falta de Visibilidad Operativa**
  - **Antes:** Sin visibilidad de estadísticas y tendencias
  - **Después:** Dashboard con métricas en tiempo real, mejor toma de decisiones

### Beneficios Cuantificables

1. **Reducción de Tiempo de Procesamiento:**
  - Registro de paquetes: 70% más rápido (importación masiva)
  - Ensacado: 60% más rápido (sistema de escaneo)
  - Generación de manifiestos: 90% más rápido (automatización)
2. **Reducción de Errores:**
  - Errores de registro: -85%
  - Errores de ensacado: -90%
  - Errores en manifiestos: -95%
3. **Mejora en Productividad:**
  - Operadores pueden procesar 2-3x más paquetes por día
  - Supervisores ahorran 5-10 horas/semana en reportes
  - Reducción de tiempo en búsqueda de paquetes: 80%
4. **ROI Estimado:**
  - Para empresa procesando 1,000 paquetes/mes:
    - Ahorro en tiempo: ~40 horas/mes
    - Valor del ahorro: $1,200-2,000 USD/mes (dependiendo de salarios)
    - **ROI en 3-5 años** (considerando licencia única)

### Beneficios Cualitativos

1. **Mejora en la Experiencia del Cliente:**
  - Respuestas más rápidas a consultas
  - Información precisa y actualizada
  - Menor tiempo de procesamiento
2. **Escalabilidad:**
  - Sistema puede crecer con la empresa
  - Soporta aumento de volumen sin cambios mayores
  - Arquitectura preparada para múltiples ubicaciones
3. **Cumplimiento y Auditoría:**
  - Historial completo de todas las operaciones
  - Reportes para auditorías
  - Trazabilidad completa para compliance
4. **Toma de Decisiones Informada:**
  - Estadísticas y métricas en tiempo real
  - Identificación de cuellos de botella
  - Optimización de procesos basada en datos

---

## Comparativa con Competencia

### Posicionamiento en el Mercado

CANDAS se posiciona en el **nivel intermedio-alto** del mercado de sistemas logísticos en Latinoamérica.


| Criterio             | CANDAS     | Tracking Básico | WMS Genérico | ERP Logístico |
| -------------------- | ---------- | --------------- | ------------ | ------------- |
| **Precio**           | $75k-$130k | $15k-$30k       | $40k-$80k    | $80k-$150k    |
| **Especialización**  | Alta       | Baja            | Media        | Media         |
| **Tecnología**       | Moderna    | Antigua         | Media        | Media         |
| **Funcionalidades**  | Completas  | Básicas         | Genéricas    | Extensas      |
| **Facilidad de Uso** | Alta       | Media           | Media        | Baja          |
| **Soporte**          | Incluido   | Limitado        | Estándar     | Premium       |


### Ventajas Competitivas de CANDAS

1. **Especialización:**
  - Diseñado específicamente para gestión de paquetes
  - Flujos de trabajo optimizados para el negocio
  - No requiere adaptación de sistemas genéricos
2. **Tecnología Moderna:**
  - Stack actualizado (Spring Boot 4.0.1, React, TypeScript)
  - Arquitectura escalable y mantenible
  - Interfaz moderna y responsive
3. **Funcionalidades Especializadas:**
  - Sistema de ensacado con escáner
  - Procesos complejos (separación, consolidación)
  - Múltiples formatos de exportación
  - Manifiestos especializados
4. **Relación Precio-Valor:**
  - Más completo que sistemas básicos
  - Más económico que ERPs enterprise
  - Mejor especialización que WMS genéricos
5. **Facilidad de Implementación:**
  - Sistema listo para usar
  - Configuración mínima requerida
  - Capacitación rápida

### Desventajas vs. Competencia

1. **vs. Sistemas Enterprise:**
  - Menos personalizaciones avanzadas
  - Menos integraciones pre-construidas
  - Soporte menos extensivo (en plan básico)
2. **vs. Soluciones SaaS:**
  - Requiere instalación y mantenimiento
  - No incluye hosting (en algunos casos)
  - Actualizaciones pueden requerir intervención

---

## Recomendaciones de Precio

### Estrategia de Precios Recomendada

#### Opción Recomendada: Modelo Híbrido

**Implementación Inicial: $45,000 - $65,000 USD**

**Incluye:**

- Sistema completo funcional
- Personalización básica según necesidades
- Instalación y configuración
- Capacitación inicial (2-3 sesiones)
- 3 meses de soporte incluido

**Suscripción Mensual: $1,200 - $2,000 USD/mes**

**Incluye:**

- Acceso al sistema
- Actualizaciones y nuevas funcionalidades
- Soporte técnico (respuesta en 24-48 horas)
- Hosting básico (opcional)
- 1 sesión de capacitación trimestral

**Ventajas del Modelo Híbrido:**

- Inversión inicial accesible
- Costos predecibles mensuales
- Actualizaciones continuas
- Soporte incluido
- Flexibilidad para escalar

### Alternativas de Precio

#### Opción 1: Licencia Única Completa

- **Precio:** $95,000 - $110,000 USD
- **Ideal para:** Clientes que prefieren propiedad completa y sin costos recurrentes
- **Incluye:** Código fuente, documentación, 6 meses de soporte, 2 sesiones de capacitación

#### Opción 2: Suscripción Anual

- **Plan Estándar:** $15,000 - $24,000 USD/año
- **Ideal para:** Clientes que prefieren costos predecibles y actualizaciones continuas
- **Incluye:** Todas las funcionalidades, soporte, actualizaciones, hosting básico

#### Opción 3: Suscripción Mensual

- **Plan Estándar:** $1,500 - $2,500 USD/mes
- **Ideal para:** Clientes que prefieren flexibilidad y menor compromiso inicial
- **Incluye:** Todas las funcionalidades, soporte, actualizaciones

### Factores de Ajuste

**Precio puede aumentar (+10% a +30%) si:**

- Personalizaciones extensas requeridas
- Integraciones con sistemas externos
- Soporte para múltiples idiomas
- Alto volumen (requiere optimizaciones)
- Requisitos de compliance específicos

**Precio puede disminuir (-10% a -20%) si:**

- Múltiples licencias (descuento por volumen)
- Contrato de largo plazo (2+ años)
- Versión simplificada (módulos limitados)
- Cliente referido

---

## Casos de Uso Ideales

### Cliente Tipo 1: Empresa de Courier Mediana

**Características:**

- Procesa 500-2,000 paquetes/mes
- 10-20 empleados
- 1-2 ubicaciones
- Presupuesto limitado

**Recomendación:**

- Plan Básico Mensual ($800-1,200/mes) o Licencia Simplificada ($50,000-65,000)
- Enfoque en funcionalidades core
- Capacitación básica

**ROI Esperado:**

- Ahorro de 20-30 horas/mes en procesos manuales
- Reducción de errores del 80%
- ROI en 2-3 años

### Cliente Tipo 2: Empresa Logística Establecida

**Características:**

- Procesa 2,000-10,000 paquetes/mes
- 30-50 empleados
- 2-5 ubicaciones
- Presupuesto medio

**Recomendación:**

- Modelo Híbrido ($45k-65k inicial + $1,500-2,000/mes) o Licencia Única ($85,000-100,000)
- Todas las funcionalidades
- Capacitación completa
- Soporte estándar

**ROI Esperado:**

- Ahorro de 50-80 horas/mes
- Mejora en eficiencia del 40-50%
- ROI en 1.5-2.5 años

### Cliente Tipo 3: Empresa Logística Grande

**Características:**

- Procesa 10,000+ paquetes/mes
- 50+ empleados
- 5+ ubicaciones
- Presupuesto alto

**Recomendación:**

- Plan Enterprise ($3,000-5,000/mes) o Licencia Única Premium ($110,000-130,000)
- Personalizaciones incluidas
- Soporte 24/7
- Capacitación continua
- Integraciones con sistemas existentes

**ROI Esperado:**

- Ahorro de 100+ horas/mes
- Mejora en eficiencia del 50-60%
- ROI en 1-2 años
- Escalabilidad para crecimiento futuro

---

## Tecnologías y Arquitectura

### Stack Tecnológico

**Backend:**

- Spring Boot 4.0.1 (Java 25)
- PostgreSQL (Base de datos)
- JPA/Hibernate (ORM)
- Flyway (Migraciones de BD)
- JWT con jjwt 0.12.5 (Autenticación)
- Spring Security (Seguridad)
- Apache POI (Exportaciones Excel)

**Frontend:**

- React 19 (Framework)
- TypeScript (Lenguaje)
- Vite 7 (Build tool)
- Tailwind CSS (Estilos)
- TanStack Router (Navegación type-safe)
- TanStack Query (Server state y caché)
- Zustand (Estado del cliente)
- React Hook Form + Zod (Formularios y validación)
- Sonner (Notificaciones)

**Infraestructura:**

- Docker (Containerización, opcional)
- PostgreSQL (Base de datos)
- Caddy (Servidor estático del SPA en imagen Docker de producción)

### Arquitectura

- **Patrón:** RESTful API + SPA (Single Page Application)
- **Separación:** Backend y Frontend completamente separados
- **Seguridad:** Autenticación JWT, RBAC en backend y frontend
- **Escalabilidad:** Arquitectura preparada para escalar horizontalmente

---

## Roadmap y Evolución Futura

### Funcionalidades Potenciales (No Incluidas en Precio Base)

1. **App Móvil:**
  - Para operadores en campo
  - Escaneo y registro desde móvil
  - **Costo adicional:** $15,000 - $25,000
2. **API Pública:**
  - Para integraciones con clientes
  - Webhooks para notificaciones
  - **Costo adicional:** $8,000 - $12,000
3. **Analytics Avanzados:**
  - Dashboards personalizables
  - Reportes predictivos
  - **Costo adicional:** $10,000 - $15,000
4. **Integración con Transportistas:**
  - APIs de tracking externos
  - Notificaciones automáticas
  - **Costo adicional:** $5,000 - $10,000 por integración
5. **Multi-tenant:**
  - Soporte para múltiples empresas
  - Aislamiento de datos
  - **Costo adicional:** $20,000 - $30,000

---

## Conclusión

CANDAS es una solución completa y especializada que ofrece un excelente balance entre funcionalidades, tecnología moderna y precio. El sistema está diseñado para empresas que necesitan una solución específica para gestión de paquetes, sin la complejidad y costo de sistemas enterprise genéricos.

**Recomendación Final:**

Para la mayoría de los clientes, recomendamos el **Modelo Híbrido** con:

- **Implementación inicial:** $45,000 - $65,000 USD
- **Suscripción mensual:** $1,200 - $2,000 USD/mes

Este modelo ofrece:

- Inversión inicial accesible
- Actualizaciones continuas
- Soporte incluido
- Flexibilidad para crecer
- ROI atractivo (1.5-3 años)

El sistema está listo para implementación y puede comenzar a generar valor desde el primer día de uso.

---

## Contacto y Próximos Pasos

Para más información sobre CANDAS, incluyendo:

- Demostración en vivo
- Prueba piloto
- Propuesta personalizada
- Preguntas técnicas

Por favor contacte al equipo de ventas o desarrollo.

**Documentos Relacionados:**

- [HISTORIAS_USUARIO.md](HISTORIAS_USUARIO.md) - Detalle completo de funcionalidades
- [ESTIMACION_COSTOS.md](ESTIMACION_COSTOS.md) - Estimación de costos (sistema completo y simplificado)

