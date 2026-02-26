-- V22__rename_envio_directo_to_despacho_directo.sql

-- Renombrar tabla
ALTER TABLE envio_directo RENAME TO despacho_directo;

-- Renombrar columnas
ALTER TABLE despacho_directo RENAME COLUMN id_envio_directo TO id_despacho_directo;
ALTER TABLE despacho_directo RENAME COLUMN id_cliente_envio_directo TO id_destinatario_directo;

-- Renombrar constraints
ALTER TABLE despacho_directo RENAME CONSTRAINT fk_envio_directo_despacho TO fk_despacho_directo_despacho;
ALTER TABLE despacho_directo RENAME CONSTRAINT fk_envio_directo_cliente TO fk_despacho_directo_destinatario;

-- Actualizar foreign key para referenciar la nueva tabla
ALTER TABLE despacho_directo 
    DROP CONSTRAINT fk_despacho_directo_destinatario,
    ADD CONSTRAINT fk_despacho_directo_destinatario FOREIGN KEY (id_destinatario_directo) 
        REFERENCES destinatario_directo(id_destinatario_directo) ON DELETE RESTRICT;
