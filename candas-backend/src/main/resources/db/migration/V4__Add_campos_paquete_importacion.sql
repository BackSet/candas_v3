-- Agregar campos adicionales para importación de paquetes desde Excel
ALTER TABLE paquete
ADD COLUMN IF NOT EXISTS sed VARCHAR(100),
ADD COLUMN IF NOT EXISTS medidas VARCHAR(200),
ADD COLUMN IF NOT EXISTS peso_libras DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS valor DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tarifa_position VARCHAR(100);
