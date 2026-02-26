-- Migración V61: Estado por etiqueta (lista etiquetada)
-- Guarda estado por NOMBRE DE ETIQUETA (no por guía individual)

CREATE TABLE IF NOT EXISTS lista_etiqueta_estado (
    etiqueta VARCHAR(100) PRIMARY KEY,
    estado VARCHAR(30) NULL,
    fecha_actualizacion TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_lista_etiqueta_estado_estado
ON lista_etiqueta_estado(estado);

