# Candas — Base UI/UX (contrato visual canónico)

Fuente de verdad consolidada para la línea visual y los componentes reutilizables del frontend. Resume y enlaza; el detalle profundo vive en los docs frontend citados. [verificado en Git]

- Tokens (fuente de verdad ejecutable): [`candas-frontend/src/index.css`](../../candas-frontend/src/index.css). [verificado en Git]
- Guía de tokens/colores/iconos: [`candas-frontend/docs/DESIGN_TOKENS.md`](../../candas-frontend/docs/DESIGN_TOKENS.md). [verificado en Git]
- Guía de patrones de pantalla: [`candas-frontend/docs/DESIGN_SYSTEM.md`](../../candas-frontend/docs/DESIGN_SYSTEM.md). [verificado en Git]
- No-regresión / smoke manual: [`candas-frontend/docs/FRONTEND_REFACTOR_BASELINE.md`](../../candas-frontend/docs/FRONTEND_REFACTOR_BASELINE.md). [verificado en Git]
- Visión UX/producto: [`docs/UX-UI-DESIGN.md`](../UX-UI-DESIGN.md). [verificado en Git]

## Stack y conexión global

- React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4 (config CSS-based vía `@theme inline`, sin `tailwind.config.*`). Primitivas Radix UI + `class-variance-authority` + `tailwind-merge` (`cn` en `src/lib/utils`). [verificado en Git]
- La base se conecta globalmente en [`src/main.tsx`](../../candas-frontend/src/main.tsx): `import './index.css'`, `QueryClientProvider`, `TooltipProvider`, `RouterProvider`. [verificado en Git]
- Tema/dark mode: variante `@custom-variant dark` + clase `.dark`; persistencia Zustand `candas-ui-storage` + [`src/lib/theme.ts`](../../candas-frontend/src/lib/theme.ts); anti-FOUC en [`index.html`](../../candas-frontend/index.html); toggle en sidebar y header. [verificado en Git]

## Tokens (resumen)

`src/index.css` define en `:root`/`.dark`: colores semánticos (`--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--muted`, `--border`, `--input`, `--ring`), estados (`--error`/`--success`/`--info`/`--warning`, cada uno con `-foreground`/`-surface`/`-border`/`-content`), `--sidebar-*`, escala de radios (`--radius-*`), motion (`--motion-duration-*`, `--motion-ease-*`), elevación (`--shadow-xs..xl`) y fuente Inter. Utilidades: `elevate`/`elevate-hover`, `brand-gradient`, `surface-panel`, `animate-fade-up`/`animate-scale-in`/`stagger-children`, `skeleton-shimmer`, `no-scrollbar`. Todo respeta `prefers-reduced-motion`. [verificado en Git]

## Inventario de componentes reutilizables

Primitivas `src/components/ui/` (27): `button`, `input`, `textarea`, `label`, `select`, `combobox`, `command`, `checkbox`, `card`, `dialog`, `dropdown-menu`, `tabs`, `accordion`, `table`, `badge`, `alert`, `tooltip`, `scroll-area`, `separator`, `skeleton`, `date-time-picker`, `segmented-toggle`, `copy-action-button`, `form-error`, `help-tip`, `section-title`, `semantic-notice`. [verificado en Git]

Estados compartidos `src/components/states/` (con barrel `index.ts`): `EmptyState`, `ErrorState`, `LoadingState`, `TableSkeleton`, `DetailSkeleton`, `FormSkeleton`. [verificado en Git]

Layout `src/app/layout/`: `MainLayout`, `Sidebar`, `Header`, `PageContainer`, `PageHeader`, `ListPageLayout`, `FormPageLayout`. Detalle: `src/components/detail/` (`DetailPageLayout`, `InfoCard`, `InfoField`). Listas: `src/components/list/` (`ListPagination`). Diálogos: `src/components/dialogs/` (`ConfirmDeleteDialog`). Iconos: `src/components/icons/` (`AppIcon`, `module-icons`, `ModulePageIcon`) + `src/config/navigation.ts`. [verificado en Git]

