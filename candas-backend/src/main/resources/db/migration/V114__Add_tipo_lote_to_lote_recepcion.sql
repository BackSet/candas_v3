-- Añadir columna tipo_lote para distinguir lotes normales de lotes especiales (etiquetas dinámicas)
ALTER TABLE lote_recepcion ADD COLUMN tipo_lote VARCHAR(20) NOT NULL DEFAULT 'NORMAL';
