-- Migración V123: Refactor tipos de problema de atención
-- Sustituir FALTA_INFORMACION y DATOS_INCOMPLETOS por tipos específicos;
-- migrar datos existentes a OTRO y actualizar el constraint.

-- 1. Migrar registros con tipos obsoletos a OTRO
UPDATE atencion_paquete
SET tipo_problema = 'OTRO'
WHERE tipo_problema IN ('FALTA_INFORMACION', 'DATOS_INCOMPLETOS');

-- 2. Actualizar el CHECK constraint para los 8 tipos nuevos
ALTER TABLE atencion_paquete DROP CONSTRAINT IF EXISTS chk_tipo_problema_atencion_enum;

ALTER TABLE atencion_paquete ADD CONSTRAINT chk_tipo_problema_atencion_enum
    CHECK (tipo_problema IN (
        'INSTRUCCION_RETENCION',
        'DIRECCION_INCONSISTENTE',
        'DESTINATARIO_NO_IDENTIFICADO',
        'GUIA_REEMPLAZO',
        'CONFLICTO_NOTAS',
        'DATOS_ERRONEOS',
        'ERROR_ENVIO',
        'OTRO'
    ));

-- 3. Verificar la migración
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_tipo_problema_atencion_enum'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RAISE NOTICE 'Migración V123 completada: tipos de problema de atención actualizados';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear el constraint chk_tipo_problema_atencion_enum';
    END IF;
END $$;
