-- V23__rename_agencia_distribucion_to_distribuidor.sql

-- Renombrar tabla
ALTER TABLE agencia_distribucion RENAME TO distribuidor;

-- Renombrar columnas
ALTER TABLE distribuidor RENAME COLUMN id_agencia_distribucion TO id_distribuidor;

-- Renombrar constraints en despacho
ALTER TABLE despacho RENAME CONSTRAINT fk_despacho_agencia_distribucion TO fk_despacho_distribuidor;

-- Actualizar foreign key en despacho
ALTER TABLE despacho 
    DROP CONSTRAINT fk_despacho_distribuidor,
    ADD CONSTRAINT fk_despacho_distribuidor FOREIGN KEY (id_agencia_distribucion) 
        REFERENCES distribuidor(id_distribuidor) ON DELETE RESTRICT;

-- Renombrar columna en despacho
ALTER TABLE despacho RENAME COLUMN id_agencia_distribucion TO id_distribuidor;
