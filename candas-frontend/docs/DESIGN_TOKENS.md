# Design tokens — Candas Frontend

Dirección visual: **Notion refinado** (neutros cálidos, Inter) + **acento azul discreto** para acciones, foco y navegación activa.

Fuente de verdad: [`src/index.css`](../src/index.css) (`:root` / `.dark`) y `@theme inline` (Tailwind v4).

## Tokens semánticos principales

| Token CSS | Uso |
|-----------|-----|
| `--background` / `--foreground` | Fondo y texto de la app |
| `--card` | Paneles elevados (distinto del fondo en oscuro) |
| `--primary` | CTA, enlaces fuertes, borde activo sidebar |
| `--accent` | Hover suave, chips secundarios |
| `--muted` | Fondos secundarios, texto atenuado |
| `--border` | Separadores |
| `--success`, `--warning`, `--error`, `--info` | Estados y badges semánticos |
| `--sidebar-*` | Barra lateral exclusiva |

## Iconografía

Fuente: [Lucide](https://lucide.dev/) vía `lucide-react`.

| Recurso | Uso |
|---------|-----|
| [`module-icons.tsx`](../src/components/icons/module-icons.tsx) | Icono semántico por módulo (`ModuleId`) |
| [`AppIcon`](../src/components/icons/AppIcon.tsx) | Trazo y tamaño nítidos (`absoluteStrokeWidth`, tamaños 14–40 px) |
| [`ModulePageIcon`](../src/components/icons/ModulePageIcon.tsx) | Cabecera de página, empty state, tiles de hub |
| [`navigation.ts`](../src/config/navigation.ts) | Sidebar y Command Palette comparten `moduleId` |

**Mapeo de módulos (resumen):** Paquetes → `Package`; Clientes → `UserRound`; Destinatarios → `MapPinned`; Agencias → `Store`; Distribuidores → `Warehouse`; Lotes recepción → `Inbox`; Despachos → `Truck`; Ensacado → `ScanBarcode`; Atención → `Headset`; Manifiestos → `FileStack`; etc.

Evitar tamaños fraccionarios (`h-3.5`) en iconos de navegación; usar `AppIcon` con `size="sm"` u otro token.

## Reglas de uso

### Colores

- **Sí:** `bg-primary`, `text-muted-foreground`, `bg-info/10`, `border-success/50`, clases del tema.
- **No:** paletas sueltas en avisos (`bg-amber-50`, `text-amber-900`, `text-yellow-600`). En claro suelen quedar ilegibles si Tailwind no expone la paleta completa.
- **Avisos / callouts:** usar [`SemanticNotice`](../src/components/ui/semantic-notice.tsx) o `Alert` con variantes `warning` | `success` | `info`. Fondo `bg-warning/15`, texto `text-warning-foreground` (nunca `text-warning` como color de párrafo).

### Botones

- Acción principal: `<Button>` variante `default` → `bg-primary`.
- Secundario / cancelar: `outline` o `ghost`.
- Destructivo: `destructive` (eliminar confirmado).

### Badges

Variantes en [`badge.tsx`](../src/components/ui/badge.tsx):

- `default`, `secondary`, `outline`, `destructive`
- `success`, `warning`, `info`, `error` (tokens semánticos)

### Layout

- Listas / detalle / formularios con `ListPageLayout`, `DetailPageLayout`, `FormPageLayout`: **sin padding extra** en `<main>` (`MainLayout` usa `p-0`).
- Hub (`/dashboard`, `/parametros-sistema`, `/mi-perfil`): padding en `<main>`.

### Feedback

- Notificaciones: `import { notify } from '@/lib/notify'`.
- Impresión: `import { printNotify } from '@/lib/print-notify'` (nunca `alert()`).
- Errores de lista: `<ErrorState onRetry={() => refetch()} />`.

### Diálogos

- Confirmar eliminación: [`ConfirmDeleteDialog`](../src/components/dialogs/ConfirmDeleteDialog.tsx).

### Tema

- Persistencia: Zustand `candas-ui-storage` + [`lib/theme.ts`](../src/lib/theme.ts).
- Anti-FOUC: script en [`index.html`](../index.html).
- Toggle: sidebar y header (sol / luna / monitor).

## Criterios de contraste

Revisar badges y texto sobre `primary` en claro y oscuro antes de merge (WCAG AA donde aplique).

## PRs nuevos

Evitar colores Tailwind de paleta fuera de tokens. Si hace falta un color nuevo, añadir token en `index.css` y documentarlo aquí.
