-- Script para aplicar manualmente los cambios de V109 y V110
-- si la aplicación no ha ejecutado Flyway o las migraciones no se reflejaron.
-- Ejecutar en la base de datos candas_v3 (PostgreSQL).

-- ========== V109: Unificar despacho ==========
ALTER TABLE despacho ADD COLUMN IF NOT EXISTS id_destinatario_directo BIGINT NULL;

ALTER TABLE despacho DROP CONSTRAINT IF EXISTS fk_despacho_destinatario_directo;
ALTER TABLE despacho
    ADD CONSTRAINT fk_despacho_destinatario_directo
    FOREIGN KEY (id_destinatario_directo)
    REFERENCES destinatario_directo(id_destinatario_directo)
    ON DELETE SET NULL;

-- Solo si existe la tabla despacho_directo:
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

-- ========== V110: Eliminar tablas de grupos ==========
DROP TABLE IF EXISTS grupo_personalizado_paquete CASCADE;
DROP TABLE IF EXISTS grupo_personalizado CASCADE;
DROP TABLE IF EXISTS usuario_grupo CASCADE;
DROP TABLE IF EXISTS rol_grupo CASCADE;
DROP TABLE IF EXISTS grupo_permiso CASCADE;
DROP TABLE IF EXISTS grupo CASCADE;

-- Registrar en Flyway para que no intente volver a ejecutar (opcional)
-- Si no insertas esto, al arrancar la app Flyway ejecutará V109 y V110 y fallará si ya aplicaste los cambios.
-- INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
-- VALUES ((SELECT COALESCE(MAX(installed_rank),0)+1 FROM flyway_schema_history), '109', 'Unificar despacho id destinatario directo', 'SQL', 'V109__Unificar_despacho_id_destinatario_directo.sql', NULL, 'manual', NOW(), 0, true);
-- INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
-- VALUES ((SELECT COALESCE(MAX(installed_rank),0)+1 FROM flyway_schema_history), '110', 'Drop tablas grupos', 'SQL', 'V110__Drop_tablas_grupos.sql', NULL, 'manual', NOW(), 0, true);
