-- Migración V46: Agregar estado RETENER para paquetes
-- Este estado indica que un paquete debe ser retenido y no debe procesarse normalmente

-- 1. Actualizar el CHECK constraint para incluir el nuevo estado RETENER
ALTER TABLE paquete DROP CONSTRAINT IF EXISTS chk_estado_paquete_enum;

ALTER TABLE paquete ADD CONSTRAINT chk_estado_paquete_enum
    CHECK (estado IN ('REGISTRADO', 'RECIBIDO', 'ASIGNADO_SACA', 'ENSACADO', 'DESPACHADO', 'RETENER'));

-- 2. Verificar la migración
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'chk_estado_paquete_enum'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Migración completada: Estado RETENER agregado exitosamente';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear el constraint chk_estado_paquete_enum';
    END IF;
END $$;
