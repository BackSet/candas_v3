-- Permitir valores NULL en la columna tipo_paquete
ALTER TABLE paquete ALTER COLUMN tipo_paquete DROP NOT NULL;
