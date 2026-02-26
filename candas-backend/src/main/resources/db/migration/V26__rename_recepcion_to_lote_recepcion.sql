-- V26__rename_recepcion_to_lote_recepcion.sql

-- Renombrar tabla
ALTER TABLE recepcion RENAME TO lote_recepcion;

-- Renombrar columnas
ALTER TABLE lote_recepcion RENAME COLUMN id_recepcion TO id_lote_recepcion;

-- Renombrar constraint
ALTER TABLE lote_recepcion RENAME CONSTRAINT fk_recepcion_agencia TO fk_lote_recepcion_agencia;

-- Actualizar foreign key en paquete (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_paquete_recepcion'
    ) THEN
        ALTER TABLE paquete RENAME CONSTRAINT fk_paquete_recepcion TO fk_paquete_lote_recepcion;
    END IF;
END $$;

-- Actualizar foreign key en paquete
ALTER TABLE paquete 
    DROP CONSTRAINT IF EXISTS fk_paquete_lote_recepcion,
    ADD CONSTRAINT fk_paquete_lote_recepcion FOREIGN KEY (id_recepcion) 
        REFERENCES lote_recepcion(id_lote_recepcion) ON DELETE RESTRICT;

-- Renombrar columna en paquete
ALTER TABLE paquete RENAME COLUMN id_recepcion TO id_lote_recepcion;
