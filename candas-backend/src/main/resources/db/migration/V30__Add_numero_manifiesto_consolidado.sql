-- Agregar columna numero_manifiesto a la tabla manifiesto_consolidado
ALTER TABLE manifiesto_consolidado ADD COLUMN numero_manifiesto VARCHAR(100);

-- Crear índice único para numero_manifiesto
CREATE UNIQUE INDEX IF NOT EXISTS idx_manifiesto_consolidado_numero_manifiesto ON manifiesto_consolidado(numero_manifiesto);

-- Actualizar registros existentes con formato MCF- + hexadecimal del ID
UPDATE manifiesto_consolidado
SET numero_manifiesto = 'MCF-' || LPAD(UPPER(to_hex(id_manifiesto_consolidado)), 8, '0')
WHERE numero_manifiesto IS NULL;

-- Agregar constraint NOT NULL después de actualizar los registros existentes
ALTER TABLE manifiesto_consolidado ALTER COLUMN numero_manifiesto SET NOT NULL;
