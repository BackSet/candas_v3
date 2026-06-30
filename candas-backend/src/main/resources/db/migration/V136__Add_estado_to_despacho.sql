-- Ciclo de vida del despacho (módulo "Despachos rápidos"):
-- BORRADOR, EN_ENSACADO, LISTO_PARA_GUIA, FINALIZADO.
--
-- Los despachos existentes provienen del flujo clásico y deben quedar como FINALIZADO
-- para no romper listados ni reportes. Postgres rellena las filas existentes con el DEFAULT
-- al agregar la columna NOT NULL. El DEFAULT a nivel de columna es además un fallback seguro
-- para cualquier inserción que no especifique estado.
-- IF NOT EXISTS evita fallo si la columna ya existe (migración parcial o BD ya actualizada).
ALTER TABLE despacho ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'FINALIZADO';

-- Defensa por si la columna existiera previamente como nullable (corrida parcial).
UPDATE despacho SET estado = 'FINALIZADO' WHERE estado IS NULL;

COMMENT ON COLUMN despacho.estado IS 'Estado del ciclo de vida del despacho: BORRADOR, EN_ENSACADO, LISTO_PARA_GUIA, FINALIZADO. FINALIZADO corresponde a los despachos del flujo clásico/históricos.';
