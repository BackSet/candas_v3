-- El presinto de seguridad se coloca físicamente al ensacar cada saca, por lo que
-- pasa a pertenecer a la saca en lugar del despacho.
-- IF NOT EXISTS evita fallo si la columna ya existe (migración parcial o BD ya actualizada).
ALTER TABLE saca ADD COLUMN IF NOT EXISTS codigo_presinto VARCHAR(64) NULL;

-- Backfill de compatibilidad inicial: copiar el presinto del despacho a sus sacas
-- mientras no exista uno propio por saca. La generación por saca queda a cargo del backend.
UPDATE saca s
SET codigo_presinto = d.codigo_presinto
FROM despacho d
WHERE s.id_despacho = d.id_despacho
  AND (s.codigo_presinto IS NULL OR s.codigo_presinto = '')
  AND d.codigo_presinto IS NOT NULL
  AND d.codigo_presinto != '';

-- NOTA: despacho.codigo_presinto se mantiene temporalmente por compatibilidad (MVP 1/3).
-- Deja de ser la fuente de verdad; su eliminación se evaluará en una migración posterior.
