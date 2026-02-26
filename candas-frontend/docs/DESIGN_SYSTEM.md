# Línea gráfica – Candas Frontend

Referencia para mantener una apariencia y estructura coherente en toda la aplicación. Los tokens de color y utilidades base están en `src/index.css` (paleta tipo Notion, light/dark).

---

## 1. Layout de página

### Páginas de lista
- Siempre usar **PageContainer** + **PageHeader**.
- `PageContainer`: elegir `width` según necesidad (`full`, `xl`, `lg`, etc.) y `spacing` (`4`, `6`, `8`).
- `PageHeader`: `icon`, `title`, `subtitle` opcional, `actions` opcional (botones, filtros).

### Páginas de detalle
- Siempre usar **DetailPageLayout** (incluye DetailHeader).
- Pasar `title`, `subtitle`, `backUrl`, `status` opcional, `actions` opcional.
- Contenido dentro con `maxWidth` y `space-y-8` entre bloques.

### Páginas de formulario
- Siempre usar **PageContainer** + **PageHeader** (icono, título, subtítulo, acciones si aplica; ej. botón "Volver" en actions).
- Formulario dentro de **Card**(s): CardHeader (CardTitle + CardDescription) + CardContent.
- No usar cabeceras custom (sticky + h1 + back); reutilizar el mismo patrón que en listas.

---

## 2. Títulos de sección

- Usar el componente **SectionTitle**.
- **Variante form:** títulos de bloques dentro de formularios (ej. "Información del Despacho"). Estilo: `text-lg font-medium border-b pb-2`.
- **Variante detail:** títulos de bloques en páginas de detalle. Estilo: `text-sm font-medium text-muted-foreground uppercase tracking-wider` con `mb-4`, icono opcional.

---

## 3. Etiquetas de formulario

- Usar siempre el componente **Label** de `components/ui/label.tsx`.
- **Variante por defecto:** `text-sm font-medium` (foreground).
- **Variante muted:** para labels secundarios o en vistas de solo lectura: `variant="muted"` → `text-muted-foreground`.
- Campo obligatorio: incluir `<span className="text-error">*</span>` dentro del Label.
- Contenedor del campo: `<div className="space-y-2">` con Label + control + mensaje de error.

---

## 4. Espaciado

- **Entre secciones** (dentro de una página o card): `space-y-6` o `space-y-8` (elegir uno y mantenerlo en ese contexto).
- **Entre label y control:** `space-y-2`.
- **Grid de campos** (2 columnas, etc.): `gap-6`.

---

## 5. Mensajes de error

- Una sola convención: `<p className="text-xs text-error">` con el mensaje, o el componente **FormError** de `components/ui/form-error.tsx`.
- Uso: `<FormError message={errors.campo?.message} />`. Opcional: `showIcon` para mostrar ⚠ antes del texto.
- Contenedor del campo: `space-y-2` con Label + control + FormError.

---

## 6. DropdownMenuLabel

- Encabezados de menú (ej. "Acciones"): clase estándar `text-xs font-normal text-muted-foreground uppercase tracking-wider`.
- Usar la misma clase en todos los DropdownMenuLabel del proyecto (o variante del componente si se añade).

---

## 7. Detalles (InfoCard / InfoField / Property)

- Preferir **InfoCard** e **InfoField** de `components/detail` para bloques de datos en páginas de detalle.
- Para filas "label + valor" reutilizar **InfoField** o un **Property** compartido en `components/detail` con la misma API en todas las páginas de detalle.

---

## 8. Paginación en listas

- Usar el componente **ListPagination** de `components/list/ListPagination.tsx` en todas las listas paginadas.
- **Props estándar:** `page`, `totalPages`, `onPageChange`, `totalItems?`, `size?` (tamaño de página para el rango), `showRange?` (default `true`), `variant?` (`'compact'` | `'full'`, default `'full'`).
- **Estilo del bloque:** contenedor con `border-t border-border/40 pt-4`; texto a la izquierda `text-xs text-muted-foreground`; cuando `showRange` es true, formato "Mostrando **X**–**Y** de **Z**"; indicador central "N / totalPages"; botones con `variant="outline"` y `size="icon"` `h-8 w-8` para iconos.
- **Variante full:** botones primera página, anterior, indicador "N / totalPages", siguiente, última página (iconos ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight).
- **Variante compact:** solo Anterior y Siguiente (iconos o texto según implementación).
- Listas sin paginación backend que muestran "Total: N": usar el mismo contenedor visual (mismo `border-t`, `pt-4`, `text-xs text-muted-foreground`) para la barra inferior.

---

## 9. Diálogos

- Estructura: **Dialog** > **DialogHeader** (DialogTitle + opcional DialogDescription) > contenido > **DialogFooter** (acciones).
- Mantener la misma jerarquía de DialogTitle en todos los diálogos.
- **Diálogos "individual vs lista/masivo":** (ej. agregar paquetes a saca) usar **Tabs** con etiquetas "Individual / Escáner" y "Lista / Masivo". Misma estructura: Header + Tabs + contenido + Footer con "Cancelar" + acción principal ("Listo", "Crear N Paquete(s)", etc.). Mismo tamaño y estilo de DialogContent (`max-w-2xl max-h-[85vh]` o acordado) en todos.
