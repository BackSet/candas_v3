-- Migración V47: Agregar campo codigo_destinatario_servientrega a destinatario_directo
-- Este campo representa el código del destinatario en el sistema de Servientrega

ALTER TABLE destinatario_directo 
ADD COLUMN codigo_destinatario_servientrega VARCHAR(255);