Feedback: `import { notify } from '@/lib/notify'`; impresión `import { printNotify } from '@/lib/print-notify'` (nunca `alert()`). [verificado en Git]

PWA: acción de instalación discreta `src/components/pwa/InstallPrompt.tsx` (botón ghost en la fila de iconos del `Header` + diálogo de instrucciones en iOS), construida sobre `Button` y `Dialog` y el hook `usePwaInstallPrompt`. Solo se muestra cuando la app es instalable y no está ya en modo standalone; no introduce tokens nuevos. [verificado en Git]

## Reglas de uso (contrato)

1. **Colores solo por token**: usar clases del tema (`bg-primary`, `text-muted-foreground`, `bg-info/10`, `border-success/50`). No usar paletas crudas de Tailwind (`bg-amber-50`, `text-red-600`, `bg-emerald-500`, etc.). Si falta un color, añadir token en `index.css` y documentarlo en `DESIGN_TOKENS.md`. [verificado en Git]
2. **Avisos/callouts**: `SemanticNotice` o `Alert` con variantes `warning|success|info` (fondo `bg-<estado>/15`, texto `text-<estado>-foreground`). [verificado en Git]
3. **Botones**: usar `<Button>` (variantes `default|outline|ghost|destructive`), no `<button>` nativo. [verificado en Git]
4. **Layouts**: listas con `ListPageLayout`, detalle con `DetailPageLayout`, formularios con `PageContainer`+`PageHeader` y `Card`. Sin cabeceras custom. [verificado en Git]
5. **Estados loading/error/empty**: usar los componentes de `components/states/` (no spinners/empties ad-hoc). [verificado en Git]
6. **Etiquetas/errores de formulario**: `Label` + control + `FormError` dentro de `space-y-2`. [verificado en Git]
7. **Diálogos**: `Dialog` > `DialogHeader` (`DialogTitle` [+ `DialogDescription`]) > contenido > `DialogFooter`; eliminación con `ConfirmDeleteDialog`. [verificado en Git]
8. **Accesibilidad/responsive/dark**: validar contraste (WCAG AA donde aplique) en claro y oscuro; respetar `prefers-reduced-motion`; el layout es responsive (sidebar colapsable). [verificado en Git]

## Estado de conexión global (MVP 1/3)

La base existe, es sólida y está conectada globalmente: la app compila y todas las pantallas heredan tokens, tema y dark mode desde `index.css`/`main.tsx`. Esta iteración consolidó la documentación canónica y un ajuste mínimo en chrome transversal (`Header`: item "Cerrar Sesión" migrado de paleta cruda `red-*` a token `destructive`). [verificado en Git]

## Estado MVP 2/3 — componentes compartidos

La capa transversal compartida (`ui/`, `states/`, `data-table/`, `detail/`, `dialogs/`, `filters/`, `form/`, `list/`, `layout/`, `app/layout/`) **ya adopta la base**: sin paleta cruda, estilos por token, foco visible (`focus-visible:ring-ring`), `aria-label` en controles, y estados loading/empty parametrizados (`DataTable` usa `Skeleton` + `emptyMessage`; `MainLayout` usa `LoadingState`; `ErrorState` disponible para listas). Los `<button>` nativos restantes en esta capa son estructurales y correctos (header de tabla ordenable, chip de filtro removible, "×" de limpiar búsqueda, ítems de navegación del sidebar/header), no acciones genéricas. [verificado en Git]

Componentes compartidos migrados a token en MVP 2: `despachos/CrearDespachoMasivoDialog.tsx` (`emerald-*` → `success`), `lotes-recepcion/PaqueteCompactListItem.tsx` (`amber-*` → `warning`). [verificado en Git]

Excepciones intencionales (no migrar sin token nuevo): `manifiestos-consolidados/SeleccionarTipoImpresionDialog.tsx` (colores de tipo agencia=azul / directo=violeta, consistentes con la impresión; violeta no tiene token); `listas-etiquetadas/CrearListaCard.tsx` (ítem "ATENCIÓN" en `orange-500` para distinguirlo de "PREGUNTAR" que ya usa `text-warning`; sin token dedicado). [verificado en Git]

