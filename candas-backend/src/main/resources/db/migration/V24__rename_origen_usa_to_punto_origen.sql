-- V24__rename_origen_usa_to_punto_origen.sql

-- Renombrar tabla
ALTER TABLE origen_usa RENAME TO punto_origen;

-- Renombrar columnas
ALTER TABLE punto_origen RENAME COLUMN id_origen TO id_punto_origen;
ALTER TABLE punto_origen RENAME COLUMN nombre_agencia_usa TO nombre_punto_origen;

-- Renombrar constraint en paquete (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_paquete_origen_usa'
    ) THEN
        ALTER TABLE paquete RENAME CONSTRAINT fk_paquete_origen_usa TO fk_paquete_punto_origen;
    END IF;
END $$;

-- Actualizar foreign key en paquete
ALTER TABLE paquete 
    DROP CONSTRAINT IF EXISTS fk_paquete_punto_origen,
    ADD CONSTRAINT fk_paquete_punto_origen FOREIGN KEY (id_origen_usa) 
        REFERENCES punto_origen(id_punto_origen) ON DELETE RESTRICT;

-- Renombrar columna en paquete
ALTER TABLE paquete RENAME COLUMN id_origen_usa TO id_punto_origen;
