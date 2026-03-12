# Baseline de refactor frontend

## Objetivo

Establecer reglas de no regresion para ejecutar el refactor por fases sin romper flujos operativos.

## Flujos criticos (smoke tests manuales)

### Despachos

- Abrir `despachos` y validar carga de tabla, filtros y paginacion.
- Crear un despacho nuevo y verificar guardado.
- Abrir dialogo de mensaje WhatsApp, copiar texto y telefono.
- Imprimir etiqueta/documento desde acciones.

### Lotes recepcion

- Abrir `lotes-recepcion` y entrar al operador.
- Escanear/tipiar paquetes y validar orden de ensacado esperado.
- Crear despacho masivo desde lote.
- Copiar listas de guias por grupos.

### Parametros sistema

- Abrir indice `parametros-sistema` y navegar a `whatsapp-despacho`.
- Cargar plantilla actual, editar contenido y guardar.
- Confirmar preview en modo claro/oscuro.

### Paquetes

- Abrir listado, aplicar filtros y buscar.
- Seleccionar multiples y ejecutar accion de impresion.
- Abrir detalle y regresar al listado conservando contexto de filtros.

## Criterios de aceptacion por fase

- Sin errores de TypeScript ni linter en archivos modificados.
- Sin cambios de comportamiento en endpoints o payloads.
- Todos los botones de copiado muestran feedback real de exito/error.
- Patrones de UI consistentes en botones, dialogos, headers y tablas.

## Convenciones visuales congeladas

- **Titulos y subtitulos:** jerarquia estable (titulo claro + subtitulo legible).
- **Tablas operativas:** contenido principal en `text-sm`; metadata secundaria en `text-xs`.
- **Dialogos:** usar presets de estilo reutilizables (compact/form) evitando clases ad hoc.
- **Botones:** priorizar componente `Button` sobre `button` nativo para consistencia.
- **Espaciado:** mantener ritmo vertical uniforme en toolbars, cards y footers.
