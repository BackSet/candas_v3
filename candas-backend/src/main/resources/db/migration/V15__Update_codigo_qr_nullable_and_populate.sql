-- Asegurar que la columna codigo_qr permita NULL (se genera automáticamente después de guardar)
ALTER TABLE saca ALTER COLUMN codigo_qr DROP NOT NULL;

-- Actualizar sacas existentes que no tengan codigo_qr (usar el ID como código QR)
UPDATE saca SET codigo_qr = id_saca::VARCHAR WHERE codigo_qr IS NULL;
