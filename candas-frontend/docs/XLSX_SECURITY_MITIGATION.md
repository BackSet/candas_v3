# Mitigación temporal de seguridad para `xlsx`

## Contexto

La dependencia `xlsx` (SheetJS Community) actualmente reporta vulnerabilidades conocidas en `npm audit` y no tiene una versión corregida disponible en npm para este proyecto.

- Paquete en uso: `xlsx@0.18.5`
- Estado de fix oficial en npm: no disponible
- Riesgo principal: procesamiento de archivos Excel maliciosos

## Mitigaciones temporales obligatorias

Mientras se mantiene `xlsx` en el frontend, aplicar estas reglas operativas:

1. Aceptar solo archivos de fuentes confiables.
2. Limitar tamaño de archivo y cantidad de filas/columnas procesadas.
3. Validar extensión y tipo MIME antes de parsear.
4. Rechazar archivos con estructura anómala o que excedan umbrales operativos.
5. Evitar procesar contenido no esperado (hojas ocultas, rangos excesivos, objetos no utilizados).
6. Registrar eventos de rechazo para trazabilidad operativa.

## Política de uso recomendada

- Usar `xlsx` solo para importaciones controladas por usuarios internos autenticados.
- No habilitar procesamiento masivo de archivos externos sin revisión previa.
- Priorizar flujos de importación por plantilla validada.

## Plan de migración propuesto

1. Evaluar reemplazo de `xlsx` por una alternativa sin CVEs abiertos en npm.
2. Preparar un adapter de importación (`excelParserAdapter`) para desacoplar la librería del resto del código.
3. Migrar gradualmente los casos de uso actuales al adapter.
4. Eliminar `xlsx` del `package.json` al finalizar la migración.

## Criterio de salida

Se considera mitigación completa cuando:

- `npm audit` deja de reportar vulnerabilidades de `xlsx`, o
- `xlsx` se reemplaza completamente por una librería alternativa segura.
