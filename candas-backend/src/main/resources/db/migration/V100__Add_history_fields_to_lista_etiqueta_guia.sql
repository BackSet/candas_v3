-- Migration to add history fields to lista_etiqueta_guia table
-- Using IF NOT EXISTS for safety (Supported in PostgreSQL 9.6+)
ALTER TABLE lista_etiqueta_guia ADD COLUMN IF NOT EXISTS estado VARCHAR(30);
ALTER TABLE lista_etiqueta_guia ADD COLUMN IF NOT EXISTS instruccion VARCHAR(30);
ALTER TABLE lista_etiqueta_guia ADD COLUMN IF NOT EXISTS fecha_recepcion TIMESTAMP;
