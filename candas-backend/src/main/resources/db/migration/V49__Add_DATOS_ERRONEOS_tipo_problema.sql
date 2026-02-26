-- Migración V49: Agregar tipo de problema DATOS_ERRONEOS
-- Este tipo de problema indica que los datos del paquete son erróneos

-- 1. Actualizar el CHECK constraint para incluir el nuevo tipo DATOS_ERRONEOS
ALTER TABLE atencion_paquete DROP CONSTRAINT IF EXISTS chk_tipo_problema_atencion_enum;

ALTER TABLE atencion_paquete ADD CONSTRAINT chk_tipo_problema_atencion_enum
    CHECK (tipo_problema IN ('FALTA_INFORMACION', 'DATOS_INCOMPLETOS', 'DATOS_ERRONEOS', 'ERROR_ENVIO', 'OTRO'));

-- 2. Verificar la migración
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
        RAISE NOTICE 'Migración completada: Tipo de problema DATOS_ERRONEOS agregado exitosamente';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear el constraint chk_tipo_problema_atencion_enum';
    END IF;
END $$;
