-- V11__Add_agencia_distribucion_and_despacho_fields.sql

-- Crear tabla agencia_distribucion
CREATE TABLE agencia_distribucion (
    id_agencia_distribucion BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(100) UNIQUE,
    direccion TEXT,
    email VARCHAR(255),
    ciudad VARCHAR(255),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- Agregar campos a despacho
ALTER TABLE despacho
    ADD COLUMN id_agencia BIGINT,
    ADD COLUMN id_agencia_distribucion BIGINT,
    ADD COLUMN numero_guia_agencia_distribucion VARCHAR(255);

-- Agregar foreign keys
ALTER TABLE despacho
    ADD CONSTRAINT fk_despacho_agencia FOREIGN KEY (id_agencia) 
        REFERENCES agencia(id_agencia) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_despacho_agencia_distribucion FOREIGN KEY (id_agencia_distribucion) 
        REFERENCES agencia_distribucion(id_agencia_distribucion) ON DELETE RESTRICT;

-- Hacer numero_manifiesto nullable (se genera automáticamente)
ALTER TABLE despacho ALTER COLUMN numero_manifiesto DROP NOT NULL;

-- Hacer codigo_barras nullable en saca (se genera automáticamente)
ALTER TABLE saca ALTER COLUMN codigo_barras DROP NOT NULL;
