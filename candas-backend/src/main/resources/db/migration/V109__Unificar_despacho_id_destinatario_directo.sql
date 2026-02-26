-- V109: Unificar modelo de despacho: id_destinatario_directo en despacho y eliminar despacho_directo

-- Añadir columna en despacho
ALTER TABLE despacho
    ADD COLUMN IF NOT EXISTS id_destinatario_directo BIGINT NULL;

-- Referencia a destinatario_directo (drop si existe por reintento)
ALTER TABLE despacho DROP CONSTRAINT IF EXISTS fk_despacho_destinatario_directo;
ALTER TABLE despacho
    ADD CONSTRAINT fk_despacho_destinatario_directo
    FOREIGN KEY (id_destinatario_directo)
    REFERENCES destinatario_directo(id_destinatario_directo)
    ON DELETE SET NULL;

-- Migrar datos desde despacho_directo (solo si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'despacho_directo') THEN
    UPDATE despacho d
    SET id_destinatario_directo = dd.id_destinatario_directo
    FROM despacho_directo dd
    WHERE dd.id_despacho = d.id_despacho;
    DROP TABLE despacho_directo CASCADE;
  END IF;
END $$;
