# Historias de Usuario - Sistema Simplificado con Reutilización de Códigos

## Índice

1. [Módulo 1: Autenticación y Autorización](#módulo-1-autenticación-y-autorización)
2. [Módulo 2: Landing Page Corporativa](#módulo-2-landing-page-corporativa)
3. [Módulo 3: Sistema de Reutilización de Códigos de Barras](#módulo-3-sistema-de-reutilización-de-códigos-de-barras)

---

## Módulo 1: Autenticación y Autorización

### HU-S-001: Inicio de Sesión

**Como** usuario del sistema  
**Quiero** iniciar sesión con mi nombre de usuario y contraseña  
**Para** acceder a las funcionalidades del sistema según mis permisos

**Criterios de Aceptación:**
- El sistema debe validar credenciales contra la base de datos
- Debe generar un token JWT válido al autenticarse correctamente
- Debe mostrar mensaje de error si las credenciales son incorrectas
- El token debe tener una expiración de 24 horas
- Debe redirigir al dashboard después del login exitoso
- Debe mantener la sesión mientras el token sea válido
- Debe permitir "Recordar sesión" opcional

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-S-002: Registro de Usuarios

**Como** administrador del sistema  
**Quiero** registrar nuevos usuarios  
**Para** dar acceso al sistema a nuevos operadores y personal

**Criterios de Aceptación:**
- Debe validar que el username y email sean únicos
- Debe encriptar la contraseña antes de guardarla
- Debe permitir asignar roles durante el registro
- Debe validar formato de email
- Debe establecer el usuario como activo por defecto
- Debe registrar la fecha de creación
- Debe enviar email de bienvenida (opcional)

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-003: Gestión de Roles

**Como** administrador del sistema  
**Quiero** crear, editar y eliminar roles  
**Para** organizar los permisos de los usuarios de manera eficiente

**Criterios de Aceptación:**
- Debe permitir crear roles con nombre y descripción
- Debe permitir editar nombre y descripción de roles existentes
- Debe permitir activar/desactivar roles
- Debe validar que el nombre del rol sea único
- Debe mostrar lista de permisos asignados al rol
- No debe permitir eliminar roles que tengan usuarios asignados
- Debe mostrar cantidad de usuarios con cada rol

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-S-004: Gestión de Permisos

**Como** administrador del sistema  
**Quiero** gestionar los permisos disponibles  
**Para** controlar el acceso granular a las funcionalidades del sistema

**Criterios de Aceptación:**
- Debe mostrar lista de todos los permisos con recurso y acción
- Debe permitir crear nuevos permisos
- Debe permitir editar descripción de permisos
- Debe mostrar qué roles tienen cada permiso asignado
- Debe validar formato de nombre de permiso (recurso:acción)
- Debe permitir filtrar permisos por recurso

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-005: Asignación de Roles a Usuarios

**Como** administrador del sistema  
**Quiero** asignar uno o más roles a usuarios  
**Para** otorgarles los permisos correspondientes

**Criterios de Aceptación:**
- Debe permitir asignar múltiples roles a un usuario
- Debe mostrar los roles actuales del usuario
- Debe permitir remover roles asignados
- Debe validar que el usuario y el rol existan
- Debe actualizar permisos del usuario inmediatamente
- Debe mostrar permisos efectivos del usuario

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-006: Protección de Rutas por Permisos

**Como** desarrollador del sistema  
**Quiero** que las rutas estén protegidas por permisos  
**Para** garantizar que solo usuarios autorizados accedan a funcionalidades específicas

**Criterios de Aceptación:**
- Debe verificar permisos antes de renderizar componentes
- Debe redirigir a página de acceso denegado si no tiene permiso
- Debe ocultar elementos de UI según permisos del usuario
- Debe validar permisos tanto en frontend como backend
- Debe mostrar mensaje claro cuando se deniega acceso
- Debe registrar intentos de acceso no autorizados

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

## Módulo 2: Landing Page Corporativa

### HU-S-007: Sección de Inicio (Hero)

**Como** visitante del sitio web  
**Quiero** ver una sección de inicio atractiva  
**Para** entender rápidamente qué hace la empresa

**Criterios de Aceptación:**
- Debe mostrar título principal y subtítulo
- Debe incluir imagen o video de fondo (opcional)
- Debe tener llamada a la acción (CTA) prominente
- Debe ser responsive (adaptarse a móvil, tablet, desktop)
- Debe cargar rápidamente (optimización de imágenes)
- Debe tener diseño moderno y profesional

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-S-008: Sección de Servicios

**Como** visitante del sitio web  
**Quiero** ver los servicios que ofrece la empresa  
**Para** entender qué puede ofrecer para mi negocio

**Criterios de Aceptación:**
- Debe mostrar lista de servicios principales
- Debe incluir iconos o imágenes para cada servicio
- Debe tener descripción breve de cada servicio
- Debe ser visualmente atractivo
- Debe ser responsive
- Debe permitir expandir para más detalles (opcional)

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-S-009: Formulario de Contacto

**Como** visitante del sitio web  
**Quiero** enviar un mensaje de contacto  
**Para** solicitar información o hacer consultas

**Criterios de Aceptación:**
- Debe capturar: nombre, email, teléfono, mensaje
- Debe validar formato de email y teléfono
- Debe mostrar mensaje de éxito después de enviar
- Debe mostrar mensaje de error si falla el envío
- Debe enviar email de notificación al administrador
- Debe guardar mensaje en base de datos
- Debe prevenir spam (CAPTCHA opcional)

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-010: Integración Backend para Contacto

**Como** desarrollador del sistema  
**Quiero** que el formulario de contacto se integre con el backend  
**Para** procesar y almacenar los mensajes

**Criterios de Aceptación:**
- Debe crear endpoint REST para recibir mensajes
- Debe validar datos en el backend
- Debe guardar mensaje en base de datos
- Debe enviar email de notificación
- Debe retornar respuesta apropiada (éxito/error)
- Debe manejar errores gracefully

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-S-011: Diseño Responsive

**Como** visitante del sitio web  
**Quiero** que el sitio se vea bien en cualquier dispositivo  
**Para** acceder desde móvil, tablet o desktop

**Criterios de Aceptación:**
- Debe adaptarse a pantallas de 320px a 1920px+
- Debe mantener legibilidad en todos los tamaños
- Debe optimizar imágenes para móvil
- Debe tener menú hamburguesa en móvil
- Debe probarse en navegadores principales
- Debe tener buen rendimiento en móvil

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-012: SEO Básico

**Como** administrador del sitio  
**Quiero** que el sitio tenga SEO básico optimizado  
**Para** mejorar visibilidad en motores de búsqueda

**Criterios de Aceptación:**
- Debe incluir meta tags (title, description, keywords)
- Debe tener URLs amigables
- Debe incluir sitemap.xml
- Debe tener robots.txt
- Debe incluir Open Graph tags (opcional)
- Debe tener estructura semántica HTML5

**Prioridad:** Media  
**Estimación:** 2 Story Points

---

## Módulo 3: Sistema de Reutilización de Códigos de Barras

### HU-S-013: Escanear Código de Barras

**Como** operador del sistema  
**Quiero** escanear un código de barras usando un escáner o cámara  
**Para** iniciar el proceso de reutilización

**Criterios de Aceptación:**
- Debe permitir escaneo desde escáner USB conectado
- Debe permitir escaneo desde escáner Bluetooth
- Debe permitir escaneo desde cámara del dispositivo (móvil/tablet)
- Debe validar formato del código escaneado
- Debe mostrar el código escaneado en pantalla
- Debe manejar errores de lectura (código inválido, sin conexión)
- Debe tener feedback visual/audible al escanear
- Debe auto-enfocar campo de entrada después de escanear

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-S-014: Consultar Estado del Código en Base de Datos

**Como** sistema  
**Quiero** consultar el estado actual de un código de barras en la base de datos  
**Para** determinar si es reutilizable

**Criterios de Aceptación:**
- Debe crear endpoint REST para consultar código
- Debe buscar código en base de datos
- Debe retornar estado actual del código
- Debe retornar información del paquete asociado (si existe)
- Debe manejar caso cuando código no existe
- Debe optimizar consulta para rendimiento
- Debe incluir timestamp de última actualización
- Debe retornar respuesta en menos de 500ms

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-015: Verificar si Código es Reutilizable

**Como** sistema  
**Quiero** verificar si un código de barras es reutilizable  
**Para** determinar si se puede usar para un nuevo paquete

**Criterios de Aceptación:**
- Debe verificar estado del código
- Debe considerar reutilizable si estado es "Entregado" o "Libre"
- Debe considerar NO reutilizable si estado es "En tránsito" o "Activo"
- Debe retornar resultado booleano (reutilizable/no reutilizable)
- Debe incluir razón si no es reutilizable
- Debe registrar la consulta en log
- Debe manejar casos edge (código nuevo, código eliminado)

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-016: Mostrar Alerta "Código en Uso"

**Como** operador del sistema  
**Quiero** ver una alerta cuando un código no es reutilizable  
**Para** saber que no puedo usarlo para un nuevo paquete

**Criterios de Aceptación:**
- Debe mostrar alerta visual clara (roja/borde rojo)
- Debe mostrar mensaje: "Código en Uso"
- Debe mostrar información adicional: estado actual, fecha de último uso
- Debe permitir ver detalles del paquete actual (si aplica)
- Debe permitir cancelar la operación
- Debe limpiar el campo de escaneo
- Debe auto-enfocar campo para nuevo escaneo

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-S-017: Limpiar/Preparar Formulario para Nuevos Datos

**Como** sistema  
**Quiero** limpiar y preparar el formulario cuando un código es reutilizable  
**Para** permitir ingresar datos del nuevo paquete

**Criterios de Aceptación:**
- Debe limpiar todos los campos del formulario
- Debe pre-llenar el código de barras (solo lectura)
- Debe resetear validaciones
- Debe enfocar el primer campo editable
- Debe mostrar indicador visual de que formulario está listo
- Debe mantener historial del código anterior (opcional)

**Prioridad:** Alta  
**Estimación:** 2 Story Points

---

### HU-S-018: Ingresar Datos del Nuevo Paquete

**Como** operador del sistema  
**Quiero** ingresar datos del nuevo paquete (remitente, destinatario, dirección)  
**Para** registrar el paquete en el sistema

**Criterios de Aceptación:**
- Debe capturar: Remitente (nombre, teléfono, email)
- Debe capturar: Destinatario (nombre, teléfono, email)
- Debe capturar: Dirección completa (calle, ciudad, estado, código postal)
- Debe validar campos requeridos
- Debe validar formato de email y teléfono
- Debe permitir guardar como borrador
- Debe mostrar indicador de progreso
- Debe permitir cancelar y volver a escanear

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-S-019: Guardar Nuevo Registro en Base de Datos

**Como** sistema  
**Quiero** guardar el nuevo registro de paquete en la base de datos  
**Para** almacenar la información permanentemente

**Criterios de Aceptación:**
- Debe crear endpoint REST para guardar paquete
- Debe validar todos los datos antes de guardar
- Debe actualizar estado del código a "En tránsito" o "Activo"
- Debe asociar código de barras con nuevo paquete
- Debe registrar fecha y hora de creación
- Debe registrar usuario que creó el registro
- Debe retornar ID del paquete creado
- Debe manejar errores (código duplicado, validación fallida)
- Debe mantener integridad referencial

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-020: Generar Nueva Etiqueta (PDF)

**Como** operador del sistema  
**Quiero** generar una etiqueta en formato PDF  
**Para** imprimirla en impresoras estándar

**Criterios de Aceptación:**
- Debe generar PDF con datos del paquete
- Debe incluir código de barras en la etiqueta
- Debe incluir información: remitente, destinatario, dirección
- Debe tener formato estándar de etiqueta de envío
- Debe ser de tamaño adecuado para impresión (4x6 pulgadas típico)
- Debe incluir fecha de creación
- Debe ser de alta calidad para impresión
- Debe permitir descargar PDF

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-S-021: Generar Nueva Etiqueta (ZPL)

**Como** operador del sistema  
**Quiero** generar una etiqueta en formato ZPL  
**Para** imprimirla en impresoras Zebra

**Criterios de Aceptación:**
- Debe generar código ZPL con datos del paquete
- Debe incluir código de barras en formato ZPL
- Debe incluir información: remitente, destinatario, dirección
- Debe seguir estándar ZPL para impresoras Zebra
- Debe ser compatible con modelos comunes (ZT, ZD, GC)
- Debe permitir descargar archivo .zpl
- Debe permitir enviar directamente a impresora (opcional)
- Debe validar sintaxis ZPL antes de generar

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-S-022: Imprimir Etiqueta

**Como** operador del sistema  
**Quiero** imprimir la etiqueta generada  
**Para** pegarla en el paquete físico

**Criterios de Aceptación:**
- Debe abrir diálogo de impresión del navegador
- Debe permitir seleccionar impresora
- Debe permitir configurar opciones de impresión (copias, orientación)
- Debe mostrar vista previa antes de imprimir
- Debe manejar errores de impresión
- Debe confirmar impresión exitosa
- Debe permitir reimprimir si es necesario
- Debe registrar fecha de impresión en base de datos

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-S-023: Gestionar Estados de Paquetes

**Como** sistema  
**Quiero** gestionar los estados de los paquetes  
**Para** rastrear el ciclo de vida de cada paquete

**Criterios de Aceptación:**
- Debe tener estados: "En tránsito", "Activo", "Entregado", "Libre"
- Debe permitir cambiar estado manualmente (con permisos)
- Debe validar transiciones de estado válidas
- Debe registrar fecha y usuario de cada cambio de estado
- Debe mantener historial de cambios de estado
- Debe actualizar estado automáticamente según reglas de negocio
- Debe permitir consultar historial de estados

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-S-024: Consultar Historial de Código de Barras

**Como** operador del sistema  
**Quiero** consultar el historial de uso de un código de barras  
**Para** ver todos los paquetes que han usado ese código

**Criterios de Aceptación:**
- Debe mostrar lista de todos los paquetes asociados al código
- Debe mostrar fecha de creación de cada paquete
- Debe mostrar estado actual de cada paquete
- Debe mostrar remitente y destinatario de cada paquete
- Debe ordenar por fecha (más reciente primero)
- Debe permitir ver detalles de cada paquete
- Debe mostrar estadísticas (total de usos, último uso)

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-S-025: Buscar Paquetes

**Como** operador del sistema  
**Quiero** buscar paquetes por diferentes criterios  
**Para** encontrar paquetes específicos

**Criterios de Aceptación:**
- Debe permitir buscar por código de barras
- Debe permitir buscar por remitente
- Debe permitir buscar por destinatario
- Debe permitir buscar por dirección
- Debe permitir buscar por estado
- Debe permitir buscar por rango de fechas
- Debe mostrar resultados en tiempo real
- Debe permitir filtrar resultados
- Debe mostrar información relevante en resultados

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-S-026: Ver Lista de Paquetes

**Como** operador del sistema  
**Quiero** ver una lista de todos los paquetes  
**Para** tener visibilidad de todos los registros

**Criterios de Aceptación:**
- Debe mostrar lista paginada de paquetes
- Debe mostrar información relevante: código, remitente, destinatario, estado, fecha
- Debe permitir ordenar por diferentes columnas
- Debe permitir filtrar por estado
- Debe permitir buscar en la lista
- Debe mostrar contador de total de paquetes
- Debe permitir acceder al detalle de cada paquete
- Debe actualizar automáticamente (opcional)

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-S-027: Ver Detalle de Paquete

**Como** operador del sistema  
**Quiero** ver el detalle completo de un paquete  
**Para** consultar toda la información

**Criterios de Aceptación:**
- Debe mostrar todos los datos del paquete
- Debe mostrar código de barras (visualización)
- Debe mostrar remitente y destinatario completos
- Debe mostrar dirección completa
- Debe mostrar estado actual
- Debe mostrar historial de cambios de estado
- Debe mostrar fecha de creación y última actualización
- Debe permitir editar paquete (con permisos)
- Debe permitir cambiar estado (con permisos)
- Debe permitir reimprimir etiqueta

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-S-028: Editar Paquete Existente

**Como** operador del sistema  
**Quiero** editar la información de un paquete existente  
**Para** corregir datos o actualizar información

**Criterios de Aceptación:**
- Debe cargar datos actuales del paquete
- Debe permitir modificar: remitente, destinatario, dirección
- Debe validar cambios antes de guardar
- Debe mantener código de barras (no editable)
- Debe registrar fecha de última actualización
- Debe registrar usuario que hizo la modificación
- Debe mantener historial de cambios
- Debe permitir cancelar edición

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-S-029: Marcar Paquete como Entregado

**Como** operador del sistema  
**Quiero** marcar un paquete como entregado  
**Para** liberar el código de barras para reutilización

**Criterios de Aceptación:**
- Debe cambiar estado del paquete a "Entregado"
- Debe cambiar estado del código a "Libre" (reutilizable)
- Debe registrar fecha y hora de entrega
- Debe registrar usuario que marcó como entregado
- Debe permitir agregar observaciones de entrega
- Debe validar que el paquete esté en estado válido para entregar
- Debe mostrar confirmación antes de cambiar estado

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-S-030: Dashboard con Estadísticas

**Como** administrador del sistema  
**Quiero** ver un dashboard con estadísticas  
**Para** tener visibilidad del estado del sistema

**Criterios de Aceptación:**
- Debe mostrar total de paquetes
- Debe mostrar paquetes por estado (En tránsito, Activo, Entregado, Libre)
- Debe mostrar códigos reutilizados hoy/esta semana/este mes
- Debe mostrar gráficos de tendencias
- Debe actualizar en tiempo real (opcional)
- Debe ser responsive
- Debe permitir exportar estadísticas (opcional)

**Prioridad:** Baja  
**Estimación:** 8 Story Points

---

## Resumen de Historias de Usuario

- **Total de Historias:** 30
- **Prioridad Alta:** 20 historias
- **Prioridad Media:** 9 historias
- **Prioridad Baja:** 1 historia
- **Total Story Points Estimados:** ~96 puntos

### Distribución por Módulo

1. **Autenticación y Autorización:** 6 historias (34 SP)
   - HU-S-001: Inicio de Sesión (3 SP)
   - HU-S-002: Registro de Usuarios (5 SP)
   - HU-S-003: Gestión de Roles (8 SP)
   - HU-S-004: Gestión de Permisos (5 SP)
   - HU-S-005: Asignación de Roles a Usuarios (5 SP)
   - HU-S-006: Protección de Rutas por Permisos (8 SP)

2. **Landing Page Corporativa:** 6 historias (21 SP)
   - HU-S-007: Sección de Inicio (Hero) (3 SP)
   - HU-S-008: Sección de Servicios (3 SP)
   - HU-S-009: Formulario de Contacto (5 SP)
   - HU-S-010: Integración Backend para Contacto (3 SP)
   - HU-S-011: Diseño Responsive (5 SP)
   - HU-S-012: SEO Básico (2 SP)

3. **Sistema de Reutilización de Códigos:** 18 historias (41 SP)
   - HU-S-013: Escanear Código de Barras (8 SP)
   - HU-S-014: Consultar Estado del Código (5 SP)
   - HU-S-015: Verificar si Código es Reutilizable (5 SP)
   - HU-S-016: Mostrar Alerta "Código en Uso" (3 SP)
   - HU-S-017: Limpiar/Preparar Formulario (2 SP)
   - HU-S-018: Ingresar Datos del Nuevo Paquete (8 SP)
   - HU-S-019: Guardar Nuevo Registro (5 SP)
   - HU-S-020: Generar Etiqueta PDF (8 SP)
   - HU-S-021: Generar Etiqueta ZPL (8 SP)
   - HU-S-022: Imprimir Etiqueta (3 SP)
   - HU-S-023: Gestionar Estados de Paquetes (5 SP)
   - HU-S-024: Consultar Historial de Código (5 SP)
   - HU-S-025: Buscar Paquetes (5 SP)
   - HU-S-026: Ver Lista de Paquetes (5 SP)
   - HU-S-027: Ver Detalle de Paquete (5 SP)
   - HU-S-028: Editar Paquete Existente (5 SP)
   - HU-S-029: Marcar Paquete como Entregado (3 SP)
   - HU-S-030: Dashboard con Estadísticas (8 SP)

---

## Flujo Principal de Reutilización de Códigos

### Proceso Completo (Según Diagrama)

1. **Inicio** → Usuario accede al sistema
2. **Escanear Código de Barras** → HU-S-013
3. **Consultar Estado en BD** → HU-S-014
4. **¿Es Reutilizable?** → HU-S-015
   - **NO (En tránsito/Activo)**:
     - Mostrar Alerta "Código en Uso" → HU-S-016
     - Fin: Cancelar
   - **SI (Entregado/Libre)**:
     - Limpiar/Preparar Formulario → HU-S-017
     - Ingresar Nuevos Datos → HU-S-018
     - Guardar Nuevo Registro → HU-S-019
     - Generar Nueva Etiqueta (PDF/ZPL) → HU-S-020/HU-S-021
     - Imprimir → HU-S-022
     - Fin: Pegar en Paquete

---

## Notas Técnicas

### Estados de Códigos de Barras

- **En tránsito:** Código asignado a paquete que está en proceso de envío
- **Activo:** Código asignado a paquete activo en el sistema
- **Entregado:** Código de paquete que fue entregado al destinatario
- **Libre:** Código disponible para reutilización (nuevo o después de entregado)

### Transiciones de Estado Válidas

- Nuevo código → Libre
- Libre → En tránsito (al crear nuevo paquete)
- En tránsito → Activo (al activar paquete)
- Activo → Entregado (al marcar como entregado)
- Entregado → Libre (automático o manual, para reutilización)

### Formatos de Etiqueta

- **PDF:** Para impresoras estándar (láser, inyección de tinta)
- **ZPL:** Para impresoras Zebra (térmicas, de etiquetas)

---

## Dependencias entre Historias

### Dependencias Críticas

- HU-S-013 (Escanear) → HU-S-014 (Consultar Estado)
- HU-S-014 (Consultar Estado) → HU-S-015 (Verificar Reutilizable)
- HU-S-015 (Verificar) → HU-S-016 (Alerta) o HU-S-017 (Preparar Formulario)
- HU-S-018 (Ingresar Datos) → HU-S-019 (Guardar)
- HU-S-019 (Guardar) → HU-S-020/HU-S-021 (Generar Etiqueta)
- HU-S-020/HU-S-021 (Generar) → HU-S-022 (Imprimir)

### Módulos Independientes

- Módulo de Autenticación puede desarrollarse en paralelo
- Landing Page puede desarrollarse en paralelo
- Sistema de Códigos depende de Autenticación para protección de rutas
