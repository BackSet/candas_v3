-- V107: Renombrar codigo_destinatario_servientrega a codigo y añadir nombre_empresa opcional

ALTER TABLE destinatario_directo
    RENAME COLUMN codigo_destinatario_servientrega TO codigo;

ALTER TABLE destinatario_directo
    ADD COLUMN IF NOT EXISTS nombre_empresa VARCHAR(255) NULL;
