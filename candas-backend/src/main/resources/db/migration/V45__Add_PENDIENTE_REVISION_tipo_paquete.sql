-- Migración V45: Agregar tipo de paquete PENDIENTE_REVISION
-- Este tipo se usa para paquetes que tienen inconsistencias en los datos y requieren revisión

-- 1. Actualizar el CHECK constraint para incluir PENDIENTE_REVISION y CADENITA (si no está ya incluido)
ALTER TABLE paquete DROP CONSTRAINT IF EXISTS chk_tipo_paquete_enum;

ALTER TABLE paquete ADD CONSTRAINT chk_tipo_paquete_enum
    CHECK (tipo_paquete IS NULL OR tipo_paquete IN ('CLEMENTINA', 'SEPARAR', 'AGENCIA', 'DOMICILIO', 'CADENITA', 'PENDIENTE_REVISION'));
