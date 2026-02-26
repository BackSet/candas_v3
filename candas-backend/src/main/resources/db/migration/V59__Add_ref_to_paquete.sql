-- Agregar columna ref a la tabla paquete
ALTER TABLE paquete
  ADD COLUMN IF NOT EXISTS ref VARCHAR(255);