## Estado MVP 3/3 — barrido final por pantallas

Todas las rutas principales (`src/pages/*`: agencias, atención-paquetes, auth, clientes, despachos, distribuidores, ensacado, lotes-recepción, lotes-especiales, manifiestos-consolidados, paquetes, parámetros-sistema, puntos-origen, roles, sacas, usuarios) fueron **revisadas** contra la base. Heredan layout, tokens y dark mode desde la base global y los componentes compartidos. [verificado en Git]

Correcciones puntuales aplicadas en MVP 3 (uso de componentes/tokens compartidos): badge de estado activo/inactivo → `Badge variant="success|error"` en `usuarios/UsuarioDetail.tsx` y `roles/RolDetail.tsx`; ítem de menú destructivo → token `destructive` en `paquetes/PaquetesList.tsx`. [verificado en Git]

### Riesgos residuales (revisados y justificados)

Colores de paleta cruda que **permanecen de forma intencional** por carecer de token equivalente; ya manejan dark mode con pares `dark:` explícitos. Candidatos a tokenizar en una iteración futura si se decide ampliar la paleta semántica: [inferido]

- **Mapas categóricos multi-color** (sin token para N categorías): `usuarios/UsuarioDetail.tsx` (`AGENCY_TONE_CLASSES`: sky/emerald/violet/amber/rose por agencia; colores por categoría de permiso), `usuarios/AsignarRolesDialog.tsx`, `roles/*` (acentos por categoría). [verificado en Git]
- **Métricas de dashboard coordinadas**: `manifiestos-consolidados/ManifiestosConsolidadosList.tsx` (azul/ámbar/esmeralda por métrica). Mapearían a info/warning/success pero su coordinación visual exige migración conjunta. [verificado en Git]
- **Distinción de tipo** agencia=azul / directo=violeta (consistente con impresión; violeta sin token): `manifiestos-consolidados/SeleccionarTipoImpresionDialog.tsx`. [verificado en Git]
- **Callouts de éxito/info one-off**: `atencion-paquetes/AtencionPaqueteDetail.tsx` (callout esmeralda "resuelto"); preview de WhatsApp en `parametros-sistema/MensajeWhatsAppDespachoSection.tsx` (colores de marca WhatsApp, intencionales). [verificado en Git]
- **Formularios/diálogos con acentos puntuales**: `agencias/AgenciaForm`, `auth/MiPerfil`, `despachos/DespachoForm`, `lotes-*`, `manifiestos-consolidados/{Exportar,Generar}ExcelDialog`, `paquetes/{AsociarCadenita,AsociarSeparar}Dialog`, `roles/RolForm`. [verificado en Git]

**`<button>` nativos en pantallas** (`despachos/DespachoForm`, `ensacado/EnsacadoPage`, `lotes-recepcion/{LoteEspecialOperador,LoteRecepcionDetail}`, `manifiestos-consolidados/GenerarManifiestoConsolidadoDialog`, `paquetes/PaqueteForm`, `usuarios/UsuarioForm`): revisados; son elementos estructurales (tiles/cards seleccionables, toggles, celdas interactivas), no acciones genéricas. No se fuerzan a `<Button>` para no alterar comportamiento/layout. [verificado en Git]

### Revisión responsive / dark mode / accesibilidad

- **Dark mode**: cubierto globalmente por tokens `.dark` en `index.css`; el residuo de paleta cruda usa pares `dark:` explícitos, por lo que también responde al tema. [verificado en Git]
- **Responsive**: layouts compartidos (`PageContainer`, `ListPageLayout`, `DetailPageLayout`) y `DataTable` (columnas `hideOn`) manejan breakpoints; sidebar colapsable. [verificado en Git]
- **Accesibilidad básica**: foco visible vía `focus-visible:ring-ring` en primitivas; `aria-label` en botones de icono compartidos; `Label`+`FormError` en formularios. Pendiente de validación manual exhaustiva por teclado en flujos densos (operadores de lote/ensacado). [pendiente de confirmar]
