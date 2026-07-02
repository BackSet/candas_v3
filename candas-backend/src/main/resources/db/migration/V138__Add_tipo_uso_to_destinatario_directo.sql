-- Agregar columna tipo_uso a destinatario_directo con default 'FRECUENTE'
ALTER TABLE destinatario_directo ADD COLUMN tipo_uso VARCHAR(20) NOT NULL DEFAULT 'FRECUENTE';
