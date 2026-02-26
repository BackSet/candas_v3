# Plan de Implementación: Flujos de Recepción y Despacho Flexible

## Objetivo
Implementar una interfaz flexible en `LoteRecepcionOperador` que soporte dos flujos operativos principales:
1.  **Flujo Unificado**: Un operario escanea, clasifica y despacha.
2.  **Flujo Dividido**:
    *   **Operario 1 (Recepción)**: Escanea para despacho directo O clasifica como "Domicilio/Pendiente".
    *   **Operario 2 (Despacho)**: Gestiona la lista de pendientes para crear despachos masivos.

## 1. Refactorización de la Vista de Escaneo (Operario 1)
Transformar la columna izquierda en un **Panel de Modos de Escaneo**.

### Modos
*   **DESPACHO DIRECTO**:
    *   Requiere configurar Destino y Transportista.
    *   Gestiona Sacas Activas.
    *   Acción: Escaneo -> Paquete asignado a Saca/Despacho inmediatamente.
*   **CLASIFICACIÓN (Domicilio / Clementina / Separar)**:
    *   Sin configuración previa.
    *   Acción: Escaneo -> Paquete marcado con etiqueta (ej. "Domicilio") y estado "RECIBIDO".
    *   Queda pendiente en la lista para gestión posterior.

### UI
*   Selector de 4 botones grandes para cambiar de modo rápidamente.
*   Visualización clara del modo activo (colores diferenciados).
*   Feedback inmediato del último escaneo según el modo.

## 2. Gestión de Lista Pendiente (Operario 2)
Mejorar la pestaña "Lista" para permitir la creación de despachos sobre paquetes ya clasificados.

### Funcionalidad
*   **Filtrado Inteligente**: Ver solo paquetes "Domicilio" o "Sin Despacho".
*   **Selección Múltiple**: Checkboxes para seleccionar paquetes pendientes.
*   **Acción Masiva**: Botón "Crear Despacho con Seleccionados".
    *   Abre modal/panel para configurar Destino/Transportista.
    *   Asigna automáticamente los paquetes seleccionados a una nueva Saca/Despacho.

## Paso a Paso Técnico

1.  **Refactor State**: Unificar estados de clasificación en `scanMode`.
2.  **Update Scanner UI**: Implementar el selector de modos y la lógica de `processPackage` condicional.
3.  **Update List UI**: Añadir selección de filas y botón de acción flotante en la pestaña Lista.
4.  **Mock Logic**: Simular la persistencia de estos cambios en el estado local (`currentDespacho` vs `pendingPackages`).

## Archivos Afectados
*   `src/pages/lotes-recepcion/LoteRecepcionOperador.tsx`
