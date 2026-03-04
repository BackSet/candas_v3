# Historias de Usuario - Sistema CANDAS

## Índice

1. [Módulo 1: Autenticación y Autorización](#módulo-1-autenticación-y-autorización)
2. [Módulo 2: Gestión de Paquetes](#módulo-2-gestión-de-paquetes)
3. [Módulo 3: Gestión de Clientes](#módulo-3-gestión-de-clientes)
4. [Módulo 4: Gestión de Agencias y Distribuidores](#módulo-4-gestión-de-agencias-y-distribuidores)
5. [Módulo 5: Lotes de Recepción](#módulo-5-lotes-de-recepción)
6. [Módulo 6: Sacas y Ensacado](#módulo-6-sacas-y-ensacado)
7. [Módulo 7: Despachos](#módulo-7-despachos)
8. [Módulo 8: Atención de Paquetes](#módulo-8-atención-de-paquetes)
9. [Módulo 9: Manifiestos Consolidados](#módulo-9-manifiestos-consolidados)
10. [Módulo 10: Dashboard y Analytics](#módulo-10-dashboard-y-analytics)
11. [Módulo 11: Reportes y Exportaciones](#módulo-11-reportes-y-exportaciones)

---

## Módulo 1: Autenticación y Autorización

### HU-001: Inicio de Sesión

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

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-002: Registro de Usuarios

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

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-003: Gestión de Roles

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

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-004: Gestión de Permisos

**Como** administrador del sistema  
**Quiero** gestionar los permisos disponibles  
**Para** controlar el acceso granular a las funcionalidades del sistema

**Criterios de Aceptación:**
- Debe mostrar lista de todos los permisos con recurso y acción
- Debe permitir crear nuevos permisos
- Debe permitir editar descripción de permisos
- Debe mostrar qué roles tienen cada permiso asignado
- Debe validar formato de nombre de permiso (recurso:acción)

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-005: Asignación de Roles a Usuarios

**Como** administrador del sistema  
**Quiero** asignar uno o más roles a usuarios  
**Para** otorgarles los permisos correspondientes

**Criterios de Aceptación:**
- Debe permitir asignar múltiples roles a un usuario
- Debe mostrar los roles actuales del usuario
- Debe permitir remover roles asignados
- Debe validar que el usuario y el rol existan
- Debe actualizar permisos del usuario inmediatamente

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-006: Protección de Rutas por Permisos

**Como** desarrollador del sistema  
**Quiero** que las rutas estén protegidas por permisos  
**Para** garantizar que solo usuarios autorizados accedan a funcionalidades específicas

**Criterios de Aceptación:**
- Debe verificar permisos antes de renderizar componentes
- Debe redirigir a página de acceso denegado si no tiene permiso
- Debe ocultar elementos de UI según permisos del usuario
- Debe validar permisos tanto en frontend como backend
- Debe mostrar mensaje claro cuando se deniega acceso

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

## Módulo 2: Gestión de Paquetes

### HU-007: Crear Paquete Individual

**Como** operador del sistema  
**Quiero** crear un paquete individual con todos sus datos  
**Para** registrar un nuevo paquete en el sistema

**Criterios de Aceptación:**
- Debe capturar número de guía, tipo de paquete, remitente, destinatario
- Debe permitir seleccionar dirección y teléfono del destinatario
- Debe validar que el número de guía sea único
- Debe establecer estado inicial como REGISTRADO
- Debe permitir agregar observaciones
- Debe asociar el paquete con punto de origen y agencia destino

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-008: Importar Paquetes desde Excel

**Como** operador del sistema  
**Quiero** importar múltiples paquetes desde un archivo Excel  
**Para** registrar grandes volúmenes de paquetes de manera eficiente

**Criterios de Aceptación:**
- Debe validar formato del archivo Excel
- Debe leer número master de la primera fila
- Debe procesar múltiples filas de paquetes
- Debe mostrar resumen de paquetes importados y errores
- Debe validar datos antes de importar
- Debe permitir descargar plantilla de ejemplo

**Prioridad:** Alta  
**Estimación:** 13 Story Points

---

### HU-009: Editar Paquete

**Como** operador del sistema  
**Quiero** editar la información de un paquete existente  
**Para** corregir datos o actualizar información

**Criterios de Aceptación:**
- Debe cargar datos actuales del paquete
- Debe permitir modificar todos los campos editables
- Debe validar cambios antes de guardar
- Debe mantener historial de cambios
- Debe permitir cambiar dirección y teléfono del destinatario
- Debe actualizar estado si corresponde

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-010: Ver Detalle de Paquete

**Como** usuario del sistema  
**Quiero** ver todos los detalles de un paquete  
**Para** consultar información completa del paquete

**Criterios de Aceptación:**
- Debe mostrar todos los datos del paquete
- Debe mostrar información del remitente y destinatario
- Debe mostrar historial de estados
- Debe mostrar saca asignada si existe
- Debe mostrar despacho asociado si existe
- Debe mostrar observaciones y atención si aplica

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-011: Separar Paquete Tipo SEPARAR

**Como** operador del sistema  
**Quiero** separar un paquete tipo SEPARAR en múltiples paquetes hijos  
**Para** dividir un paquete consolidado en sus componentes

**Criterios de Aceptación:**
- Debe validar que el paquete sea tipo SEPARAR
- Debe permitir crear múltiples paquetes hijos
- Debe asociar cada hijo con el paquete padre
- Debe generar números de guía únicos para cada hijo
- Debe actualizar estado del paquete padre
- Debe mostrar relación padre-hijo en la vista

**Prioridad:** Media  
**Estimación:** 13 Story Points

---

### HU-012: Asignar Hijos a Paquete CLEMENTINA

**Como** operador del sistema  
**Quiero** asignar paquetes hijos existentes a un paquete CLEMENTINA  
**Para** consolidar múltiples paquetes bajo un paquete padre

**Criterios de Aceptación:**
- Debe validar que el paquete sea tipo CLEMENTINA
- Debe permitir buscar y seleccionar paquetes hijos
- Debe validar que los hijos no estén ya asignados
- Debe crear relación padre-hijo
- Debe mostrar lista de hijos asignados
- Debe permitir remover hijos asignados

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

### HU-013: Cambiar Estado de Paquete

**Como** operador del sistema  
**Quiero** cambiar el estado de un paquete  
**Para** reflejar el progreso del paquete en el proceso logístico

**Criterios de Aceptación:**
- Debe permitir cambiar entre estados válidos (REGISTRADO, RECIBIDO, ENSACADO, DESPACHADO)
- Debe validar transiciones de estado permitidas
- Debe registrar fecha y usuario del cambio
- Debe actualizar automáticamente según operaciones (ensacado, despacho)
- Debe mostrar historial de cambios de estado

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-014: Cambiar Tipo de Paquete Masivamente

**Como** operador del sistema  
**Quiero** cambiar el tipo de múltiples paquetes a la vez  
**Para** actualizar eficientemente grupos de paquetes

**Criterios de Aceptación:**
- Debe permitir seleccionar múltiples paquetes
- Debe permitir seleccionar nuevo tipo
- Debe validar que el cambio sea permitido
- Debe mostrar resumen de cambios a realizar
- Debe procesar cambios en lote
- Debe mostrar resultado de la operación

**Prioridad:** Baja  
**Estimación:** 8 Story Points

---

### HU-015: Buscar Paquetes por Número de Guía

**Como** usuario del sistema  
**Quiero** buscar un paquete por su número de guía  
**Para** encontrar rápidamente un paquete específico

**Criterios de Aceptación:**
- Debe permitir búsqueda por número de guía exacto
- Debe mostrar resultado inmediatamente
- Debe redirigir al detalle si se encuentra
- Debe mostrar mensaje si no se encuentra
- Debe funcionar desde cualquier página

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-016: Filtrar Paquetes por Estado/Tipo

**Como** usuario del sistema  
**Quiero** filtrar la lista de paquetes por estado y tipo  
**Para** encontrar paquetes específicos según criterios

**Criterios de Aceptación:**
- Debe permitir filtrar por estado (REGISTRADO, RECIBIDO, ENSACADO, DESPACHADO)
- Debe permitir filtrar por tipo (CLEMENTINA, SEPARAR, AGENCIA, DOMICILIO)
- Debe permitir combinar múltiples filtros
- Debe mostrar contador de resultados
- Debe mantener filtros en la URL para compartir

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-017: Imprimir Etiqueta de Paquete

**Como** operador del sistema  
**Quiero** imprimir la etiqueta de un paquete  
**Para** etiquetar físicamente el paquete

**Criterios de Aceptación:**
- Debe generar PDF imprimible con datos del paquete
- Debe incluir número de guía, destinatario, dirección
- Debe tener formato estándar de etiqueta
- Debe permitir imprimir múltiples etiquetas
- Debe abrir en nueva ventana para impresión

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

## Módulo 3: Gestión de Clientes

### HU-018: Crear Cliente (Remitente/Destinatario/Ambos)

**Como** operador del sistema  
**Quiero** crear un cliente especificando su tipo  
**Para** registrar remitentes y destinatarios en el sistema

**Criterios de Aceptación:**
- Debe permitir seleccionar tipo: REMITENTE, DESTINATARIO o AMBOS
- Debe capturar nombre completo, documento de identidad, email
- Debe validar que el documento sea único
- Debe permitir agregar direcciones y teléfonos durante la creación
- Debe establecer cliente como activo por defecto
- Debe registrar fecha de creación

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-019: Editar Cliente

**Como** operador del sistema  
**Quiero** editar la información de un cliente  
**Para** actualizar datos del cliente

**Criterios de Aceptación:**
- Debe cargar datos actuales del cliente
- Debe permitir modificar nombre, documento, email, tipo
- Debe validar cambios antes de guardar
- Debe mantener integridad con paquetes asociados
- Debe permitir activar/desactivar cliente

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-020: Gestionar Múltiples Direcciones por Cliente

**Como** operador del sistema  
**Quiero** agregar, editar y eliminar direcciones de un cliente  
**Para** manejar clientes con múltiples ubicaciones

**Criterios de Aceptación:**
- Debe permitir agregar múltiples direcciones
- Debe capturar país, ciudad, cantón, dirección
- Debe permitir editar cada dirección individualmente
- Debe permitir eliminar direcciones
- Debe permitir marcar una dirección como principal
- Debe validar que haya al menos una dirección si el cliente es destinatario

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-021: Gestionar Múltiples Teléfonos por Cliente

**Como** operador del sistema  
**Quiero** agregar, editar y eliminar teléfonos de un cliente  
**Para** manejar múltiples números de contacto

**Criterios de Aceptación:**
- Debe permitir agregar múltiples teléfonos
- Debe capturar número de teléfono
- Debe permitir editar cada teléfono individualmente
- Debe permitir eliminar teléfonos
- Debe permitir marcar un teléfono como principal
- Debe validar formato de teléfono

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-022: Marcar Dirección/Teléfono como Principal

**Como** operador del sistema  
**Quiero** marcar una dirección o teléfono como principal  
**Para** que se use por defecto en nuevos paquetes

**Criterios de Aceptación:**
- Debe permitir marcar solo una dirección como principal
- Debe permitir marcar solo un teléfono como principal
- Debe actualizar automáticamente si se marca otro como principal
- Debe mostrar visualmente cuál es el principal
- Debe usar el principal por defecto al crear paquetes

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-023: Ver Historial de Paquetes del Cliente

**Como** usuario del sistema  
**Quiero** ver todos los paquetes asociados a un cliente  
**Para** consultar el historial de envíos del cliente

**Criterios de Aceptación:**
- Debe mostrar lista de paquetes donde el cliente es remitente
- Debe mostrar lista de paquetes donde el cliente es destinatario
- Debe mostrar estado actual de cada paquete
- Debe permitir filtrar por fecha, estado, tipo
- Debe mostrar estadísticas (total, por estado)

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-024: Buscar Clientes

**Como** usuario del sistema  
**Quiero** buscar clientes por nombre, documento o email  
**Para** encontrar rápidamente un cliente específico

**Criterios de Aceptación:**
- Debe permitir búsqueda por nombre (parcial)
- Debe permitir búsqueda por documento de identidad
- Debe permitir búsqueda por email
- Debe mostrar resultados en tiempo real
- Debe mostrar información relevante en los resultados
- Debe permitir acceder al detalle desde los resultados

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

## Módulo 4: Gestión de Agencias y Distribuidores

### HU-025: Crear/Editar Agencia

**Como** administrador del sistema  
**Quiero** crear y editar agencias  
**Para** gestionar las agencias de distribución

**Criterios de Aceptación:**
- Debe capturar nombre, código, dirección, teléfono, email
- Debe validar que el código sea único
- Debe permitir activar/desactivar agencia
- Debe permitir agregar múltiples teléfonos
- Debe asociar agencia con distribuidor si aplica
- Debe mostrar lista de paquetes asociados

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-026: Crear/Editar Distribuidor

**Como** administrador del sistema  
**Quiero** crear y editar distribuidores  
**Para** gestionar los distribuidores del sistema

**Criterios de Aceptación:**
- Debe capturar nombre, código, información de contacto
- Debe validar que el código sea único
- Debe permitir activar/desactivar distribuidor
- Debe asociar distribuidor con agencias
- Debe mostrar estadísticas de despachos

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-027: Gestionar Destinatarios Directos

**Como** operador del sistema  
**Quiero** crear y gestionar destinatarios directos  
**Para** manejar envíos que no pasan por agencias

**Criterios de Aceptación:**
- Debe permitir crear destinatario directo con datos completos
- Debe capturar nombre, dirección, teléfono, ciudad, cantón
- Debe permitir editar y eliminar destinatarios
- Debe asociar con paquetes tipo DOMICILIO
- Debe permitir buscar destinatarios

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-028: Gestionar Puntos de Origen

**Como** administrador del sistema  
**Quiero** gestionar puntos de origen de los paquetes  
**Para** rastrear desde dónde provienen los paquetes

**Criterios de Aceptación:**
- Debe permitir crear punto de origen con nombre y descripción
- Debe permitir editar y eliminar puntos
- Debe asociar con paquetes
- Debe mostrar estadísticas de paquetes por punto de origen
- Debe permitir activar/desactivar puntos

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-029: Asociar Agencias con Distribuidores

**Como** administrador del sistema  
**Quiero** asociar agencias con distribuidores  
**Para** establecer relaciones de distribución

**Criterios de Aceptación:**
- Debe permitir asignar agencia a distribuidor
- Debe permitir remover asociación
- Debe mostrar agencias asociadas a un distribuidor
- Debe mostrar distribuidor de una agencia
- Debe validar que la relación sea única

**Prioridad:** Baja  
**Estimación:** 3 Story Points

---

## Módulo 5: Lotes de Recepción

### HU-030: Crear Lote de Recepción

**Como** operador del sistema  
**Quiero** crear un nuevo lote de recepción  
**Para** agrupar paquetes recibidos de una agencia

**Criterios de Aceptación:**
- Debe asociar lote con una agencia
- Debe capturar número de recepción, fecha, observaciones
- Debe generar número de recepción automáticamente si no se proporciona
- Debe registrar usuario que crea el lote
- Debe establecer estado inicial
- Debe permitir agregar paquetes inmediatamente

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-031: Agregar Paquetes a Lote

**Como** operador del sistema  
**Quiero** agregar paquetes a un lote de recepción  
**Para** agrupar paquetes recibidos juntos

**Criterios de Aceptación:**
- Debe permitir buscar paquetes por número de guía
- Debe permitir agregar múltiples paquetes
- Debe validar que los paquetes no estén ya en otro lote
- Debe actualizar estado de paquetes a RECIBIDO
- Debe mostrar lista de paquetes en el lote
- Debe calcular porcentaje de completado del lote

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-032: Ver Detalle de Lote con Paquetes

**Como** usuario del sistema  
**Quiero** ver el detalle de un lote con todos sus paquetes  
**Para** consultar información completa del lote

**Criterios de Aceptación:**
- Debe mostrar información del lote (agencia, fecha, estado)
- Debe mostrar lista de todos los paquetes del lote
- Debe mostrar estadísticas (total, completados, pendientes)
- Debe mostrar porcentaje de completado
- Debe permitir acceder al detalle de cada paquete
- Debe permitir exportar datos del lote

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-033: Exportar Lote a Excel (Formato Tracking)

**Como** operador del sistema  
**Quiero** exportar un lote a Excel en formato simplificado de tracking  
**Para** crear archivos para sistemas externos de seguimiento

**Criterios de Aceptación:**
- Debe generar archivo Excel con formato específico
- Debe incluir columnas: número de guía, estado, fecha recepción
- Debe incluir solo datos esenciales para tracking
- Debe permitir seleccionar grupos específicos del lote
- Debe generar archivo descargable

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

### HU-034: Exportar Lote a Excel (Formato Completo)

**Como** operador del sistema  
**Quiero** exportar un lote a Excel con información completa  
**Para** tener todos los datos del paquete y destinatario

**Criterios de Aceptación:**
- Debe generar archivo Excel con formato completo
- Debe incluir datos del paquete (guía, tipo, estado)
- Debe incluir datos del destinatario (nombre, dirección, teléfono, ciudad, cantón)
- Debe incluir datos del remitente
- Debe permitir seleccionar grupos específicos
- Debe generar archivo descargable

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

### HU-035: Marcar Lote como Completado

**Como** operador del sistema  
**Quiero** marcar un lote como completado  
**Para** indicar que todos los paquetes han sido procesados

**Criterios de Aceptación:**
- Debe validar que todos los paquetes estén en estado válido
- Debe cambiar estado del lote a COMPLETADO
- Debe registrar fecha y usuario de completado
- Debe permitir desmarcar si es necesario
- Debe mostrar lote como completado en listas

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-036: Filtrar Lotes por Agencia/Estado

**Como** usuario del sistema  
**Quiero** filtrar lotes por agencia y estado  
**Para** encontrar lotes específicos

**Criterios de Aceptación:**
- Debe permitir filtrar por agencia
- Debe permitir filtrar por estado
- Debe permitir combinar filtros
- Debe mostrar contador de resultados
- Debe mantener filtros en la URL

**Prioridad:** Baja  
**Estimación:** 3 Story Points

---

## Módulo 6: Sacas y Ensacado

### HU-037: Crear Saca

**Como** operador del sistema  
**Quiero** crear una nueva saca  
**Para** agrupar paquetes para despacho

**Criterios de Aceptación:**
- Debe capturar tamaño de saca (INDIVIDUAL, PEQUEÑO, MEDIANO, GRANDE)
- Debe generar número de orden automáticamente
- Debe asociar con un despacho
- Debe establecer estado inicial
- Debe permitir agregar paquetes inmediatamente

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-038: Asignar Paquetes a Saca

**Como** operador del sistema  
**Quiero** asignar paquetes a una saca  
**Para** organizar paquetes para el despacho

**Criterios de Aceptación:**
- Debe permitir buscar paquetes por número de guía
- Debe validar que el paquete pueda ser ensacado
- Debe actualizar estado del paquete
- Debe mostrar lista de paquetes en la saca
- Debe calcular capacidad utilizada de la saca
- Debe validar límites según tamaño de saca

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-039: Proceso de Ensacado con Escáner

**Como** operador del sistema  
**Quiero** ensacar paquetes usando un escáner de códigos de barras  
**Para** agilizar el proceso de ensacado

**Criterios de Aceptación:**
- Debe permitir escanear número de guía
- Debe buscar paquete automáticamente
- Debe mostrar información del paquete
- Debe validar que el paquete esté asignado a una saca
- Debe permitir confirmar ensacado
- Debe auto-enfocar el campo de escaneo después de confirmar

**Prioridad:** Alta  
**Estimación:** 13 Story Points

---

### HU-040: Verificar Paquete Antes de Ensacar

**Como** operador del sistema  
**Quiero** verificar información del paquete antes de ensacarlo  
**Para** asegurar que el paquete correcto se está ensacando

**Criterios de Aceptación:**
- Debe mostrar número de guía, destinatario, dirección
- Debe mostrar observaciones del paquete
- Debe mostrar a qué saca está asignado
- Debe mostrar advertencia si no está asignado a saca
- Debe mostrar dirección completa del destinatario

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-041: Confirmar Ensacado de Paquete

**Como** operador del sistema  
**Quiero** confirmar que un paquete ha sido ensacado  
**Para** actualizar su estado en el sistema

**Criterios de Aceptación:**
- Debe cambiar estado del paquete a ENSACADO
- Debe registrar fecha y usuario del ensacado
- Debe validar que el paquete esté asignado a una saca
- Debe actualizar estadísticas de la saca
- Debe limpiar campo de búsqueda después de confirmar
- Debe mostrar mensaje de éxito

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-042: Ver Sacas por Despacho

**Como** usuario del sistema  
**Quiero** ver todas las sacas asociadas a un despacho  
**Para** consultar la organización del despacho

**Criterios de Aceptación:**
- Debe mostrar lista de sacas del despacho
- Debe mostrar número de orden de cada saca
- Debe mostrar tamaño y cantidad de paquetes
- Debe mostrar estado de cada saca
- Debe permitir acceder al detalle de cada saca
- Debe mostrar total de sacas y paquetes

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-043: Imprimir Etiqueta de Saca

**Como** operador del sistema  
**Quiero** imprimir la etiqueta de una saca  
**Para** etiquetar físicamente la saca

**Criterios de Aceptación:**
- Debe generar PDF imprimible con datos de la saca
- Debe incluir número de orden, tamaño, cantidad de paquetes
- Debe incluir información del despacho
- Debe tener formato estándar de etiqueta
- Debe abrir en nueva ventana para impresión

**Prioridad:** Media  
**Estimación:** 5 Story Points

---

### HU-044: Mover Paquete Entre Sacas

**Como** operador del sistema  
**Quiero** mover un paquete de una saca a otra  
**Para** reorganizar paquetes si es necesario

**Criterios de Aceptación:**
- Debe permitir seleccionar paquete de una saca
- Debe permitir seleccionar saca destino
- Debe validar que ambas sacas pertenezcan al mismo despacho
- Debe actualizar estados y estadísticas
- Debe mantener historial del movimiento

**Prioridad:** Baja  
**Estimación:** 5 Story Points

---

## Módulo 7: Despachos

### HU-045: Crear Despacho (Paso a Paso)

**Como** operador del sistema  
**Quiero** crear un despacho siguiendo un proceso paso a paso  
**Para** organizar el envío de paquetes de manera estructurada

**Criterios de Aceptación:**
- Debe tener proceso de múltiples pasos
- Paso 1: Información básica (fecha, observaciones)
- Paso 2: Selección de tipo de envío
- Paso 3: Selección de destino (agencia/distribuidor/directo)
- Paso 4: Agregar sacas con paquetes
- Debe validar cada paso antes de continuar
- Debe permitir guardar como borrador

**Prioridad:** Alta  
**Estimación:** 13 Story Points

---

### HU-046: Seleccionar Tipo de Envío (Agencia/Distribuidor/Directo)

**Como** operador del sistema  
**Quiero** seleccionar el tipo de envío del despacho  
**Para** determinar el destino y proceso del despacho

**Criterios de Aceptación:**
- Debe permitir seleccionar: AGENCIA, DISTRIBUIDOR o DIRECTO
- Debe mostrar opciones según el tipo seleccionado
- Debe mostrar información del destino seleccionado
- Debe validar que el destino exista y esté activo
- Debe actualizar formulario según tipo seleccionado

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-047: Agregar Sacas al Despacho

**Como** operador del sistema  
**Quiero** agregar sacas con sus paquetes al despacho  
**Para** organizar los paquetes que se enviarán

**Criterios de Aceptación:**
- Debe permitir crear nuevas sacas desde el formulario
- Debe permitir agregar sacas existentes
- Debe mostrar lista de sacas agregadas
- Debe mostrar paquetes de cada saca
- Debe permitir mover paquetes entre sacas
- Debe calcular totales (sacas, paquetes)

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-048: Generar Manifiesto de Despacho (PDF)

**Como** operador del sistema  
**Quiero** generar un manifiesto en PDF del despacho  
**Para** documentar el envío

**Criterios de Aceptación:**
- Debe generar PDF imprimible con información del despacho
- Debe incluir información de agencia/distribuidor/destinatario
- Debe incluir lista de sacas con sus paquetes
- Debe incluir datos de cada paquete (guía, destinatario, dirección, teléfono)
- Debe incluir totales y resumen
- Debe tener formato profesional

**Prioridad:** Alta  
**Estimación:** 13 Story Points

---

### HU-049: Ver Despachos en Progreso

**Como** usuario del sistema  
**Quiero** ver lista de despachos en progreso  
**Para** monitorear despachos activos

**Criterios de Aceptación:**
- Debe mostrar despachos que no están completados
- Debe mostrar información relevante (fecha, destino, estado)
- Debe mostrar progreso de ensacado
- Debe permitir acceder al detalle
- Debe permitir completar despacho

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-050: Marcar Despacho como Completado

**Como** operador del sistema  
**Quiero** marcar un despacho como completado  
**Para** indicar que el envío ha sido finalizado

**Criterios de Aceptación:**
- Debe validar que todas las sacas estén ensacadas
- Debe cambiar estado del despacho
- Debe actualizar estados de paquetes a DESPACHADO
- Debe registrar fecha y usuario de completado
- Debe permitir generar manifiesto final

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-051: Filtrar Despachos por Fecha/Agencia/Estado

**Como** usuario del sistema  
**Quiero** filtrar despachos por diferentes criterios  
**Para** encontrar despachos específicos

**Criterios de Aceptación:**
- Debe permitir filtrar por rango de fechas
- Debe permitir filtrar por agencia
- Debe permitir filtrar por distribuidor
- Debe permitir filtrar por estado
- Debe permitir combinar múltiples filtros
- Debe mostrar contador de resultados

**Prioridad:** Baja  
**Estimación:** 5 Story Points

---

## Módulo 8: Atención de Paquetes

### HU-052: Crear Solicitud de Atención

**Como** usuario del sistema  
**Quiero** crear una solicitud de atención para un paquete  
**Para** reportar problemas o solicitar información

**Criterios de Aceptación:**
- Debe permitir buscar paquete por número de guía
- Debe capturar tipo de problema (FALTA_INFORMACION, DATOS_INCOMPLETOS, ERROR_ENVIO, OTRO)
- Debe capturar descripción del problema
- Debe establecer estado inicial como PENDIENTE
- Debe registrar usuario y fecha de creación
- Debe asociar con el paquete

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-053: Ver Lista de Atenciones Pendientes

**Como** supervisor del sistema  
**Quiero** ver lista de atenciones pendientes  
**Para** priorizar y resolver problemas

**Criterios de Aceptación:**
- Debe mostrar atenciones con estado PENDIENTE o EN_REVISION
- Debe mostrar información relevante (paquete, tipo problema, fecha)
- Debe mostrar estado de cada atención
- Debe permitir filtrar por tipo de problema
- Debe permitir acceder al detalle
- Debe mostrar contador de pendientes

**Prioridad:** Alta  
**Estimación:** 3 Story Points

---

### HU-054: Resolver Atención de Paquete

**Como** supervisor del sistema  
**Quiero** resolver una atención de paquete  
**Para** cerrar la solicitud y actualizar el estado

**Criterios de Aceptación:**
- Debe permitir cambiar estado a RESUELTO o CANCELADO
- Debe capturar observaciones de resolución
- Debe registrar fecha y usuario de resolución
- Debe actualizar estado del paquete si es necesario
- Debe mostrar historial de la atención

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-055: Agregar Observaciones de Solución

**Como** supervisor del sistema  
**Quiero** agregar observaciones de solución a una atención  
**Para** documentar cómo se resolvió el problema

**Criterios de Aceptación:**
- Debe permitir agregar observaciones sin cambiar estado
- Debe permitir editar observaciones
- Debe mostrar historial de observaciones
- Debe registrar usuario y fecha de cada observación
- Debe permitir resolver después de agregar observaciones

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-056: Filtrar Atenciones por Estado/Tipo Problema

**Como** usuario del sistema  
**Quiero** filtrar atenciones por estado y tipo de problema  
**Para** encontrar atenciones específicas

**Criterios de Aceptación:**
- Debe permitir filtrar por estado (PENDIENTE, EN_REVISION, RESUELTO, CANCELADO)
- Debe permitir filtrar por tipo de problema
- Debe permitir combinar filtros
- Debe mostrar contador de resultados
- Debe mantener filtros en la URL

**Prioridad:** Baja  
**Estimación:** 3 Story Points

---

### HU-057: Exportar Atenciones a Excel

**Como** supervisor del sistema  
**Quiero** exportar atenciones a Excel  
**Para** analizar y reportar problemas

**Criterios de Aceptación:**
- Debe generar archivo Excel con todas las atenciones
- Debe incluir información del paquete
- Debe incluir tipo de problema, estado, fechas
- Debe incluir observaciones y solución
- Debe respetar filtros aplicados
- Debe generar archivo descargable

**Prioridad:** Baja  
**Estimación:** 5 Story Points

---

### HU-058: Imprimir Atención de Paquetes (PDF)

**Como** supervisor del sistema  
**Quiero** imprimir información de atenciones en PDF  
**Para** documentar y archivar

**Criterios de Aceptación:**
- Debe generar PDF imprimible con información de atenciones
- Debe incluir datos del paquete
- Debe incluir tipo de problema y descripción
- Debe incluir observaciones y solución
- Debe incluir fechas y usuarios
- Debe tener formato profesional

**Prioridad:** Baja  
**Estimación:** 8 Story Points

---

## Módulo 9: Manifiestos Consolidados

### HU-059: Generar Manifiesto Consolidado

**Como** operador del sistema  
**Quiero** generar un manifiesto consolidado  
**Para** consolidar información de múltiples despachos

**Criterios de Aceptación:**
- Debe permitir seleccionar despachos a consolidar
- Debe permitir seleccionar rango de fechas
- Debe generar información consolidada
- Debe incluir resumen de sacas y paquetes
- Debe permitir exportar a Excel
- Debe permitir imprimir en PDF

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

### HU-060: Exportar Manifiesto a Excel

**Como** operador del sistema  
**Quiero** exportar manifiesto consolidado a Excel  
**Para** análisis y reportes

**Criterios de Aceptación:**
- Debe generar archivo Excel con datos consolidados
- Debe incluir información de despachos
- Debe incluir resumen de sacas y paquetes
- Debe incluir totales y subtotales
- Debe tener formato estructurado
- Debe generar archivo descargable

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

### HU-061: Imprimir Manifiesto Consolidado (PDF)

**Como** operador del sistema  
**Quiero** imprimir manifiesto consolidado en PDF  
**Para** documentación oficial

**Criterios de Aceptación:**
- Debe generar PDF imprimible con información consolidada
- Debe incluir información de todos los despachos
- Debe incluir resumen de sacas por tamaño
- Debe incluir totales y estadísticas
- Debe tener formato profesional
- Debe incluir fecha de generación

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

### HU-062: Generar Manifiesto de Pago (PDF)

**Como** operador del sistema  
**Quiero** generar un manifiesto de pago en PDF  
**Para** documentar información de facturación

**Criterios de Aceptación:**
- Debe generar PDF con formato de manifiesto de pago
- Debe incluir información de despachos
- Debe incluir información de agencias/distribuidores
- Debe incluir totales y cálculos
- Debe tener formato específico para facturación
- Debe ser imprimible

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

## Módulo 10: Dashboard y Analytics

### HU-063: Ver Dashboard con Estadísticas Generales

**Como** usuario del sistema  
**Quiero** ver un dashboard con estadísticas generales  
**Para** tener una visión general del sistema

**Criterios de Aceptación:**
- Debe mostrar total de paquetes
- Debe mostrar atenciones pendientes
- Debe mostrar despachos recientes
- Debe mostrar lotes de recepción recientes
- Debe actualizar en tiempo real
- Debe ser responsive

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-064: Ver Estadísticas de Paquetes por Estado

**Como** usuario del sistema  
**Quiero** ver estadísticas de paquetes agrupados por estado  
**Para** monitorear el flujo de trabajo

**Criterios de Aceptación:**
- Debe mostrar cantidad de paquetes por estado
- Debe mostrar porcentajes del total
- Debe usar iconos y colores distintivos
- Debe permitir hacer clic para filtrar
- Debe actualizar automáticamente

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-065: Ver Atenciones Pendientes en Dashboard

**Como** supervisor del sistema  
**Quiero** ver atenciones pendientes en el dashboard  
**Para** priorizar trabajo

**Criterios de Aceptación:**
- Debe mostrar lista de últimas 5 atenciones pendientes
- Debe mostrar información relevante (paquete, tipo, estado)
- Debe permitir acceder al detalle
- Debe mostrar contador total
- Debe permitir ver todas las atenciones

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-066: Ver Despachos Recientes en Dashboard

**Como** usuario del sistema  
**Quiero** ver despachos recientes en el dashboard  
**Para** monitorear actividad reciente

**Criterios de Aceptación:**
- Debe mostrar lista de últimos 5 despachos
- Debe mostrar información relevante (fecha, destino, estado)
- Debe permitir acceder al detalle
- Debe mostrar contador total
- Debe permitir ver todos los despachos

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

### HU-067: Ver Lotes de Recepción Recientes en Dashboard

**Como** usuario del sistema  
**Quiero** ver lotes de recepción recientes en el dashboard  
**Para** monitorear recepciones

**Criterios de Aceptación:**
- Debe mostrar lista de últimos 5 lotes
- Debe mostrar información relevante (fecha, agencia, porcentaje)
- Debe permitir acceder al detalle
- Debe mostrar contador total
- Debe permitir ver todos los lotes

**Prioridad:** Media  
**Estimación:** 3 Story Points

---

## Módulo 11: Reportes y Exportaciones

### HU-068: Exportar Datos a Excel (Múltiples Formatos)

**Como** usuario del sistema  
**Quiero** exportar datos a Excel en diferentes formatos  
**Para** análisis y reportes externos

**Criterios de Aceptación:**
- Debe permitir exportar desde diferentes módulos
- Debe ofrecer formatos simplificados y completos
- Debe respetar filtros aplicados
- Debe generar archivos descargables
- Debe incluir datos relevantes según el módulo
- Debe validar permisos de exportación

**Prioridad:** Media  
**Estimación:** 8 Story Points

---

### HU-069: Generar PDFs Imprimibles

**Como** usuario del sistema  
**Quiero** generar PDFs imprimibles de diferentes documentos  
**Para** documentación y archivo

**Criterios de Aceptación:**
- Debe generar PDFs de manifiestos
- Debe generar PDFs de atenciones
- Debe generar PDFs de etiquetas
- Debe tener formato profesional
- Debe ser imprimible en tamaño estándar
- Debe incluir información completa

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

### HU-070: Imprimir Etiquetas

**Como** operador del sistema  
**Quiero** imprimir etiquetas de paquetes y sacas  
**Para** etiquetar físicamente los elementos

**Criterios de Aceptación:**
- Debe generar etiquetas de paquetes
- Debe generar etiquetas de sacas
- Debe tener formato estándar de etiqueta
- Debe incluir información relevante
- Debe permitir imprimir múltiples etiquetas
- Debe abrir en nueva ventana para impresión

**Prioridad:** Alta  
**Estimación:** 5 Story Points

---

### HU-071: Generar Manifiestos

**Como** operador del sistema  
**Quiero** generar diferentes tipos de manifiestos  
**Para** documentar envíos

**Criterios de Aceptación:**
- Debe generar manifiesto de despacho
- Debe generar manifiesto consolidado
- Debe generar manifiesto de pago
- Debe incluir información completa
- Debe tener formato profesional
- Debe ser imprimible

**Prioridad:** Alta  
**Estimación:** 8 Story Points

---

## Resumen de Historias de Usuario

- **Total de Historias:** 71
- **Prioridad Alta:** 35 historias
- **Prioridad Media:** 25 historias
- **Prioridad Baja:** 11 historias
- **Total Story Points Estimados:** ~485 puntos

### Distribución por Módulo

1. Autenticación y Autorización: 6 historias (34 SP)
2. Gestión de Paquetes: 11 historias (73 SP)
3. Gestión de Clientes: 7 historias (37 SP)
4. Gestión de Agencias y Distribuidores: 5 historias (21 SP)
5. Lotes de Recepción: 7 historias (40 SP)
6. Sacas y Ensacado: 8 historias (49 SP)
7. Despachos: 7 historias (50 SP)
8. Atención de Paquetes: 7 historias (32 SP)
9. Manifiestos Consolidados: 4 historias (32 SP)
10. Dashboard y Analytics: 5 historias (22 SP)
11. Reportes y Exportaciones: 4 historias (29 SP)
