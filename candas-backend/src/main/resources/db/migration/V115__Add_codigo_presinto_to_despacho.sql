-- Código del presinto para etiqueta Zebra (único por despacho)
-- IF NOT EXISTS evita fallo si la columna ya existe (ej. migración ejecutada parcialmente o BD ya actualizada)
ALTER TABLE despacho ADD COLUMN IF NOT EXISTS codigo_presinto VARCHAR(64) NULL;

-- Backfill: despachos con número de manifiesto
UPDATE despacho
SET codigo_presinto = 'VIAJE-' || id_despacho || '-' || REPLACE(numero_manifiesto, ' ', '')
WHERE numero_manifiesto IS NOT NULL AND numero_manifiesto != '';

-- Backfill: resto (sin manifiesto)
UPDATE despacho
SET codigo_presinto = 'V-' || id_despacho || '-' || TO_CHAR(fecha_despacho, 'YYYYMMDD')
WHERE codigo_presinto IS NULL;
