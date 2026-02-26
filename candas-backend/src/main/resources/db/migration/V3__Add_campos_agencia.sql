-- Agregar campos faltantes a la tabla agencia
ALTER TABLE agencia
    ADD COLUMN ciudad VARCHAR(255),
    ADD COLUMN nombre_personal VARCHAR(255),
    ADD COLUMN horario_atencion TEXT;
