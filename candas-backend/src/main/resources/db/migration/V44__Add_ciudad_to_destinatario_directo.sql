-- Migración V44: Agregar campo ciudad a destinatario_directo
-- Este campo permitirá incluir la ciudad del destinatario directo en los reportes Excel

ALTER TABLE destinatario_directo 
ADD COLUMN ciudad VARCHAR(255);
