-- Migración V50: Agregar campos para rastrear operaciones especiales de paquetes
-- Campos para CLEMENTINA (etiqueta cambiada), SEPARAR (separado), CADENITA (unido en caja)

ALTER TABLE paquete 
ADD COLUMN IF NOT EXISTS etiqueta_cambiada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS separado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unido_en_caja BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_etiqueta_cambiada TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_separado TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_unido_en_caja TIMESTAMP;

-- Comentarios para documentación
COMMENT ON COLUMN paquete.etiqueta_cambiada IS 'Indica si un paquete CLEMENTINA ya ha sido cambiado de etiqueta';
COMMENT ON COLUMN paquete.separado IS 'Indica si un paquete SEPARAR ya ha sido separado';
COMMENT ON COLUMN paquete.unido_en_caja IS 'Indica si un paquete CADENITA ya ha sido unido en una caja';
COMMENT ON COLUMN paquete.fecha_etiqueta_cambiada IS 'Fecha en que se cambió la etiqueta del paquete CLEMENTINA';
COMMENT ON COLUMN paquete.fecha_separado IS 'Fecha en que se separó el paquete SEPARAR';
COMMENT ON COLUMN paquete.fecha_unido_en_caja IS 'Fecha en que se unió el paquete CADENITA en una caja';
